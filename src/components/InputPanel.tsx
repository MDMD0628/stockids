import { BadgeCheck, Loader2, Sparkles } from "lucide-react";
import type { RiskProfile } from "../lib/types";
import { ProfileSelector } from "./ProfileSelector";

type InputPanelProps = {
  isLoading: boolean;
  onProfileChange: (profile: RiskProfile) => void;
  onQueryChange: (query: string) => void;
  onTranslate: () => void;
  profile: RiskProfile;
  query: string;
};

export function InputPanel({
  isLoading,
  onProfileChange,
  onQueryChange,
  onTranslate,
  profile,
  query,
}: InputPanelProps) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">입력</h2>
          <p className="mt-1 text-sm text-ink/60">
            원하는 종목의 느낌을 문장으로 적어주세요.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-pine/10 px-2.5 py-1 text-xs font-semibold text-pine">
          <BadgeCheck size={14} aria-hidden="true" />
          조건검색 참고용
        </span>
      </div>

      <label htmlFor="query" className="sr-only">
        자연어 입력
      </label>
      <textarea
        id="query"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        className="min-h-[168px] w-full resize-none rounded-lg border border-ink/15 bg-paper/60 p-4 text-base leading-7 outline-none transition focus:border-pool focus:bg-white focus:ring-4 focus:ring-pool/10"
        placeholder="예: 거래량이 늘고 변동은 너무 크지 않은 조건"
      />

      <div className="mt-4 flex flex-col gap-3">
        <button
          type="button"
          onClick={onTranslate}
          disabled={isLoading}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 text-sm font-bold text-white transition hover:bg-pine disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={18} aria-hidden="true" />
          ) : (
            <Sparkles size={18} aria-hidden="true" />
          )}
          조건식으로 번역
        </button>

        <ProfileSelector profile={profile} onChange={onProfileChange} />
      </div>
    </div>
  );
}
