import {
  buildBrokenChartExclusionConditions,
  buildDefensiveRiskPreferenceConditions,
  buildFinancialDistressAvoidanceConditions,
  buildFundamentalQualityPreferenceConditions,
  buildOverheatAvoidanceConditions,
  buildPullbackConditions,
  buildSizeLiquidityAvoidanceConditions,
  buildStableUptrendConditions,
  buildThemeSpeculationAvoidanceConditions,
  buildThreeWhiteSoldiersConditions,
  buildTrendDistanceConditions,
  buildVolatilityRiskAvoidanceConditions,
  buildVolumeStrengthConditions,
  type ProfileDefaults,
} from "./conditionBuilders";
import type { AlternativeInterpretation, SearchCondition } from "./types";

export type PhraseRule = {
  id: string;
  phrases: string[];
  interpretation: string;
  mappedIndicators: string[];
  alternatives: AlternativeInterpretation[];
  buildConditions: (defaults: ProfileDefaults) => SearchCondition[];
};

export const phraseDictionary: PhraseRule[] = [
  {
    id: "trend-distance-control",
    phrases: [
      "추세를 너무 벗어나지 않은",
      "추세에서 벗어나지 않은",
      "평균에서 너무 멀지 않은",
      "평균에서 멀지 않은",
      "이격이 크지 않은",
    ],
    interpretation:
      "가격이 기준 평균에서 과하게 멀어지지 않은 흐름으로 해석했습니다.",
    mappedIndicators: ["볼린저밴드", "이동평균선 이격도", "RSI"],
    alternatives: [
      {
        label: "평균 회귀형",
        description:
          "평균에서 멀어진 뒤 다시 가까워지는 구간을 더 중점적으로 볼 수 있습니다.",
        conditionHints: ["20일 이동평균선 이격도 축소", "볼린저밴드 중심선 근접"],
      },
      {
        label: "추세 유지형",
        description:
          "평균과 너무 붙어 있는 상태보다 중기 흐름을 유지하는 쪽으로 볼 수도 있습니다.",
        conditionHints: ["종가 >= 60일 이동평균선", "20일선 >= 60일선"],
      },
    ],
    buildConditions: buildTrendDistanceConditions,
  },
  {
    id: "overheat-avoidance",
    phrases: [
      "너무 오른 건 싫어",
      "너무 오른건 싫어",
      "과열은 싫어",
      "과열된 건 싫어",
      "많이 오른 건 제외",
      "많이 오른건 제외",
      "꼭대기에서 사고 싶진 않아",
      "고점 추격은 피하고 싶어",
      "이미 많이 오른 종목은 빼고 싶어",
      "급등한 종목 말고 아직은 여유가 있는 종목.",
      "이미 너무 오른 건 싫어",
      "고점 같은 종목은 빼줘",
      "상투 잡을 것 같은 종목은 싫어",
      "급등 후 꺾일 것 같은 종목은 빼줘",
      "너무 과열된 종목은 싫어",
      "단기간에 너무 많이 오른 종목은 제외",
      "따라 사기 무서운 종목은 빼줘",
      "불타기 어려운 종목",
      "이미 불붙은 종목 말고",
      "급등 끝물 같은 종목은 싫어",
      "거래량 터지고 윗꼬리 긴 종목은 빼줘",
      "뉴스 나오고 이미 오른 종목은 싫어",
      "단기 고점권 종목은 제외",
      "너무 뜨거운 종목 말고 차분한 종목",
      "FOMO 생기는 종목은 빼줘",
    ],
    interpretation:
      "최근 가격 변화가 과하게 커진 구간을 줄이고 싶은 표현으로 해석했습니다.",
    mappedIndicators: ["최근 상승률", "RSI", "볼린저밴드"],
    alternatives: [
      {
        label: "상승률 제한 강화",
        description:
          "최근 가격 변화율 기준을 더 좁혀 빠르게 오른 구간을 더 많이 줄일 수 있습니다.",
        conditionHints: ["20일 상승률 상한 낮추기", "5일 가격 변화율 상한 추가"],
      },
      {
        label: "과열 지표 중심",
        description:
          "가격 변화율보다 RSI와 볼린저밴드 위치를 중심으로 해석할 수도 있습니다.",
        conditionHints: ["RSI 상한", "볼린저밴드 상단 과도 이탈 제외"],
      },
    ],
    buildConditions: buildOverheatAvoidanceConditions,
  },
  {
    id: "volume-strength-building",
    phrases: [
      "슬슬 힘 붙는",
      "슬슬 힘이 붙는",
      "거래가 붙는",
      "거래량이 붙는",
      "힘이 붙는",
    ],
    interpretation:
      "거래 활성도와 단기 흐름 변화가 함께 나타나는 구간으로 해석했습니다.",
    mappedIndicators: ["거래량/거래대금", "이동평균선", "MACD"],
    alternatives: [
      {
        label: "거래량 중심",
        description:
          "가격 흐름보다 최근 거래량 증가를 더 강하게 보는 조건으로 바꿀 수 있습니다.",
        conditionHints: ["5일 평균 거래량 / 20일 평균 거래량", "20일 평균 거래대금"],
      },
      {
        label: "흐름 전환 중심",
        description:
          "거래량보다 단기 이동평균과 MACD의 전환을 더 중점적으로 볼 수도 있습니다.",
        conditionHints: ["5일선 >= 20일선", "MACD 히스토그램 >= 0"],
      },
    ],
    buildConditions: buildVolumeStrengthConditions,
  },
  {
    id: "stable-uptrend",
    phrases: [
      "안정적으로 상승하는",
      "안정적인 상승추세",
      "꾸준히 안정적인 상승추세",
      "안정적인 우상향",
      "꾸준히 올라가는",
      "꾸준히 상승하는",
      "흐름이 안정적인",
      "차트가 안정적인",
      "차트가 안정적으로 올라가는",
      "급등락 없이 올라가는",
      "완만하게 우상향하는",
      "안정적으로 올라가는",
    ],
    interpretation:
      "급등락이 크지 않으면서 중기적으로 상승 흐름이 이어지는 조건으로 해석했습니다.",
    mappedIndicators: [
      "이동평균선 정배열",
      "이동평균선 기울기",
      "최근 상승률",
      "변동성",
      "고점 대비 낙폭",
    ],
    alternatives: [
      {
        label: "추세 유지형",
        description:
          "중기 이동평균선 위에서 흐름이 이어지는지를 더 중점적으로 볼 수 있습니다.",
        conditionHints: ["20일선 >= 60일선", "종가 >= 60일선", "60일선 기울기 > 0"],
      },
      {
        label: "완만한 상승형",
        description:
          "급등보다 완만한 상승을 원한다면 단기 급등률과 변동성 제한을 함께 볼 수 있습니다.",
        conditionHints: ["20일 상승률 상한", "60일 변동성 상한", "고점 대비 낙폭 제한"],
      },
    ],
    buildConditions: buildStableUptrendConditions,
  },
  {
    id: "volatility-risk-avoidance",
    phrases: [
      "너무 위험한 종목은 싫어",
      "너무 불안한 종목은 빼줘",
      "변동이 너무 큰 종목은 싫어",
      "하루에 너무 많이 움직이는 종목은 무서워",
      "급등락 심한 종목은 빼줘",
      "출렁임 심한 종목은 빼줘",
      "롤러코스터 같은 종목은 싫어",
      "너무 출렁이는 종목은 싫어",
      "위아래로 심하게 흔들리는 종목은 빼줘",
      "등락폭 큰 종목은 빼줘",
      "변동폭 큰 종목은 제외해줘",
      "심장 떨리는 종목은 싫어",
      "차트가 너무 험한 종목은 빼줘",
      "휙휙 움직이는 종목은 싫어",
      "너무 요동치는 종목 말고",
      "급락 잘 나오는 종목은 빼줘",
      "갭상 갭하 심한 종목은 싫어",
      "하루 만에 분위기 바뀌는 종목은 싫어",
    ],
    interpretation:
      "가격 변동이 과도하거나 급등락이 잦은 구간을 줄이고 싶은 표현으로 해석했습니다.",
    mappedIndicators: [
      "20일 변동성",
      "60일 변동성",
      "ATR",
      "일중 고가-저가 평균 변동폭",
      "최근 급등락 횟수",
      "갭 발생 빈도",
    ],
    alternatives: [
      {
        label: "중기 변동성 중심",
        description:
          "60일 변동성 기준을 더 중점적으로 두어 크게 흔들리는 구간을 줄일 수 있습니다.",
        conditionHints: ["60일 변동성 상한", "최근 20일 급락일 수 제한"],
      },
      {
        label: "하루 움직임 중심",
        description:
          "일중 고가-저가 폭을 중심으로 하루 안의 흔들림을 더 강하게 볼 수 있습니다.",
        conditionHints: ["20일 평균 일중 변동폭 상한", "갭 발생 빈도 확인"],
      },
    ],
    buildConditions: buildVolatilityRiskAvoidanceConditions,
  },
  {
    id: "theme-speculation-avoidance",
    phrases: [
      "테마주 같은 건 빼줘",
      "정치 테마주는 빼줘",
      "뉴스 하나에 튀는 종목은 싫어",
      "이슈 따라 출렁이는 종목은 빼줘",
      "재료 하나로 급등한 종목은 제외",
      "단기 이슈로 오른 종목은 싫어",
      "이름만 엮인 종목은 빼줘",
      "실체 없는 테마주는 빼줘",
      "기대감만으로 오른 종목은 싫어",
      "뉴스 나오면 확 오르고 꺼지는 종목은 빼줘",
      "사람들 몰려서 튄 종목은 조심하고 싶어",
      "급등 테마주는 빼고 싶어",
      "묻지마 테마주는 제외",
      "실적 없이 테마만 있는 종목은 싫어",
      "너무 핫한 테마주는 무서워",
    ],
    interpretation:
      "테마성 과열이나 단기 이슈 기반 급등락을 줄이고 싶은 표현으로 해석했습니다.",
    mappedIndicators: ["최근 상승률", "RSI", "거래량 급증", "실적 위험 표시"],
    alternatives: [
      {
        label: "과열 대체 지표 중심",
        description:
          "현재 MVP에는 뉴스/테마 데이터가 없어 최근 상승률과 RSI를 대체 조건으로 볼 수 있습니다.",
        conditionHints: ["20일 상승률 상한", "RSI 상한"],
      },
      {
        label: "추후 데이터 연결형",
        description:
          "뉴스, 커뮤니티, 테마 분류 데이터가 연결되면 별도 위험 표시로 더 분리할 수 있습니다.",
        conditionHints: ["뉴스/테마 데이터 연결 필요", "실적 부진 + 가격 급등 위험 표시"],
      },
    ],
    buildConditions: buildThemeSpeculationAvoidanceConditions,
  },
  {
    id: "financial-distress-avoidance",
    phrases: [
      "망한 회사는 싫어",
      "망할 것 같은 회사는 빼줘",
      "부실기업은 싫어",
      "재무 안 좋은 회사는 빼줘",
      "적자만 나는 회사는 싫어",
      "빚 많은 회사는 싫어",
      "돈 못 버는 회사는 빼줘",
      "회사가 너무 불안한 건 싫어",
      "상장폐지 위험 있는 건 빼줘",
      "관리종목은 빼줘",
      "감사의견 안 좋은 회사는 빼줘",
      "자본잠식 있는 회사는 싫어",
      "부도 위험 있는 회사는 빼줘",
      "실적이 너무 망가진 회사는 싫어",
      "매출도 없고 기대감만 있는 회사는 싫어",
    ],
    interpretation:
      "상장 유지, 재무 건전성, 실적 위험 신호가 큰 회사를 줄이고 싶은 표현으로 해석했습니다.",
    mappedIndicators: [
      "관리종목 여부",
      "자본잠식 여부",
      "감사의견",
      "연속 적자",
      "부채비율",
      "매출 존재",
    ],
    alternatives: [
      {
        label: "상장 유지 위험 중심",
        description:
          "관리종목, 자본잠식, 감사의견 같은 위험 신호를 더 중점적으로 볼 수 있습니다.",
        conditionHints: ["관리종목 여부 = 아님", "자본잠식 여부 = 아님", "감사의견 상태 = 정상"],
      },
      {
        label: "실적 위험 중심",
        description:
          "적자가 오래 이어지거나 부채 부담이 큰 회사를 줄이는 쪽으로 볼 수 있습니다.",
        conditionHints: ["연속 영업손실 연수 제한", "부채비율 상한"],
      },
    ],
    buildConditions: buildFinancialDistressAvoidanceConditions,
  },
  {
    id: "fundamental-quality-preference",
    phrases: [
      "그래도 기본은 있는 종목",
      "회사가 탄탄한 종목",
      "재무가 괜찮은 종목",
      "재무가 안정적인 종목",
      "우량하고 안정적인 종목",
      "실적이 받쳐주는 종목",
      "돈은 버는 회사",
      "매출이 꾸준한 회사",
      "적자는 아닌 회사",
      "부채가 너무 많지 않은 회사",
      "망할 걱정은 적은 회사",
      "사업이 실제로 돌아가는 회사",
      "이름 있는 회사",
      "우량한 회사",
      "안정적인 기업",
      "안정적인 회사",
      "체력이 있는 회사",
      "버틸 힘이 있는 회사",
      "기본기가 있는 종목",
      "실적 기반이 있는 종목",
      "재무제표가 너무 나쁘지 않은 종목",
      "최소한 회사는 멀쩡한 종목",
      "단기 테마 말고 본업이 있는 회사",
    ],
    interpretation:
      "기업의 본업, 실적, 재무 기반이 너무 약하지 않은 조건을 보고 싶은 표현으로 해석했습니다.",
    mappedIndicators: ["영업이익", "매출", "부채비율", "영업이익률", "연속 적자"],
    alternatives: [
      {
        label: "이익 기반 중심",
        description: "매출과 영업이익이 확인되는지를 더 중점적으로 볼 수 있습니다.",
        conditionHints: ["TTM 영업이익 > 0", "TTM 매출 > 0"],
      },
      {
        label: "재무 부담 중심",
        description: "부채비율과 영업이익률로 회사의 기초 체력을 볼 수 있습니다.",
        conditionHints: ["부채비율 상한", "영업이익률 하한"],
      },
    ],
    buildConditions: buildFundamentalQualityPreferenceConditions,
  },
  {
    id: "size-liquidity-avoidance",
    phrases: [
      "너무 작은 종목은 싫어",
      "잡주는 빼줘",
      "이름도 모르는 회사는 싫어",
      "듣보잡 종목은 빼줘",
      "시총 너무 작은 건 싫어",
      "너무 가벼운 종목은 빼줘",
      "세력이 흔들기 쉬운 종목은 싫어",
      "거래 없는 소형주는 빼줘",
      "유동성 없는 종목은 싫어",
      "사고팔기 힘든 종목은 빼줘",
      "호가가 너무 얇은 종목은 싫어",
      "몇 명이 움직이는 것 같은 종목은 빼줘",
      "너무 쉽게 급등락하는 종목은 싫어",
      "대형주나 중형주 위주로 보고 싶어",
      "대형주 위주로 안정적인 종목",
      "그래도 시장에서 어느 정도 검증된 종목",
    ],
    interpretation:
      "시가총액이 너무 작거나 거래대금·거래량이 부족한 구간을 줄이고 싶은 표현으로 해석했습니다.",
    mappedIndicators: ["시가총액", "20일 평균 거래대금", "20일 평균 거래량", "저유동성 위험 표시"],
    alternatives: [
      {
        label: "규모 중심",
        description: "시가총액 하한을 중심으로 작은 규모의 구간을 줄일 수 있습니다.",
        conditionHints: ["시가총액 하한"],
      },
      {
        label: "거래 가능성 중심",
        description:
          "거래대금과 거래량을 중심으로 사고팔기 어려운 구간을 줄일 수 있습니다.",
        conditionHints: ["20일 평균 거래대금 하한", "20일 평균 거래량 하한"],
      },
    ],
    buildConditions: buildSizeLiquidityAvoidanceConditions,
  },
  {
    id: "defensive-risk-preference",
    phrases: [
      "물려도 덜 불안한 종목",
      "오래 들고 있어도 괜찮을 종목",
      "갑자기 반토막 날 것 같지 않은 종목",
      "하락해도 버틸 수 있는 종목",
      "방어력 있는 종목",
      "안정적인 종목",
      "안전한 편인 종목",
      "위험이 낮은 종목",
      "무리하지 않는 종목",
      "보수적으로 볼 만한 종목",
      "초보자가 보기 괜찮은 종목",
      "장기 보유해도 불안하지 않은 종목",
      "너무 공격적인 종목 말고",
      "손실폭이 작을 것 같은 종목",
      "시장 빠져도 덜 빠지는 종목",
    ],
    interpretation:
      "상대적으로 변동성·재무 위험·과열 신호를 줄이고 싶은 표현으로 해석했습니다.",
    mappedIndicators: ["변동성", "고점 대비 낙폭", "부채비율", "최근 상승률", "저유동성 위험 표시"],
    alternatives: [
      {
        label: "변동성 완화 중심",
        description:
          "가격이 크게 흔들리는 구간을 줄이는 쪽으로 더 중점적으로 볼 수 있습니다.",
        conditionHints: ["60일 변동성 상한", "고점 대비 낙폭 제한"],
      },
      {
        label: "재무 위험 신호 중심",
        description: "재무 부담이나 과열 신호를 함께 줄이는 방식으로 볼 수 있습니다.",
        conditionHints: ["부채비율 상한", "20일 상승률 상한"],
      },
    ],
    buildConditions: buildDefensiveRiskPreferenceConditions,
  },
  {
    id: "broken-chart-exclusion",
    phrases: [
      "망가진 차트는 제외",
      "차트가 망가진 건 제외",
      "무너진 차트 제외",
      "저점 이탈 제외",
      "신저가 제외",
      "차트가 무너지진 않은 종목",
      "흐름은 좋은데 너무 튀진않은 종목",
      "안정적으로 올라가는 느낌의 종",
      "안정적으로 올라가는 느낌의 종목",
      "안정적으로 오르는 종목",
      "안정적으로 오르는 종목차트가 아직 살아있는 종목",
      "차트가 아직 살아있는 종목",
      "차트가 깨지지 않은 종목",
      "흐름이 안 죽은 종목",
      "아직 모양이 괜찮은 종목",
      "급락하지 않고 버티는 종목",
      "밀려도 다시 올라오는 종목",
      "선을 안 깨는 종목",
      "중요한 자리 안 깨는 종목",
      "지지선 지키는 종목",
      "무너지지 않고 버티는 종목",
      "빠져도 회복하는 종목",
      "하락해도 추세는 유지되는 종목",
      "조정은 받았는데 망가진 건 아닌 종목",
      "꾸준히 올라가는 종목",
      "천천히 우상향하는 종목",
      "급등 말고 차분하게 오르는 종목",
      "계단식으로 올라가는 종목",
      "탄탄하게 올라가는 종목",
      "흔들림 없이 올라가는 종목",
      "조용히 올라가는 종목",
      "매일 조금씩 오르는 종목",
      "눌려도 다시 올라가는 종목",
      "급등락 없이 우상향하는 종목",
      "보기 편한 차트",
      "예쁘게 올라가는 차트",
      "정직하게 올라가는 차트",
      "안정적인 우상향 차트",
      "급하게 안 가고 천천히 가는 종목",
      "계단 만들면서 가는 종목",
      "이평선 타고 올라가는 종목",
      "추세 살아있는 종목",
      "추세 안 죽은 종목",
      "아직 힘 있는 종목",
      "흐름 살아있는 종목",
      "상승 흐름 유지하는 종목",
      "상승 추세가 꺾이지 않은 종목",
      "아직 방향이 위인 종목",
      "꺾인 것 같지 않은 종목",
      "다시 갈 수 있는 차트",
      "힘이 남아있는 차트",
      "상승 에너지가 남은 종목",
      "주가 흐름이 좋은 종목",
      "시장보다 강한 종목",
      "지수 빠져도 버티는 종목",
      "남들 빠질 때 덜 빠지는 종목",
    ],
    interpretation:
      "중기 기준선을 크게 하회하거나 최근 저점을 이탈한 흐름을 줄이고 싶은 표현으로 해석했습니다.",
    mappedIndicators: ["이동평균선", "신고가/신저가", "정배열/역배열"],
    alternatives: [
      {
        label: "중기선 중심",
        description:
          "60일 이동평균선 위에 있는지에 더 무게를 두는 방식으로 해석할 수 있습니다.",
        conditionHints: ["종가 >= 60일 이동평균선", "20일선 >= 60일선"],
      },
      {
        label: "저점 이탈 중심",
        description:
          "최근 저점 또는 신저가 조건을 더 엄격하게 보는 방식도 가능합니다.",
        conditionHints: ["60일 신저가 제외", "20일 저점 이탈 제외"],
      },
    ],
    buildConditions: buildBrokenChartExclusionConditions,
  },
  {
    id: "pullback",
    phrases: ["눌림목", "눌린 후", "쉬어가는", "잠깐 눌린"],
    interpretation:
      "중기 흐름은 유지하되 단기 가격 변화가 쉬어 가는 구간으로 해석했습니다.",
    mappedIndicators: ["눌림목", "이동평균선", "RSI", "최근 상승률"],
    alternatives: [
      {
        label: "짧은 조정 중심",
        description:
          "단기 가격 변화율이 약하게 내려온 상태를 더 중점적으로 볼 수 있습니다.",
        conditionHints: ["5일 가격 변화율 범위", "20일선 근접"],
      },
      {
        label: "중기 흐름 중심",
        description:
          "단기 조정보다 20일선과 60일선의 관계를 더 강하게 볼 수도 있습니다.",
        conditionHints: ["20일선 >= 60일선", "종가 >= 60일선"],
      },
    ],
    buildConditions: buildPullbackConditions,
  },
  {
    id: "three-white-soldiers",
    phrases: ["적삼병", "양봉이 이어지는", "양봉 연속"],
    interpretation:
      "짧은 기간의 캔들 흐름이 연속적으로 강해지는 패턴으로 해석했습니다.",
    mappedIndicators: ["적삼병", "거래량/거래대금", "RSI"],
    alternatives: [
      {
        label: "캔들 패턴 중심",
        description:
          "3거래일 연속 양봉 자체를 중심 조건으로 둘 수 있습니다.",
        conditionHints: ["최근 3거래일 양봉", "종가가 전일 종가 이상"],
      },
    ],
    buildConditions: buildThreeWhiteSoldiersConditions,
  },
];
