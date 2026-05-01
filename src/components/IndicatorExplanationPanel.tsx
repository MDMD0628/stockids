import { BarChart3, Gauge } from "lucide-react";
import type { IndicatorExplanation, SearchCondition } from "../lib/types";
import { ResultBlock } from "./ResultBlock";

type IndicatorExplanationPanelProps = {
  conditions: SearchCondition[];
  explanations: IndicatorExplanation[];
};

export function IndicatorExplanationPanel({
  conditions,
  explanations,
}: IndicatorExplanationPanelProps) {
  return (
    <>
      <ResultBlock
        icon={<Gauge size={18} aria-hidden="true" />}
        title="각 조건을 선택한 이유"
      >
        <div className="space-y-3">
          {conditions.map((item) => (
            <div
              key={`${item.id}-reason`}
              className="grid gap-2 border-b border-ink/10 pb-3 last:border-0 last:pb-0 md:grid-cols-[180px_1fr]"
            >
              <strong className="text-sm">{item.label}</strong>
              <span className="text-sm leading-6 text-ink/65">{item.reason}</span>
            </div>
          ))}
        </div>
      </ResultBlock>

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
    </>
  );
}
