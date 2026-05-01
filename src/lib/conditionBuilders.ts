import type { MachineQuery, RiskProfile, SearchCondition } from "./types";

export const profileDefaults = {
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

export type ProfileDefaults = (typeof profileDefaults)[RiskProfile];

const numberFromText = (value: string) =>
  Number(value.replace(/,/g, "").replace(/[^0-9.-]/g, ""));

const percentFromText = (value: string) => numberFromText(value);

const krwFromEok = (value: string) => numberFromText(value) * 100_000_000;

const rangeFromText = (value: string) => {
  const [min, max] = value.split("~").map((item) => percentFromText(item));
  return { min, max };
};

export const condition = (
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

export const buildLiquidityCondition = (defaults: ProfileDefaults) =>
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
  );

export const buildStabilityConditions = (
  defaults: ProfileDefaults,
  wantsShortTerm: boolean,
) => [
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
        wantsShortTerm ? profileDefaults.aggressive.maxVolatility : defaults.maxVolatility,
      ),
      unit: "percent",
    },
  ),
];

export const buildMomentumConditions = (defaults: ProfileDefaults) => [
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
];

export const buildCoreTrendRiskConditions = (defaults: ProfileDefaults) => [
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
];

export const buildGrowthConditions = (defaults: ProfileDefaults) => [
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
];

export const buildValueConditions = (defaults: ProfileDefaults) => [
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
];

export const buildTrendDistanceConditions = (defaults: ProfileDefaults) => [
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
];

export const buildOverheatAvoidanceConditions = (defaults: ProfileDefaults) => [
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
];

export const buildVolumeStrengthConditions = (defaults: ProfileDefaults) => [
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
];

export const buildBrokenChartExclusionConditions = () => [
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
];

export const buildPullbackConditions = (defaults: ProfileDefaults) => [
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
];

export const buildThreeWhiteSoldiersConditions = (defaults: ProfileDefaults) => [
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
];
