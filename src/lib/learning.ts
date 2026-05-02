import type { FeedbackRecord, FeedbackWrongReason } from "./feedback";
import type { PhraseRule } from "./phraseDictionary";

export type LearningSuggestion = {
  id: string;
  type: "add_phrase" | "create_rule" | "adjust_threshold";
  title: string;
  description: string;
  confidence: number;
  examples: string[];
  targetRuleId?: string;
  suggestedPhrases?: string[];
  suggestedIndicators?: string[];
  suggestedConditionHints?: string[];
  codexPrompt: string;
};

type KeywordMapping = {
  keywords: string[];
  targetRuleId: string;
  title: string;
  description: string;
  suggestedIndicators: string[];
  suggestedConditionHints: string[];
};

const unrecognizedReason: FeedbackWrongReason = "표현을 인식하지 못함";
const conservativeReason: FeedbackWrongReason = "조건이 너무 보수적임";
const aggressiveReason: FeedbackWrongReason = "조건이 너무 공격적임";

const keywordMappings: KeywordMapping[] = [
  {
    keywords: ["고점", "추격", "꼭대기", "너무 위", "상투", "과열", "불타기", "fomo", "FOMO", "끝물"],
    targetRuleId: "overheat-avoidance",
    title: "과열 회피 표현 추가 후보",
    description:
      "높은 위치나 뒤따라가는 느낌의 표현을 과열 회피 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["최근 상승률", "RSI", "볼린저밴드"],
    suggestedConditionHints: [
      "최근 상승률 상한",
      "RSI 상한",
      "볼린저밴드 상단 과도 이탈 제외",
    ],
  },
  {
    keywords: ["눌림", "조정", "쉬어가는"],
    targetRuleId: "pullback",
    title: "눌림목 표현 추가 후보",
    description:
      "잠시 쉬어가는 흐름을 찾는 표현을 눌림목 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["눌림목", "이동평균선", "RSI", "최근 상승률"],
    suggestedConditionHints: [
      "중기 추세 유지",
      "단기 조정 범위",
      "RSI 중립 구간",
    ],
  },
  {
    keywords: ["거래", "관심", "힘"],
    targetRuleId: "volume-strength-building",
    title: "거래 관심 표현 추가 후보",
    description:
      "거래나 관심이 붙는다는 표현을 거래량 증가 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["거래량/거래대금", "이동평균선", "MACD"],
    suggestedConditionHints: [
      "5일 평균 거래량 / 20일 평균 거래량",
      "20일 평균 거래대금",
      "단기 이동평균 돌파",
    ],
  },
  {
    keywords: ["시장이 모르는", "관심 덜 받은", "숨어 있는", "숨은", "조용한", "주목받기 전"],
    targetRuleId: "under-the-radar-quality",
    title: "시장 관심도 낮은 실적 표현 추가 후보",
    description:
      "실적은 보되 시장 관심도 과열은 낮게 보고 싶은 표현을 별도 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["실적 개선", "최근 상승률", "거래량 과열 여부"],
    suggestedConditionHints: [
      "최근 분기 매출 증가율",
      "TTM 영업이익 > 0",
      "20일 상승률 상한",
      "거래량 과열 여부는 대체 지표로 확인",
    ],
  },
  {
    keywords: ["만년 저평가", "저평가 함정", "싸지만 죽은", "계속 소외", "반응 없는", "계속 빠지는"],
    targetRuleId: "value-trap-avoidance",
    title: "밸류트랩 회피 표현 추가 후보",
    description:
      "낮은 밸류 부담만 보지 않고 차트 훼손과 장기 소외 위험을 줄이고 싶은 표현을 별도 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["PER", "PBR", "60일선 회복", "거래량 회복", "신저가 이탈 제외"],
    suggestedConditionHints: [
      "PER/PBR 상한",
      "종가 >= 60일선",
      "5일 평균 거래량 / 20일 평균 거래량",
      "60일 신저가 아님",
    ],
  },
  {
    keywords: ["실적", "숫자", "돈은 잘 버", "발표", "덜 오른", "안 오른", "가격 부담 낮은", "고점은 아닌", "과열은 아닌"],
    targetRuleId: "earnings-quality-low-price-reaction",
    title: "실적 개선 + 가격 과열 완화 표현 추가 후보",
    description:
      "실적 개선과 최근 가격 과열 제한을 함께 말한 표현을 별도 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["매출 증가율", "영업이익 증가율", "TTM 영업이익", "최근 상승률", "RSI"],
    suggestedConditionHints: [
      "최근 분기 매출 증가율",
      "최근 분기 영업이익 증가율",
      "20일 상승률 상한",
      "RSI 상한",
    ],
  },
  {
    keywords: ["턴어라운드", "다시 좋아지는", "바닥 찍고", "회복", "돌아서는"],
    targetRuleId: "turnaround-recovery",
    title: "실적 회복 표현 추가 후보",
    description:
      "매출 또는 이익이 바닥을 지나 회복되는 느낌의 표현을 별도 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["흑자전환", "영업이익률 개선", "매출 회복", "영업이익 회복"],
    suggestedConditionHints: [
      "영업이익 흑자전환 여부",
      "영업이익률 변화 > 0",
      "최근 분기 매출 증가율 >= 0",
    ],
  },
  {
    keywords: ["매출", "팔리는", "장사", "수요", "제품"],
    targetRuleId: "revenue-growth",
    title: "매출 성장 표현 추가 후보",
    description:
      "외형 성장이나 매출 회복을 말한 표현을 매출 성장 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["최근 분기 매출 증가율", "TTM 매출 증가율", "최근 4분기 매출 증가 추세"],
    suggestedConditionHints: [
      "최근 분기 매출 YoY 증가율",
      "TTM 매출 증가율",
      "이익 조건도 함께 검토",
    ],
  },
  {
    keywords: ["영업이익", "순이익", "수익성", "흑자전환", "이익률"],
    targetRuleId: "profit-growth",
    title: "이익 개선 표현 추가 후보",
    description:
      "사업 수익성이나 이익 개선을 말한 표현을 이익 개선 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["영업이익 증가율", "순이익 증가율", "영업이익률 개선", "TTM 영업이익"],
    suggestedConditionHints: [
      "최근 분기 영업이익 증가율",
      "최근 분기 순이익 증가율",
      "영업이익률 변화 > 0",
    ],
  },
  {
    keywords: ["가격 부담", "비싸지", "밸류 부담", "실적 대비 가격", "기대감 반영"],
    targetRuleId: "valuation-burden-low",
    title: "밸류 부담 완화 표현 추가 후보",
    description:
      "실적이나 자산 대비 가격 부담을 줄이고 싶은 표현을 별도 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["PER", "PBR", "최근 상승률", "RSI", "신고가 근접 위험 표시"],
    suggestedConditionHints: [
      "PER 상한",
      "PBR 상한",
      "20일 상승률 상한",
      "RSI 상한",
    ],
  },
  {
    keywords: ["저평가", "싼데", "PER", "PBR", "밸류", "차트", "추세", "흐름"],
    targetRuleId: "value-with-technical-confirmation",
    title: "밸류 + 차트 확인 표현 추가 후보",
    description:
      "밸류 부담과 차트 훼손 여부를 함께 확인하고 싶은 표현을 별도 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["PER", "PBR", "ROE", "이동평균선", "신저가", "거래량 회복"],
    suggestedConditionHints: [
      "PER/PBR 상한",
      "ROE 하한",
      "20일선 >= 60일선",
      "60일 신저가 아님",
    ],
  },
  {
    keywords: ["안정", "상승", "우상향", "꾸준히", "흐름", "차트"],
    targetRuleId: "stable-uptrend",
    title: "추세 안정성 표현 추가 후보",
    description:
      "안정적으로 이어지는 가격 흐름을 말한 표현을 추세 안정성 규칙에 추가할 수 있습니다.",
    suggestedIndicators: [
      "이동평균선 정배열",
      "이동평균선 기울기",
      "최근 상승률",
      "변동성",
      "고점 대비 낙폭",
    ],
    suggestedConditionHints: [
      "20일선 >= 60일선",
      "60일선 기울기 > 0",
      "60일 변동성 상한",
      "고점 대비 낙폭 제한",
    ],
  },
  {
    keywords: ["출렁", "흔들", "급등락", "롤러코스터", "요동", "변동"],
    targetRuleId: "volatility-risk-avoidance",
    title: "변동성 회피 표현 추가 후보",
    description:
      "가격이 크게 흔들리는 느낌의 표현을 변동성 회피 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["20일 변동성", "60일 변동성", "ATR", "최근 급등락 횟수"],
    suggestedConditionHints: [
      "60일 변동성 상한",
      "20일 평균 일중 변동폭 상한",
      "최근 20일 급락일 수 제한",
    ],
  },
  {
    keywords: ["테마", "뉴스", "이슈", "재료", "기대감", "묻지마"],
    targetRuleId: "theme-speculation-avoidance",
    title: "테마성 과열 회피 표현 추가 후보",
    description:
      "테마나 단기 이슈에 따른 가격 과열을 줄이고 싶은 표현을 별도 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["최근 상승률", "RSI", "거래량 급증", "실적 위험 표시"],
    suggestedConditionHints: [
      "20일 상승률 상한",
      "RSI 상한",
      "뉴스/테마 데이터는 추후 연결 필요",
    ],
  },
  {
    keywords: ["망한", "부실", "적자", "빚", "상장폐지", "관리종목", "자본잠식", "감사의견"],
    targetRuleId: "financial-distress-avoidance",
    title: "재무 위험 신호 회피 표현 추가 후보",
    description:
      "재무 위험 신호가 큰 회사를 줄이고 싶은 표현을 별도 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["관리종목 여부", "자본잠식 여부", "감사의견", "연속 적자", "부채비율"],
    suggestedConditionHints: [
      "관리종목 여부 = 아님",
      "자본잠식 여부 = 아님",
      "감사의견 상태 = 정상",
      "부채비율 상한",
    ],
  },
  {
    keywords: ["기본", "탄탄", "재무", "실적", "돈은 버는", "본업", "우량"],
    targetRuleId: "fundamental-quality-preference",
    title: "기본기 있는 기업 표현 추가 후보",
    description:
      "본업, 실적, 재무 기반이 너무 약하지 않은 회사를 찾는 표현을 별도 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["영업이익", "매출", "부채비율", "영업이익률"],
    suggestedConditionHints: [
      "TTM 영업이익 > 0",
      "TTM 매출 > 0",
      "부채비율 상한",
      "영업이익률 하한",
    ],
  },
  {
    keywords: ["작은", "잡주", "시총", "가벼운", "유동성", "호가 얇은", "사고팔기 힘든"],
    targetRuleId: "size-liquidity-avoidance",
    title: "규모·유동성 회피 표현 추가 후보",
    description:
      "작은 규모나 거래가 얇은 구간을 줄이고 싶은 표현을 별도 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["시가총액", "20일 평균 거래대금", "20일 평균 거래량"],
    suggestedConditionHints: ["시가총액 하한", "20일 평균 거래대금 하한"],
  },
  {
    keywords: ["방어", "보수적", "초보자", "덜 불안", "반토막", "장기 보유"],
    targetRuleId: "defensive-risk-preference",
    title: "방어적 성향 표현 추가 후보",
    description:
      "상대적으로 변동성과 위험 신호를 줄이고 싶은 표현을 별도 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["변동성", "고점 대비 낙폭", "부채비율", "최근 상승률"],
    suggestedConditionHints: [
      "60일 변동성 상한",
      "고점 대비 낙폭 제한",
      "부채비율 상한",
      "20일 상승률 상한",
    ],
  },
  {
    keywords: ["무너진", "망가진", "저점", "신저가"],
    targetRuleId: "broken-chart-exclusion",
    title: "흐름 훼손 제외 표현 추가 후보",
    description:
      "차트가 훼손되었거나 저점을 이탈했다는 표현을 흐름 훼손 제외 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["이동평균선", "신고가/신저가", "정배열/역배열"],
    suggestedConditionHints: [
      "60일선 하회 제외",
      "최근 저점 이탈 제외",
      "20일선과 60일선 관계 확인",
    ],
  },
  {
    keywords: ["평균", "멀지", "이격"],
    targetRuleId: "trend-distance-control",
    title: "평균 이격 표현 추가 후보",
    description:
      "평균에서 너무 멀지 않다는 표현을 추세 이격 제한 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["볼린저밴드", "이동평균선 이격도", "RSI"],
    suggestedConditionHints: [
      "볼린저밴드 내부",
      "20일 이동평균선 이격도 제한",
      "RSI 과열 제외",
    ],
  },
  {
    keywords: ["양봉", "적삼병"],
    targetRuleId: "three-white-soldiers",
    title: "양봉 연속 표현 추가 후보",
    description:
      "양봉 흐름이나 적삼병을 언급한 표현을 적삼병 규칙에 추가할 수 있습니다.",
    suggestedIndicators: ["적삼병", "거래량/거래대금", "RSI"],
    suggestedConditionHints: [
      "최근 3거래일 양봉",
      "종가가 전일 종가 이상",
      "거래량 동반 여부",
    ],
  },
];

const normalizeText = (text: string) =>
  text.trim().replace(/\s+/g, " ").toLowerCase();

const unique = (items: string[]) =>
  Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

const clampConfidence = (value: number) =>
  Math.max(0.35, Math.min(0.95, Number(value.toFixed(2))));

const getAnalysisText = (record: FeedbackRecord) =>
  normalizeText(`${record.input} ${record.comment ?? ""}`);

const getExamples = (records: FeedbackRecord[]) =>
  unique(records.map((record) => record.input)).slice(0, 5);

const getMatchedRuleCount = (record: FeedbackRecord) =>
  record.matchedPhrases.length;

const hasLowMatchedPhraseCount = (record: FeedbackRecord) =>
  getMatchedRuleCount(record) <= 1;

const companyStabilityBlockers = [
  "재무",
  "기업",
  "우량",
  "대형",
  "튼튼",
  "부채",
  "실적",
  "망하지",
  "기본은 있는",
  "회사",
];

const stableUptrendStrongHints = [
  "안정적으로 상승",
  "안정적으로 올라",
  "안정적인 우상향",
  "상승추세",
  "꾸준히 올라",
  "꾸준히 상승",
  "급등락 없이",
  "완만하게 우상향",
  "차트가 안정",
  "흐름이 안정",
];

const stableUptrendSoftHints = ["상승", "우상향", "꾸준히", "흐름", "차트", "올라"];

const hasCompanyStabilityBlocker = (analysisText: string) =>
  companyStabilityBlockers.some((keyword) => analysisText.includes(keyword));

const hasStableUptrendSuggestionContext = (analysisText: string) => {
  if (hasCompanyStabilityBlocker(analysisText)) {
    return false;
  }

  return (
    stableUptrendStrongHints.some((keyword) => analysisText.includes(keyword)) ||
    (analysisText.includes("안정") &&
      stableUptrendSoftHints.some((keyword) => analysisText.includes(keyword)))
  );
};

const findMapping = (record: FeedbackRecord) => {
  const analysisText = getAnalysisText(record);
  const stableUptrendMapping = keywordMappings.find(
    (mapping) => mapping.targetRuleId === "stable-uptrend",
  );

  if (stableUptrendMapping && hasStableUptrendSuggestionContext(analysisText)) {
    return stableUptrendMapping;
  }

  return keywordMappings.find((mapping) =>
    mapping.targetRuleId !== "stable-uptrend" &&
    mapping.keywords.some((keyword) => analysisText.includes(keyword)),
  );
};

const findRule = (rules: PhraseRule[], ruleId: string) =>
  rules.find((rule) => rule.id === ruleId);

const groupBy = <T>(items: T[], getKey: (item: T) => string) =>
  items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getKey(item);
    groups[key] = [...(groups[key] ?? []), item];
    return groups;
  }, {});

const getCreateRuleSignature = (record: FeedbackRecord) => {
  const tokens = getAnalysisText(record)
    .split(" ")
    .filter((token) => token.length >= 2)
    .slice(0, 3);

  return tokens.length > 0 ? tokens.join("-") : "general";
};

const buildConfidence = (records: FeedbackRecord[]) => {
  const lowMatchCount = records.filter(hasLowMatchedPhraseCount).length;
  const emptyMatchCount = records.filter(
    (record) => record.matchedPhrases.length === 0,
  ).length;
  const unrecognizedCount = records.filter(
    (record) => record.wrongReason === unrecognizedReason,
  ).length;

  const volumeScore = Math.min(records.length * 0.08, 0.24);
  const lowMatchScore = records.length > 0 ? lowMatchCount / records.length : 0;
  const emptyMatchScore = records.length > 0 ? emptyMatchCount / records.length : 0;
  const reasonScore = records.length > 0 ? unrecognizedCount / records.length : 0;

  return clampConfidence(
    0.42 + volumeScore + lowMatchScore * 0.1 + emptyMatchScore * 0.16 + reasonScore * 0.12,
  );
};

const createAddPhrasePrompt = (
  targetRuleId: string,
  phrases: string[],
) => [
  `phraseDictionary.ts의 ${targetRuleId} 규칙 phrases 배열에 다음 표현을 추가해줘:`,
  ...phrases.map((phrase) => `- ${phrase}`),
  "",
  "기존 조건과 UI는 유지하고 npm run build가 통과해야 한다.",
].join("\n");

const createRulePrompt = (
  title: string,
  phrases: string[],
  indicators: string[],
  conditionHints: string[],
  reason: string,
) => [
  "phraseDictionary.ts에 새 PhraseRule 후보를 검토해서 추가해줘.",
  "",
  `후보 이름: ${title}`,
  `생성 이유: ${reason}`,
  "",
  "표현 후보:",
  ...phrases.map((phrase) => `- ${phrase}`),
  "",
  "지표 후보:",
  ...indicators.map((indicator) => `- ${indicator}`),
  "",
  "조건 힌트:",
  ...conditionHints.map((hint) => `- ${hint}`),
  "",
  "자동 반영하지 말고 기존 UI와 결과 구조를 유지하면서, npm run build가 통과해야 한다.",
].join("\n");

const createThresholdPrompt = (
  targetRuleId: string | undefined,
  reason: FeedbackWrongReason | undefined,
  examples: string[],
  conditionHints: string[],
) => [
  `phraseDictionary.ts와 conditionBuilders.ts에서 ${
    targetRuleId ?? "관련"
  } 규칙의 조건 임계값을 검토해줘.`,
  "",
  `피드백 이유: ${reason ?? "조건 범위 조정 필요"}`,
  "",
  "예시 입력:",
  ...examples.map((example) => `- ${example}`),
  "",
  "검토 힌트:",
  ...conditionHints.map((hint) => `- ${hint}`),
  "",
  "기존 UI와 결과 구조는 유지하고 npm run build가 통과해야 한다.",
].join("\n");

function buildAddPhraseSuggestions(
  records: FeedbackRecord[],
  rules: PhraseRule[],
): LearningSuggestion[] {
  const candidates = records.filter(
    (record) =>
      record.wrongReason === unrecognizedReason && hasLowMatchedPhraseCount(record),
  );

  const mappedCandidates = candidates.filter((record) => {
    const mapping = findMapping(record);
    return mapping ? Boolean(findRule(rules, mapping.targetRuleId)) : false;
  });

  const grouped = groupBy(mappedCandidates, (record) => {
    const mapping = findMapping(record);
    return mapping?.targetRuleId ?? "unknown";
  });

  return Object.entries(grouped).map(([ruleId, groupRecords]) => {
    const mapping = keywordMappings.find((item) => item.targetRuleId === ruleId)!;
    const examples = getExamples(groupRecords);

    return {
      id: `add_phrase:${ruleId}`,
      type: "add_phrase",
      title: mapping.title,
      description: mapping.description,
      confidence: buildConfidence(groupRecords),
      examples,
      targetRuleId: ruleId,
      suggestedPhrases: examples,
      suggestedIndicators: mapping.suggestedIndicators,
      suggestedConditionHints: mapping.suggestedConditionHints,
      codexPrompt: createAddPhrasePrompt(ruleId, examples),
    };
  });
}

function buildCreateRuleSuggestions(
  records: FeedbackRecord[],
  rules: PhraseRule[],
): LearningSuggestion[] {
  const candidates = records.filter((record) => {
    if (record.wrongReason !== unrecognizedReason || !hasLowMatchedPhraseCount(record)) {
      return false;
    }

    const mapping = findMapping(record);
    return !mapping || !findRule(rules, mapping.targetRuleId);
  });

  const grouped = groupBy(candidates, getCreateRuleSignature);

  return Object.entries(grouped).map(([signature, groupRecords]) => {
    const examples = getExamples(groupRecords);
    const suggestedIndicators = ["검토 필요"];
    const suggestedConditionHints = [
      "반복 입력이 더 쌓이면 별도 규칙 분리",
      "기존 규칙과 겹치는 지표가 있는지 검토",
      "표현 사전에 추가하기 전 조건검색 참고용 문구 유지",
    ];
    const reason =
      "기존 키워드 매핑과 phraseDictionary 규칙으로 묶기 어려운 해석 실패 입력입니다.";

    return {
      id: `create_rule:${signature}`,
      type: "create_rule",
      title: "새 표현 규칙 생성 후보",
      description: reason,
      confidence: buildConfidence(groupRecords),
      examples,
      suggestedPhrases: examples,
      suggestedIndicators,
      suggestedConditionHints,
      codexPrompt: createRulePrompt(
        "새 표현 규칙 생성 후보",
        examples,
        suggestedIndicators,
        suggestedConditionHints,
        reason,
      ),
    };
  });
}

function buildThresholdSuggestions(records: FeedbackRecord[]): LearningSuggestion[] {
  const candidates = records.filter(
    (record) =>
      record.wrongReason === conservativeReason ||
      record.wrongReason === aggressiveReason,
  );

  const grouped = groupBy(candidates, (record) => {
    const targetRuleId = record.matchedPhrases[0]?.id ?? "general";
    return `${record.wrongReason}:${targetRuleId}`;
  });

  return Object.entries(grouped).map(([key, groupRecords]) => {
    const reason = groupRecords[0].wrongReason;
    const targetRuleId = groupRecords[0].matchedPhrases[0]?.id;
    const isConservative = reason === conservativeReason;
    const examples = getExamples(groupRecords);
    const conditionHints = isConservative
      ? ["상한 완화", "하한 완화", "between 범위 확대"]
      : ["상한 강화", "하한 강화", "between 범위 축소"];

    return {
      id: `adjust_threshold:${key}`,
      type: "adjust_threshold",
      title: isConservative
        ? "조건 범위 완화 검토 후보"
        : "조건 범위 강화 검토 후보",
      description: isConservative
        ? "조건이 좁게 느껴졌다는 피드백입니다. 해당 규칙의 임계값 범위를 넓힐지 검토할 수 있습니다."
        : "조건이 넓게 느껴졌다는 피드백입니다. 해당 규칙의 임계값 범위를 좁힐지 검토할 수 있습니다.",
      confidence: clampConfidence(0.42 + Math.min(groupRecords.length * 0.1, 0.35)),
      examples,
      targetRuleId,
      suggestedConditionHints: conditionHints,
      codexPrompt: createThresholdPrompt(
        targetRuleId,
        reason,
        examples,
        conditionHints,
      ),
    };
  });
}

export function analyzeFeedback(
  records: FeedbackRecord[],
  rules: PhraseRule[],
): LearningSuggestion[] {
  const badRecords = records.filter((record) => record.feedback === "bad");

  return [
    ...buildAddPhraseSuggestions(badRecords, rules),
    ...buildCreateRuleSuggestions(badRecords, rules),
    ...buildThresholdSuggestions(badRecords),
  ].sort((left, right) => {
    const confidenceDiff = right.confidence - left.confidence;

    if (confidenceDiff !== 0) {
      return confidenceDiff;
    }

    return right.examples.length - left.examples.length;
  });
}
