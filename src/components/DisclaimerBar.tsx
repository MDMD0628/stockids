import { BadgeCheck } from "lucide-react";

export function DisclaimerBar() {
  return (
    <div className="rounded-lg border border-ink/10 bg-ink p-5 text-white">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold text-citrus">조건검색 참고용</p>
          <p className="mt-1 text-sm leading-6 text-white/70">
            이 화면은 자연어를 조건식으로 정리하는 MVP이며, 실제 종목 데이터 조회나
            투자 판단을 대신하지 않습니다.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm font-bold">
          <BadgeCheck size={16} aria-hidden="true" />
          표시 완료
        </span>
      </div>
    </div>
  );
}
