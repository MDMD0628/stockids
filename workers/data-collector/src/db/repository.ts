import {
  expressionCategories,
  isExpressionCategoryId,
  type ApprovedExpression,
  type CandidateReviewPatch,
  type CandidateStatus,
  type ExpressionCandidate,
  type RawItem,
  type SourceLog,
} from "../../../../packages/shared/src/collectorTypes";
import type { SqlDatabase } from "./sql";

type CandidateRow = {
  id: string;
  raw_item_id: string;
  phrase: string;
  category_id: string;
  meaning: string;
  possible_conditions_json: string;
  confidence: number;
  status: CandidateStatus;
  reviewer_note?: string | null;
  created_at: string;
  updated_at: string;
};

type ApprovedRow = {
  id: string;
  candidate_id?: string | null;
  phrase: string;
  category_id: string;
  meaning: string;
  conditions_json: string;
  confidence: number;
  created_at: string;
  updated_at: string;
};

export type CreateCandidateInput = Omit<
  ExpressionCandidate,
  "id" | "status" | "reviewerNote" | "createdAt" | "updatedAt"
>;

export type CollectorRepository = {
  createRawItem: (item: RawItem) => Promise<RawItem>;
  createCandidates: (
    candidates: CreateCandidateInput[],
  ) => Promise<ExpressionCandidate[]>;
  listCandidates: (status?: CandidateStatus) => Promise<ExpressionCandidate[]>;
  updateCandidate: (
    id: string,
    patch: CandidateReviewPatch,
  ) => Promise<ExpressionCandidate | null>;
  approveCandidate: (
    candidate: ExpressionCandidate,
  ) => Promise<ApprovedExpression>;
  listApprovedExpressions: () => Promise<ApprovedExpression[]>;
  createSourceLog: (log: SourceLog) => Promise<SourceLog>;
};

const nowIso = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

const parseJsonList = (value: string) => {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const mapCandidateRow = (row: CandidateRow): ExpressionCandidate => ({
  id: row.id,
  rawItemId: row.raw_item_id,
  phrase: row.phrase,
  category: isExpressionCategoryId(row.category_id) ? row.category_id : "other",
  meaning: row.meaning,
  possibleConditions: parseJsonList(row.possible_conditions_json),
  confidence: row.confidence,
  status: row.status,
  reviewerNote: row.reviewer_note ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapApprovedRow = (row: ApprovedRow): ApprovedExpression => ({
  id: row.id,
  candidateId: row.candidate_id ?? undefined,
  phrase: row.phrase,
  category: isExpressionCategoryId(row.category_id) ? row.category_id : "other",
  meaning: row.meaning,
  conditions: parseJsonList(row.conditions_json),
  confidence: row.confidence,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class D1CollectorRepository implements CollectorRepository {
  constructor(private readonly db: SqlDatabase) {}

  async createRawItem(item: RawItem) {
    await this.db
      .prepare(
        `INSERT INTO raw_items
          (id, raw_text, normalized_text, text_hash, source_type, privacy_note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        item.id,
        item.rawText,
        item.normalizedText,
        item.textHash,
        item.sourceType,
        item.privacyNote,
        item.createdAt,
      )
      .run();

    return item;
  }

  async createCandidates(candidates: CreateCandidateInput[]) {
    const createdAt = nowIso();
    const created: ExpressionCandidate[] = [];

    for (const candidate of candidates) {
      const item: ExpressionCandidate = {
        ...candidate,
        id: newId(),
        status: "pending",
        createdAt,
        updatedAt: createdAt,
      };

      await this.db
        .prepare(
          `INSERT INTO expression_candidates
            (id, raw_item_id, phrase, category_id, meaning, possible_conditions_json,
             confidence, status, reviewer_note, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          item.id,
          item.rawItemId,
          item.phrase,
          item.category,
          item.meaning,
          JSON.stringify(item.possibleConditions),
          item.confidence,
          item.status,
          item.reviewerNote ?? null,
          item.createdAt,
          item.updatedAt,
        )
        .run();

      created.push(item);
    }

    return created;
  }

  async listCandidates(status?: CandidateStatus) {
    const query = status
      ? `SELECT * FROM expression_candidates
         WHERE status = ?
         ORDER BY created_at DESC
         LIMIT 100`
      : `SELECT * FROM expression_candidates
         ORDER BY created_at DESC
         LIMIT 100`;
    const statement = status
      ? this.db.prepare(query).bind(status)
      : this.db.prepare(query);
    const { results = [] } = await statement.all<CandidateRow>();
    return results.map(mapCandidateRow);
  }

  async updateCandidate(id: string, patch: CandidateReviewPatch) {
    const existing = await this.db
      .prepare(`SELECT * FROM expression_candidates WHERE id = ?`)
      .bind(id)
      .first<CandidateRow>();

    if (!existing) {
      return null;
    }

    const next = {
      ...mapCandidateRow(existing),
      phrase: patch.phrase ?? existing.phrase,
      category: patch.category ?? mapCandidateRow(existing).category,
      meaning: patch.meaning ?? existing.meaning,
      possibleConditions:
        patch.possibleConditions ?? parseJsonList(existing.possible_conditions_json),
      status: patch.status,
      reviewerNote: patch.reviewerNote,
      updatedAt: nowIso(),
    };

    await this.db
      .prepare(
        `UPDATE expression_candidates
         SET phrase = ?,
             category_id = ?,
             meaning = ?,
             possible_conditions_json = ?,
             status = ?,
             reviewer_note = ?,
             updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        next.phrase,
        next.category,
        next.meaning,
        JSON.stringify(next.possibleConditions),
        next.status,
        next.reviewerNote ?? null,
        next.updatedAt,
        id,
      )
      .run();

    return next;
  }

  async approveCandidate(candidate: ExpressionCandidate) {
    const approved: ApprovedExpression = {
      id: newId(),
      candidateId: candidate.id,
      phrase: candidate.phrase,
      category: candidate.category,
      meaning: candidate.meaning,
      conditions: candidate.possibleConditions,
      confidence: candidate.confidence,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    await this.db
      .prepare(
        `INSERT INTO approved_expressions
          (id, candidate_id, phrase, category_id, meaning, conditions_json,
           confidence, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        approved.id,
        approved.candidateId ?? null,
        approved.phrase,
        approved.category,
        approved.meaning,
        JSON.stringify(approved.conditions),
        approved.confidence,
        approved.createdAt,
        approved.updatedAt,
      )
      .run();

    return approved;
  }

  async listApprovedExpressions() {
    const { results = [] } = await this.db
      .prepare(
        `SELECT * FROM approved_expressions
         ORDER BY created_at DESC
         LIMIT 200`,
      )
      .all<ApprovedRow>();
    return results.map(mapApprovedRow);
  }

  async createSourceLog(log: SourceLog) {
    await this.db
      .prepare(
        `INSERT INTO source_logs
          (id, raw_item_id, source_type, text_hash, action, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        log.id,
        log.rawItemId ?? null,
        log.sourceType,
        log.textHash,
        log.action,
        log.createdAt,
      )
      .run();

    return log;
  }
}

export class MemoryCollectorRepository implements CollectorRepository {
  private rawItems: RawItem[] = [];
  private candidates: ExpressionCandidate[] = [];
  private approved: ApprovedExpression[] = [];
  private logs: SourceLog[] = [];

  async createRawItem(item: RawItem) {
    this.rawItems.unshift(item);
    return item;
  }

  async createCandidates(candidates: CreateCandidateInput[]) {
    const createdAt = nowIso();
    const created = candidates.map<ExpressionCandidate>((candidate) => ({
      ...candidate,
      id: newId(),
      status: "pending",
      createdAt,
      updatedAt: createdAt,
    }));
    this.candidates.unshift(...created);
    return created;
  }

  async listCandidates(status?: CandidateStatus) {
    return this.candidates
      .filter((candidate) => !status || candidate.status === status)
      .slice(0, 100);
  }

  async updateCandidate(id: string, patch: CandidateReviewPatch) {
    const index = this.candidates.findIndex((candidate) => candidate.id === id);

    if (index < 0) {
      return null;
    }

    const next: ExpressionCandidate = {
      ...this.candidates[index],
      phrase: patch.phrase ?? this.candidates[index].phrase,
      category: patch.category ?? this.candidates[index].category,
      meaning: patch.meaning ?? this.candidates[index].meaning,
      possibleConditions:
        patch.possibleConditions ?? this.candidates[index].possibleConditions,
      status: patch.status,
      reviewerNote: patch.reviewerNote,
      updatedAt: nowIso(),
    };
    this.candidates[index] = next;
    return next;
  }

  async approveCandidate(candidate: ExpressionCandidate) {
    const approved: ApprovedExpression = {
      id: newId(),
      candidateId: candidate.id,
      phrase: candidate.phrase,
      category: candidate.category,
      meaning: candidate.meaning,
      conditions: candidate.possibleConditions,
      confidence: candidate.confidence,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.approved.unshift(approved);
    return approved;
  }

  async listApprovedExpressions() {
    return this.approved.slice(0, 200);
  }

  async createSourceLog(log: SourceLog) {
    this.logs.unshift(log);
    return log;
  }
}

export const seedCategoriesSql = expressionCategories.map((category, index) => ({
  id: category.id,
  label: category.label,
  description: category.description,
  sortOrder: index + 1,
}));
