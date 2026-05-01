import { indicatorCatalog } from "./indicatorCatalog";
import type {
  AlternativeInterpretation,
  IndicatorExplanation,
  MachineQuery,
  MatchedPhrase,
  RiskProfile,
  SearchCondition,
  TranslationResult,
} from "./types";

const profileCopy: Record<RiskProfile, string> = {
  balanced: "균형형",
  conservative: "보수적",
  aggressive: "공격적",
};

const keywordGroups = {
  stability: ["안정", "꾸준", "저변동", "방어", "튼튼", "대형", "우량"],
  momentum: ["거래량", "강한", "탄력", "돌파", "추세", "활발", "관심"],
  growth: ["성장", "실적", "매출", "영업이익", "턴어라운드", "개선"],
  value: ["저평가", "per", "pbr", "배당", "가치", "부담"],
  shortTerm: ["단기", "빠른", "민감", "스윙", "급등락"],
};

const profileDefaults = {
  balanced: {
    minMarketCap: "3,000억원",
    minTradingValue: "30억원",
    maxVolatility: "25%",
    rsiRange: "40~68",
    rsiCeiling: "68",
    volumeSpike: "130%",
    volumeAcceleration: "125%",
    shortReturn: "3%",
    recentReturnCap: "18%",
    maDistanceRange: "-5%~8%",
    pullbackReturnRange: "-6%~1%",
    pullbackRsiRange: "42~58",
    revenueGrowth: "5%",
    operatingGrowth: "0%",
    maxPer: "18",
    maxPbr: "1.8",
  },
  conservative: {
    minMarketCap: "7,000억원",
    minTradingValue: "70억원",
    maxVolatility: "18%",
    rsiRange: "42~62",
    rsiCeiling: "62",
    volumeSpike: "115%",
    volumeAcceleration: "115%",
    shortReturn: "0%",
    recentReturnCap: "10%",
    maDistanceRange: "-4%~6%",
    pullbackReturnRange: "-4%~0%",
    pullbackRsiRange: "44~55",
    revenueGrowth: "3%",
    operatingGrowth: "0%",
    maxPer: "15",
    maxPbr: "1.5",
  },
  aggressive: {
    minMarketCap: "1,000억원",
    minTradingValue: "20억원",
    maxVolatility: "35%",
    rsiRange: "45~76",
    rsiCeiling: "76",
    volumeSpike: "160%",
    volumeAcceleration: "145%",
    shortReturn: "5%",
    recentReturnCap: "28%",
    maDistanceRange: "-8%~12%",
    pullbackReturnRange: "-9%~3%",
    pullbackRsiRange: "40~64",
    revenueGrowth: "10%",
    operatingGrowth: "8%",
    maxPer: "28",
    maxPbr: "3.0",
  },
};

type ProfileDefaults = (typeof profileDefaults)[RiskProfile];

type PhraseRule = {
  id: string;
  phrases: string[];
  interpretation: string;
  mappedIndicators: string[];
  alternatives: AlternativeInterpretation[];
  buildConditions: (defaults: ProfileDefaults) => SearchCondition[];
};

const createId = () =>
  `tr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const hasKeyword = (input: string, group: keyof typeof keywordGroups) =>
  keywordGroups[group].some((word) => input.includes(word));

const numberFromText = (value: string) =>
  Number(value.replace(/,/g, "").replace(/[^0-9.-]/g, ""));

const percentFromText = (value: string) => numberFromText(value);

const krwFromEok = (value: string) => numberFromText(value) * 100_000_000;

const rangeFromText = (value: string) => {
  const [min, max] = value.split("~").map((item) => percentFromText(item));
  return { min, max };
};

const condition = (
  id: string,
  category: SearchCondition["category"],
  label: string,
  metric: string,
  operator: string,
  value: string,
  reason: string,
  indicatorKey: string,
  machineQuery: MachineQuery,
): SearchCondition => ({
  id,
  category,
  label,
  metric,
  operator,
  value,
  display: `${metric} ${operator} ${value}`,
  reason,
  indicatorKey,
  machineQuery,
});

const phraseDictionary: PhraseRule[] = [
  {
    id: "trend-distance-control",
    phrases: [
      "추세를 너무 벗어나지 않은",
      "추세에서 벗어나지 않은",
      "평균에서 너무 멀지 않은",
      "평균에서 멀지 않은",
      "이격이 크지 않은",
    ],
    interpretation:
      "가격이 기준 평균에서 과하게 멀어지지 않은 흐름으로 해석했습니다.",
    mappedIndicators: ["볼린저밴드", "이동평균선 이격도", "RSI"],
    alternatives: [
      {
        label: "평균 회귀형",
        description:
          "평균에서 멀어진 뒤 다시 가까워지는 구간을 더 중점적으로 볼 수 있습니다.",
        conditionHints: ["20일 이동평균선 이격도 축소", "볼린저밴드 중심선 근접"],
      },
      {
        label: "추세 유지형",
        description:
          "평균과 너무 붙어 있는 상태보다 중기 흐름을 유지하는 쪽으로 볼 수도 있습니다.",
        conditionHints: ["종가 >= 60일 이동평균선", "20일선 >= 60일선"],
      },
    ],
    buildConditions: (defaults) => [
      condition(
        "phrase-bollinger-inside",
        "risk",
        "밴드 내부 유지",
        "종가 위치",
        "inside",
        "볼린저밴드(20,2) 상단~하단",
        "평균 범위에서 과하게 벗어난 구간을 줄이기 위한 조건입니다.",
        "bollingerBand",
        { field: "close", operator: "insideBand", band: "bollinger_20_2" },
      ),
      condition(
        "phrase-ma-distance",
        "risk",
        "평균 대비 이격 제한",
        "20일 이동평균선 이격도",
        "between",
        defaults.maDistanceRange,
        "현재 가격이 기준 평균에서 지나치게 멀어지지 않았는지 확인합니다.",
        "maDistance",
        {
          field: "ma20_distance_pct",
          operator: "between",
          ...rangeFromText(defaults.maDistanceRange),
          unit: "percent",
        },
      ),
      condition(
        "phrase-rsi-ceiling",
        "risk",
        "RSI 상한",
        "RSI(14)",
        "<=",
        defaults.rsiCeiling,
        "흐름 강도가 한쪽으로 과하게 쏠린 구간을 줄이기 위한 조건입니다.",
        "rsi",
        {
          field: "rsi_14",
          operator: "<=",
          value: numberFromText(defaults.rsiCeiling),
          unit: "ratio",
        },
      ),
    ],
  },
  {
    id: "overheat-avoidance",
    phrases: [
      "너무 오른 건 싫어",
      "너무 오른건 싫어",
      "과열은 싫어",
      "과열된 건 싫어",
      "많이 오른 건 제외",
      "많이 오른건 제외",
    ],
    interpretation:
      "최근 가격 변화가 과하게 커진 구간을 줄이고 싶은 표현으로 해석했습니다.",
    mappedIndicators: ["최근 상승률", "RSI", "볼린저밴드"],
    alternatives: [
      {
        label: "상승률 제한 강화",
        description:
          "최근 가격 변화율 기준을 더 좁혀 빠르게 오른 구간을 더 많이 줄일 수 있습니다.",
        conditionHints: ["20일 상승률 상한 낮추기", "5일 가격 변화율 상한 추가"],
      },
      {
        label: "과열 지표 중심",
        description:
          "가격 변화율보다 RSI와 볼린저밴드 위치를 중심으로 해석할 수도 있습니다.",
        conditionHints: ["RSI 상한", "볼린저밴드 상단 과도 이탈 제외"],
      },
    ],
    buildConditions: (defaults) => [
      condition(
        "phrase-recent-return-cap",
        "risk",
        "최근 상승률 제한",
        "20일 상승률",
        "<=",
        defaults.recentReturnCap,
        "짧은 기간에 가격 변화가 과해진 구간을 줄이기 위한 조건입니다.",
        "recentReturn",
        {
          field: "return_20d_pct",
          operator: "<=",
          value: percentFromText(defaults.recentReturnCap),
          unit: "percent",
        },
      ),
      condition(
        "phrase-overheat-rsi-cap",
        "risk",
        "과열 강도 제한",
        "RSI(14)",
        "<=",
        defaults.rsiCeiling,
        "가격 흐름의 강도가 과하게 높은 구간을 줄입니다.",
        "rsi",
        {
          field: "rsi_14",
          operator: "<=",
          value: numberFromText(defaults.rsiCeiling),
          unit: "ratio",
        },
      ),
      condition(
        "phrase-bollinger-upper-limit",
        "risk",
        "상단 이탈 제한",
        "종가 / 볼린저밴드 상단",
        "<=",
        "102%",
        "밴드 상단을 과하게 벗어난 구간을 제외하는 조건입니다.",
        "bollingerBand",
        {
          field: "close_to_bollinger_upper_pct",
          operator: "<=",
          value: 102,
          unit: "percent",
        },
      ),
    ],
  },
  {
    id: "volume-strength-building",
    phrases: [
      "슬슬 힘 붙는",
      "슬슬 힘이 붙는",
      "거래가 붙는",
      "거래량이 붙는",
      "힘이 붙는",
    ],
    interpretation:
      "거래 활성도와 단기 흐름 변화가 함께 나타나는 구간으로 해석했습니다.",
    mappedIndicators: ["거래량/거래대금", "이동평균선", "MACD"],
    alternatives: [
      {
        label: "거래량 중심",
        description:
          "가격 흐름보다 최근 거래량 증가를 더 강하게 보는 조건으로 바꿀 수 있습니다.",
        conditionHints: ["5일 평균 거래량 / 20일 평균 거래량", "20일 평균 거래대금"],
      },
      {
        label: "흐름 전환 중심",
        description:
          "거래량보다 단기 이동평균과 MACD의 전환을 더 중점적으로 볼 수도 있습니다.",
        conditionHints: ["5일선 >= 20일선", "MACD 히스토그램 >= 0"],
      },
    ],
    buildConditions: (defaults) => [
      condition(
        "phrase-volume-acceleration",
        "liquidity",
        "최근 거래량 증가",
        "5일 평균 거래량 / 20일 평균 거래량",
        ">=",
        defaults.volumeAcceleration,
        "최근 거래가 이전 평균보다 늘어나는지 확인합니다.",
        "volume",
        {
          field: "avg_volume_5d_to_20d_pct",
          operator: ">=",
          value: percentFromText(defaults.volumeAcceleration),
          unit: "percent",
        },
      ),
      condition(
        "phrase-short-ma-break",
        "trend",
        "단기 흐름 전환",
        "5일 이동평균선",
        ">=",
        "20일 이동평균선",
        "짧은 흐름이 중기 흐름 위로 올라오는지 확인합니다.",
        "movingAverage",
        { field: "ma5", operator: ">=", value: "ma20" },
      ),
      condition(
        "phrase-macd-turn",
        "trend",
        "MACD 전환 확인",
        "MACD 히스토그램",
        ">=",
        "0",
        "단기 흐름의 힘이 이전보다 붙는지 보는 보조 조건입니다.",
        "macd",
        { field: "macd_histogram", operator: ">=", value: 0, unit: "ratio" },
      ),
    ],
  },
  {
    id: "broken-chart-exclusion",
    phrases: [
      "망가진 차트는 제외",
      "차트가 망가진 건 제외",
      "무너진 차트 제외",
      "저점 이탈 제외",
      "신저가 제외",
    ],
    interpretation:
      "중기 기준선을 크게 하회하거나 최근 저점을 이탈한 흐름을 줄이고 싶은 표현으로 해석했습니다.",
    mappedIndicators: ["이동평균선", "신고가/신저가", "정배열/역배열"],
    alternatives: [
      {
        label: "중기선 중심",
        description:
          "60일 이동평균선 위에 있는지에 더 무게를 두는 방식으로 해석할 수 있습니다.",
        conditionHints: ["종가 >= 60일 이동평균선", "20일선 >= 60일선"],
      },
      {
        label: "저점 이탈 중심",
        description:
          "최근 저점 또는 신저가 조건을 더 엄격하게 보는 방식도 가능합니다.",
        conditionHints: ["60일 신저가 제외", "20일 저점 이탈 제외"],
      },
    ],
    buildConditions: () => [
      condition(
        "phrase-close-above-60ma",
        "trend",
        "중기선 하회 제외",
        "종가",
        ">=",
        "60일 이동평균선",
        "중기 흐름 기준선 아래로 내려간 구간을 줄입니다.",
        "movingAverage",
        { field: "close", operator: ">=", value: "ma60" },
      ),
      condition(
        "phrase-no-new-low",
        "risk",
        "최근 저점 이탈 제외",
        "60일 신저가",
        "=",
        "아님",
        "최근 저점을 새로 낮춘 구간을 제외하는 조건입니다.",
        "highLowBreakout",
        {
          field: "is_60d_new_low",
          operator: "=",
          value: false,
          unit: "boolean",
        },
      ),
      condition(
        "phrase-not-reverse-alignment",
        "trend",
        "역배열 제외",
        "20일 이동평균선",
        ">=",
        "60일 이동평균선",
        "단기와 중기 흐름이 완전히 아래로 정렬된 상태를 줄입니다.",
        "movingAverageAlignment",
        { field: "ma20", operator: ">=", value: "ma60" },
      ),
    ],
  },
  {
    id: "pullback",
    phrases: ["눌림목", "눌린 후", "쉬어가는", "잠깐 눌린"],
    interpretation:
      "중기 흐름은 유지하되 단기 가격 변화가 쉬어 가는 구간으로 해석했습니다.",
    mappedIndicators: ["눌림목", "이동평균선", "RSI", "최근 상승률"],
    alternatives: [
      {
        label: "짧은 조정 중심",
        description:
          "단기 가격 변화율이 약하게 내려온 상태를 더 중점적으로 볼 수 있습니다.",
        conditionHints: ["5일 가격 변화율 범위", "20일선 근접"],
      },
      {
        label: "중기 흐름 중심",
        description:
          "단기 조정보다 20일선과 60일선의 관계를 더 강하게 볼 수도 있습니다.",
        conditionHints: ["20일선 >= 60일선", "종가 >= 60일선"],
      },
    ],
    buildConditions: (defaults) => [
      condition(
        "phrase-pullback-trend",
        "trend",
        "중기 추세 유지",
        "20일 이동평균선",
        ">=",
        "60일 이동평균선",
        "중기 흐름은 유지되는지 확인합니다.",
        "movingAverageAlignment",
        { field: "ma20", operator: ">=", value: "ma60" },
      ),
      condition(
        "phrase-pullback-short-rest",
        "trend",
        "단기 조정",
        "5일 가격 변화율",
        "between",
        defaults.pullbackReturnRange,
        "단기적으로 쉬어 가는 상태를 수치 범위로 표현합니다.",
        "pullback",
        {
          field: "return_5d_pct",
          operator: "between",
          ...rangeFromText(defaults.pullbackReturnRange),
          unit: "percent",
        },
      ),
      condition(
        "phrase-pullback-rsi-neutral",
        "risk",
        "RSI 중립 구간",
        "RSI(14)",
        "between",
        defaults.pullbackRsiRange,
        "과하게 식거나 과하게 뜨거운 상태를 피하기 위한 보조 조건입니다.",
        "rsi",
        {
          field: "rsi_14",
          operator: "between",
          ...rangeFromText(defaults.pullbackRsiRange),
          unit: "ratio",
        },
      ),
    ],
  },
  {
    id: "three-white-soldiers",
    phrases: ["적삼병", "양봉이 이어지는", "양봉 연속"],
    interpretation:
      "짧은 기간의 캔들 흐름이 연속적으로 강해지는 패턴으로 해석했습니다.",
    mappedIndicators: ["적삼병", "거래량/거래대금", "RSI"],
    alternatives: [
      {
        label: "캔들 패턴 중심",
        description:
          "3거래일 연속 양봉 자체를 중심 조건으로 둘 수 있습니다.",
        conditionHints: ["최근 3거래일 양봉", "종가가 전일 종가 이상"],
      },
    ],
    buildConditions: (defaults) => [
      condition(
        "phrase-three-white-soldiers",
        "trend",
        "적삼병 패턴",
        "최근 3거래일 캔들",
        "=",
        "양봉 연속",
        "짧은 기간에 캔들 흐름이 이어지는지 확인합니다.",
        "threeWhiteSoldiers",
        {
          field: "is_three_white_soldiers",
          operator: "=",
          value: true,
          unit: "boolean",
        },
      ),
      condition(
        "phrase-three-white-rsi",
        "risk",
        "패턴 과열 제한",
        "RSI(14)",
        "<=",
        defaults.rsiCeiling,
        "패턴이 나타나더라도 흐름 강도가 과한 구간은 줄입니다.",
        "rsi",
        {
          field: "rsi_14",
          operator: "<=",
          value: numberFromText(defaults.rsiCeiling),
          unit: "ratio",
        },
      ),
    ],
  },
];

const uniqueExplanations = (conditions: SearchCondition[]): IndicatorExplanation[] => {
  const keys = Array.from(new Set(conditions.map((item) => item.indicatorKey)));
  return keys
    .map((key) => indicatorCatalog[key])
    .filter((item): item is IndicatorExplanation => Boolean(item));
};

const uniqueAlternatives = (
  alternatives: AlternativeInterpretation[],
): AlternativeInterpretation[] => {
  const seen = new Set<string>();
  return alternatives.filter((item) => {
    if (seen.has(item.label)) {
      return false;
    }

    seen.add(item.label);
    return true;
  });
};

const findPhraseMatches = (input: string) =>
  phraseDictionary
    .map((rule) => {
      const phrase = rule.phrases.find((candidate) =>
        input.includes(candidate.toLowerCase()),
      );

      return phrase ? { rule, phrase } : null;
    })
    .filter((item): item is { rule: PhraseRule; phrase: string } => Boolean(item));

const addCondition = (
  conditionsById: Map<string, SearchCondition>,
  nextCondition: SearchCondition,
) => {
  if (!conditionsById.has(nextCondition.id)) {
    conditionsById.set(nextCondition.id, nextCondition);
  }
};

const addConditions = (
  conditionsById: Map<string, SearchCondition>,
  nextConditions: SearchCondition[],
) => {
  nextConditions.forEach((nextCondition) => addCondition(conditionsById, nextCondition));
};

const fallbackAlternatives: AlternativeInterpretation[] = [
  {
    label: "안정성 중심",
    description:
      "모호한 표현을 규모, 변동성, 중기 이동평균선 기준으로 더 차분하게 해석할 수 있습니다.",
    conditionHints: ["시가총액 하한", "60일 변동성 상한", "종가 >= 60일선"],
  },
  {
    label: "활성도 중심",
    description:
      "거래가 붙는 흐름을 더 중점적으로 보려면 거래량과 단기 이동평균 조건을 강화할 수 있습니다.",
    conditionHints: ["5일/20일 거래량 비교", "5일선 >= 20일선", "MACD 히스토그램 >= 0"],
  },
  {
    label: "평균 근접 중심",
    description:
      "평균에서 멀지 않은 흐름을 더 보고 싶다면 이격도와 볼린저밴드 조건을 중심으로 둘 수 있습니다.",
    conditionHints: ["20일선 이격도 범위", "볼린저밴드 내부", "RSI 중립 구간"],
  },
];

export const translateWithMock = (
  rawInput: string,
  profile: RiskProfile = "balanced",
): TranslationResult => {
  const input = rawInput.trim();
  const normalized = input.toLowerCase();
  const defaults = profileDefaults[profile];
  const phraseMatches = findPhraseMatches(normalized);

  const wantsStability = hasKeyword(normalized, "stability");
  const wantsMomentum = hasKeyword(normalized, "momentum");
  const wantsGrowth = hasKeyword(normalized, "growth");
  const wantsValue = hasKeyword(normalized, "value");
  const wantsShortTerm = hasKeyword(normalized, "shortTerm");

  const conditionsById = new Map<string, SearchCondition>();

  addCondition(
    conditionsById,
    condition(
      "liquidity-trading-value",
      "liquidity",
      "거래 실행 필터",
      "20일 평균 거래대금",
      ">=",
      defaults.minTradingValue,
      "조건식 결과가 거래가 너무 얇은 구간에 몰리지 않도록 기본 유동성 기준을 둡니다.",
      "volume",
      {
        field: "avg_trading_value_20d_krw",
        operator: ">=",
        value: krwFromEok(defaults.minTradingValue),
        unit: "krw",
      },
    ),
  );

  if (wantsStability || !wantsMomentum) {
    addConditions(conditionsById, [
      condition(
        "stability-market-cap",
        "stability",
        "규모 안정성",
        "시가총액",
        ">=",
        defaults.minMarketCap,
        "안정감, 대형, 꾸준함 같은 표현을 기업 규모 기준으로 정리합니다.",
        "marketCap",
        {
          field: "market_cap_krw",
          operator: ">=",
          value: krwFromEok(defaults.minMarketCap),
          unit: "krw",
        },
      ),
      condition(
        "risk-volatility",
        "risk",
        "흔들림 제한",
        "60일 변동성",
        "<=",
        wantsShortTerm ? profileDefaults.aggressive.maxVolatility : defaults.maxVolatility,
        "가격 흔들림이 과한 구간을 줄여 사용자가 말한 안정감에 맞춥니다.",
        "volatility",
        {
          field: "volatility_60d_pct",
          operator: "<=",
          value: percentFromText(
            wantsShortTerm
              ? profileDefaults.aggressive.maxVolatility
              : defaults.maxVolatility,
          ),
          unit: "percent",
        },
      ),
    ]);
  }

  if (wantsMomentum || wantsShortTerm) {
    addConditions(conditionsById, [
      condition(
        "momentum-volume-spike",
        "liquidity",
        "거래 활성도",
        "금일 거래량 / 20일 평균 거래량",
        ">=",
        defaults.volumeSpike,
        "관심이 늘어난 흐름을 거래량 변화로 표현합니다.",
        "volume",
        {
          field: "volume_today_to_avg_20d_pct",
          operator: ">=",
          value: percentFromText(defaults.volumeSpike),
          unit: "percent",
        },
      ),
      condition(
        "trend-short-return",
        "trend",
        "최근 흐름",
        "20일 상승률",
        ">=",
        defaults.shortReturn,
        "강한 흐름이나 단기 탄력이라는 표현을 최근 가격 흐름 조건으로 바꿉니다.",
        "recentReturn",
        {
          field: "return_20d_pct",
          operator: ">=",
          value: percentFromText(defaults.shortReturn),
          unit: "percent",
        },
      ),
    ]);
  }

  addConditions(conditionsById, [
    condition(
      "trend-ma",
      "trend",
      "추세 정렬",
      "20일 이동평균선",
      ">",
      "60일 이동평균선",
      "단기 흐름이 중기 흐름보다 위에 있는지 확인해 조건의 방향성을 정리합니다.",
      "movingAverageAlignment",
      { field: "ma20", operator: ">", value: "ma60" },
    ),
    condition(
      "risk-rsi",
      "risk",
      "과열 구간 완화",
      "RSI(14)",
      "between",
      defaults.rsiRange,
      "흐름의 강도를 보되 한쪽으로 과하게 쏠린 구간을 줄이기 위한 보조 조건입니다.",
      "rsi",
      {
        field: "rsi_14",
        operator: "between",
        ...rangeFromText(defaults.rsiRange),
        unit: "ratio",
      },
    ),
  ]);

  phraseMatches.forEach(({ rule }) => {
    addConditions(conditionsById, rule.buildConditions(defaults));
  });

  if (wantsGrowth) {
    addConditions(conditionsById, [
      condition(
        "growth-revenue",
        "growth",
        "매출 흐름",
        "최근 분기 매출 증가율",
        ">=",
        defaults.revenueGrowth,
        "성장이나 실적 개선이라는 표현을 매출의 방향성으로 정량화합니다.",
        "fundamentals",
        {
          field: "revenue_growth_recent_quarter_pct",
          operator: ">=",
          value: percentFromText(defaults.revenueGrowth),
          unit: "percent",
        },
      ),
      condition(
        "growth-operating-profit",
        "growth",
        "이익 흐름",
        "최근 분기 영업이익 증가율",
        ">=",
        defaults.operatingGrowth,
        "사업 성과가 함께 개선되는지를 별도 조건으로 확인합니다.",
        "fundamentals",
        {
          field: "operating_profit_growth_recent_quarter_pct",
          operator: ">=",
          value: percentFromText(defaults.operatingGrowth),
          unit: "percent",
        },
      ),
    ]);
  }

  if (wantsValue) {
    addConditions(conditionsById, [
      condition(
        "valuation-per",
        "valuation",
        "이익 대비 가격 부담",
        "PER",
        "<=",
        defaults.maxPer,
        "가격 부담이 낮은 편이라는 표현을 이익 대비 가격 기준으로 바꿉니다.",
        "valuation",
        {
          field: "per",
          operator: "<=",
          value: numberFromText(defaults.maxPer),
          unit: "ratio",
        },
      ),
      condition(
        "valuation-pbr",
        "valuation",
        "자산 대비 가격 부담",
        "PBR",
        "<=",
        defaults.maxPbr,
        "자산 기준에서 과도하게 높지 않은 구간을 찾는 조건입니다.",
        "valuation",
        {
          field: "pbr",
          operator: "<=",
          value: numberFromText(defaults.maxPbr),
          unit: "ratio",
        },
      ),
    ]);
  }

  const conditions = Array.from(conditionsById.values());
  const matchedPhrases: MatchedPhrase[] = phraseMatches.map(({ rule, phrase }) => ({
    id: rule.id,
    phrase,
    interpretation: rule.interpretation,
    mappedIndicators: rule.mappedIndicators,
  }));
  const phraseAlternatives = phraseMatches.flatMap(({ rule }) => rule.alternatives);
  const alternativeInterpretations = uniqueAlternatives(
    phraseAlternatives.length > 0 ? phraseAlternatives : fallbackAlternatives,
  );

  const themeParts = [
    wantsStability ? "안정성" : null,
    wantsMomentum || wantsShortTerm ? "거래 활성도와 최근 흐름" : null,
    wantsGrowth ? "실적 흐름" : null,
    wantsValue ? "가격 부담" : null,
    ...matchedPhrases.map((item) => item.phrase),
  ].filter(Boolean);

  const matchedPhraseText = matchedPhrases.map((item) => `"${item.phrase}"`).join(", ");
  const interpretationSummary =
    matchedPhrases.length > 0
      ? `${matchedPhraseText} 표현을 인식해 평균과의 거리, 과열 완화, 거래 활성도, 중기 흐름 유지 같은 조건으로 분해했습니다. 결과는 입력 문장을 조건식으로 변환한 조건검색 참고용 구조입니다.`
      : "명확한 사전 표현은 없어서 유동성, 추세, 변동성의 기본 축으로 입력 문장을 조건식으로 변환했습니다. 결과는 조건검색 참고용 구조입니다.";

  return {
    id: createId(),
    profile,
    intent:
      themeParts.length > 0
        ? `${profileCopy[profile]} 기준으로 ${themeParts.join(", ")}을 함께 보는 조건식으로 해석했습니다.`
        : `${profileCopy[profile]} 기준으로 유동성, 추세, 변동성의 기본 균형을 보는 조건식으로 해석했습니다.`,
    reading:
      input.length > 0
        ? `"${input}" 문장을 조건검색 지표 중심으로 분해했습니다. 실제 종목 데이터 조회 없이 조건 구조만 만듭니다.`
        : "입력 문장이 비어 있어 기본 균형형 조건 예시를 표시합니다.",
    matchedPhrases,
    interpretationSummary,
    alternativeInterpretations,
    conditions,
    explanations: uniqueExplanations(conditions),
    referenceLabel: "조건검색 참고용",
    generatedAt: new Date().toISOString(),
  };
};
