import { Gauge, Shield, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RiskProfile } from "../lib/types";

export type ProfileOption = {
  id: RiskProfile;
  label: string;
  caption: string;
  icon: LucideIcon;
};

export const profileOptions: ProfileOption[] = [
  {
    id: "conservative",
    label: "보수적",
    caption: "규모와 흔들림 제한 강화",
    icon: Shield,
  },
  {
    id: "balanced",
    label: "균형",
    caption: "유동성, 추세, 위험 균형",
    icon: Gauge,
  },
  {
    id: "aggressive",
    label: "공격적",
    caption: "활성도와 민감도 확대",
    icon: Zap,
  },
];

type ProfileSelectorProps = {
  profile: RiskProfile;
  onChange: (profile: RiskProfile) => void;
};

export function ProfileSelector({ profile, onChange }: ProfileSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {profileOptions.map((option) => {
        const Icon = option.icon;
        const isActive = option.id === profile;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={isActive}
            title={option.caption}
            className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-lg border px-2 text-center text-sm font-bold transition ${
              isActive
                ? "border-pine bg-pine text-white"
                : "border-ink/10 bg-white text-ink hover:border-pool hover:text-pool"
            }`}
          >
            <Icon size={18} aria-hidden="true" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
