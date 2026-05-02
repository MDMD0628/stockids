export type VolumePhraseGroupId =
  | "volume-strength-building"
  | "money-flow-strength"
  | "quiet-volume-build"
  | "volume-breakout"
  | "orderbook-liquidity"
  | "volume-risk-avoidance";

export type VolumePhraseGroup = {
  id: VolumePhraseGroupId;
  label: string;
  intent: string;
  mvpHandling: string;
  phraseCandidates: string[];
  builderCandidate?: {
    name: string;
    conditionHints: string[];
    machineQueryHints: string[];
  };
  alternativeInterpretation?: string;
  separatedBecause?: string;
};

export const volumePhraseCatalog: VolumePhraseGroup[] = [
  {
    id: "volume-strength-building",
    label: "기존 volume-strength-building 후보",
    intent:
      "최근 거래량이나 시장 관심이 평소보다 붙기 시작했다는 일반적인 관심 증가 표현입니다.",
    mvpHandling:
      "기존 volume-strength-building 규칙에 추가할 수 있는 1차 후보입니다. 거래량 증가와 단기 흐름 전환 조건으로 해석합니다.",
    phraseCandidates: [
      "슬슬 거래가 붙는 종목",
      "사람들이 관심 갖기 시작한 종목",
      "관심이 붙는 종목",
      "거래가 살아나는 종목",
      "죽어 있던 거래가 살아나는 종목",
      "잠잠하다가 반응 오는 종목",
      "이제 막 움직이려는 종목",
      "꿈틀거리는 종목",
      "뭔가 낌새가 있는 종목",
      "슬슬 시동 거는 종목",
      "바닥에서 반응 나오는 종목",
      "거래량이 평소보다 많아진 종목",
      "거래량 붙는 종목",
      "거래량이 붙기 시작한 종목",
      "거래량이 살아나는 종목",
      "수급이 살아나는 종목",
      "거래량이 늘어나는 종목",
      "거래량이 슬금슬금 증가하는 종목",
      "거래량이 실리는 종목",
      "거래량이 받쳐주는 종목",
      "거래량 동반 상승 종목",
      "거래량이 따라오는 종목",
      "거래량 없이 오르는 종목 말고 거래량 있는 종목",
      "거래량이 점점 커지는 종목",
      "거래량 막대가 커지는 종목",
      "사람들이 몰리는 종목",
      "관심이 몰리는 종목",
      "시장 관심 받는 종목",
      "오늘 주목받는 종목",
      "갑자기 주목받는 종목",
      "눈에 띄기 시작한 종목",
      "검색 많이 될 것 같은 종목",
      "커뮤니티에서 언급 늘어난 종목",
      "뉴스 나오고 관심 붙은 종목",
      "시장에서 반응 오는 종목",
      "투자자들이 보기 시작한 종목",
      "사람들이 다시 보는 종목",
      "소외됐다가 관심 받는 종목",
      "다시 관심받는 종목",
      "소외됐다가 살아나는 종목",
      "잊혀졌다가 거래 붙는 종목",
      "죽은 줄 알았는데 살아나는 종목",
      "바닥에서 거래 살아나는 종목",
      "거래 말랐다가 다시 붙는 종목",
      "관심 밖이었다가 다시 들어오는 종목",
      "오래 쉬다가 움직이는 종목",
      "예전에 핫했던 종목이 다시 반응 오는 종목",
      "테마가 다시 붙는 종목",
      "재료가 다시 살아나는 종목",
      "시장이 다시 보는 종목",
      "거래 빠졌다가 회복되는 종목",
    ],
  },
  {
    id: "money-flow-strength",
    label: "money-flow-strength 새 규칙 후보",
    intent:
      "거래량보다 거래대금, 수급, 큰 자금 유입 느낌을 더 직접적으로 말하는 표현입니다.",
    mvpHandling:
      "바로 적용하지 않고 별도 규칙 후보로 둡니다. 실제 데이터 연결 시 거래대금과 투자 주체별 순매수 데이터를 분리해서 볼 수 있습니다.",
    phraseCandidates: [
      "거래대금 붙는 종목",
      "돈이 들어오는 종목",
      "돈이 몰리는 종목",
      "시장 돈이 몰리는 종목",
      "큰돈이 들어오는 종목",
      "판돈이 커지는 종목",
      "거래대금 상위 종목",
      "돈이 실리는 종목",
      "수급이 몰리는 종목",
      "거래대금이 받쳐주는 종목",
      "돈 들어온 흔적이 있는 종목",
      "거래대금이 갑자기 커진 종목",
      "예전보다 돈이 많이 도는 종목",
      "오늘 시장에서 돈 몰리는 종목",
      "수급 들어오는 종목",
      "수급이 붙는 종목",
      "수급이 강한 종목",
      "매수세 들어오는 종목",
      "사는 힘이 붙는 종목",
      "매수세가 강해지는 종목",
      "외국인 들어오는 종목",
      "기관 들어오는 종목",
      "프로그램 매수 들어오는 종목",
      "큰손 들어오는 종목",
      "세력이 들어오는 것 같은 종목",
      "누가 계속 사는 종목",
      "밑에서 계속 받는 종목",
      "팔아도 누가 받아주는 종목",
      "다시 돈 들어오는 종목",
    ],
    builderCandidate: {
      name: "buildMoneyFlowStrengthConditions",
      conditionHints: [
        "20일 평균 거래대금 하한",
        "당일 거래대금 / 20일 평균 거래대금 비율",
        "거래대금 시장 내 순위 또는 분위",
        "외국인/기관/프로그램 순매수는 데이터 연결 이후 선택 지표로 분리",
      ],
      machineQueryHints: [
        "avg_trading_value_20d_krw >= profile 기준값",
        "trading_value_today_to_avg_20d_pct >= 130",
        "trading_value_rank_pct <= 20",
        "net_buy_value_by_investor_krw는 외부 데이터 연결 이후 검토",
      ],
    },
    separatedBecause:
      "거래량 증가보다 실제 돈의 크기와 수급 주체를 말하므로 volume-strength-building과 분리합니다.",
  },
  {
    id: "quiet-volume-build",
    label: "quiet-volume-build 새 규칙 후보",
    intent:
      "가격은 크게 튀지 않았지만 거래가 조용히 쌓이거나 바닥권에서 반응이 생기는 표현입니다.",
    mvpHandling:
      "바로 적용하지 않고 별도 규칙 후보로 둡니다. 거래량 증가와 가격 과열 제한을 함께 보는 후보입니다.",
    phraseCandidates: [
      "조용하다가 움직이기 시작한 종목",
      "오래 조용했는데 거래가 늘어난 종목",
      "조용히 거래량 쌓이는 종목",
      "조용히 매집되는 종목",
      "티 안 나게 거래 붙는 종목",
      "조용히 누가 사는 종목",
      "가격은 안 오르는데 거래량 늘어나는 종목",
      "횡보하는데 거래량 붙는 종목",
      "바닥에서 거래량 쌓이는 종목",
      "아직 안 올랐는데 거래량 늘어난 종목",
      "거래량은 느는데 주가는 안 튄 종목",
      "조용히 힘 모으는 종목",
      "폭발 전처럼 보이는 종목",
      "에너지 모으는 종목",
      "매집 냄새 나는 종목",
      "오랫동안 조용하다가 움직이는 종목",
      "급등 후 거래 터지는 종목 말고 초입 종목",
      "이미 불붙은 종목 말고 불붙기 직전 종목",
    ],
    builderCandidate: {
      name: "buildQuietVolumeBuildConditions",
      conditionHints: [
        "5일 평균 거래량 / 20일 평균 거래량 증가",
        "20일 상승률 상한",
        "가격 변동 범위 제한",
        "볼린저밴드 상단 과도 이탈 제외",
      ],
      machineQueryHints: [
        "avg_volume_5d_to_20d_pct >= 115",
        "return_20d_pct <= profile recentReturnCap보다 낮은 값",
        "return_5d_pct between -3 and 6",
        "close_to_bollinger_upper_pct <= 100",
      ],
    },
    separatedBecause:
      "거래 증가와 동시에 가격이 아직 과하게 움직이지 않았다는 의미가 있어 일반 거래 관심과 분리합니다.",
  },
  {
    id: "volume-breakout",
    label: "volume-breakout 새 규칙 후보",
    intent:
      "거래량, 거래대금, 시장 관심이 한 번에 크게 터진 강한 이벤트성 표현입니다.",
    mvpHandling:
      "바로 적용하지 않고 별도 규칙 후보로 둡니다. 강한 거래 증가 조건과 과열 위험 표시를 함께 설계해야 합니다.",
    phraseCandidates: [
      "갑자기 거래가 늘어난 종목",
      "평소랑 다르게 사람들이 몰리는 종목",
      "거래대금 터지는 종목",
      "거래량이 평소보다 터진 종목",
      "거래량이 확 늘어난 종목",
      "밑에서 거래 터지는 종목",
      "바닥 거래량 들어온 종목",
      "거래량 터진 종목",
      "거래대금 터진 종목",
      "수급 터진 종목",
      "장대양봉 터진 종목",
      "거래량 폭발한 종목",
      "오늘 거래 터진 종목",
      "갑자기 거래 폭발한 종목",
      "돈이 확 들어온 종목",
      "매수세 터진 종목",
      "시장 관심 폭발한 종목",
      "뉴스랑 거래량 같이 터진 종목",
      "거래량 동반 급등 종목",
      "대량 거래 터진 종목",
      "평소보다 거래가 몇 배 붙은 종목",
      "갑자기 불붙은 종목",
    ],
    builderCandidate: {
      name: "buildVolumeBreakoutConditions",
      conditionHints: [
        "당일 거래량 / 20일 평균 거래량 급증",
        "당일 거래대금 하한",
        "장대양봉 또는 가격 반응 여부는 캔들 데이터 연결 이후 검토",
        "고점 부근 거래 폭증은 위험 요소로 별도 표시",
      ],
      machineQueryHints: [
        "volume_today_to_avg_20d_pct >= 200",
        "trading_value_today_krw >= profile 기준값",
        "candle_body_pct >= 3은 선택 검토",
        "drawdown_from_60d_high_pct와 return_20d_pct로 과열 위험 표시",
      ],
    },
    separatedBecause:
      "강도가 큰 이벤트성 표현이라 일반적인 거래 관심 증가보다 조건이 훨씬 공격적으로 해석될 수 있습니다.",
  },
  {
    id: "orderbook-liquidity",
    label: "orderbook-liquidity 대체 해석 후보",
    intent:
      "호가창, 체결 속도, 잔량처럼 실시간 미시 구조 데이터를 필요로 하는 표현입니다.",
    mvpHandling:
      "현재 MVP에서는 실제 호가/체결 데이터를 보지 않으므로 조건으로 자동 생성하지 않습니다. 대체 해석으로 거래대금, 거래량, 유동성 위험 표시만 제안합니다.",
    phraseCandidates: [
      "호가창이 활발한 종목",
      "체결이 잘 되는 종목",
      "매수 매도가 활발한 종목",
      "호가가 두꺼운 종목",
      "호가가 살아있는 종목",
      "체결 속도 빠른 종목",
      "주문이 많이 붙는 종목",
      "사고파는 사람이 많은 종목",
      "호가창에 힘 있는 종목",
      "매수잔량 붙는 종목",
      "매도 물량 받아내는 종목",
      "체결강도 높은 종목",
      "매수 체결이 많은 종목",
      "빨리빨리 거래되는 종목",
      "유동성 좋은 종목",
    ],
    alternativeInterpretation:
      "실시간 호가 데이터가 없을 때는 20일 평균 거래대금, 당일 거래량 증가, 거래량 부족 위험 표시로만 참고용 대체 해석을 제공합니다.",
    separatedBecause:
      "호가/체결 데이터는 일봉 조건검색식과 데이터 소스가 달라 현재 MVP에서 직접 조건화하지 않습니다.",
  },
  {
    id: "volume-risk-avoidance",
    label: "위험 회피 표현 분리 후보",
    intent:
      "거래가 많아도 과열, 상투, 변동성, 윗꼬리, 분배성 흐름을 피하고 싶다는 표현입니다.",
    mvpHandling:
      "volume-strength-building에 넣지 않습니다. overheat-avoidance, 선택 필터, 위험 요소 표시로 분리합니다.",
    phraseCandidates: [
      "너무 갑자기 터진 종목은 빼줘",
      "이미 너무 오른 종목 말고",
      "상투 느낌 나는 종목은 제외",
      "설거지 같은 종목은 빼줘",
      "거래량은 터졌는데 윗꼬리 긴 종목은 빼줘",
      "거래만 많고 못 오르는 종목은 빼줘",
      "거래량 터지고 빠지는 종목은 제외",
      "고점에서 거래 터진 종목은 위험한 것 같아",
      "물량 넘기는 느낌 나는 종목은 빼줘",
      "변동성 너무 큰 종목은 빼줘",
      "작전주 같은 건 빼줘",
      "너무 지저분하게 움직이는 종목은 빼줘",
      "거래량은 많은데 음봉인 종목은 조심",
      "급등 후 거래 터지는 종목 말고 초입 종목",
      "이미 불붙은 종목 말고 불붙기 직전 종목",
    ],
    builderCandidate: {
      name: "buildVolumeRiskAvoidanceConditions",
      conditionHints: [
        "최근 상승률 상한",
        "60일 변동성 상한",
        "고점 대비 위치 위험 표시",
        "윗꼬리/음봉 조건은 캔들 데이터 연결 이후 검토",
      ],
      machineQueryHints: [
        "return_20d_pct <= profile recentReturnCap",
        "volatility_60d_pct <= profile maxVolatility",
        "close_to_60d_high_pct >= 95이면 위험 표시 후보",
        "upper_wick_pct와 candle_color는 캔들 데이터 연결 이후 검토",
      ],
    },
    separatedBecause:
      "거래 관심 조건이 아니라 거래 증가 상황에서 피하고 싶은 위험 요소를 말하는 표현입니다.",
  },
];

