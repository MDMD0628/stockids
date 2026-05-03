import type {
  ApprovedExpression,
  ExpressionCandidate,
} from "../../../packages/shared/src/collectorTypes";

const CANDIDATES_KEY = "stockids.collectorAdmin.candidates.v1";
const APPROVED_KEY = "stockids.collectorAdmin.approved.v1";

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const loadCandidates = () =>
  readJson<ExpressionCandidate[]>(CANDIDATES_KEY, []);

export const saveCandidates = (candidates: ExpressionCandidate[]) => {
  localStorage.setItem(CANDIDATES_KEY, JSON.stringify(candidates));
};

export const loadApprovedExpressions = () =>
  readJson<ApprovedExpression[]>(APPROVED_KEY, []);

export const saveApprovedExpressions = (approved: ApprovedExpression[]) => {
  localStorage.setItem(APPROVED_KEY, JSON.stringify(approved));
};
