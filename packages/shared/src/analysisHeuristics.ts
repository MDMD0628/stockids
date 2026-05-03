import {
  type AnalysisExpression,
  type AnalysisResponse,
  type ExpressionCategoryId,
} from "./collectorTypes";

type HeuristicRule = {
  category: ExpressionCategoryId;
  keywords: string[];
  meaning: string;
  possibleConditions: string[];
};

const heuristicRules: HeuristicRule[] = [
  {
    category: "trend_chart",
    keywords: [
      "추세",
      "차트",
      "우상향",
      "흐름",
      "이평선",
      "눌림",
      "무너지지",
      "살아있는",
    ],
    meaning: "차트 흐름이나 추세 유지 여부를 조건으로 바꾸고 싶은 표현입니다.",
    possibleConditions: [
      "20일 이동평균선 >= 60일 이동평균선",
      "종가 >= 60일 이동평균선",
      "최근 저점 이탈 제외",
    ],
  },
  {
    category: "volume_attention",
    keywords: [
      "거래량",
      "거래대금",
      "관심",
      "주목",
      "거래가 붙",
      "돈이 들어",
      "거래 살아",
    ],
    meaning: "평소보다 거래나 관심이 늘어나는 느낌을 조건으로 바꾸고 싶은 표현입니다.",
    possibleConditions: [
      "5일 평균 거래량 / 20일 평균 거래량 >= 기준값",
      "20일 평균 거래대금 >= 기준값",
      "최근 거래대금 증가율 확인",
    ],
  },
  {
    category: "volatility_risk",
    keywords: [
      "위험",
      "불안",
      "급등락",
      "변동",
      "출렁",
      "과열",
      "고점",
      "상투",
    ],
    meaning: "가격 흔들림이나 과열 구간을 줄이고 싶은 표현입니다.",
    possibleConditions: [
      "60일 변동성 <= 기준값",
      "최근 20일 상승률 <= 기준값",
      "RSI(14) <= 기준값",
    ],
  },
  {
    category: "earnings_value",
    keywords: [
      "실적",
      "매출",
      "이익",
      "영업이익",
      "저평가",
      "PER",
      "PBR",
      "밸류",
      "가격 부담",
    ],
    meaning: "실적, 가치, 가격 부담을 함께 조건으로 정리하고 싶은 표현입니다.",
    possibleConditions: [
      "최근 분기 매출 증가율 >= 기준값",
      "TTM 영업이익 > 0",
      "PER/PBR 업종 평균 대비 확인",
      "최근 상승률 과열 제외",
    ],
  },
  {
    category: "supply_institution_foreign",
    keywords: [
      "수급",
      "기관",
      "외국인",
      "프로그램",
      "큰손",
      "누가 계속 사",
      "순매수",
    ],
    meaning: "특정 투자 주체나 수급 흐름을 조건 후보로 보고 싶은 표현입니다.",
    possibleConditions: [
      "기관 순매수 연속일수 확인",
      "외국인 순매수 연속일수 확인",
      "프로그램 순매수 데이터는 추후 연결 필요",
    ],
  },
  {
    category: "theme_news_issue",
    keywords: [
      "테마",
      "뉴스",
      "이슈",
      "재료",
      "기대감",
      "정치",
      "커뮤니티",
    ],
    meaning: "뉴스나 이슈성 움직임을 조건 후보나 위험 표시로 분리해야 하는 표현입니다.",
    possibleConditions: [
      "뉴스/테마 데이터는 추후 연결 필요",
      "최근 상승률 과열 제외",
      "거래량 급증 후 윗꼬리 위험 표시",
    ],
  },
  {
    category: "entry_timing_question",
    keywords: ["언제", "초입", "아직 안 오른", "덜 오른", "따라가기", "부담"],
    meaning: "시점 고민을 직접 행동 문구가 아니라 과열 완화 조건으로 바꿀 표현입니다.",
    possibleConditions: [
      "최근 20일 상승률 <= 기준값",
      "RSI(14) <= 기준값",
      "볼린저밴드 상단 과도 이탈 제외",
    ],
  },
  {
    category: "exit_stop_question",
    keywords: ["빠지는", "깨지면", "이탈", "손절", "정리", "망가진", "무너진"],
    meaning: "위험 관리 고민을 차트 훼손 여부나 이탈 조건 후보로 바꿀 표현입니다.",
    possibleConditions: [
      "종가 < 60일 이동평균선 위험 표시",
      "최근 저점 이탈 여부 확인",
      "고점 대비 낙폭 기준 확인",
    ],
  },
];

const splitSentences = (text: string) =>
  text
    .split(/[\n.!?。！？]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const clampConfidence = (score: number) =>
  Math.max(0.45, Math.min(0.92, Number(score.toFixed(2))));

const findRule = (sentence: string) =>
  heuristicRules
    .map((rule) => ({
      rule,
      hits: rule.keywords.filter((keyword) => sentence.includes(keyword)),
    }))
    .filter((match) => match.hits.length > 0)
    .sort((left, right) => right.hits.length - left.hits.length)[0];

export const analyzeTextWithHeuristics = (text: string): AnalysisResponse => {
  const expressions = splitSentences(text)
    .slice(0, 12)
    .map<AnalysisExpression | null>((sentence) => {
      const match = findRule(sentence);

      if (!match) {
        return null;
      }

      return {
        phrase: sentence.slice(0, 80),
        category: match.rule.category,
        meaning: match.rule.meaning,
        possible_conditions: match.rule.possibleConditions,
        confidence: clampConfidence(0.58 + match.hits.length * 0.08),
      };
    })
    .filter((item): item is AnalysisExpression => Boolean(item));

  if (expressions.length > 0) {
    return { expressions };
  }

  return {
    expressions: [
      {
        phrase: text.trim().slice(0, 80) || "분석할 표현",
        category: "other",
        meaning:
          "현재 사전으로는 분류가 애매한 표현입니다. 관리자가 의미와 조건 후보를 검수해야 합니다.",
        possible_conditions: ["관리자 검수 후 조건 후보 지정"],
        confidence: 0.45,
      },
    ],
  };
};
