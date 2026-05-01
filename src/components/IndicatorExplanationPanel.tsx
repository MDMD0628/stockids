import { BarChart3 } from "lucide-react";
import type { IndicatorExplanation } from "../lib/types";
import { ResultBlock } from "./ResultBlock";

type IndicatorExplanationPanelProps = {
  explanations: IndicatorExplanation[];
};

export function IndicatorExplanationPanel({
  explanations,
}: IndicatorExplanationPanelProps) {
  return (
    <ResultBlock
      icon={<BarChart3 size={18} aria-hidden="true" />}
      title="사용된 지표의 쉬운 설명"
    >
      <div className="grid gap-3 md:grid-cols-2">
        {explanations.map((item) => (
          <div key={item.key} className="rounded-lg border border-ink/10 bg-white p-4">
            <h3 className="font-bold">{item.name}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/65">{item.plain}</p>
            <p className="mt-2 text-sm leading-6 text-pine">{item.usedFor}</p>
          </div>
        ))}
      </div>
    </ResultBlock>
  );
}
