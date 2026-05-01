import { CheckCircle2, MessageSquareWarning, Save, ThumbsUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  type FeedbackRecord,
  type FeedbackValue,
  type FeedbackWrongReason,
  saveFeedback,
} from "../lib/feedback";
import type { RiskProfile, TranslationResult } from "../lib/types";
import { ResultBlock } from "./ResultBlock";

const wrongReasonOptions: FeedbackWrongReason[] = [
  "표현을 인식하지 못함",
  "조건이 너무 보수적임",
  "조건이 너무 공격적임",
  "지표 선택이 어색함",
  "조건이 너무 많음",
  "조건이 너무 적음",
  "직접 입력",
];

type FeedbackPanelProps = {
  input: string;
  profile: RiskProfile;
  result: TranslationResult;
  onSaved?: () => void;
};

export function FeedbackPanel({
  input,
  profile,
  result,
  onSaved,
}: FeedbackPanelProps) {
  const [feedback, setFeedback] = useState<FeedbackValue | null>(null);
  const [wrongReason, setWrongReason] = useState<FeedbackWrongReason | "">("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const machineQueries = useMemo(
    () => result.conditions.map((condition) => condition.machineQuery),
    [result.conditions],
  );

  useEffect(() => {
    setFeedback(null);
    setWrongReason("");
    setComment("");
    setStatus("idle");
  }, [result.id]);

  const createRecord = (
    nextFeedback: FeedbackValue,
    nextReason?: FeedbackWrongReason,
  ): FeedbackRecord => ({
    id: `${result.id}-${Date.now()}`,
    input,
    profile,
    resultId: result.id,
    matchedPhrases: result.matchedPhrases,
    conditions: result.conditions,
    machineQueries,
    feedback: nextFeedback,
    wrongReason: nextReason,
    comment: nextFeedback === "bad" ? comment.trim() || undefined : undefined,
    createdAt: new Date().toISOString(),
  });

  const persistFeedback = (
    nextFeedback: FeedbackValue,
    nextReason?: FeedbackWrongReason,
  ) => {
    try {
      saveFeedback(createRecord(nextFeedback, nextReason));
      setStatus("saved");
      onSaved?.();
    } catch {
      setStatus("error");
    }
  };

  const handleGood = () => {
    setFeedback("good");
    setWrongReason("");
    persistFeedback("good");
  };

  const handleBad = () => {
    setFeedback("bad");
    setStatus("idle");
  };

  const canSaveBad =
    feedback === "bad" &&
    wrongReason !== "" &&
    (wrongReason !== "직접 입력" || comment.trim().length > 0);

  return (
    <ResultBlock
      icon={<MessageSquareWarning size={18} aria-hidden="true" />}
      title="해석 품질 피드백"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-bold">이 해석이 의도와 맞았나요?</p>
          <p className="mt-1 text-sm leading-6 text-ink/60">
            이 피드백은 투자 성과 판단이 아니라 자연어 해석 품질 개선용으로만
            저장됩니다.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleGood}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition ${
              feedback === "good"
                ? "border-pine bg-pine text-white"
                : "border-ink/10 bg-paper/70 text-ink hover:border-pine hover:text-pine"
            }`}
          >
            <ThumbsUp size={16} aria-hidden="true" />
            맞아요
          </button>
          <button
            type="button"
            onClick={handleBad}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition ${
              feedback === "bad"
                ? "border-coral bg-coral text-white"
                : "border-ink/10 bg-paper/70 text-ink hover:border-coral hover:text-coral"
            }`}
          >
            <MessageSquareWarning size={16} aria-hidden="true" />
            달라요
          </button>
        </div>

        {feedback === "bad" && (
          <div className="rounded-lg border border-coral/20 bg-coral/5 p-4">
            <p className="text-sm font-bold text-ink">어떤 점이 달랐나요?</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {wrongReasonOptions.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-semibold text-ink/70 transition hover:border-coral/40"
                >
                  <input
                    type="radio"
                    name={`feedback-reason-${result.id}`}
                    value={option}
                    checked={wrongReason === option}
                    onChange={() => setWrongReason(option)}
                    className="h-4 w-4 accent-coral"
                  />
                  {option}
                </label>
              ))}
            </div>

            <label
              htmlFor={`feedback-comment-${result.id}`}
              className="mt-4 block text-sm font-bold text-ink"
            >
              추가 의견
            </label>
            <textarea
              id={`feedback-comment-${result.id}`}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="mt-2 min-h-24 w-full resize-none rounded-lg border border-ink/15 bg-white p-3 text-sm leading-6 outline-none transition focus:border-coral focus:ring-4 focus:ring-coral/10"
              placeholder="해석 품질 개선에 필요한 내용을 적어주세요."
            />

            <button
              type="button"
              onClick={() =>
                wrongReason && persistFeedback("bad", wrongReason)
              }
              disabled={!canSaveBad}
              className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-bold text-white transition hover:bg-coral disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} aria-hidden="true" />
              피드백 저장
            </button>
          </div>
        )}

        {status === "saved" && (
          <p className="inline-flex items-center gap-2 rounded-md bg-pine/10 px-3 py-2 text-sm font-bold text-pine">
            <CheckCircle2 size={16} aria-hidden="true" />
            피드백이 저장되었습니다.
          </p>
        )}

        {status === "error" && (
          <p className="rounded-md bg-coral/10 px-3 py-2 text-sm font-bold text-coral">
            피드백 저장 중 문제가 발생했습니다.
          </p>
        )}
      </div>
    </ResultBlock>
  );
}
