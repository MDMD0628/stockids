export type RiskProfile = "balanced" | "conservative" | "aggressive";

export type ConditionCategory =
  | "trend"
  | "liquidity"
  | "stability"
  | "valuation"
  | "growth"
  | "risk";

export type SearchCondition = {
  id: string;
  category: ConditionCategory;
  label: string;
  metric: string;
  operator: string;
  value: string;
  display: string;
  reason: string;
  indicatorKey: string;
};

export type IndicatorExplanation = {
  key: string;
  name: string;
  plain: string;
  usedFor: string;
};

export type TranslationResult = {
  id: string;
  profile: RiskProfile;
  intent: string;
  reading: string;
  conditions: SearchCondition[];
  explanations: IndicatorExplanation[];
  referenceLabel: "조건검색 참고용";
  generatedAt: string;
};
