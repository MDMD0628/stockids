import { SlidersHorizontal } from "lucide-react";
import {
  type SelectableFilterId,
  selectableFilterOptions,
} from "../lib/selectableFilters";
import { ResultBlock } from "./ResultBlock";

type SelectableFilterPanelProps = {
  selectedFilterIds: SelectableFilterId[];
  onChange: (selectedFilterIds: SelectableFilterId[]) => void;
};

export function SelectableFilterPanel({
  onChange,
  selectedFilterIds,
}: SelectableFilterPanelProps) {
  const toggleFilter = (filterId: SelectableFilterId) => {
    if (selectedFilterIds.includes(filterId)) {
      onChange(selectedFilterIds.filter((id) => id !== filterId));
      return;
    }

    onChange([...selectedFilterIds, filterId]);
  };

  return (
    <ResultBlock
      icon={<SlidersHorizontal size={18} aria-hidden="true" />}
      title="사용자 선택 필터"
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-ink/65">
          기본값은 모두 꺼져 있습니다. 켠 항목만 조건식에 추가되며, 아래 조건
          카드에서 출처가 사용자 선택 필터로 표시됩니다.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          {selectableFilterOptions.map((option) => {
            const checked = selectedFilterIds.includes(option.id);

            return (
              <label
                key={option.id}
                className={`cursor-pointer rounded-lg border p-4 transition ${
                  checked
                    ? "border-pool bg-pool/10"
                    : "border-ink/10 bg-paper/45 hover:border-pool/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFilter(option.id)}
                    className="mt-1 h-4 w-4 accent-pool"
                  />
                  <div>
                    <p className="text-sm font-bold text-ink">{option.label}</p>
                    <p className="mt-1 text-sm leading-6 text-ink/60">
                      {option.description}
                    </p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <p className="rounded-lg bg-white p-3 text-sm leading-6 text-ink/60">
          나중에 피드백이 쌓이면 사용자가 자주 제외하는 조건을 기본 필터 후보로
          보여줄 수 있습니다. 현재는 자동 적용하지 않고 사용자가 직접 켠 항목만
          반영합니다.
        </p>
      </div>
    </ResultBlock>
  );
}
