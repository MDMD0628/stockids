import type { IndicatorExplanation } from "./types";

export const indicatorCatalog: Record<string, IndicatorExplanation> = {
  movingAverage: {
    key: "movingAverage",
    name: "이동평균선",
    plain:
      "일정 기간의 가격 평균을 이어서 본 선입니다. 단기선과 중기선의 위치로 흐름의 방향성을 살핍니다.",
    usedFor:
      "최근 흐름이 중기 흐름보다 단단한지 확인하는 조건에 사용합니다.",
  },
  volume: {
    key: "volume",
    name: "거래량/거래대금",
    plain:
      "얼마나 자주, 어느 정도 규모로 거래되는지 보는 지표입니다. 조건식 실행 가능성과 체결 환경을 가늠하는 데 도움을 줍니다.",
    usedFor:
      "관심이 갑자기 몰린 구간 또는 거래가 너무 얇은 구간을 걸러내는 데 사용합니다.",
  },
  volatility: {
    key: "volatility",
    name: "변동성",
    plain:
      "가격이 일정 기간 동안 얼마나 크게 흔들렸는지 보는 지표입니다.",
    usedFor:
      "사용자가 말한 안정감 또는 빠른 움직임 선호도를 조건 폭으로 바꾸는 데 사용합니다.",
  },
  rsi: {
    key: "rsi",
    name: "RSI",
    plain:
      "최근 가격 움직임의 강도를 0부터 100 사이 값으로 표현합니다. 너무 낮거나 높은 구간을 구분하는 데 쓰입니다.",
    usedFor:
      "흐름이 과하게 식었거나 과열된 구간을 배제하는 보조 조건으로 사용합니다.",
  },
  marketCap: {
    key: "marketCap",
    name: "시가총액",
    plain:
      "상장된 주식 전체를 현재 가격으로 평가한 규모입니다. 기업 규모를 가늠하는 데 사용합니다.",
    usedFor:
      "대형, 중형, 가벼운 움직임 같은 자연어 표현을 조건식의 규모 기준으로 바꿀 때 사용합니다.",
  },
  fundamentals: {
    key: "fundamentals",
    name: "실적 지표",
    plain:
      "매출, 영업이익, 이익률처럼 기업의 사업 성과를 숫자로 본 값입니다.",
    usedFor:
      "성장, 턴어라운드, 실적 개선 같은 표현을 정량 조건으로 바꾸는 데 사용합니다.",
  },
  valuation: {
    key: "valuation",
    name: "밸류에이션",
    plain:
      "PER, PBR처럼 현재 가격이 실적이나 자산 대비 어느 정도 수준인지 보는 지표입니다.",
    usedFor:
      "가격 부담이 낮은 편이라는 표현을 조건식 기준으로 정리할 때 사용합니다.",
  },
};
