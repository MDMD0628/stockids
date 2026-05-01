import type { FeedbackRecord, FeedbackWrongReason } from "./feedback";
import type { PhraseRule } from "./phraseDictionary";

export type LearningSuggestion = {
  type: "add_phrase" | "create_rule" | "adjust_threshold";
  title: string;
  description: string;
  confidence: number;
  examples: string[];
  targetRuleId?: string;
  suggestedPhrases?: string[];
  suggestedIndicators?: string[];
  suggestedConditionHints?: string[];
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
    keywords: ["고점", "너무 위", "꼭대기", "추격"],
    targetRuleId: "overheat-avoidance",
    title: "과열 회피 표현 추가 후보",
    description:
      "높은 위치나 뒤따라가는 느낌의 표현은 과열 회피 규칙에 새 표현으로 붙일 수 있습니다.",
    suggestedIndicators: ["최근 상승률", "RSI", "볼린저밴드"],
    suggestedConditionHints: [
      "최근 상승률 상한",
      "RSI 상한",
      "볼린저밴드 상단 과도 이탈 제외",
    ],
  },
  {
    keywords: ["눌림", "쉬어가는", "조정"],
    targetRuleId: "pullback",
    title: "눌림목 표현 추가 후보",
    description:
      "잠시 쉬어가는 흐름을 찾는 표현은 눌림목 규칙에 새 표현으로 붙일 수 있습니다.",
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
      "거래나 관심이 붙는다는 표현은 거래량 증가 규칙에 새 표현으로 붙일 수 있습니다.",
    suggestedIndicators: ["거래량", "거래대금", "단기 이동평균", "MACD"],
    suggestedConditionHints: [
      "5일 평균 거래량 / 20일 평균 거래량",
      "20일 평균 거래대금",
      "단기 이동평균 돌파",
    ],
  },
  {
    keywords: ["무너진", "망가진", "저점"],
    targetRuleId: "broken-chart-exclusion",
    title: "흐름 훼손 제외 표현 추가 후보",
    description:
      "차트가 훼손되었다는 표현은 중기 기준선과 최근 저점 이탈 제외 규칙에 붙일 수 있습니다.",
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
      "평균에서 너무 멀지 않다는 표현은 추세 이격 제한 규칙에 붙일 수 있습니다.",
    suggestedIndicators: ["볼린저밴드", "이동평균선 이격도", "RSI"],
    suggestedConditionHints: [
      "볼린저밴드 내부",
      "20일 이동평균선 이격도 제한",
      "RSI 과열 제외",
    ],
  },
];

const normalizeInput = (input: string) =>
  input.trim().replace(/\s+/g, " ").toLowerCase();

const unique = (items: string[]) =>
  Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

const clampConfidence = (value: number) =>
  Math.max(0.35, Math.min(0.95, Number(value.toFixed(2))));

const findRule = (rules: PhraseRule[], ruleId: string) =>
  rules.find((rule) => rule.id === ruleId);

const getPrimaryRuleId = (record: FeedbackRecord) =>
  record.matchedPhrases[0]?.id;

const toExampleList = (records: FeedbackRecord[]) =>
  unique(records.map((record) => record.input)).slice(0, 5);

const buildConfidence = (records: FeedbackRecord[]) => {
  const emptyMatchCount = records.filter(
    (record) => record.matchedPhrases.length === 0,
  ).length;
  const lowMatchCount = records.filter(
    (record) => record.matchedPhrases.length <= 1,
  ).length;
  const volumeScore = Math.min(records.length * 0.08, 0.24);
  const emptyMatchScore = records.length > 0 ? emptyMatchCount / records.length : 0;
  const lowMatchScore = records.length > 0 ? lowMatchCount / records.length : 0;

  return clampConfidence(0.46 + volumeScore + emptyMatchScore * 0.18 + lowMatchScore * 0.07);
};

const groupBy = <T>(items: T[], getKey: (item: T) => string) =>
  items.reduce<Record<string, T[]>>((groups, item) => {
    const key = getKey(item);
    groups[key] = [...(groups[key] ?? []), item];
    return groups;
  }, {});

const findMapping = (input: string) =>
  keywordMappings.find((mapping) =>
    mapping.keywords.some((keyword) => input.includes(keyword)),
  );

function buildAddPhraseSuggestions(
  records: FeedbackRecord[],
  rules: PhraseRule[],
): LearningSuggestion[] {
  const candidates = records.filter(
    (record) =>
      record.feedback === "bad" &&
      record.wrongReason === unrecognizedReason &&
      record.matchedPhrases.length <= 1,
  );

  const grouped = groupBy(candidates, (record) => {
    const mapping = findMapping(normalizeInput(record.input));
    return mapping?.targetRuleId ?? "create-rule";
  });

  const mappedSuggestions = Object.entries(grouped)
    .filter(([ruleId]) => ruleId !== "create-rule")
    .map(([ruleId, ruleRecords]) => {
      const mapping = keywordMappings.find((item) => item.targetRuleId === ruleId)!;
      const targetRule = findRule(rules, ruleId);
      const examples = toExampleList(ruleRecords);

      return {
        type: "add_phrase" as const,
        title: mapping.title,
        description: targetRule
          ? `${mapping.description} 대상 규칙: ${targetRule.id}.`
          : mapping.description,
        confidence: buildConfidence(ruleRecords),
        examples,
        targetRuleId: ruleId,
        suggestedPhrases: examples,
        suggestedIndicators: mapping.suggestedIndicators,
        suggestedConditionHints: mapping.suggestedConditionHints,
      };
    });

  const createRuleRecords = grouped["create-rule"] ?? [];
  const createRuleSuggestions: LearningSuggestion[] =
    createRuleRecords.length > 0
      ? [
          {
            type: "create_rule",
            title: "새 표현 규칙 생성 후보",
            description:
              "기존 키워드 매핑으로 묶기 어려운 입력입니다. 별도 phrase rule 후보로 검토할 수 있습니다.",
            confidence: buildConfidence(createRuleRecords),
            examples: toExampleList(createRuleRecords),
            suggestedPhrases: toExampleList(createRuleRecords),
            suggestedConditionHints: [
              "반복 입력이 더 쌓이면 별도 규칙 분리",
              "기존 규칙과 겹치는 지표가 있는지 검토",
            ],
          },
        ]
      : [];

  return [...mappedSuggestions, ...createRuleSuggestions];
}

function buildThresholdSuggestions(records: FeedbackRecord[]): LearningSuggestion[] {
  const thresholdRecords = records.filter(
    (record) =>
      record.feedback === "bad" &&
      (record.wrongReason === conservativeReason ||
        record.wrongReason === aggressiveReason),
  );

  const grouped = groupBy(
    thresholdRecords,
    (record) => `${record.wrongReason ?? "unknown"}:${getPrimaryRuleId(record) ?? "general"}`,
  );

  return Object.values(grouped).map((groupRecords) => {
    const reason = groupRecords[0].wrongReason;
    const targetRuleId = getPrimaryRuleId(groupRecords[0]);
    const isConservative = reason === conservativeReason;
    const examples = toExampleList(groupRecords);

    return {
      type: "adjust_threshold" as const,
      title: isConservative
        ? "조건 범위 완화 검토 후보"
        : "조건 범위 강화 검토 후보",
      description: isConservative
        ? "조건이 좁게 느껴졌다는 피드백입니다. 해당 규칙의 임계값 범위를 넓힐지 검토할 수 있습니다."
        : "조건이 넓게 느껴졌다는 피드백입니다. 해당 규칙의 임계값 범위를 좁힐지 검토할 수 있습니다.",
      confidence: clampConfidence(0.42 + Math.min(groupRecords.length * 0.1, 0.35)),
      examples,
      targetRuleId,
      suggestedConditionHints: isConservative
        ? ["상한 완화", "하한 완화", "between 범위 확대"]
        : ["상한 강화", "하한 강화", "between 범위 축소"],
    };
  });
}

export function analyzeFeedback(
  records: FeedbackRecord[],
  rules: PhraseRule[],
): LearningSuggestion[] {
  const badRecords = records.filter((record) => record.feedback === "bad");

  const suggestions = [
    ...buildAddPhraseSuggestions(badRecords, rules),
    ...buildThresholdSuggestions(badRecords),
  ];

  return suggestions.sort((left, right) => {
    const confidenceDiff = right.confidence - left.confidence;

    if (confidenceDiff !== 0) {
      return confidenceDiff;
    }

    return right.examples.length - left.examples.length;
  });
}
