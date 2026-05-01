import {
  buildCoreTrendRiskConditions,
  buildGrowthConditions,
  buildLiquidityCondition,
  buildMomentumConditions,
  buildStabilityConditions,
  buildValueConditions,
  profileDefaults,
} from "./conditionBuilders";
import { indicatorCatalog } from "./indicatorCatalog";
import { phraseDictionary, type PhraseRule } from "./phraseDictionary";
import type {
  AlternativeInterpretation,
  IndicatorExplanation,
  MatchedPhrase,
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

const fallbackAlternatives: AlternativeInterpretation[] = [
  {
    label: "안정성 중심",
    description:
      "모호한 표현을 규모, 변동성, 중기 이동평균선 기준으로 더 차분하게 해석할 수 있습니다.",
    conditionHints: ["시가총액 하한", "60일 변동성 상한", "종가 >= 60일선"],
  },
  {
    label: "활성도 중심",
    description:
      "거래가 붙는 흐름을 더 중점적으로 보려면 거래량과 단기 이동평균 조건을 강화할 수 있습니다.",
    conditionHints: ["5일/20일 거래량 비교", "5일선 >= 20일선", "MACD 히스토그램 >= 0"],
  },
  {
    label: "평균 근접 중심",
    description:
      "평균에서 멀지 않은 흐름을 더 보고 싶다면 이격도와 볼린저밴드 조건을 중심으로 둘 수 있습니다.",
    conditionHints: ["20일선 이격도 범위", "볼린저밴드 내부", "RSI 중립 구간"],
  },
];

const createId = () =>
  `tr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const hasKeyword = (input: string, group: keyof typeof keywordGroups) =>
  keywordGroups[group].some((word) => input.includes(word));

const uniqueExplanations = (conditions: SearchCondition[]): IndicatorExplanation[] => {
  const keys = Array.from(new Set(conditions.map((item) => item.indicatorKey)));
  return keys
    .map((key) => indicatorCatalog[key])
    .filter((item): item is IndicatorExplanation => Boolean(item));
};

const uniqueAlternatives = (
  alternatives: AlternativeInterpretation[],
): AlternativeInterpretation[] => {
  const seen = new Set<string>();
  return alternatives.filter((item) => {
    if (seen.has(item.label)) {
      return false;
    }

    seen.add(item.label);
    return true;
  });
};

const findPhraseMatches = (input: string) =>
  phraseDictionary
    .map((rule) => {
      const phrase = rule.phrases.find((candidate) =>
        input.includes(candidate.toLowerCase()),
      );

      return phrase ? { rule, phrase } : null;
    })
    .filter((item): item is { rule: PhraseRule; phrase: string } => Boolean(item));

const addCondition = (
  conditionsById: Map<string, SearchCondition>,
  nextCondition: SearchCondition,
) => {
  if (!conditionsById.has(nextCondition.id)) {
    conditionsById.set(nextCondition.id, nextCondition);
  }
};

const addConditions = (
  conditionsById: Map<string, SearchCondition>,
  nextConditions: SearchCondition[],
) => {
  nextConditions.forEach((nextCondition) => addCondition(conditionsById, nextCondition));
};

const buildMatchedPhrases = (
  phraseMatches: Array<{ rule: PhraseRule; phrase: string }>,
): MatchedPhrase[] =>
  phraseMatches.map(({ rule, phrase }) => ({
    id: rule.id,
    phrase,
    interpretation: rule.interpretation,
    mappedIndicators: rule.mappedIndicators,
  }));

export const translateWithMock = (
  rawInput: string,
  profile: RiskProfile = "balanced",
): TranslationResult => {
  const input = rawInput.trim();
  const normalized = input.toLowerCase();
  const defaults = profileDefaults[profile];
  const phraseMatches = findPhraseMatches(normalized);

  const wantsStability = hasKeyword(normalized, "stability");
  const wantsMomentum = hasKeyword(normalized, "momentum");
  const wantsGrowth = hasKeyword(normalized, "growth");
  const wantsValue = hasKeyword(normalized, "value");
  const wantsShortTerm = hasKeyword(normalized, "shortTerm");

  const conditionsById = new Map<string, SearchCondition>();

  addCondition(conditionsById, buildLiquidityCondition(defaults));

  if (wantsStability || !wantsMomentum) {
    addConditions(conditionsById, buildStabilityConditions(defaults, wantsShortTerm));
  }

  if (wantsMomentum || wantsShortTerm) {
    addConditions(conditionsById, buildMomentumConditions(defaults));
  }

  addConditions(conditionsById, buildCoreTrendRiskConditions(defaults));

  phraseMatches.forEach(({ rule }) => {
    addConditions(conditionsById, rule.buildConditions(defaults));
  });

  if (wantsGrowth) {
    addConditions(conditionsById, buildGrowthConditions(defaults));
  }

  if (wantsValue) {
    addConditions(conditionsById, buildValueConditions(defaults));
  }

  const conditions = Array.from(conditionsById.values());
  const matchedPhrases = buildMatchedPhrases(phraseMatches);
  const phraseAlternatives = phraseMatches.flatMap(({ rule }) => rule.alternatives);
  const alternativeInterpretations = uniqueAlternatives(
    phraseAlternatives.length > 0 ? phraseAlternatives : fallbackAlternatives,
  );

  const themeParts = [
    wantsStability ? "안정성" : null,
    wantsMomentum || wantsShortTerm ? "거래 활성도와 최근 흐름" : null,
    wantsGrowth ? "실적 흐름" : null,
    wantsValue ? "가격 부담" : null,
    ...matchedPhrases.map((item) => item.phrase),
  ].filter(Boolean);

  const matchedPhraseText = matchedPhrases.map((item) => `"${item.phrase}"`).join(", ");
  const interpretationSummary =
    matchedPhrases.length > 0
      ? `${matchedPhraseText} 표현을 인식해 평균과의 거리, 과열 완화, 거래 활성도, 중기 흐름 유지 같은 조건으로 분해했습니다. 결과는 입력 문장을 조건식으로 변환한 조건검색 참고용 구조입니다.`
      : "명확한 사전 표현은 없어서 유동성, 추세, 변동성의 기본 축으로 입력 문장을 조건식으로 변환했습니다. 결과는 조건검색 참고용 구조입니다.";

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
    matchedPhrases,
    interpretationSummary,
    alternativeInterpretations,
    conditions,
    explanations: uniqueExplanations(conditions),
    referenceLabel: "조건검색 참고용",
    generatedAt: new Date().toISOString(),
  };
};
