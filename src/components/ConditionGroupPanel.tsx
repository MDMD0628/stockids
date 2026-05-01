import { ArrowRight } from "lucide-react";
import type { SearchCondition } from "../lib/types";
import { splitConditionsBySource } from "../lib/resultPresentation";
import { ConditionCard } from "./ConditionCard";
import { ResultBlock } from "./ResultBlock";

type ConditionGroupPanelProps = {
  conditions: SearchCondition[];
};

export function ConditionGroupPanel({ conditions }: ConditionGroupPanelProps) {
  const { userExpressionConditions, selectedFilterConditions } =
    splitConditionsBySource(conditions);

  return (
    <ResultBlock
      icon={<ArrowRight size={18} aria-hidden="true" />}
      title="변환된 검색 조건"
    >
      <div className="space-y-5">
        <ConditionGroup
          title="사용자 표현에서 나온 조건"
          description="입력 문장에서 인식한 표현을 조건식으로 변환한 항목입니다."
          conditions={userExpressionConditions}
          emptyText="이번 입력에서 직접 인식한 표현 기반 조건은 많지 않습니다."
        />

        <ConditionGroup
          title="사용자 선택 필터"
          description="기본값은 꺼져 있으며, 사용자가 직접 켠 항목만 조건식에 추가됩니다."
          conditions={selectedFilterConditions}
          emptyText="켜진 사용자 선택 필터가 없습니다."
        />
      </div>
    </ResultBlock>
  );
}

function ConditionGroup({
  conditions,
  description,
  emptyText,
  title,
}: {
  conditions: SearchCondition[];
  description: string;
  emptyText: string;
  title: string;
}) {
  return (
    <section>
      <div className="mb-3">
        <h3 className="text-sm font-bold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-ink/60">{description}</p>
      </div>

      {conditions.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {conditions.map((condition) => (
            <ConditionCard key={condition.id} condition={condition} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-ink/15 bg-paper/45 p-4 text-sm text-ink/55">
          {emptyText}
        </p>
      )}
    </section>
  );
}
