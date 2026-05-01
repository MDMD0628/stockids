import {
  buildGrowthConditions,
  buildMomentumConditions,
  buildValueConditions,
  profileDefaults,
} from "./conditionBuilders";
import { indicatorCatalog } from "./indicatorCatalog";
import { phraseDictionary, type PhraseRule } from "./phraseDictionary";
import {
  buildSelectedFilterConditions,
  type SelectableFilterId,
} from "./selectableFilters";
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

const directFilterKeywords: Record<SelectableFilterId, string[]> = {
  thin_liquidity: ["거래량 얇", "거래가 얇", "거래 적은", "거래 부족", "유동성"],
  small_market_cap: ["소형주", "작은 종목", "시가총액 작은", "규모 작은"],
  high_volatility: ["변동성 큰", "흔들림 큰", "위험한", "너무 위험"],
  deficit_company: ["적자", "실적 불안정", "영업이익 적자"],
  recent_runup: ["최근 급등", "너무 오른", "과열", "고점", "추격"],
};

const exclusionWords = ["싫", "제외", "빼", "거르", "줄이"];

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

const getDirectFilterIds = (input: string): SelectableFilterId[] =>
  Object.entries(directFilterKeywords)
    .filter(([, keywords]) => {
      const hasFilterKeyword = keywords.some((keyword) => input.includes(keyword));
      const hasExclusionIntent = exclusionWords.some((word) => input.includes(word));
      return hasFilterKeyword && hasExclusionIntent;
    })
    .map(([filterId]) => filterId as SelectableFilterId);

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

const tagConditions = (
  nextConditions: SearchCondition[],
  source: SearchCondition["source"],
  sourcePhrase?: string,
) =>
  nextConditions.map((condition) => ({
    ...condition,
    source,
    sourcePhrase,
  }));

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
  const phraseRuleIds = new Set(phraseMatches.map(({ rule }) => rule.id));
  const directFilterIds = getDirectFilterIds(normalized).filter(
    (filterId) =>
      !(filterId === "recent_runup" && phraseRuleIds.has("overheat-avoidance")),
  );

  const conditionsById = new Map<string, SearchCondition>();

  if (wantsMomentum || wantsShortTerm) {
    addConditions(
      conditionsById,
      tagConditions(
        buildMomentumConditions(defaults),
        "user_expression",
        wantsShortTerm ? "단기 흐름 표현" : "거래 활성도 표현",
      ),
    );
  }

  if (wantsStability) {
    addConditions(
      conditionsById,
      buildSelectedFilterConditions(
        ["small_market_cap", "high_volatility"],
        profile,
        "user_expression",
        "안정성 표현",
      ),
    );
  }

  phraseMatches.forEach(({ rule }) => {
    const matchedPhrase = phraseMatches.find((match) => match.rule.id === rule.id)?.phrase;
    addConditions(
      conditionsById,
      tagConditions(rule.buildConditions(defaults), "user_expression", matchedPhrase),
    );
  });

  if (wantsGrowth) {
    addConditions(
      conditionsById,
      tagConditions(buildGrowthConditions(defaults), "user_expression", "실적 흐름 표현"),
    );
  }

  if (wantsValue) {
    addConditions(
      conditionsById,
      tagConditions(buildValueConditions(defaults), "user_expression", "가격 부담 표현"),
    );
  }

  if (directFilterIds.length > 0) {
    addConditions(
      conditionsById,
      buildSelectedFilterConditions(
        directFilterIds,
        profile,
        "user_expression",
        "제외 의도가 담긴 사용자 표현",
      ),
    );
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
      ? `${matchedPhraseText} 표현을 인식해 사용자의 말에서 나온 조건으로 분해했습니다. 위험 요소는 조건식에 자동으로 넣지 않고 별도로 표시합니다.`
      : "명확한 사전 표현은 없어서 조건식으로 바로 변환할 표현이 적습니다. 위험 요소는 조건검색 참고용으로 별도 표시합니다.";

  return {
    id: createId(),
    profile,
    intent:
      themeParts.length > 0
        ? `${profileCopy[profile]} 기준으로 ${themeParts.join(", ")}을 함께 보는 조건식으로 해석했습니다.`
        : `${profileCopy[profile]} 기준으로 입력 문장에서 직접 드러난 조건을 찾는 구조로 해석했습니다.`,
    reading:
      input.length > 0
        ? `"${input}" 문장을 조건검색 지표 중심으로 분해했습니다. 실제 종목 데이터 조회 없이 조건 구조만 만듭니다.`
        : "입력 문장이 비어 있어 조건식으로 변환할 표현이 아직 없습니다.",
    matchedPhrases,
    interpretationSummary,
    alternativeInterpretations,
    conditions,
    explanations: uniqueExplanations(conditions),
    referenceLabel: "조건검색 참고용",
    generatedAt: new Date().toISOString(),
  };
};
