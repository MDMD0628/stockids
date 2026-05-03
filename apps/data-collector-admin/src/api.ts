import { analyzeTextWithHeuristics } from "../../../packages/shared/src/analysisHeuristics";
import {
  isExpressionCategoryId,
  type AnalyzeResult,
  type ApprovedExpression,
  type CandidateReviewPatch,
  type ExpressionCandidate,
  type RawItem,
} from "../../../packages/shared/src/collectorTypes";

const apiBase = import.meta.env.VITE_COLLECTOR_API_BASE?.replace(/\/$/, "") ?? "";

export const hasRemoteApi = Boolean(apiBase);

const nowIso = () => new Date().toISOString();

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeText = (text: string) => text.replace(/\s+/g, " ").trim();

const createLocalHash = async (text: string) => {
  if (!crypto.subtle) {
    return `local-${text.length}-${Date.now()}`;
  }

  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message ?? "관리자 API 요청에 실패했습니다.");
  }

  return (await response.json()) as T;
};

export const analyzeInputText = async (text: string): Promise<AnalyzeResult> => {
  if (hasRemoteApi) {
    return requestJson<AnalyzeResult>("/api/admin/analyze", {
      method: "POST",
      body: JSON.stringify({ text, sourceType: "manual_paste" }),
    });
  }

  const normalizedText = normalizeText(text);
  const ai = analyzeTextWithHeuristics(normalizedText);
  const createdAt = nowIso();
  const rawItem: RawItem = {
    id: newId(),
    rawText: normalizedText,
    normalizedText,
    textHash: await createLocalHash(normalizedText),
    sourceType: "manual_paste",
    privacyNote:
      "로컬 목업 분석입니다. 작성자명, 닉네임, 프로필, 원문 URL은 저장하지 않습니다.",
    createdAt,
  };
  const candidates = ai.expressions.map<ExpressionCandidate>((expression) => ({
    id: newId(),
    rawItemId: rawItem.id,
    phrase: expression.phrase,
    category: isExpressionCategoryId(expression.category)
      ? expression.category
      : "other",
    meaning: expression.meaning,
    possibleConditions: expression.possible_conditions,
    confidence: expression.confidence,
    status: "pending",
    createdAt,
    updatedAt: createdAt,
  }));

  return { rawItem, candidates, ai };
};

export const fetchApprovedExpressions = async () => {
  if (!hasRemoteApi) {
    return null;
  }

  return requestJson<{ approved: ApprovedExpression[] }>("/api/admin/approved");
};

export const patchCandidate = async (
  id: string,
  patch: CandidateReviewPatch,
) => {
  if (!hasRemoteApi) {
    return null;
  }

  return requestJson<{
    candidate: ExpressionCandidate;
    approved: ApprovedExpression | null;
  }>(`/api/admin/candidates/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
};
