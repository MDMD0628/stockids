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

const formatConfidence = (confidence: number) =>
  `${Math.round(confidence * 100)}%`;

const typeLabel: Record<LearningSuggestion["type"], string> = {
  add_phrase: "표현 추가",
  create_rule: "규칙 생성",
  adjust_threshold: "조건 조정",
};

const createCopyText = (suggestion: LearningSuggestion) => {
  const lines = [
    "StockIDS phraseDictionary 개선 후보를 검토해주세요.",
    "",
    `유형: ${typeLabel[suggestion.type]}`,
    `제목: ${suggestion.title}`,
    `설명: ${suggestion.description}`,
    `신뢰도: ${formatConfidence(suggestion.confidence)}`,
  ];

  if (suggestion.targetRuleId) {
    lines.push(`대상 규칙: ${suggestion.targetRuleId}`);
  }

  if (suggestion.suggestedPhrases?.length) {
    lines.push("", "표현 후보:");
    suggestion.suggestedPhrases.forEach((phrase) => lines.push(`- ${phrase}`));
  }

  if (suggestion.suggestedIndicators?.length) {
    lines.push("", "지표 후보:");
    suggestion.suggestedIndicators.forEach((indicator) =>
      lines.push(`- ${indicator}`),
    );
  }

  if (suggestion.suggestedConditionHints?.length) {
    lines.push("", "조건 힌트:");
    suggestion.suggestedConditionHints.forEach((hint) => lines.push(`- ${hint}`));
  }

  lines.push("", "예시 입력:");
  suggestion.examples.forEach((example) => lines.push(`- ${example}`));
  lines.push(
    "",
    "주의: 이 내용은 자동 반영하지 말고, 해석 품질 개선 관점에서만 검토해주세요.",
  );

  return lines.join("\n");
};

const copyText = async (text: string) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to the older clipboard path below.
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    setRecords(getFeedbackRecords());
  }, [refreshKey]);

  const suggestions = useMemo(
    () => analyzeFeedback(records, phraseDictionary),
    [records],
  );

  const copySuggestion = async (
    suggestion: LearningSuggestion,
    index: number,
  ) => {
    const text = createCopyText(suggestion);
    const copied = await copyText(text);

    if (copied) {
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1500);
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
            사용자 피드백은 자연어 해석 품질 개선용으로만 분석합니다. 아래
            후보는 자동 반영되지 않습니다.
          </p>
        </div>
        <span className="rounded-md bg-citrus/15 px-2.5 py-1 text-xs font-bold text-ink">
          {suggestions.length}건
        </span>
      </div>

      {suggestions.length === 0 ? (
        <p className="rounded-lg bg-paper/70 p-4 text-sm leading-6 text-ink/60">
          아직 학습 제안을 만들 만큼의 달라요 피드백이 없습니다. 특히 표현을
          인식하지 못한 사례가 쌓이면 후보가 표시됩니다.
        </p>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <article
              key={`${suggestion.type}-${suggestion.targetRuleId ?? "new"}-${index}`}
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
                        {suggestion.targetRuleId}
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
                  onClick={() => void copySuggestion(suggestion, index)}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-sm font-bold text-ink transition hover:border-pool hover:text-pool"
                >
                  {copiedIndex === index ? (
                    <Check size={16} aria-hidden="true" />
                  ) : (
                    <ClipboardCopy size={16} aria-hidden="true" />
                  )}
                  {copiedIndex === index ? "복사됨" : "복사하기"}
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <SuggestionList title="예시 입력" items={suggestion.examples} />
                <SuggestionList
                  title="조건 힌트"
                  items={suggestion.suggestedConditionHints ?? []}
                />
              </div>

              {suggestion.suggestedIndicators?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestion.suggestedIndicators.map((indicator) => (
                    <span
                      key={indicator}
                      className="rounded-md bg-pine/10 px-2 py-1 text-xs font-semibold text-pine"
                    >
                      {indicator}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SuggestionList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-3">
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
