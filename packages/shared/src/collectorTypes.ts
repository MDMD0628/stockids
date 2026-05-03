export const expressionCategories = [
  {
    id: "trend_chart",
    label: "추세/차트 흐름",
    description: "차트 모양, 추세 유지, 흐름 변화와 관련된 표현",
  },
  {
    id: "volume_attention",
    label: "거래량/거래대금/관심 증가",
    description: "거래 증가, 시장 관심, 거래대금 변화와 관련된 표현",
  },
  {
    id: "volatility_risk",
    label: "변동성/위험 회피",
    description: "큰 흔들림, 과열, 위험 신호를 줄이고 싶은 표현",
  },
  {
    id: "earnings_value",
    label: "실적/가치",
    description: "매출, 이익, 밸류 부담, 회사 기본기와 관련된 표현",
  },
  {
    id: "supply_institution_foreign",
    label: "수급/기관/외국인",
    description: "기관, 외국인, 프로그램, 수급 흐름과 관련된 표현",
  },
  {
    id: "theme_news_issue",
    label: "테마/뉴스/이슈",
    description: "뉴스, 테마, 재료, 이슈성 움직임과 관련된 표현",
  },
  {
    id: "entry_timing_question",
    label: "매수 타이밍 고민",
    description: "진입 시점 고민을 조건검색 언어로 바꾸기 위한 표현",
  },
  {
    id: "exit_stop_question",
    label: "매도/손절 고민",
    description: "이탈, 정리, 위험 관리 고민을 조건검색 언어로 바꾸기 위한 표현",
  },
  {
    id: "other",
    label: "기타",
    description: "아직 명확한 분류가 어려운 표현",
  },
] as const;

export type ExpressionCategoryId = (typeof expressionCategories)[number]["id"];

export type CandidateStatus = "pending" | "approved" | "rejected";

export type AnalysisExpression = {
  phrase: string;
  category: ExpressionCategoryId;
  meaning: string;
  possible_conditions: string[];
  confidence: number;
};

export type AnalysisResponse = {
  expressions: AnalysisExpression[];
};

export type RawItem = {
  id: string;
  rawText: string;
  normalizedText: string;
  textHash: string;
  sourceType: "manual_paste" | "imported_text";
  privacyNote: string;
  createdAt: string;
};

export type ExpressionCandidate = {
  id: string;
  rawItemId: string;
  phrase: string;
  category: ExpressionCategoryId;
  meaning: string;
  possibleConditions: string[];
  confidence: number;
  status: CandidateStatus;
  reviewerNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type ApprovedExpression = {
  id: string;
  candidateId?: string;
  phrase: string;
  category: ExpressionCategoryId;
  meaning: string;
  conditions: string[];
  confidence: number;
  createdAt: string;
  updatedAt: string;
};

export type SourceLog = {
  id: string;
  rawItemId?: string;
  sourceType: RawItem["sourceType"];
  textHash: string;
  action: "raw_item_created" | "ai_analyzed" | "candidate_reviewed";
  createdAt: string;
};

export type AnalyzeRequest = {
  text: string;
  sourceType?: RawItem["sourceType"];
};

export type AnalyzeResult = {
  rawItem: RawItem;
  candidates: ExpressionCandidate[];
  ai: AnalysisResponse;
};

export type CandidateReviewPatch = {
  status: CandidateStatus;
  phrase?: string;
  category?: ExpressionCategoryId;
  meaning?: string;
  possibleConditions?: string[];
  reviewerNote?: string;
};

export const getCategoryLabel = (categoryId: ExpressionCategoryId) =>
  expressionCategories.find((category) => category.id === categoryId)?.label ??
  "기타";

export const isExpressionCategoryId = (
  value: unknown,
): value is ExpressionCategoryId =>
  expressionCategories.some((category) => category.id === value);
