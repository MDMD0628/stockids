import {
  buildBrokenChartExclusionConditions,
  buildOverheatAvoidanceConditions,
  buildPullbackConditions,
  buildThreeWhiteSoldiersConditions,
  buildTrendDistanceConditions,
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
    id: "broken-chart-exclusion",
    phrases: [
      "망가진 차트는 제외",
      "차트가 망가진 건 제외",
      "무너진 차트 제외",
      "저점 이탈 제외",
      "신저가 제외",
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
