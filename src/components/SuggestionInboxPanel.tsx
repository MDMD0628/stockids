import {
  Check,
  ClipboardCopy,
  Inbox,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  deleteSavedSuggestion,
  getSavedSuggestions,
  type SavedSuggestion,
  type SuggestionStatus,
  updateSuggestionNote,
  updateSuggestionStatus,
} from "../lib/suggestionInbox";

type SuggestionInboxPanelProps = {
  onChange: () => void;
  refreshKey: number;
};

const statusLabels: Record<SuggestionStatus, string> = {
  new: "새 제안",
  backlog: "보류",
  planned: "반영 예정",
  applied: "반영 완료",
  ignored: "무시",
};

const typeLabels: Record<SavedSuggestion["type"], string> = {
  add_phrase: "표현 추가",
  create_rule: "규칙 생성",
  adjust_threshold: "조건 조정",
};

const statusStyles: Record<SuggestionStatus, string> = {
  new: "bg-pool/10 text-pool",
  backlog: "bg-citrus/15 text-ink",
  planned: "bg-pine/10 text-pine",
  applied: "bg-ink text-white",
  ignored: "bg-coral/10 text-coral",
};

const formatConfidence = (confidence: number) =>
  `${Math.round(confidence * 100)}%`;

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

const copyText = async (text: string) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below handles older or restricted browser contexts.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  return copied;
};

export function SuggestionInboxPanel({
  onChange,
  refreshKey,
}: SuggestionInboxPanelProps) {
  const [suggestions, setSuggestions] = useState<SavedSuggestion[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setSuggestions(getSavedSuggestions());
  }, [refreshKey]);

  const handleStatusChange = (id: string, status: SuggestionStatus) => {
    setSuggestions(updateSuggestionStatus(id, status));
  };

  const handleNoteChange = (id: string, note: string) => {
    setSuggestions(updateSuggestionNote(id, note));
  };

  const handleDelete = (id: string) => {
    setSuggestions(deleteSavedSuggestion(id));
    onChange();
  };

  const copyPrompt = async (suggestion: SavedSuggestion) => {
    const copied = await copyText(suggestion.codexPrompt);

    if (copied) {
      setCopiedId(suggestion.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    }
  };

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-bold">
            <Inbox size={16} aria-hidden="true" />
            제안 저장함
          </div>
          <p className="mt-2 text-sm leading-6 text-ink/60">
            학습 제안은 자동 반영되지 않습니다. 반복되는 표현이나 직접 검토한
            제안만 반영 예정으로 옮겨 코덱스에 전달하세요.
          </p>
        </div>
        <span className="rounded-md bg-pool/10 px-2.5 py-1 text-xs font-bold text-pool">
          {suggestions.length}건
        </span>
      </div>

      {suggestions.length === 0 ? (
        <p className="rounded-lg bg-paper/70 p-4 text-sm leading-6 text-ink/60">
          저장된 학습 제안이 없습니다. 학습 제안 카드에서 저장함에 추가할 수
          있습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <article
              key={suggestion.id}
              className="rounded-lg border border-ink/10 bg-paper/45 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-bold ${
                        statusStyles[suggestion.status]
                      }`}
                    >
                      {statusLabels[suggestion.status]}
                    </span>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-ink/60">
                      {typeLabels[suggestion.type]}
                    </span>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-ink/60">
                      신뢰도 {formatConfidence(suggestion.confidence)}
                    </span>
                    {suggestion.targetRuleId && (
                      <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink/60">
                        대상 규칙 {suggestion.targetRuleId}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-sm font-bold text-ink">
                    {suggestion.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink/65">
                    {suggestion.description}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-ink/40">
                    저장 {formatDateTime(suggestion.createdAt)} · 수정{" "}
                    {formatDateTime(suggestion.updatedAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyPrompt(suggestion)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-sm font-bold text-ink transition hover:border-pool hover:text-pool"
                  >
                    {copiedId === suggestion.id ? (
                      <Check size={16} aria-hidden="true" />
                    ) : (
                      <ClipboardCopy size={16} aria-hidden="true" />
                    )}
                    {copiedId === suggestion.id ? "복사됨" : "프롬프트 복사"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(suggestion.id)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-coral/20 bg-white px-3 text-sm font-bold text-coral transition hover:bg-coral hover:text-white"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    삭제
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <SuggestionList title="예시 입력" items={suggestion.examples} />
                <SuggestionList
                  title="제안 지표"
                  items={suggestion.suggestedIndicators ?? []}
                />
              </div>

              <SuggestionList
                title="조건 힌트"
                items={suggestion.suggestedConditionHints ?? []}
              />

              <div className="mt-3 grid gap-3 md:grid-cols-[220px_1fr]">
                <label className="block">
                  <span className="text-xs font-bold text-ink/50">상태</span>
                  <select
                    value={suggestion.status}
                    onChange={(event) =>
                      handleStatusChange(
                        suggestion.id,
                        event.target.value as SuggestionStatus,
                      )
                    }
                    className="mt-2 min-h-10 w-full rounded-lg border border-ink/10 bg-white px-3 text-sm font-bold text-ink outline-none transition focus:border-pool focus:ring-4 focus:ring-pool/10"
                  >
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-ink/50">메모</span>
                  <textarea
                    value={suggestion.note ?? ""}
                    onChange={(event) =>
                      handleNoteChange(suggestion.id, event.target.value)
                    }
                    className="mt-2 min-h-20 w-full resize-none rounded-lg border border-ink/10 bg-white p-3 text-sm leading-6 text-ink outline-none transition focus:border-pool focus:ring-4 focus:ring-pool/10"
                    placeholder="검토 내용이나 다음 작업 메모를 남겨주세요."
                  />
                </label>
              </div>

              <details className="mt-3 rounded-lg border border-ink/10 bg-white">
                <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-ink/60 transition hover:text-pool">
                  코덱스용 프롬프트 보기
                </summary>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap border-t border-ink/10 p-3 text-xs leading-5 text-ink/70">
                  {suggestion.codexPrompt}
                </pre>
              </details>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SuggestionList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mt-3 rounded-lg border border-ink/10 bg-white p-3 first:mt-0">
      <p className="text-xs font-bold text-ink/50">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm leading-6 text-ink/65">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink/45">표시할 항목이 없습니다.</p>
      )}
    </div>
  );
}
