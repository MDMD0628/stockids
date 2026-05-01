import type { SearchCondition } from "../lib/types";
import {
  getConditionEasyDescription,
  getConditionReason,
  getConditionSourceLabel,
} from "../lib/resultPresentation";

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
  const sourceLabel = getConditionSourceLabel(condition);
  const isUserExpression = condition.source === "user_expression";

  return (
    <div className="rounded-lg border border-ink/10 bg-paper/45 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-pool">
          {categoryLabel[condition.category]}
        </span>
        <span className="text-xs font-semibold text-ink/45">{condition.label}</span>
      </div>

      <p className="break-keep text-sm font-bold leading-6">
        {getConditionEasyDescription(condition)}
      </p>

      <div className="mt-3 rounded-lg bg-white p-3">
        <p className="text-xs font-bold text-ink/45">왜 들어갔나요?</p>
        <p className="mt-1 text-sm leading-6 text-ink/65">
          {getConditionReason(condition)}
        </p>
      </div>

      <div className="mt-3">
        <span
          className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${
            isUserExpression ? "bg-pine/10 text-pine" : "bg-citrus/15 text-ink"
          }`}
        >
          출처: {sourceLabel}
        </span>
      </div>

      <details className="mt-3 rounded-lg border border-ink/10 bg-white">
        <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-ink/60 transition hover:text-pool">
          조건식과 실행용 조건 보기
        </summary>
        <div className="border-t border-ink/10 p-3">
          <p className="text-xs font-bold text-ink/45">조건식</p>
          <p className="mt-1 break-keep text-sm font-bold leading-6 text-ink/75">
            {condition.display}
          </p>
          <p className="mt-3 text-xs font-bold text-ink/45">machineQuery</p>
          <pre className="mt-1 max-h-48 overflow-auto rounded-md bg-paper/70 p-3 text-xs leading-5 text-ink/70">
            {JSON.stringify(condition.machineQuery, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  );
}
