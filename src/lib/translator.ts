import { translateWithMock } from "./mockTranslator";
import type { RiskProfile, TranslationResult } from "./types";

export const translateQuery = async (
  input: string,
  profile: RiskProfile,
): Promise<TranslationResult> => {
  const endpoint = import.meta.env.VITE_TRANSLATOR_ENDPOINT;

  if (endpoint) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input, profile }),
    });

    if (!response.ok) {
      throw new Error("조건식 변환 요청을 처리하지 못했습니다.");
    }

    return response.json();
  }

  await new Promise((resolve) => window.setTimeout(resolve, 350));
  return translateWithMock(input, profile);
};
