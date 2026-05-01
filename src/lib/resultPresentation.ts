import type { SearchCondition, TranslationResult } from "./types";

const conditionEasyCopy: Record<string, string> = {
  "liquidity-trading-value": "거래가 너무 얇은 항목은 기본적으로 줄입니다.",
  "stability-market-cap": "규모가 너무 작은 항목은 기본적으로 줄입니다.",
  "risk-volatility": "가격 흔들림이 큰 항목은 기본적으로 줄입니다.",
  "trend-ma": "단기 흐름이 중기 흐름보다 무너지지 않았는지 봅니다.",
  "risk-rsi": "흐름 강도가 한쪽으로 과하게 치우치지 않았는지 봅니다.",
  "momentum-volume-spike": "오늘 거래가 평소보다 활발한지 봅니다.",
  "trend-short-return": "최근 가격 흐름이 너무 약하지 않은지 봅니다.",
  "growth-revenue": "최근 매출 흐름이 개선되는지 봅니다.",
  "growth-operating-profit": "이익 흐름도 함께 확인합니다.",
  "valuation-per": "이익 대비 가격 부담이 과하지 않은지 봅니다.",
  "valuation-pbr": "자산 대비 가격 부담이 과하지 않은지 봅니다.",
  "phrase-bollinger-inside":
    "가격이 평균 흐름의 범위에서 크게 벗어나지 않았는지 봅니다.",
  "phrase-ma-distance": "가격이 평균선에서 너무 멀리 떨어지지 않았는지 봅니다.",
  "phrase-rsi-ceiling": "과열 신호가 강하지 않은 항목으로 좁힙니다.",
  "phrase-recent-return-cap": "짧은 기간에 과하게 앞서간 흐름은 줄입니다.",
  "phrase-overheat-rsi-cap": "흐름 강도가 과하게 높아진 구간은 줄입니다.",
  "phrase-bollinger-upper-limit": "평균 범위의 상단을 과하게 벗어난 구간은 줄입니다.",
  "phrase-volume-acceleration": "최근 거래가 평소보다 늘어난 항목을 봅니다.",
  "phrase-short-ma-break": "짧은 흐름이 중기 흐름 위로 올라오는지 봅니다.",
  "phrase-macd-turn": "단기 흐름의 힘이 이전보다 붙는지 봅니다.",
  "phrase-close-above-60ma": "중기 흐름 기준선 아래로 내려간 항목은 줄입니다.",
  "phrase-no-new-low": "최근 저점을 새로 낮춘 항목은 줄입니다.",
  "phrase-not-reverse-alignment": "흐름이 아래로 정렬된 항목은 줄입니다.",
  "phrase-pullback-trend": "중기 흐름은 유지되는지 봅니다.",
  "phrase-pullback-short-rest": "단기적으로 쉬어 가는 상태인지 봅니다.",
  "phrase-pullback-rsi-neutral": "흐름 강도가 너무 식거나 뜨겁지 않은지 봅니다.",
  "phrase-three-white-soldiers": "최근 양봉 흐름이 이어지는지 봅니다.",
  "phrase-three-white-rsi": "캔들 흐름이 있어도 과한 구간은 줄입니다.",
};

const phraseSummaryCopy: Record<string, string> = {
  "trend-distance-control": "평균 흐름에서 너무 멀지 않은",
  "overheat-avoidance": "과하게 앞서간 흐름은 줄인",
  "volume-strength-building": "최근 거래 관심이 붙은",
  "broken-chart-exclusion": "흐름이 크게 훼손된 구간은 제외하는",
  pullback: "중기 흐름은 유지하되 잠시 쉬어가는",
  "three-white-soldiers": "양봉 흐름이 이어지는",
};

const conditionSummaryCopy: Record<string, string> = {
  "momentum-volume-spike": "최근 거래가 평소보다 활발한",
  "trend-short-return": "최근 흐름이 너무 약하지 않은",
  "growth-revenue": "실적 흐름을 함께 보는",
  "growth-operating-profit": "이익 흐름을 함께 보는",
  "valuation-per": "가격 부담을 줄인",
  "valuation-pbr": "자산 대비 가격 부담을 줄인",
  "stability-market-cap": "규모 안정성을 함께 보는",
  "risk-volatility": "흔들림을 줄인",
};

export const getConditionSourceLabel = (condition: SearchCondition) =>
  condition.source === "user_expression"
    ? "사용자 표현 기반 조건"
    : "기본 안전 필터";

export const getConditionEasyDescription = (condition: SearchCondition) =>
  conditionEasyCopy[condition.id] ?? condition.easyDescription ?? condition.reason;

export const getConditionReason = (condition: SearchCondition) => {
  if (condition.source === "user_expression") {
    return condition.sourcePhrase
      ? `사용자가 “${condition.sourcePhrase}”라고 표현했기 때문에 ${condition.reason}`
      : `입력 문장에 관련 표현이 있어 ${condition.reason}`;
  }

  return `사용자 표현에서 직접 나온 조건은 아니지만, 너무 거래가 얇거나 변동성이 큰 항목을 줄이기 위한 기본 필터입니다. ${condition.reason}`;
};

export const splitConditionsBySource = (conditions: SearchCondition[]) => ({
  userExpressionConditions: conditions.filter(
    (condition) => condition.source === "user_expression",
  ),
  defaultFilterConditions: conditions.filter(
    (condition) => condition.source !== "user_expression",
  ),
});

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
    return `“${parts.join("면서, ")} 검색 조건”으로 해석됩니다.`;
  }

  return "“유동성, 흐름, 변동성을 함께 확인하는 기본 검색 조건”으로 해석됩니다.";
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

  if (phraseIds.has("broken-chart-exclusion")) {
    return "흐름이 크게 훼손된 구간을 줄이는 조건에 가깝습니다.";
  }

  return "입력 문장을 조건식으로 변환한 조건검색 참고용 결과입니다.";
};

export const buildPlainLanguageBullets = (conditions: SearchCondition[]) => {
  const { userExpressionConditions, defaultFilterConditions } =
    splitConditionsBySource(conditions);
  const userBullets = userExpressionConditions.map(getConditionEasyDescription);
  const defaultBullets = defaultFilterConditions.map(getConditionEasyDescription);

  return Array.from(new Set([...userBullets, ...defaultBullets])).slice(0, 7);
};
