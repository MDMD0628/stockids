import { AlertTriangle } from "lucide-react";
import type { RiskFactor } from "../lib/resultPresentation";
import { ResultBlock } from "./ResultBlock";

type RiskFactorPanelProps = {
  factors: RiskFactor[];
};

export function RiskFactorPanel({ factors }: RiskFactorPanelProps) {
  return (
    <ResultBlock
      icon={<AlertTriangle size={18} aria-hidden="true" />}
      title="위험 요소 표시"
    >
      <div className="mb-3 rounded-lg border border-citrus/30 bg-citrus/10 p-4 text-sm leading-6 text-ink/70">
        아래 항목은 조건검색 결과에서 제외된 것이 아니라, 주의해서 볼 항목입니다.
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {factors.map((factor) => (
          <article
            key={factor.id}
            className="rounded-lg border border-ink/10 bg-paper/45 p-4"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-citrus/20 px-2 py-1 text-xs font-bold text-ink">
                출처: 위험 표시 항목
              </span>
            </div>
            <h3 className="text-sm font-bold text-ink">{factor.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              {factor.description}
            </p>
          </article>
        ))}
      </div>
    </ResultBlock>
  );
}
