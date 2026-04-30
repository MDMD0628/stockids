import { indicatorCatalog } from "./indicatorCatalog";
import type {
  IndicatorExplanation,
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

const createId = () =>
  `tr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const hasKeyword = (input: string, group: keyof typeof keywordGroups) =>
  keywordGroups[group].some((word) => input.includes(word));

const uniqueExplanations = (conditions: SearchCondition[]): IndicatorExplanation[] => {
  const keys = Array.from(new Set(conditions.map((condition) => condition.indicatorKey)));
  return keys
    .map((key) => indicatorCatalog[key])
    .filter((item): item is IndicatorExplanation => Boolean(item));
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
});

const profileDefaults = {
  balanced: {
    minMarketCap: "3,000억원",
    minTradingValue: "30억원",
    maxVolatility: "25%",
    rsiRange: "40~68",
    volumeSpike: "130%",
    shortReturn: "3%",
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
    volumeSpike: "115%",
    shortReturn: "0%",
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
    volumeSpike: "160%",
    shortReturn: "5%",
    revenueGrowth: "10%",
    operatingGrowth: "8%",
    maxPer: "28",
    maxPbr: "3.0",
  },
};

export const translateWithMock = (
  rawInput: string,
  profile: RiskProfile = "balanced",
): TranslationResult => {
  const input = rawInput.trim();
  const normalized = input.toLowerCase();
  const defaults = profileDefaults[profile];

  const wantsStability = hasKeyword(normalized, "stability");
  const wantsMomentum = hasKeyword(normalized, "momentum");
  const wantsGrowth = hasKeyword(normalized, "growth");
  const wantsValue = hasKeyword(normalized, "value");
  const wantsShortTerm = hasKeyword(normalized, "shortTerm");

  const conditions: SearchCondition[] = [];

  conditions.push(
    condition(
      "liquidity-trading-value",
      "liquidity",
      "거래 실행 필터",
      "20일 평균 거래대금",
      ">=",
      defaults.minTradingValue,
      "조건식 결과가 거래가 너무 얇은 구간에 몰리지 않도록 기본 유동성 기준을 둡니다.",
      "volume",
    ),
  );

  if (wantsStability || !wantsMomentum) {
    conditions.push(
      condition(
        "stability-market-cap",
        "stability",
        "규모 안정성",
        "시가총액",
        ">=",
        defaults.minMarketCap,
        "안정감, 대형, 꾸준함 같은 표현을 기업 규모 기준으로 정리합니다.",
        "marketCap",
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
      ),
    );
  }

  if (wantsMomentum || wantsShortTerm) {
    conditions.push(
      condition(
        "momentum-volume-spike",
        "liquidity",
        "거래 활성도",
        "금일 거래량 / 20일 평균 거래량",
        ">=",
        defaults.volumeSpike,
        "관심이 늘어난 흐름을 거래량 변화로 표현합니다.",
        "volume",
      ),
      condition(
        "trend-short-return",
        "trend",
        "최근 흐름",
        "20일 수익률",
        ">=",
        defaults.shortReturn,
        "강한 흐름이나 단기 탄력이라는 표현을 최근 가격 흐름 조건으로 바꿉니다.",
        "movingAverage",
      ),
    );
  }

  conditions.push(
    condition(
      "trend-ma",
      "trend",
      "추세 정렬",
      "20일 이동평균선",
      ">",
      "60일 이동평균선",
      "단기 흐름이 중기 흐름보다 위에 있는지 확인해 조건의 방향성을 정리합니다.",
      "movingAverage",
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
    ),
  );

  if (wantsGrowth) {
    conditions.push(
      condition(
        "growth-revenue",
        "growth",
        "매출 흐름",
        "최근 분기 매출 증가율",
        ">=",
        defaults.revenueGrowth,
        "성장이나 실적 개선이라는 표현을 매출의 방향성으로 정량화합니다.",
        "fundamentals",
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
      ),
    );
  }

  if (wantsValue) {
    conditions.push(
      condition(
        "valuation-per",
        "valuation",
        "이익 대비 가격 부담",
        "PER",
        "<=",
        defaults.maxPer,
        "가격 부담이 낮은 편이라는 표현을 이익 대비 가격 기준으로 바꿉니다.",
        "valuation",
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
      ),
    );
  }

  const themeParts = [
    wantsStability ? "안정성" : null,
    wantsMomentum || wantsShortTerm ? "거래 활성도와 최근 흐름" : null,
    wantsGrowth ? "실적 흐름" : null,
    wantsValue ? "가격 부담" : null,
  ].filter(Boolean);

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
    conditions,
    explanations: uniqueExplanations(conditions),
    referenceLabel: "조건검색 참고용",
    generatedAt: new Date().toISOString(),
  };
};
