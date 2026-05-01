import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Gauge,
  Loader2,
  RefreshCw,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Zap,
} from "lucide-react";
import { translateQuery } from "./lib/translator";
import type { RiskProfile, TranslationResult } from "./lib/types";

const starterPrompts = [
  "평균에서 너무 멀지 않고 거래가 붙는 조건",
  "눌림목인데 망가진 차트는 제외하고 싶다",
  "슬슬 힘 붙지만 너무 오른 건 싫어",
];

const profileOptions: Array<{
  id: RiskProfile;
  label: string;
  caption: string;
  icon: typeof Shield;
}> = [
  {
    id: "conservative",
    label: "보수적",
    caption: "규모와 흔들림 제한 강화",
    icon: Shield,
  },
  {
    id: "balanced",
    label: "균형",
    caption: "유동성, 추세, 위험 균형",
    icon: Gauge,
  },
  {
    id: "aggressive",
    label: "공격적",
    caption: "활성도와 민감도 확대",
    icon: Zap,
  },
];

const categoryLabel: Record<string, string> = {
  trend: "추세",
  liquidity: "유동성",
  stability: "안정성",
  valuation: "가격 부담",
  growth: "실적",
  risk: "위험 관리",
};

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conditionCount = result?.conditions.length ?? 0;
  const indicatorCount = result?.explanations.length ?? 0;

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
                <p className="text-sm font-semibold uppercase text-pine">
                  StockIDS
                </p>
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
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-[168px] w-full resize-none rounded-lg border border-ink/15 bg-paper/60 p-4 text-base leading-7 outline-none transition focus:border-pool focus:bg-white focus:ring-4 focus:ring-pool/10"
              placeholder="예: 거래량이 늘고 변동은 너무 크지 않은 조건"
            />

            <div className="mt-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void runTranslation()}
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

              <div className="grid grid-cols-3 gap-2">
                {profileOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = option.id === profile;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => changeProfile(option.id)}
                      aria-pressed={isActive}
                      title={option.caption}
                      className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg border px-2 text-center text-sm font-bold transition ${
                        isActive
                          ? "border-pine bg-pine text-white"
                          : "border-ink/10 bg-white text-ink hover:border-pool hover:text-pool"
                      }`}
                    >
                      <Icon size={18} aria-hidden="true" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-ink/10 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <RefreshCw size={17} className="text-coral" aria-hidden="true" />
              <h2 className="text-sm font-bold">빠른 입력</h2>
            </div>
            <div className="space-y-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setQuery(prompt);
                    void runTranslation(profile, prompt);
                  }}
                  className="w-full rounded-lg border border-ink/10 bg-paper/50 px-3 py-3 text-left text-sm leading-6 transition hover:border-coral hover:bg-coral/5"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
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
                <ResultBlock
                  icon={<Activity size={18} aria-hidden="true" />}
                  title="사용자의 의도 해석"
                >
                  <p className="text-base leading-7 text-ink/80">{result.intent}</p>
                  <p className="mt-2 text-sm leading-6 text-ink/55">{result.reading}</p>
                </ResultBlock>

                <ResultBlock
                  icon={<Sparkles size={18} aria-hidden="true" />}
                  title="인식한 표현"
                >
                  {result.matchedPhrases.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {result.matchedPhrases.map((item) => (
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
                          <p className="text-sm leading-6 text-ink/65">
                            {item.interpretation}
                          </p>
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

                <ResultBlock
                  icon={<SlidersHorizontal size={18} aria-hidden="true" />}
                  title="이렇게 해석한 이유"
                >
                  <p className="text-sm leading-6 text-ink/70">
                    {result.interpretationSummary}
                  </p>
                </ResultBlock>

                <ResultBlock
                  icon={<RefreshCw size={18} aria-hidden="true" />}
                  title="다르게 해석할 수도 있는 조건"
                >
                  <div className="grid gap-3 md:grid-cols-3">
                    {result.alternativeInterpretations.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-lg border border-ink/10 bg-paper/45 p-4"
                      >
                        <h3 className="text-sm font-bold">{item.label}</h3>
                        <p className="mt-2 text-sm leading-6 text-ink/65">
                          {item.description}
                        </p>
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

                <ResultBlock
                  icon={<ArrowRight size={18} aria-hidden="true" />}
                  title="변환된 검색 조건"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    {result.conditions.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-ink/10 bg-paper/45 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-pool">
                            {categoryLabel[item.category]}
                          </span>
                          <span className="text-xs font-semibold text-ink/45">
                            {item.label}
                          </span>
                        </div>
                        <p className="break-keep text-sm font-bold leading-6">
                          {item.display}
                        </p>
                        <details className="mt-3 rounded-lg border border-ink/10 bg-white">
                          <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-ink/60 transition hover:text-pool">
                            실행용 조건 보기
                          </summary>
                          <pre className="max-h-48 overflow-auto border-t border-ink/10 p-3 text-xs leading-5 text-ink/70">
                            {JSON.stringify(item.machineQuery, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ))}
                  </div>
                </ResultBlock>

                <ResultBlock
                  icon={<Gauge size={18} aria-hidden="true" />}
                  title="각 조건을 선택한 이유"
                >
                  <div className="space-y-3">
                    {result.conditions.map((item) => (
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
                    {result.explanations.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-lg border border-ink/10 bg-white p-4"
                      >
                        <h3 className="font-bold">{item.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-ink/65">{item.plain}</p>
                        <p className="mt-2 text-sm leading-6 text-pine">{item.usedFor}</p>
                      </div>
                    ))}
                  </div>
                </ResultBlock>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-ink/10 bg-ink p-5 text-white">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-citrus">조건검색 참고용</p>
                <p className="mt-1 text-sm leading-6 text-white/70">
                  이 화면은 자연어를 조건식으로 정리하는 MVP이며, 실제 종목 데이터 조회나
                  투자 판단을 대신하지 않습니다.
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm font-bold">
                <BadgeCheck size={16} aria-hidden="true" />
                표시 완료
              </span>
            </div>
          </div>
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

function ResultBlock({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-pool/10 text-pool">
          {icon}
        </span>
        <h3 className="text-base font-bold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export default App;
