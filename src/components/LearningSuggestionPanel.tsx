import { Check, ClipboardCopy, Lightbulb } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getFeedbackRecords, type FeedbackRecord } from "../lib/feedback";
import {
  analyzeFeedback,
  type LearningSuggestion,
} from "../lib/learning";
import { phraseDictionary } from "../lib/phraseDictionary";

type LearningSuggestionPanelProps = {
  refreshKey: number;
};

const typeLabel: Record<LearningSuggestion["type"], string> = {
  add_phrase: "표현 추가",
  create_rule: "규칙 생성",
  adjust_threshold: "조건 조정",
};

const formatConfidence = (confidence: number) =>
  `${Math.round(confidence * 100)}%`;

const copyText = async (text: string) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below handles older or restricted browser contexts.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  return copied;
};

export function LearningSuggestionPanel({
  refreshKey,
}: LearningSuggestionPanelProps) {
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setRecords(getFeedbackRecords());
  }, [refreshKey]);

  const suggestions = useMemo(
    () => analyzeFeedback(records, phraseDictionary),
    [records],
  );

  const copyPrompt = async (suggestion: LearningSuggestion) => {
    const copied = await copyText(suggestion.codexPrompt);

    if (copied) {
      setCopiedId(suggestion.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    }
  };

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-bold">
            <Lightbulb size={16} aria-hidden="true" />
            학습 제안
          </div>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            사용자 피드백은 투자 성과가 아니라 자연어 해석 품질 개선용으로만
            분석합니다. 아래 후보는 자동 반영되지 않습니다.
          </p>
        </div>
        <span className="rounded-md bg-citrus/15 px-2.5 py-1 text-xs font-bold text-ink">
          {suggestions.length}건
        </span>
      </div>

      {suggestions.length === 0 ? (
        <p className="rounded-lg bg-paper/70 p-4 text-sm leading-6 text-ink/60">
          아직 충분한 피드백이 없습니다. 표현을 인식하지 못한 사례가 더 쌓이면
          개선 후보가 표시됩니다.
        </p>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <article
              key={suggestion.id}
              className="rounded-lg border border-ink/10 bg-paper/45 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-pool/10 px-2 py-1 text-xs font-bold text-pool">
                      {typeLabel[suggestion.type]}
                    </span>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-ink/60">
                      신뢰도 {formatConfidence(suggestion.confidence)}
                    </span>
                    {suggestion.targetRuleId && (
                      <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink/60">
                        대상 규칙 {suggestion.targetRuleId}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-ink">
                    {suggestion.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink/65">
                    {suggestion.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void copyPrompt(suggestion)}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-sm font-bold text-ink transition hover:border-pool hover:text-pool"
                >
                  {copiedId === suggestion.id ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <ClipboardCopy size={16} aria-hidden="true" />
                  )}
                  {copiedId === suggestion.id ? "복사됨" : "프롬프트 복사"}
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <SuggestionList title="예시 입력" items={suggestion.examples} />
                <SuggestionList
                  title="제안 지표"
                  items={suggestion.suggestedIndicators ?? []}
                />
              </div>

              <SuggestionList
                title="조건 힌트"
                items={suggestion.suggestedConditionHints ?? []}
              />

              <div className="mt-3 rounded-lg border border-ink/10 bg-white">
                <div className="border-b border-ink/10 px-3 py-2 text-xs font-bold text-ink/55">
                  코덱스용 프롬프트
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap p-3 text-xs leading-5 text-ink/70">
                  {suggestion.codexPrompt}
                </pre>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SuggestionList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3 rounded-lg border border-ink/10 bg-white p-3 first:mt-0">
      <p className="text-xs font-bold text-ink/50">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm leading-6 text-ink/65">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink/45">표시할 항목이 없습니다.</p>
      )}
    </div>
  );
}
