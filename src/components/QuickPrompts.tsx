import { RefreshCw } from "lucide-react";

type QuickPromptsProps = {
  onSelect: (prompt: string) => void;
  prompts: string[];
};

export function QuickPrompts({ onSelect, prompts }: QuickPromptsProps) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5">
      <div className="mb-3 flex items-center gap-2">
        <RefreshCw size={17} className="text-coral" aria-hidden="true" />
        <h2 className="text-sm font-bold">빠른 입력</h2>
      </div>
      <div className="space-y-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelect(prompt)}
            className="w-full rounded-lg border border-ink/10 bg-paper/50 px-3 py-3 text-left text-sm leading-6 transition hover:border-coral hover:bg-coral/5"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
