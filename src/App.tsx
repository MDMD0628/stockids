import { useEffect, useMemo, useState } from "react";
import { BarChart3, SlidersHorizontal } from "lucide-react";
import { AlternativeInterpretationPanel } from "./components/AlternativeInterpretationPanel";
import { ConditionGroupPanel } from "./components/ConditionGroupPanel";
import { DisclaimerBar } from "./components/DisclaimerBar";
import { FeedbackLogPanel } from "./components/FeedbackLogPanel";
import { FeedbackPanel } from "./components/FeedbackPanel";
import { IndicatorExplanationPanel } from "./components/IndicatorExplanationPanel";
import { InputPanel } from "./components/InputPanel";
import { LearningSuggestionPanel } from "./components/LearningSuggestionPanel";
import { MatchedPhrasePanel } from "./components/MatchedPhrasePanel";
import { PlainLanguageSummaryPanel } from "./components/PlainLanguageSummaryPanel";
import { profileOptions } from "./components/ProfileSelector";
import { QuickPrompts } from "./components/QuickPrompts";
import { ResultBlock } from "./components/ResultBlock";
import { ResultSummary } from "./components/ResultSummary";
import { RiskFactorPanel } from "./components/RiskFactorPanel";
import { SelectableFilterPanel } from "./components/SelectableFilterPanel";
import { TranslationConclusionCard } from "./components/TranslationConclusionCard";
import { indicatorCatalog } from "./lib/indicatorCatalog";
import {
  buildSelectedFilterConditions,
  getSelectedFilterSnapshots,
  type SelectableFilterId,
} from "./lib/selectableFilters";
import { translateQuery } from "./lib/translator";
import { getRiskFactors } from "./lib/resultPresentation";
import type {
  IndicatorExplanation,
  RiskProfile,
  TranslationResult,
} from "./lib/types";

const starterPrompts = [
  "평균에서 너무 멀지 않고 거래가 붙는 조건",
  "눌림목인데 망가진 차트는 제외하고 싶다",
  "슬슬 힘 붙지만 너무 오른 건 싫어",
];

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));

function App() {
  const [query, setQuery] = useState(starterPrompts[0]);
  const [profile, setProfile] = useState<RiskProfile>("balanced");
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [resultInput, setResultInput] = useState(query);
  const [resultProfile, setResultProfile] = useState<RiskProfile>(profile);
  const [feedbackRefreshKey, setFeedbackRefreshKey] = useState(0);
  const [selectedFilterIds, setSelectedFilterIds] = useState<SelectableFilterId[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFilterConditions = useMemo(
    () =>
      result
        ? buildSelectedFilterConditions(selectedFilterIds, resultProfile)
        : [],
    [result, resultProfile, selectedFilterIds],
  );

  const visibleConditions = useMemo(
    () => (result ? [...result.conditions, ...selectedFilterConditions] : []),
    [result, selectedFilterConditions],
  );

  const visibleExplanations = useMemo(() => {
    const keys = Array.from(
      new Set(visibleConditions.map((condition) => condition.indicatorKey)),
    );

    return keys
      .map((key) => indicatorCatalog[key])
      .filter((item): item is IndicatorExplanation => Boolean(item));
  }, [visibleConditions]);

  const riskFactors = useMemo(
    () => getRiskFactors(selectedFilterIds),
    [selectedFilterIds],
  );

  const selectedFilterSnapshots = useMemo(
    () => getSelectedFilterSnapshots(selectedFilterIds),
    [selectedFilterIds],
  );

  const conditionCount = visibleConditions.length;
  const indicatorCount = visibleExplanations.length;

  const selectedProfile = useMemo(
    () => profileOptions.find((option) => option.id === profile)!,
    [profile],
  );

  const runTranslation = async (nextProfile = profile, nextQuery = query) => {
    setIsLoading(true);
    setError(null);

    try {
      const translated = await translateQuery(nextQuery, nextProfile);
      setResult(translated);
      setResultInput(nextQuery);
      setResultProfile(nextProfile);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "조건식 변환 중 알 수 없는 문제가 생겼습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const changeProfile = (nextProfile: RiskProfile) => {
    setProfile(nextProfile);
    void runTranslation(nextProfile);
  };

  const selectPrompt = (prompt: string) => {
    setQuery(prompt);
    void runTranslation(profile, prompt);
  };

  useEffect(() => {
    void runTranslation(profile, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section className="border-b border-ink/10 bg-white/80">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-5 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-white">
                <BarChart3 size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase text-pine">StockIDS</p>
                <h1 className="text-2xl font-bold md:text-3xl">
                  자연어 조건검색 번역기
                </h1>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm md:min-w-[360px]">
            <Metric label="조건" value={conditionCount.toString()} />
            <Metric label="지표" value={indicatorCount.toString()} />
            <Metric label="표시" value="참고용" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[420px_1fr] lg:px-8">
        <aside className="space-y-5">
          <InputPanel
            isLoading={isLoading}
            onProfileChange={changeProfile}
            onQueryChange={setQuery}
            onTranslate={() => void runTranslation()}
            profile={profile}
            query={query}
          />
          <QuickPrompts prompts={starterPrompts} onSelect={selectPrompt} />
        </aside>

        <section className="space-y-5">
          <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-md bg-citrus/15 px-2.5 py-1 text-xs font-bold text-ink">
                  <SlidersHorizontal size={14} aria-hidden="true" />
                  {selectedProfile.label} 조정값 적용
                </div>
                <h2 className="text-xl font-bold">번역 결과</h2>
              </div>

              {result && (
                <span className="text-sm text-ink/55">
                  생성 시각 {formatTime(result.generatedAt)}
                </span>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-coral/25 bg-coral/10 p-4 text-sm font-semibold text-coral">
                {error}
              </div>
            )}

            {!result && !error && (
              <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-ink/20 bg-paper/60 text-sm text-ink/60">
                문장을 입력하면 조건식 구조가 여기에 표시됩니다.
              </div>
            )}

            {result && (
              <div className="space-y-5">
                <TranslationConclusionCard result={result} />

                <PlainLanguageSummaryPanel
                  conditions={visibleConditions}
                  riskFactors={riskFactors}
                />

                <ResultSummary intent={result.intent} reading={result.reading} />

                <MatchedPhrasePanel matchedPhrases={result.matchedPhrases} />

                <ResultBlock
                  icon={<SlidersHorizontal size={18} aria-hidden="true" />}
                  title="이렇게 해석한 이유"
                >
                  <p className="text-sm leading-6 text-ink/70">
                    {result.interpretationSummary}
                  </p>
                </ResultBlock>

                <AlternativeInterpretationPanel
                  alternatives={result.alternativeInterpretations}
                />

                <RiskFactorPanel factors={riskFactors} />

                <SelectableFilterPanel
                  selectedFilterIds={selectedFilterIds}
                  onChange={setSelectedFilterIds}
                />

                <ConditionGroupPanel conditions={visibleConditions} />

                <IndicatorExplanationPanel
                  explanations={visibleExplanations}
                />

                <FeedbackPanel
                  conditions={visibleConditions}
                  input={resultInput}
                  profile={resultProfile}
                  result={result}
                  selectedFilters={selectedFilterSnapshots}
                  onSaved={() => setFeedbackRefreshKey((current) => current + 1)}
                />
              </div>
            )}
          </div>

          <FeedbackLogPanel refreshKey={feedbackRefreshKey} />

          <LearningSuggestionPanel refreshKey={feedbackRefreshKey} />

          <DisclaimerBar />
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-paper/70 p-3">
      <p className="text-xs font-semibold text-ink/50">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

export default App;
