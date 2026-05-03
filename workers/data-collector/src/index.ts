import {
  expressionCategories,
  isExpressionCategoryId,
  type AnalyzeRequest,
  type CandidateReviewPatch,
  type CandidateStatus,
  type RawItem,
  type SourceLog,
} from "../../../packages/shared/src/collectorTypes";
import { createAnalyzer, analyzeExpressions } from "./ai/analyzer";
import {
  D1CollectorRepository,
  MemoryCollectorRepository,
  type CollectorRepository,
} from "./db/repository";
import type { SqlDatabase } from "./db/sql";

type Env = {
  DB?: SqlDatabase;
  EXPRESSION_AI_MODE?: "mock";
};

const memoryRepository = new MemoryCollectorRepository();

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (payload: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...(init?.headers ?? {}),
    },
  });

const createRepository = (env: Env): CollectorRepository =>
  env.DB ? new D1CollectorRepository(env.DB) : memoryRepository;

const normalizeText = (text: string) =>
  text.replace(/\s+/g, " ").trim().slice(0, 4000);

const createHash = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const readJson = async <T>(request: Request): Promise<T> => {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("요청 본문을 JSON으로 읽을 수 없습니다.");
  }
};

const createSourceLog = (
  rawItem: RawItem,
  action: SourceLog["action"],
): SourceLog => ({
  id: crypto.randomUUID(),
  rawItemId: rawItem.id,
  sourceType: rawItem.sourceType,
  textHash: rawItem.textHash,
  action,
  createdAt: new Date().toISOString(),
});

const isCandidateStatus = (value: string | null): value is CandidateStatus =>
  value === "pending" || value === "approved" || value === "rejected";

const handleAnalyze = async (request: Request, env: Env) => {
  const body = await readJson<AnalyzeRequest>(request);
  const text = typeof body.text === "string" ? body.text : "";
  const normalizedText = normalizeText(text);

  if (normalizedText.length < 2) {
    return json(
      { message: "분석할 문장을 입력해 주세요." },
      { status: 400 },
    );
  }

  const sourceType = body.sourceType === "imported_text" ? body.sourceType : "manual_paste";
  const textHash = await createHash(normalizedText);
  const now = new Date().toISOString();
  const rawItem: RawItem = {
    id: crypto.randomUUID(),
    rawText: normalizedText,
    normalizedText,
    textHash,
    sourceType,
    privacyNote:
      "작성자명, 닉네임, 프로필, 원문 URL은 저장하지 않는 관리자 입력 데이터입니다.",
    createdAt: now,
  };

  const repository = createRepository(env);
  const analyzer = createAnalyzer(env);
  const ai = await analyzeExpressions(normalizedText, analyzer);

  await repository.createRawItem(rawItem);
  await repository.createSourceLog(createSourceLog(rawItem, "raw_item_created"));

  const candidates = await repository.createCandidates(
    ai.expressions.map((expression) => ({
      rawItemId: rawItem.id,
      phrase: expression.phrase,
      category: expression.category,
      meaning: expression.meaning,
      possibleConditions: expression.possible_conditions,
      confidence: expression.confidence,
    })),
  );

  await repository.createSourceLog(createSourceLog(rawItem, "ai_analyzed"));

  return json({ rawItem, candidates, ai });
};

const handleListCandidates = async (url: URL, env: Env) => {
  const status = url.searchParams.get("status");
  const candidates = await createRepository(env).listCandidates(
    isCandidateStatus(status) ? status : undefined,
  );
  return json({ candidates });
};

const handlePatchCandidate = async (
  request: Request,
  env: Env,
  candidateId: string,
) => {
  const body = await readJson<CandidateReviewPatch>(request);

  if (!isCandidateStatus(body.status)) {
    return json({ message: "후보 상태가 올바르지 않습니다." }, { status: 400 });
  }

  if (body.category && !isExpressionCategoryId(body.category)) {
    return json({ message: "카테고리가 올바르지 않습니다." }, { status: 400 });
  }

  const repository = createRepository(env);
  const candidate = await repository.updateCandidate(candidateId, body);

  if (!candidate) {
    return json({ message: "표현 후보를 찾을 수 없습니다." }, { status: 404 });
  }

  const approved =
    candidate.status === "approved"
      ? await repository.approveCandidate(candidate)
      : null;

  return json({ candidate, approved });
};

const handleRequest = async (request: Request, env: Env) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: jsonHeaders });
  }

  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "");

  if (request.method === "GET" && pathname === "/api/admin/categories") {
    return json({ categories: expressionCategories });
  }

  if (request.method === "POST" && pathname === "/api/admin/analyze") {
    return handleAnalyze(request, env);
  }

  if (request.method === "GET" && pathname === "/api/admin/candidates") {
    return handleListCandidates(url, env);
  }

  if (request.method === "GET" && pathname === "/api/admin/approved") {
    const approved = await createRepository(env).listApprovedExpressions();
    return json({ approved });
  }

  const candidateMatch = pathname.match(/^\/api\/admin\/candidates\/([^/]+)$/);

  if (request.method === "PATCH" && candidateMatch) {
    return handlePatchCandidate(request, env, candidateMatch[1]);
  }

  return json({ message: "지원하지 않는 관리자 API 경로입니다." }, { status: 404 });
};

export default {
  async fetch(request: Request, env: Env) {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      return json(
        {
          message:
            error instanceof Error
              ? error.message
              : "관리자 API 처리 중 문제가 발생했습니다.",
        },
        { status: 500 },
      );
    }
  },
};
