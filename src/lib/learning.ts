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
    keywords: ["고점", "추격", "꼭대기", "너무 위"],
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

const findMapping = (record: FeedbackRecord) => {
  const analysisText = getAnalysisText(record);
  return keywordMappings.find((mapping) =>
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
