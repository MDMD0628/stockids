import type { LearningSuggestion } from "./learning";

const STORAGE_KEY = "stockids.savedSuggestions.v1";

export type SuggestionStatus =
  | "new"
  | "backlog"
  | "planned"
  | "applied"
  | "ignored";

export type SavedSuggestion = {
  id: string;
  suggestionId: string;
  type: "add_phrase" | "create_rule" | "adjust_threshold";
  title: string;
  description: string;
  confidence: number;
  examples: string[];
  targetRuleId?: string;
  suggestedPhrases?: string[];
  suggestedIndicators?: string[];
  suggestedConditionHints?: string[];
  codexPrompt: string;
  status: SuggestionStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

const getStorage = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const writeSavedSuggestions = (suggestions: SavedSuggestion[]) => {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(suggestions));
};

export function getSavedSuggestions(): SavedSuggestion[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const rawSuggestions = storage.getItem(STORAGE_KEY);

  if (!rawSuggestions) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawSuggestions);
    return Array.isArray(parsed) ? (parsed as SavedSuggestion[]) : [];
  } catch {
    return [];
  }
}

export function saveSuggestion(suggestion: LearningSuggestion): SavedSuggestion {
  const now = new Date().toISOString();
  const savedSuggestions = getSavedSuggestions();
  const existingSuggestion = savedSuggestions.find(
    (item) => item.suggestionId === suggestion.id,
  );

  if (existingSuggestion) {
    const updatedSuggestion = {
      ...existingSuggestion,
      updatedAt: now,
    };
    writeSavedSuggestions(
      savedSuggestions.map((item) =>
        item.id === existingSuggestion.id ? updatedSuggestion : item,
      ),
    );
    return updatedSuggestion;
  }

  const savedSuggestion: SavedSuggestion = {
    id: `saved-${suggestion.id}`,
    suggestionId: suggestion.id,
    type: suggestion.type,
    title: suggestion.title,
    description: suggestion.description,
    confidence: suggestion.confidence,
    examples: suggestion.examples,
    targetRuleId: suggestion.targetRuleId,
    suggestedPhrases: suggestion.suggestedPhrases,
    suggestedIndicators: suggestion.suggestedIndicators,
    suggestedConditionHints: suggestion.suggestedConditionHints,
    codexPrompt: suggestion.codexPrompt,
    status: "new",
    createdAt: now,
    updatedAt: now,
  };

  writeSavedSuggestions([savedSuggestion, ...savedSuggestions]);
  return savedSuggestion;
}

export function updateSuggestionStatus(
  id: string,
  status: SuggestionStatus,
): SavedSuggestion[] {
  const now = new Date().toISOString();
  const updatedSuggestions = getSavedSuggestions().map((suggestion) =>
    suggestion.id === id ? { ...suggestion, status, updatedAt: now } : suggestion,
  );

  writeSavedSuggestions(updatedSuggestions);
  return updatedSuggestions;
}

export function updateSuggestionNote(
  id: string,
  note: string,
): SavedSuggestion[] {
  const now = new Date().toISOString();
  const updatedSuggestions = getSavedSuggestions().map((suggestion) =>
    suggestion.id === id
      ? { ...suggestion, note: note.trim() || undefined, updatedAt: now }
      : suggestion,
  );

  writeSavedSuggestions(updatedSuggestions);
  return updatedSuggestions;
}

export function deleteSavedSuggestion(id: string): SavedSuggestion[] {
  const updatedSuggestions = getSavedSuggestions().filter(
    (suggestion) => suggestion.id !== id,
  );

  writeSavedSuggestions(updatedSuggestions);
  return updatedSuggestions;
}
