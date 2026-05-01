import type { SearchCondition } from "../lib/types";

const categoryLabel: Record<SearchCondition["category"], string> = {
  trend: "추세",
  liquidity: "유동성",
  stability: "안정성",
  valuation: "가격 부담",
  growth: "실적",
  risk: "위험 관리",
};

type ConditionCardProps = {
  condition: SearchCondition;
};

export function ConditionCard({ condition }: ConditionCardProps) {
  return (
    <div className="rounded-lg border border-ink/10 bg-paper/45 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-pool">
          {categoryLabel[condition.category]}
        </span>
        <span className="text-xs font-semibold text-ink/45">{condition.label}</span>
      </div>
      <p className="break-keep text-sm font-bold leading-6">{condition.display}</p>
      <details className="mt-3 rounded-lg border border-ink/10 bg-white">
        <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-ink/60 transition hover:text-pool">
          실행용 조건 보기
        </summary>
        <pre className="max-h-48 overflow-auto border-t border-ink/10 p-3 text-xs leading-5 text-ink/70">
          {JSON.stringify(condition.machineQuery, null, 2)}
        </pre>
      </details>
    </div>
  );
}
