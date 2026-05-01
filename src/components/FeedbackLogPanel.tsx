import { Bug, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { getFeedbackRecords, type FeedbackRecord } from "../lib/feedback";

type FeedbackLogPanelProps = {
  refreshKey: number;
};

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

export function FeedbackLogPanel({ refreshKey }: FeedbackLogPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [records, setRecords] = useState<FeedbackRecord[]>([]);

  useEffect(() => {
    setRecords(getFeedbackRecords());
  }, [refreshKey, isOpen]);

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="inline-flex items-center gap-2 text-sm font-bold">
          <Bug size={16} aria-hidden="true" />
          개발자 확인용 피드백 로그
        </span>
        <span className="inline-flex items-center gap-2 text-xs font-bold text-ink/55">
          {records.length}건
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`transition ${isOpen ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 max-h-[520px] space-y-3 overflow-auto border-t border-ink/10 pt-4">
          {records.length === 0 ? (
            <p className="rounded-lg bg-paper/70 p-4 text-sm text-ink/60">
              아직 저장된 피드백이 없습니다.
            </p>
          ) : (
            records.map((record) => (
              <article
                key={record.id}
                className="rounded-lg border border-ink/10 bg-paper/45 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-bold ${
                      record.feedback === "good"
                        ? "bg-pine/10 text-pine"
                        : "bg-coral/10 text-coral"
                    }`}
                  >
                    {record.feedback === "good" ? "맞아요" : "달라요"}
                  </span>
                  {record.wrongReason && (
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink/60">
                      {record.wrongReason}
                    </span>
                  )}
                  <span className="text-xs font-semibold text-ink/45">
                    {formatDateTime(record.createdAt)}
                  </span>
                </div>

                <p className="mt-3 text-sm font-semibold leading-6 text-ink">
                  {record.input}
                </p>

                {record.comment && (
                  <p className="mt-2 rounded-md bg-white p-3 text-sm leading-6 text-ink/65">
                    {record.comment}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {record.matchedPhrases.map((phrase) => (
                    <span
                      key={phrase.id}
                      className="rounded-md bg-pine/10 px-2 py-1 text-xs font-semibold text-pine"
                    >
                      {phrase.phrase}
                    </span>
                  ))}
                </div>

                {record.selectedFilters?.some((filter) => filter.enabled) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {record.selectedFilters
                      .filter((filter) => filter.enabled)
                      .map((filter) => (
                        <span
                          key={filter.id}
                          className="rounded-md bg-pool/10 px-2 py-1 text-xs font-semibold text-pool"
                        >
                          {filter.label}
                        </span>
                      ))}
                  </div>
                )}

                <details className="mt-3 rounded-lg border border-ink/10 bg-white">
                  <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-ink/60 transition hover:text-pool">
                    저장된 machineQuery 보기
                  </summary>
                  <pre className="max-h-48 overflow-auto border-t border-ink/10 p-3 text-xs leading-5 text-ink/70">
                    {JSON.stringify(record.machineQueries, null, 2)}
                  </pre>
                </details>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}
