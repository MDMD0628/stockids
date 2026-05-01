import { ListChecks } from "lucide-react";
import type { SearchCondition } from "../lib/types";
import {
  buildPlainLanguageBullets,
  type RiskFactor,
} from "../lib/resultPresentation";
import { ResultBlock } from "./ResultBlock";

type PlainLanguageSummaryPanelProps = {
  conditions: SearchCondition[];
  riskFactors: RiskFactor[];
};

export function PlainLanguageSummaryPanel({
  conditions,
  riskFactors,
}: PlainLanguageSummaryPanelProps) {
  const bullets = buildPlainLanguageBullets(conditions, riskFactors);

  return (
    <ResultBlock
      icon={<ListChecks size={18} aria-hidden="true" />}
      title="쉽게 풀어보면"
    >
      <ul className="grid gap-2 md:grid-cols-2">
        {bullets.map((item) => (
          <li
            key={item}
            className="rounded-lg border border-ink/10 bg-paper/45 px-4 py-3 text-sm font-semibold leading-6 text-ink/75"
          >
            {item}
          </li>
        ))}
      </ul>
    </ResultBlock>
  );
}
