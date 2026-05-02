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

const stableUptrendContextWords = [
  "상승",
  "올라",
  "오르는",
  "우상향",
  "추세",
  "흐름",
  "차트",
  "꾸준",
  "천천히",
  "급등락 없이",
  "완만하게",
];

const stableUptrendStandalonePatterns = [
  "꾸준히 올라",
  "꾸준히 상승",
  "급등락 없이",
  "완만하게 우상향",
  "천천히 우상향",
  "차분하게 오르",
  "계단식으로 올라",
  "안정적으로 올라",
  "안정적으로 상승",
];

const companyStabilityStrongWords = ["재무", "우량", "대형", "튼튼", "부채"];
const companyStabilityContextWords = ["기업", "실적", "회사"];
const companyStabilityPhrases = ["망하지", "기본은 있는", "안정적인 회사"];
const brokenChartDamageWords = [
  "무너",
  "망가",
  "깨지",
  "저점",
  "신저가",
  "지지선",
  "하회",
  "죽은",
  "꺾",
  "급락",
  "밀려",
  "빠져",
  "회복",
  "버티",
  "선을 안 깨",
  "중요한 자리",
];
const explicitActivityWords = ["거래량", "거래", "관심", "힘", "활발", "돌파", "탄력"];

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

const stabilityAmbiguousAlternatives: AlternativeInterpretation[] = [
  {
    label: "주가 흐름 안정성",
    description: "급등락이 크지 않고 추세가 꾸준히 이어지는 조건",
    conditionHints: [
      "20일선 >= 60일선",
      "60일선 기울기 > 0",
      "60일 변동성 상한",
    ],
  },
  {
    label: "기업 안정성",
    description: "기업 규모, 재무, 실적이 상대적으로 안정적인 조건",
    conditionHints: [
      "영업이익 적자 여부 확인",
      "부채비율 과도 여부 확인",
      "거래대금 부족 위험 표시",
    ],
  },
];

const createId = () =>
  `tr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const hasKeyword = (input: string, group: keyof typeof keywordGroups) =>
  keywordGroups[group].some((word) => input.includes(word));

const hasAny = (input: string, keywords: string[]) =>
  keywords.some((word) => input.includes(word));

const hasStableUptrendContext = (input: string) =>
  hasAny(input, stableUptrendStandalonePatterns) ||
  (input.includes("안정") && hasAny(input, stableUptrendContextWords));

const hasCompanyStabilityContext = (input: string) =>
  hasAny(input, companyStabilityPhrases) ||
  hasAny(input, companyStabilityStrongWords) ||
  (input.includes("안정") && hasAny(input, companyStabilityContextWords));

const hasAmbiguousStabilityContext = (
  input: string,
  wantsStableUptrend: boolean,
  wantsCompanyStability: boolean,
) => input.includes("안정") && !wantsStableUptrend && !wantsCompanyStability;

const hasBrokenChartDamageContext = (input: string) =>
  hasAny(input, brokenChartDamageWords);

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

type PhraseMatch = { rule: PhraseRule; phrase: string };

const findPhraseMatches = (input: string): PhraseMatch[] =>
  phraseDictionary
    .map((rule) => {
      const phrase = rule.phrases.find((candidate) =>
        input.includes(candidate.toLowerCase()),
      );

      return phrase ? { rule, phrase } : null;
    })
    .filter((item): item is PhraseMatch => Boolean(item));

const findRuleById = (ruleId: string) =>
  phraseDictionary.find((rule) => rule.id === ruleId);

const getStableUptrendContextPhrase = (rawInput: string, normalizedInput: string) => {
  const stableRule = findRuleById("stable-uptrend");
  const matchedPhrase = stableRule?.phrases.find((phrase) =>
    normalizedInput.includes(phrase.toLowerCase()),
  );

  return matchedPhrase ?? rawInput.trim() ?? "안정적인 상승 흐름";
};

const addContextualPhraseMatch = (
  phraseMatches: PhraseMatch[],
  ruleId: string,
  phrase: string,
): PhraseMatch[] => {
  if (phraseMatches.some((match) => match.rule.id === ruleId)) {
    return phraseMatches;
  }

  const rule = findRuleById(ruleId);
  return rule ? [...phraseMatches, { rule, phrase }] : phraseMatches;
};

const preferStableUptrendMatch = (
  phraseMatches: PhraseMatch[],
  input: string,
): PhraseMatch[] => {
  if (!phraseMatches.some((match) => match.rule.id === "stable-uptrend")) {
    return phraseMatches;
  }

  if (hasBrokenChartDamageContext(input)) {
    return phraseMatches;
  }

  return phraseMatches.filter((match) => match.rule.id !== "broken-chart-exclusion");
};

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
  phraseMatches: PhraseMatch[],
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
  const wantsStableUptrend = hasStableUptrendContext(normalized);
  const wantsCompanyStability =
    hasCompanyStabilityContext(normalized) && !wantsStableUptrend;
  const hasAmbiguousStability = hasAmbiguousStabilityContext(
    normalized,
    wantsStableUptrend,
    wantsCompanyStability,
  );
  let phraseMatches = findPhraseMatches(normalized);

  if (wantsStableUptrend) {
    phraseMatches = addContextualPhraseMatch(
      phraseMatches,
      "stable-uptrend",
      getStableUptrendContextPhrase(input, normalized),
    );
    phraseMatches = preferStableUptrendMatch(phraseMatches, normalized);
  }

  const wantsMomentum = wantsStableUptrend
    ? hasAny(normalized, explicitActivityWords)
    : hasKeyword(normalized, "momentum");
  const wantsGrowth = hasKeyword(normalized, "growth");
  const wantsValue = hasKeyword(normalized, "value");
  const wantsShortTerm =
    hasKeyword(normalized, "shortTerm") &&
    !(wantsStableUptrend && normalized.includes("급등락 없이"));
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

  if (wantsCompanyStability) {
    addConditions(
      conditionsById,
      buildSelectedFilterConditions(
        ["small_market_cap", "high_volatility"],
        profile,
        "user_expression",
        "기업 안정성 표현",
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
    hasAmbiguousStability
      ? stabilityAmbiguousAlternatives
      : phraseAlternatives.length > 0
        ? phraseAlternatives
        : fallbackAlternatives,
  );

  const themeParts = [
    wantsStableUptrend ? "추세 안정성" : null,
    wantsCompanyStability ? "기업 안정성" : null,
    wantsMomentum || wantsShortTerm ? "거래 활성도와 최근 흐름" : null,
    wantsGrowth ? "실적 흐름" : null,
    wantsValue ? "가격 부담" : null,
    ...matchedPhrases.map((item) => item.phrase),
  ].filter(Boolean);

  const matchedPhraseText = matchedPhrases.map((item) => `"${item.phrase}"`).join(", ");
  const interpretationSummary =
    hasAmbiguousStability
      ? "안정이라는 표현만으로는 주가 흐름 안정성과 기업 안정성 모두로 볼 수 있어, 하나로 단정하지 않고 대안 해석을 함께 표시했습니다."
      : matchedPhrases.length > 0
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
