import { Sparkles } from "lucide-react";
import type { MatchedPhrase } from "../lib/types";
import { ResultBlock } from "./ResultBlock";

type MatchedPhrasePanelProps = {
  matchedPhrases: MatchedPhrase[];
};

export function MatchedPhrasePanel({ matchedPhrases }: MatchedPhrasePanelProps) {
  return (
    <ResultBlock
      icon={<Sparkles size={18} aria-hidden="true" />}
      title="인식한 표현"
    >
      {matchedPhrases.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {matchedPhrases.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-pine/20 bg-pine/5 p-4"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-pine px-2 py-1 text-xs font-bold text-white">
                  {item.phrase}
                </span>
                {item.mappedIndicators.map((indicator) => (
                  <span
                    key={indicator}
                    className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-pine"
                  >
                    {indicator}
                  </span>
                ))}
              </div>
              <p className="text-sm leading-6 text-ink/65">{item.interpretation}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-6 text-ink/60">
          사전에 등록된 모호한 표현은 따로 감지되지 않았습니다. 입력 문장을
          기본 지표 축으로 변환했습니다.
        </p>
      )}
    </ResultBlock>
  );
}
