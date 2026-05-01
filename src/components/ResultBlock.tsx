import type { ReactNode } from "react";

type ResultBlockProps = {
  children: ReactNode;
  icon: ReactNode;
  title: string;
};

export function ResultBlock({ children, icon, title }: ResultBlockProps) {
  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-pool/10 text-pool">
          {icon}
        </span>
        <h3 className="text-base font-bold">{title}</h3>
      </div>
      {children}
    </section>
  );
}
