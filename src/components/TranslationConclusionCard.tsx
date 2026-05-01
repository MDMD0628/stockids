import { Languages } from "lucide-react";
import type { TranslationResult } from "../lib/types";
import {
  buildTranslationCharacter,
  buildTranslationHeadline,
} from "../lib/resultPresentation";

type TranslationConclusionCardProps = {
  result: TranslationResult;
};

export function TranslationConclusionCard({
  result,
}: TranslationConclusionCardProps) {
  return (
    <section className="rounded-lg border border-pool/20 bg-pool/5 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-pool text-white">
          <Languages size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-bold text-pool">조건검색 참고용</p>
          <h3 className="text-lg font-bold">번역 결과</h3>
        </div>
      </div>

      <p className="break-keep text-xl font-bold leading-8 text-ink md:text-2xl">
        {buildTranslationHeadline(result)}
      </p>
      <p className="mt-3 text-sm leading-6 text-ink/65">
        {buildTranslationCharacter(result)}
      </p>
    </section>
  );
}
