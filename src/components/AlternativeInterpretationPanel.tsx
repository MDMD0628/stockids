import { RefreshCw } from "lucide-react";
import type { AlternativeInterpretation } from "../lib/types";
import { ResultBlock } from "./ResultBlock";

type AlternativeInterpretationPanelProps = {
  alternatives: AlternativeInterpretation[];
};

export function AlternativeInterpretationPanel({
  alternatives,
}: AlternativeInterpretationPanelProps) {
  return (
    <ResultBlock
      icon={<RefreshCw size={18} aria-hidden="true" />}
      title="다르게 해석할 수도 있는 조건"
    >
      <div className="grid gap-3 md:grid-cols-3">
        {alternatives.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-ink/10 bg-paper/45 p-4"
          >
            <h3 className="text-sm font-bold">{item.label}</h3>
            <p className="mt-2 text-sm leading-6 text-ink/65">{item.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.conditionHints.map((hint) => (
                <span
                  key={hint}
                  className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink/60"
                >
                  {hint}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ResultBlock>
  );
}
