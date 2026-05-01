import type {
  MachineQuery,
  MatchedPhrase,
  RiskProfile,
  SearchCondition,
} from "./types";

const STORAGE_KEY = "stockids.feedbackRecords.v1";

export type FeedbackValue = "good" | "bad";

export type FeedbackWrongReason =
  | "표현을 인식하지 못함"
  | "조건이 너무 보수적임"
  | "조건이 너무 공격적임"
  | "지표 선택이 어색함"
  | "조건이 너무 많음"
  | "조건이 너무 적음"
  | "직접 입력";

export type FeedbackRecord = {
  id: string;
  input: string;
  profile: RiskProfile;
  resultId: string;
  matchedPhrases: MatchedPhrase[];
  conditions: SearchCondition[];
  machineQueries: MachineQuery[];
  feedback: FeedbackValue;
  wrongReason?: FeedbackWrongReason;
  comment?: string;
  createdAt: string;
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

export function getFeedbackRecords(): FeedbackRecord[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const rawRecords = storage.getItem(STORAGE_KEY);

  if (!rawRecords) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawRecords);
    return Array.isArray(parsed) ? (parsed as FeedbackRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveFeedback(record: FeedbackRecord) {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  const records = getFeedbackRecords();
  storage.setItem(STORAGE_KEY, JSON.stringify([record, ...records]));
}
