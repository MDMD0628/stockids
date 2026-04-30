import { translateWithMock } from "../../src/lib/mockTranslator";
import type { RiskProfile } from "../../src/lib/types";

type TranslateRequest = {
  input?: string;
  profile?: RiskProfile;
};

const isRiskProfile = (value: unknown): value is RiskProfile =>
  value === "balanced" || value === "conservative" || value === "aggressive";

export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    const payload = (await request.json()) as TranslateRequest;
    const input = typeof payload.input === "string" ? payload.input : "";
    const profile = isRiskProfile(payload.profile) ? payload.profile : "balanced";
    const translated = translateWithMock(input, profile);

    return Response.json(translated, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { message: "요청 본문을 확인해 주세요." },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
};
