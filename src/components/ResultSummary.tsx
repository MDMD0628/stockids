import { Activity } from "lucide-react";
import { ResultBlock } from "./ResultBlock";

type ResultSummaryProps = {
  intent: string;
  reading: string;
};

export function ResultSummary({ intent, reading }: ResultSummaryProps) {
  return (
    <ResultBlock
      icon={<Activity size={18} aria-hidden="true" />}
      title="사용자의 의도 해석"
    >
      <p className="text-base leading-7 text-ink/80">{intent}</p>
      <p className="mt-2 text-sm leading-6 text-ink/55">{reading}</p>
    </ResultBlock>
  );
}
