export type RiskProfile = "balanced" | "conservative" | "aggressive";

export type ConditionCategory =
  | "trend"
  | "liquidity"
  | "stability"
  | "valuation"
  | "growth"
  | "risk";

export type ConditionSource =
  | "user_expression"
  | "user_selected_filter"
  | "risk_notice";

export type MachineQuery =
  | {
      field: string;
      operator: ">=" | "<=" | ">" | "<" | "=";
      value: number | string | boolean;
      unit?: "percent" | "krw" | "ratio" | "boolean";
    }
  | {
      field: string;
      operator: "between";
      min: number;
      max: number;
      unit?: "percent" | "krw" | "ratio";
    }
  | {
      field: string;
      operator: "insideBand";
      band: "bollinger_20_2";
    };

export type SearchCondition = {
  id: string;
  category: ConditionCategory;
  label: string;
  metric: string;
  operator: string;
  value: string;
  display: string;
  reason: string;
  easyDescription: string;
  source: ConditionSource;
  sourcePhrase?: string;
  indicatorKey: string;
  machineQuery: MachineQuery;
};

export type IndicatorExplanation = {
  key: string;
  name: string;
  plain: string;
  usedFor: string;
};

export type MatchedPhrase = {
  id: string;
  phrase: string;
  interpretation: string;
  mappedIndicators: string[];
};

export type AlternativeInterpretation = {
  label: string;
  description: string;
  conditionHints: string[];
};

export type TranslationResult = {
  id: string;
  profile: RiskProfile;
  intent: string;
  reading: string;
  matchedPhrases: MatchedPhrase[];
  interpretationSummary: string;
  alternativeInterpretations: AlternativeInterpretation[];
  conditions: SearchCondition[];
  explanations: IndicatorExplanation[];
  referenceLabel: "조건검색 참고용";
  generatedAt: string;
};
