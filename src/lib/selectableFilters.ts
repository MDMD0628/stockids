import { condition, profileDefaults } from "./conditionBuilders";
import type { ConditionSource, RiskProfile, SearchCondition } from "./types";

export type SelectableFilterId =
  | "thin_liquidity"
  | "small_market_cap"
  | "high_volatility"
  | "deficit_company"
  | "financial_risk"
  | "theme_overheat"
  | "recent_runup";

export type SelectedFilterSnapshot = {
  id: SelectableFilterId;
  label: string;
  enabled: boolean;
};

export type SelectableFilterOption = {
  id: SelectableFilterId;
  label: string;
  description: string;
};

export const selectableFilterOptions: SelectableFilterOption[] = [
  {
    id: "thin_liquidity",
    label: "거래량 얇은 종목 제외",
    description: "거래대금 기준을 사용자 선택 필터로 조건식에 추가합니다.",
  },
  {
    id: "small_market_cap",
    label: "시가총액 작은 종목 제외",
    description: "규모가 작은 구간을 줄이는 조건을 사용자 선택 필터로 추가합니다.",
  },
  {
    id: "high_volatility",
    label: "변동성 큰 종목 제외",
    description: "가격 흔들림이 큰 구간을 줄이는 조건을 사용자 선택 필터로 추가합니다.",
  },
  {
    id: "deficit_company",
    label: "적자 기업 제외",
    description: "최근 영업이익 기준을 사용자 선택 필터로 조건식에 추가합니다.",
  },
  {
    id: "financial_risk",
    label: "재무 위험 신호 있는 종목 제외",
    description: "관리 이슈, 자본잠식, 감사의견, 부채비율 기준을 사용자 선택 필터로 추가합니다.",
  },
  {
    id: "theme_overheat",
    label: "테마성 과열 종목 제외",
    description: "테마/뉴스 데이터는 추후 연결 대상으로 두고, 현재는 과열 대체 조건을 추가합니다.",
  },
  {
    id: "recent_runup",
    label: "최근 급격히 오른 종목 제외",
    description: "최근 가격 변화가 과한 구간을 줄이는 조건을 사용자 선택 필터로 추가합니다.",
  },
];

const numberFromText = (value: string) =>
  Number(value.replace(/,/g, "").replace(/[^0-9.-]/g, ""));

const percentFromText = (value: string) => numberFromText(value);

const krwFromEok = (value: string) => numberFromText(value) * 100_000_000;

const getOption = (id: SelectableFilterId) =>
  selectableFilterOptions.find((option) => option.id === id)!;

export const getSelectedFilterSnapshots = (
  selectedFilterIds: SelectableFilterId[],
): SelectedFilterSnapshot[] =>
  selectableFilterOptions.map((option) => ({
    id: option.id,
    label: option.label,
    enabled: selectedFilterIds.includes(option.id),
  }));

const buildSelectableFilterCondition = (
  filterId: SelectableFilterId,
  profile: RiskProfile,
  source: ConditionSource,
  sourcePhrase?: string,
): SearchCondition => {
  const defaults = profileDefaults[profile];
  const option = getOption(filterId);
  const commonOptions = {
    source,
    sourcePhrase: sourcePhrase ?? option.label,
  };

  switch (filterId) {
    case "thin_liquidity":
      return condition(
        "filter-thin-liquidity",
        "liquidity",
        "거래대금 선택 필터",
        "20일 평균 거래대금",
        ">=",
        defaults.minTradingValue,
        "사용자가 거래가 얇은 종목을 줄이기로 선택해 거래대금 기준을 추가했습니다.",
        "volume",
        {
          field: "avg_trading_value_20d_krw",
          operator: ">=",
          value: krwFromEok(defaults.minTradingValue),
          unit: "krw",
        },
        {
          ...commonOptions,
          easyDescription: "거래가 너무 얇은 종목을 줄입니다.",
        },
      );
    case "small_market_cap":
      return condition(
        "filter-small-market-cap",
        "stability",
        "시가총액 선택 필터",
        "시가총액",
        ">=",
        defaults.minMarketCap,
        "사용자가 규모가 작은 종목을 줄이기로 선택해 시가총액 기준을 추가했습니다.",
        "marketCap",
        {
          field: "market_cap_krw",
          operator: ">=",
          value: krwFromEok(defaults.minMarketCap),
          unit: "krw",
        },
        {
          ...commonOptions,
          easyDescription: "규모가 너무 작은 종목을 줄입니다.",
        },
      );
    case "high_volatility":
      return condition(
        "filter-high-volatility",
        "risk",
        "변동성 선택 필터",
        "60일 변동성",
        "<=",
        defaults.maxVolatility,
        "사용자가 가격 흔들림이 큰 종목을 줄이기로 선택해 변동성 기준을 추가했습니다.",
        "volatility",
        {
          field: "volatility_60d_pct",
          operator: "<=",
          value: percentFromText(defaults.maxVolatility),
          unit: "percent",
        },
        {
          ...commonOptions,
          easyDescription: "가격 흔들림이 큰 종목을 줄입니다.",
        },
      );
    case "deficit_company":
      return condition(
        "filter-deficit-company",
        "growth",
        "실적 선택 필터",
        "최근 분기 영업이익",
        ">=",
        "0",
        "사용자가 실적이 불안정한 기업을 줄이기로 선택해 영업이익 기준을 추가했습니다.",
        "fundamentals",
        {
          field: "operating_profit_recent_quarter_krw",
          operator: ">=",
          value: 0,
          unit: "krw",
        },
        {
          ...commonOptions,
          easyDescription: "최근 영업이익이 적자인 기업을 줄입니다.",
        },
      );
    case "financial_risk":
      return condition(
        "filter-financial-risk",
        "stability",
        "재무 위험 선택 필터",
        "재무 위험 신호",
        "=",
        "낮음",
        "사용자가 재무 위험 신호가 있는 회사를 줄이기로 선택해 관리 이슈와 재무 부담을 확인하는 기준을 추가했습니다.",
        "fundamentals",
        {
          field: "has_financial_risk_flag",
          operator: "=",
          value: false,
          unit: "boolean",
        },
        {
          ...commonOptions,
          easyDescription: "재무 위험 신호가 큰 회사를 줄입니다.",
        },
      );
    case "theme_overheat":
      return condition(
        "filter-theme-overheat",
        "risk",
        "테마성 과열 선택 필터",
        "20일 상승률",
        "<=",
        defaults.recentReturnCap,
        "사용자가 테마성 과열 구간을 줄이기로 선택해 현재 MVP에서 계산 가능한 가격 과열 대체 기준을 추가했습니다.",
        "recentReturn",
        {
          field: "return_20d_pct",
          operator: "<=",
          value: percentFromText(defaults.recentReturnCap),
          unit: "percent",
        },
        {
          ...commonOptions,
          easyDescription: "테마성 과열로 볼 수 있는 가격 과열 구간을 줄입니다.",
        },
      );
    case "recent_runup":
      return condition(
        "filter-recent-runup",
        "risk",
        "최근 가격 선택 필터",
        "20일 상승률",
        "<=",
        defaults.recentReturnCap,
        "사용자가 최근 가격 변화가 과한 종목을 줄이기로 선택해 최근 상승률 기준을 추가했습니다.",
        "recentReturn",
        {
          field: "return_20d_pct",
          operator: "<=",
          value: percentFromText(defaults.recentReturnCap),
          unit: "percent",
        },
        {
          ...commonOptions,
          easyDescription: "최근 가격 변화가 과한 종목을 줄입니다.",
        },
      );
  }
};

export const buildSelectedFilterConditions = (
  selectedFilterIds: SelectableFilterId[],
  profile: RiskProfile,
  source: ConditionSource = "user_selected_filter",
  sourcePhrase?: string,
) =>
  selectedFilterIds.map((filterId) =>
    buildSelectableFilterCondition(filterId, profile, source, sourcePhrase),
  );
