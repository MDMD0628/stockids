import type { SelectableFilterId } from "./selectableFilters";
import type { SearchCondition, TranslationResult } from "./types";

export type RiskFactor = {
  id: string;
  title: string;
  description: string;
  relatedFilterId?: SelectableFilterId;
};

const conditionEasyCopy: Record<string, string> = {
  "momentum-volume-spike": "최근 거래가 평소보다 늘어난 종목",
  "trend-short-return": "최근 가격 흐름이 너무 약하지 않은 종목",
  "growth-revenue": "최근 매출 흐름이 개선되는 종목",
  "growth-operating-profit": "이익 흐름도 함께 확인되는 종목",
  "valuation-per": "이익 대비 가격 부담이 과하지 않은 종목",
  "valuation-pbr": "자산 대비 가격 부담이 과하지 않은 종목",
  "phrase-bollinger-inside":
    "가격이 평균 흐름의 범위에서 너무 멀리 벗어나지 않은 종목",
  "phrase-ma-distance": "가격이 평균선에서 너무 멀리 떨어지지 않은 종목",
  "phrase-rsi-ceiling": "과열 신호가 강하지 않은 종목",
  "phrase-recent-return-cap": "최근 가격 변화가 과하게 앞서가지 않은 종목",
  "phrase-overheat-rsi-cap": "흐름 강도가 과하게 높지 않은 종목",
  "phrase-bollinger-upper-limit":
    "평균 범위의 상단을 과하게 벗어나지 않은 종목",
  "phrase-volume-acceleration": "최근 거래가 평소보다 늘어난 종목",
  "phrase-short-ma-break": "짧은 흐름이 중기 흐름 위로 올라오는 종목",
  "phrase-macd-turn": "단기 흐름의 힘이 이전보다 붙는 종목",
  "phrase-stable-uptrend-ma-alignment": "중기 흐름이 아래로 밀리지 않은 종목",
  "phrase-stable-uptrend-ma-slope": "중기 기준선이 위쪽으로 정돈된 종목",
  "phrase-stable-uptrend-60d-return": "중기 가격 흐름이 위쪽 방향을 유지한 종목",
  "phrase-stable-uptrend-volatility": "가격 움직임이 과도하게 흔들리지 않은 종목",
  "phrase-stable-uptrend-drawdown": "최근 고점에서 크게 밀리지 않은 종목",
  "phrase-stable-uptrend-runup-cap": "짧은 기간에 과하게 앞서가지 않은 종목",
  "phrase-close-above-60ma": "중기 흐름 기준선 아래로 내려가지 않은 종목",
  "phrase-no-new-low": "최근 저점을 새로 낮추지 않은 종목",
  "phrase-not-reverse-alignment": "흐름이 아래로 정렬되지 않은 종목",
  "phrase-pullback-trend": "중기 흐름은 유지되는 종목",
  "phrase-pullback-short-rest": "단기적으로 쉬어 가는 종목",
  "phrase-pullback-rsi-neutral": "흐름 강도가 너무 식거나 뜨겁지 않은 종목",
  "phrase-three-white-soldiers": "최근 양봉 흐름이 이어지는 종목",
  "phrase-three-white-rsi": "캔들 흐름이 있어도 과열 신호가 강하지 않은 종목",
  "filter-thin-liquidity": "거래가 너무 얇은 종목을 줄입니다.",
  "filter-small-market-cap": "시가총액이 작은 종목을 줄입니다.",
  "filter-high-volatility": "변동성이 큰 종목을 줄입니다.",
  "filter-deficit-company": "최근 영업이익이 적자인 기업을 줄입니다.",
  "filter-recent-runup": "최근 가격 변화가 과한 종목을 줄입니다.",
};

const phraseSummaryCopy: Record<string, string> = {
  "trend-distance-control": "평균 흐름에서 너무 멀지 않은",
  "overheat-avoidance": "과하게 앞서간 흐름은 줄인",
  "volume-strength-building": "최근 거래 관심이 붙은",
  "stable-uptrend": "급등락이 크지 않고 중기 상승 흐름이 이어지는",
  "broken-chart-exclusion": "흐름이 크게 훼손된 구간은 제외하는",
  pullback: "중기 흐름은 유지하되 잠시 쉬어가는",
  "three-white-soldiers": "양봉 흐름이 이어지는",
};

const conditionSummaryCopy: Record<string, string> = {
  "momentum-volume-spike": "최근 거래가 평소보다 활발한",
  "trend-short-return": "최근 흐름이 너무 약하지 않은",
  "phrase-stable-uptrend-ma-alignment": "중기 상승 흐름을 유지하는",
  "phrase-stable-uptrend-ma-slope": "중기 기준선이 아래로 꺾이지 않은",
  "phrase-stable-uptrend-volatility": "급등락을 줄인",
  "growth-revenue": "실적 흐름을 함께 보는",
  "growth-operating-profit": "이익 흐름을 함께 보는",
  "valuation-per": "가격 부담을 줄인",
  "valuation-pbr": "자산 대비 가격 부담을 줄인",
  "filter-small-market-cap": "규모 안정성을 함께 보는",
  "filter-high-volatility": "흔들림을 줄인",
};

const riskFactors: RiskFactor[] = [
  {
    id: "thin-liquidity-risk",
    title: "거래량 부족 가능성",
    description:
      "이 조건은 거래가 얇은 종목도 포함할 수 있습니다. 원하면 선택 필터에서 제외할 수 있습니다.",
    relatedFilterId: "thin_liquidity",
  },
  {
    id: "small-cap-risk",
    title: "소형주 변동성 가능성",
    description:
      "시가총액이 작은 종목은 가격 변동이 크게 나타날 수 있습니다. 원하면 선택 필터에서 제외할 수 있습니다.",
    relatedFilterId: "small_market_cap",
  },
  {
    id: "high-volatility-risk",
    title: "변동성 과다 가능성",
    description:
      "가격 흔들림이 큰 종목도 포함될 수 있습니다. 원하면 선택 필터에서 제외할 수 있습니다.",
    relatedFilterId: "high_volatility",
  },
  {
    id: "recent-runup-risk",
    title: "단기 과열 후 되돌림 가능성",
    description:
      "최근 가격 변화가 큰 종목도 포함될 수 있습니다. 원하면 선택 필터에서 제외할 수 있습니다.",
    relatedFilterId: "recent_runup",
  },
  {
    id: "earnings-risk",
    title: "실적 불안정 가능성",
    description:
      "실적이 불안정한 기업도 포함될 수 있습니다. 원하면 선택 필터에서 제외할 수 있습니다.",
    relatedFilterId: "deficit_company",
  },
  {
    id: "theme-volatility-risk",
    title: "테마성 변동 가능성",
    description:
      "입력 문장을 조건식으로 변환한 결과이며, 테마성 가격 변화는 별도 확인이 필요할 수 있습니다.",
  },
];

export const getConditionSourceLabel = (condition: SearchCondition) => {
  if (condition.source === "user_selected_filter") {
    return "사용자 선택 필터";
  }

  if (condition.source === "risk_notice") {
    return "위험 표시 항목";
  }

  return "사용자 표현 기반 조건";
};

export const getConditionEasyDescription = (condition: SearchCondition) =>
  conditionEasyCopy[condition.id] ?? condition.easyDescription ?? condition.reason;

export const getConditionReason = (condition: SearchCondition) => {
  if (condition.source === "user_expression") {
    return condition.sourcePhrase
      ? `사용자가 “${condition.sourcePhrase}”라고 표현했기 때문에 ${condition.reason}`
      : `입력 문장에 관련 표현이 있어 ${condition.reason}`;
  }

  if (condition.source === "user_selected_filter") {
    return `사용자가 선택 필터를 직접 켰기 때문에 조건식에 추가했습니다. ${condition.reason}`;
  }

  return `조건검색 결과에서 제외된 것은 아니며, 주의해서 볼 위험 요소로 표시합니다. ${condition.reason}`;
};

export const splitConditionsBySource = (conditions: SearchCondition[]) => ({
  userExpressionConditions: conditions.filter(
    (condition) => condition.source === "user_expression",
  ),
  selectedFilterConditions: conditions.filter(
    (condition) => condition.source === "user_selected_filter",
  ),
  riskNoticeConditions: conditions.filter(
    (condition) => condition.source === "risk_notice",
  ),
});

export const getRiskFactors = (selectedFilterIds: SelectableFilterId[]) =>
  riskFactors.map((factor) => ({
    ...factor,
    description:
      factor.relatedFilterId && selectedFilterIds.includes(factor.relatedFilterId)
        ? `${factor.description} 현재 해당 선택 필터가 켜져 조건식에 추가되어 있습니다.`
        : factor.description,
  }));

export const buildTranslationHeadline = (result: TranslationResult) => {
  const phraseParts = result.matchedPhrases
    .map((phrase) => phraseSummaryCopy[phrase.id])
    .filter((item): item is string => Boolean(item));
  const conditionParts = result.conditions
    .filter((condition) => condition.source === "user_expression")
    .map((condition) => conditionSummaryCopy[condition.id])
    .filter((item): item is string => Boolean(item));
  const parts = Array.from(new Set([...phraseParts, ...conditionParts])).slice(0, 3);

  if (parts.length > 0) {
    return `“${parts.join("면서, ")} 종목 조건”으로 해석됩니다.`;
  }

  return "“입력 문장에서 직접 드러난 표현을 조건식으로 변환하는 결과”로 해석됩니다.";
};

export const buildTranslationCharacter = (result: TranslationResult) => {
  const phraseIds = new Set(result.matchedPhrases.map((phrase) => phrase.id));

  if (
    phraseIds.has("trend-distance-control") &&
    phraseIds.has("volume-strength-building")
  ) {
    return "과열 추격형보다는 균형형 관심 증가 조건에 가깝습니다.";
  }

  if (phraseIds.has("pullback")) {
    return "중기 흐름을 유지하면서 단기 조정을 확인하는 조건에 가깝습니다.";
  }

  if (phraseIds.has("overheat-avoidance")) {
    return "과하게 앞서간 흐름을 줄이는 조건에 가깝습니다.";
  }

  if (phraseIds.has("stable-uptrend")) {
    return "급등락을 줄이면서 중기 흐름이 이어지는지를 보는 조건에 가깝습니다.";
  }

  if (phraseIds.has("broken-chart-exclusion")) {
    return "흐름이 크게 훼손된 구간을 줄이는 조건에 가깝습니다.";
  }

  return "입력 문장을 조건식으로 변환하고, 위험 요소는 별도 표시하는 조건검색 참고용 결과입니다.";
};

export const buildPlainLanguageBullets = (
  conditions: SearchCondition[],
  factors: RiskFactor[],
) => {
  const { userExpressionConditions, selectedFilterConditions } =
    splitConditionsBySource(conditions);
  const userBullets = userExpressionConditions.map(getConditionEasyDescription);
  const selectedFilterBullets = selectedFilterConditions.map(getConditionEasyDescription);
  const riskBullet =
    factors.length > 0
      ? "단, 거래량이 얇거나 변동성이 큰 종목도 포함될 수 있습니다."
      : null;

  return Array.from(
    new Set([...userBullets, ...selectedFilterBullets, riskBullet].filter(Boolean)),
  ).slice(0, 7);
};
