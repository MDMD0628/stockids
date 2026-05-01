import { CheckCircle2, MessageSquareWarning, Save } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  type FeedbackRecord,
  type FeedbackValue,
  type FeedbackWrongReason,
  saveFeedback,
} from "../lib/feedback";
import type { RiskProfile, TranslationResult } from "../lib/types";
import { buildTranslationHeadline } from "../lib/resultPresentation";
import { ResultBlock } from "./ResultBlock";

type IntentFit = "matched" | "not_matched";
type StrengthFeedback = "too_conservative" | "balanced" | "too_aggressive";
type CountFeedback = "too_many" | "balanced" | "too_few";

type FeedbackPanelProps = {
  input: string;
  profile: RiskProfile;
  result: TranslationResult;
  onSaved?: () => void;
};

const intentOptions: Array<{ label: string; value: IntentFit }> = [
  { label: "맞아요", value: "matched" },
  { label: "아니요", value: "not_matched" },
];

const strengthOptions: Array<{ label: string; value: StrengthFeedback }> = [
  { label: "너무 보수적이에요", value: "too_conservative" },
  { label: "적당해요", value: "balanced" },
  { label: "너무 공격적이에요", value: "too_aggressive" },
];

const countOptions: Array<{ label: string; value: CountFeedback }> = [
  { label: "너무 많아요", value: "too_many" },
  { label: "적당해요", value: "balanced" },
  { label: "너무 적어요", value: "too_few" },
];

const getFeedbackResult = (
  intentFit: IntentFit,
  strengthFeedback: StrengthFeedback,
  countFeedback: CountFeedback,
): { feedback: FeedbackValue; wrongReason?: FeedbackWrongReason } => {
  if (intentFit === "not_matched") {
    return { feedback: "bad", wrongReason: "표현을 인식하지 못함" };
  }

  if (strengthFeedback === "too_conservative") {
    return { feedback: "bad", wrongReason: "조건이 너무 보수적임" };
  }

  if (strengthFeedback === "too_aggressive") {
    return { feedback: "bad", wrongReason: "조건이 너무 공격적임" };
  }

  if (countFeedback === "too_many") {
    return { feedback: "bad", wrongReason: "조건이 너무 많음" };
  }

  if (countFeedback === "too_few") {
    return { feedback: "bad", wrongReason: "조건이 너무 적음" };
  }

  return { feedback: "good" };
};

export function FeedbackPanel({
  input,
  profile,
  result,
  onSaved,
}: FeedbackPanelProps) {
  const [intentFit, setIntentFit] = useState<IntentFit | null>(null);
  const [strengthFeedback, setStrengthFeedback] =
    useState<StrengthFeedback>("balanced");
  const [countFeedback, setCountFeedback] = useState<CountFeedback>("balanced");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  const machineQueries = useMemo(
    () => result.conditions.map((condition) => condition.machineQuery),
    [result.conditions],
  );

  useEffect(() => {
    setIntentFit(null);
    setStrengthFeedback("balanced");
    setCountFeedback("balanced");
    setComment("");
    setStatus("idle");
  }, [result.id]);

  const saveCurrentFeedback = () => {
    if (!intentFit) {
      return;
    }

    const { feedback, wrongReason } = getFeedbackResult(
      intentFit,
      strengthFeedback,
      countFeedback,
    );

    const record: FeedbackRecord = {
      id: `${result.id}-${Date.now()}`,
      input,
      profile,
      resultId: result.id,
      matchedPhrases: result.matchedPhrases,
      conditions: result.conditions,
      machineQueries,
      feedback,
      wrongReason,
      intentFit,
      conditionStrengthFeedback: strengthFeedback,
      conditionCountFeedback: countFeedback,
      comment: comment.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      saveFeedback(record);
      setStatus("saved");
      onSaved?.();
    } catch {
      setStatus("error");
    }
  };

  return (
    <ResultBlock
      icon={<MessageSquareWarning size={18} aria-hidden="true" />}
      title="해석 품질 피드백"
    >
      <div className="space-y-5">
        <div>
          <p className="text-sm font-bold">
            이 피드백은 차트 검증이 아니라 의도 확인을 위한 것입니다.
          </p>
          <p className="mt-1 text-sm leading-6 text-ink/60">
            사용자 피드백은 투자 성과가 아니라 자연어 해석 품질 개선용으로만
            저장됩니다.
          </p>
        </div>

        <FeedbackQuestion
          title="이 한 줄 번역이 당신의 의도와 맞나요?"
          helper={buildTranslationHeadline(result)}
        >
          <SegmentedOptions
            name={`intent-fit-${result.id}`}
            options={intentOptions}
            value={intentFit}
            onChange={setIntentFit}
          />
        </FeedbackQuestion>

        <FeedbackQuestion title="조건 강도는 어떤가요?">
          <SegmentedOptions
            name={`strength-${result.id}`}
            options={strengthOptions}
            value={strengthFeedback}
            onChange={setStrengthFeedback}
          />
        </FeedbackQuestion>

        <FeedbackQuestion title="조건 개수는 어떤가요?">
          <SegmentedOptions
            name={`count-${result.id}`}
            options={countOptions}
            value={countFeedback}
            onChange={setCountFeedback}
          />
        </FeedbackQuestion>

        <div>
          <label
            htmlFor={`feedback-comment-${result.id}`}
            className="block text-sm font-bold text-ink"
          >
            추가 의견
          </label>
          <textarea
            id={`feedback-comment-${result.id}`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            className="mt-2 min-h-24 w-full resize-none rounded-lg border border-ink/15 bg-white p-3 text-sm leading-6 outline-none transition focus:border-pool focus:ring-4 focus:ring-pool/10"
            placeholder="서비스가 어떤 표현을 다르게 이해했는지 적어주세요."
          />
        </div>

        <button
          type="button"
          onClick={saveCurrentFeedback}
          disabled={!intentFit}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-bold text-white transition hover:bg-pool disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={16} aria-hidden="true" />
          피드백 저장
        </button>

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

function FeedbackQuestion({
  children,
  helper,
  title,
}: {
  children: ReactNode;
  helper?: string;
  title: string;
}) {
  return (
    <section>
      <p className="text-sm font-bold text-ink">{title}</p>
      {helper && <p className="mt-1 text-sm leading-6 text-ink/60">{helper}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SegmentedOptions<T extends string>({
  name,
  onChange,
  options,
  value,
}: {
  name: string;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  value: T | null;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-3">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-center text-sm font-bold transition ${
            value === option.value
              ? "border-pool bg-pool text-white"
              : "border-ink/10 bg-paper/70 text-ink hover:border-pool hover:text-pool"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}
