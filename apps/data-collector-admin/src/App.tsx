import { useEffect, useMemo, useState } from "react";
import {
  expressionCategories,
  getCategoryLabel,
  type AnalysisResponse,
  type ApprovedExpression,
  type CandidateStatus,
  type ExpressionCandidate,
  type ExpressionCategoryId,
} from "../../../packages/shared/src/collectorTypes";
import {
  analyzeInputText,
  fetchApprovedExpressions,
  hasRemoteApi,
  patchCandidate,
} from "./api";
import {
  loadApprovedExpressions,
  loadCandidates,
  saveApprovedExpressions,
  saveCandidates,
} from "./storage";

type Screen = "input" | "analysis" | "review" | "dictionary" | "categories";

const sampleText =
  "실적은 괜찮은데 아직 많이 안 오른 종목\n거래가 살아나는 느낌인데 너무 과열된 건 싫어\n차트가 무너지지 않고 흐름이 살아있는 종목";

const screenLabels: Record<Screen, string> = {
  input: "문장 입력",
  analysis: "AI 분석 결과",
  review: "표현 후보 검수",
  dictionary: "승인된 표현 사전",
  categories: "카테고리별 표현",
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `approved-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const toLines = (items: string[]) => items.join("\n");

const fromLines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const createApprovedExpression = (
  candidate: ExpressionCandidate,
): ApprovedExpression => {
  const now = new Date().toISOString();
  return {
    id: newId(),
    candidateId: candidate.id,
    phrase: candidate.phrase,
    category: candidate.category,
    meaning: candidate.meaning,
    conditions: candidate.possibleConditions,
    confidence: candidate.confidence,
    createdAt: now,
    updatedAt: now,
  };
};

function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("input");
  const [input, setInput] = useState(sampleText);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [candidates, setCandidates] = useState<ExpressionCandidate[]>([]);
  const [approved, setApproved] = useState<ApprovedExpression[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCandidates(loadCandidates());
    setApproved(loadApprovedExpressions());

    if (hasRemoteApi) {
      void fetchApprovedExpressions().then((payload) => {
        if (payload) {
          setApproved(payload.approved);
          saveApprovedExpressions(payload.approved);
        }
      });
    }
  }, []);

  const pendingCandidates = useMemo(
    () => candidates.filter((candidate) => candidate.status === "pending"),
    [candidates],
  );

  const categoryCounts = useMemo(
    () =>
      expressionCategories.map((category) => ({
        ...category,
        candidateCount: candidates.filter(
          (candidate) => candidate.category === category.id,
        ).length,
        approvedCount: approved.filter(
          (expression) => expression.category === category.id,
        ).length,
      })),
    [approved, candidates],
  );

  const persistCandidates = (next: ExpressionCandidate[]) => {
    setCandidates(next);
    saveCandidates(next);
  };

  const persistApproved = (next: ApprovedExpression[]) => {
    setApproved(next);
    saveApprovedExpressions(next);
  };

  const runAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeInputText(input);
      setAnalysis(result.ai);
      const nextCandidates = [...result.candidates, ...candidates];
      persistCandidates(nextCandidates);
      setActiveScreen("analysis");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "표현 분석 중 문제가 발생했습니다.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateCandidateDraft = (
    candidateId: string,
    patch: Partial<ExpressionCandidate>,
  ) => {
    persistCandidates(
      candidates.map((candidate) =>
        candidate.id === candidateId
          ? {
              ...candidate,
              ...patch,
              updatedAt: new Date().toISOString(),
            }
          : candidate,
      ),
    );
  };

  const setCandidateStatus = async (
    candidate: ExpressionCandidate,
    status: CandidateStatus,
  ) => {
    const patch = {
      status,
      phrase: candidate.phrase,
      category: candidate.category,
      meaning: candidate.meaning,
      possibleConditions: candidate.possibleConditions,
      reviewerNote: candidate.reviewerNote,
    };

    const remote = await patchCandidate(candidate.id, patch);
    const updatedCandidate = remote?.candidate ?? {
      ...candidate,
      status,
      updatedAt: new Date().toISOString(),
    };
    const nextCandidates = candidates.map((item) =>
      item.id === candidate.id ? updatedCandidate : item,
    );
    persistCandidates(nextCandidates);

    if (status === "approved") {
      const approvedExpression =
        remote?.approved ?? createApprovedExpression(updatedCandidate);
      persistApproved([approvedExpression, ...approved]);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">조건검색 참고용 관리자</p>
          <h1>주린이 번역기 데이터 수집 관리자</h1>
          <p className="lead">
            커뮤니티 문장에서 두루뭉술한 표현을 뽑아 조건검색 언어 후보로
            정리하고, 관리자가 승인하거나 보류하는 교육/검색 보조 도구입니다.
          </p>
        </div>
        <div className="status-card">
          <span>{hasRemoteApi ? "Worker API 연결" : "로컬 목업 모드"}</span>
          <strong>{pendingCandidates.length}</strong>
          <small>검수 대기 후보</small>
        </div>
      </header>

      <nav className="tabs" aria-label="관리자 화면">
        {(Object.keys(screenLabels) as Screen[]).map((screen) => (
          <button
            className={activeScreen === screen ? "active" : ""}
            key={screen}
            onClick={() => setActiveScreen(screen)}
            type="button"
          >
            {screenLabels[screen]}
          </button>
        ))}
      </nav>

      <section className="notice">
        개인정보 저장을 피하기 위해 작성자명, 닉네임, 프로필, 원문 URL은
        수집하지 않습니다. 이 화면은 종목 판단이 아니라 표현을 조건검색
        언어로 바꾸기 위한 검수용입니다.
      </section>

      {error && <section className="error-box">{error}</section>}

      {activeScreen === "input" && (
        <InputScreen
          input={input}
          isAnalyzing={isAnalyzing}
          onAnalyze={() => void runAnalyze()}
          onChange={setInput}
        />
      )}

      {activeScreen === "analysis" && (
        <AnalysisScreen analysis={analysis} candidates={candidates} />
      )}

      {activeScreen === "review" && (
        <ReviewScreen
          candidates={pendingCandidates}
          onReject={(candidate) => void setCandidateStatus(candidate, "rejected")}
          onApprove={(candidate) =>
            void setCandidateStatus(candidate, "approved")
          }
          onUpdate={updateCandidateDraft}
        />
      )}

      {activeScreen === "dictionary" && (
        <DictionaryScreen approved={approved} />
      )}

      {activeScreen === "categories" && (
        <CategoryScreen
          approved={approved}
          categoryCounts={categoryCounts}
        />
      )}
    </main>
  );
}

function InputScreen({
  input,
  isAnalyzing,
  onAnalyze,
  onChange,
}: {
  input: string;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <section className="panel two-column">
      <div>
        <h2>문장 입력</h2>
        <p>
          커뮤니티 문장이나 댓글을 붙여넣으면 표현 후보를 추출합니다. 원문
          URL이나 작성자 정보는 넣지 않는 운영을 권장합니다.
        </p>
      </div>
      <div className="input-area">
        <textarea
          aria-label="분석할 문장"
          onChange={(event) => onChange(event.target.value)}
          value={input}
        />
        <button disabled={isAnalyzing} onClick={onAnalyze} type="button">
          {isAnalyzing ? "분석 중" : "표현 분석"}
        </button>
      </div>
    </section>
  );
}

function AnalysisScreen({
  analysis,
  candidates,
}: {
  analysis: AnalysisResponse | null;
  candidates: ExpressionCandidate[];
}) {
  const latest = candidates.slice(0, analysis?.expressions.length ?? 0);

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>AI 분석 결과</h2>
          <p>
            AI 함수는 표현, 카테고리, 의미, 조건검색 후보, 신뢰도를 JSON으로
            반환합니다.
          </p>
        </div>
      </div>

      {!analysis ? (
        <EmptyState text="아직 분석 결과가 없습니다." />
      ) : (
        <div className="result-grid">
          <div className="card-list">
            {latest.map((candidate) => (
              <CandidateSummary key={candidate.id} candidate={candidate} />
            ))}
          </div>
          <pre className="json-view">{JSON.stringify(analysis, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}

function ReviewScreen({
  candidates,
  onApprove,
  onReject,
  onUpdate,
}: {
  candidates: ExpressionCandidate[];
  onApprove: (candidate: ExpressionCandidate) => void;
  onReject: (candidate: ExpressionCandidate) => void;
  onUpdate: (
    candidateId: string,
    patch: Partial<ExpressionCandidate>,
  ) => void;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>표현 후보 검수</h2>
          <p>
            후보 표현은 자동 반영되지 않습니다. 관리자가 의미와 조건 후보를
            확인한 뒤 승인하거나 거절합니다.
          </p>
        </div>
      </div>

      {candidates.length === 0 ? (
        <EmptyState text="검수 대기 후보가 없습니다." />
      ) : (
        <div className="review-list">
          {candidates.map((candidate) => (
            <article className="review-card" key={candidate.id}>
              <label>
                표현
                <input
                  onChange={(event) =>
                    onUpdate(candidate.id, { phrase: event.target.value })
                  }
                  value={candidate.phrase}
                />
              </label>

              <label>
                카테고리
                <select
                  onChange={(event) =>
                    onUpdate(candidate.id, {
                      category: event.target.value as ExpressionCategoryId,
                    })
                  }
                  value={candidate.category}
                >
                  {expressionCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                의미
                <textarea
                  onChange={(event) =>
                    onUpdate(candidate.id, { meaning: event.target.value })
                  }
                  value={candidate.meaning}
                />
              </label>

              <label>
                조건검색 번역 후보
                <textarea
                  onChange={(event) =>
                    onUpdate(candidate.id, {
                      possibleConditions: fromLines(event.target.value),
                    })
                  }
                  value={toLines(candidate.possibleConditions)}
                />
              </label>

              <label>
                검수 메모
                <input
                  onChange={(event) =>
                    onUpdate(candidate.id, {
                      reviewerNote: event.target.value,
                    })
                  }
                  placeholder="수정 이유나 보류 사유"
                  value={candidate.reviewerNote ?? ""}
                />
              </label>

              <div className="review-actions">
                <span>신뢰도 {(candidate.confidence * 100).toFixed(0)}%</span>
                <button
                  className="secondary"
                  onClick={() => onReject(candidate)}
                  type="button"
                >
                  거절
                </button>
                <button onClick={() => onApprove(candidate)} type="button">
                  승인
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function DictionaryScreen({ approved }: { approved: ApprovedExpression[] }) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>승인된 표현 사전</h2>
          <p>
            승인된 표현만 향후 phraseDictionary 개선 후보로 검토합니다. 자동
            반영은 하지 않습니다.
          </p>
        </div>
      </div>

      {approved.length === 0 ? (
        <EmptyState text="아직 승인된 표현이 없습니다." />
      ) : (
        <div className="card-list">
          {approved.map((expression) => (
            <article className="expression-card" key={expression.id}>
              <div>
                <span className="badge">{getCategoryLabel(expression.category)}</span>
                <h3>{expression.phrase}</h3>
                <p>{expression.meaning}</p>
              </div>
              <ul>
                {expression.conditions.map((condition) => (
                  <li key={condition}>{condition}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryScreen({
  approved,
  categoryCounts,
}: {
  approved: ApprovedExpression[];
  categoryCounts: Array<
    (typeof expressionCategories)[number] & {
      candidateCount: number;
      approvedCount: number;
    }
  >;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>카테고리별 표현 목록</h2>
          <p>
            표현이 어느 의도 그룹에 쌓이는지 확인하고 사전 개선 우선순위를
            잡기 위한 화면입니다.
          </p>
        </div>
      </div>

      <div className="category-grid">
        {categoryCounts.map((category) => (
          <article className="category-card" key={category.id}>
            <div className="category-card-header">
              <h3>{category.label}</h3>
              <span>
                후보 {category.candidateCount} · 승인 {category.approvedCount}
              </span>
            </div>
            <p>{category.description}</p>
            <ul>
              {approved
                .filter((expression) => expression.category === category.id)
                .slice(0, 5)
                .map((expression) => (
                  <li key={expression.id}>{expression.phrase}</li>
                ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function CandidateSummary({ candidate }: { candidate: ExpressionCandidate }) {
  return (
    <article className="expression-card">
      <div>
        <span className="badge">{getCategoryLabel(candidate.category)}</span>
        <h3>{candidate.phrase}</h3>
        <p>{candidate.meaning}</p>
      </div>
      <ul>
        {candidate.possibleConditions.map((condition) => (
          <li key={condition}>{condition}</li>
        ))}
      </ul>
      <small>신뢰도 {(candidate.confidence * 100).toFixed(0)}%</small>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

export default App;
