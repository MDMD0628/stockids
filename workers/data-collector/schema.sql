CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO categories (id, label, description, sort_order) VALUES
  ('trend_chart', '추세/차트 흐름', '차트 모양, 추세 유지, 흐름 변화와 관련된 표현', 1),
  ('volume_attention', '거래량/거래대금/관심 증가', '거래 증가, 시장 관심, 거래대금 변화와 관련된 표현', 2),
  ('volatility_risk', '변동성/위험 회피', '큰 흔들림, 과열, 위험 신호를 줄이고 싶은 표현', 3),
  ('earnings_value', '실적/가치', '매출, 이익, 밸류 부담, 회사 기본기와 관련된 표현', 4),
  ('supply_institution_foreign', '수급/기관/외국인', '기관, 외국인, 프로그램, 수급 흐름과 관련된 표현', 5),
  ('theme_news_issue', '테마/뉴스/이슈', '뉴스, 테마, 재료, 이슈성 움직임과 관련된 표현', 6),
  ('entry_timing_question', '매수 타이밍 고민', '진입 시점 고민을 조건검색 언어로 바꾸기 위한 표현', 7),
  ('exit_stop_question', '매도/손절 고민', '이탈, 정리, 위험 관리 고민을 조건검색 언어로 바꾸기 위한 표현', 8),
  ('other', '기타', '아직 명확한 분류가 어려운 표현', 9);

CREATE TABLE IF NOT EXISTS raw_items (
  id TEXT PRIMARY KEY,
  raw_text TEXT NOT NULL,
  normalized_text TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  source_type TEXT NOT NULL,
  privacy_note TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_raw_items_text_hash ON raw_items(text_hash);
CREATE INDEX IF NOT EXISTS idx_raw_items_created_at ON raw_items(created_at);

CREATE TABLE IF NOT EXISTS expression_candidates (
  id TEXT PRIMARY KEY,
  raw_item_id TEXT NOT NULL,
  phrase TEXT NOT NULL,
  category_id TEXT NOT NULL,
  meaning TEXT NOT NULL,
  possible_conditions_json TEXT NOT NULL,
  confidence REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (raw_item_id) REFERENCES raw_items(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_expression_candidates_status
  ON expression_candidates(status);
CREATE INDEX IF NOT EXISTS idx_expression_candidates_category
  ON expression_candidates(category_id);

CREATE TABLE IF NOT EXISTS approved_expressions (
  id TEXT PRIMARY KEY,
  candidate_id TEXT,
  phrase TEXT NOT NULL,
  category_id TEXT NOT NULL,
  meaning TEXT NOT NULL,
  conditions_json TEXT NOT NULL,
  confidence REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (candidate_id) REFERENCES expression_candidates(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_approved_expressions_category
  ON approved_expressions(category_id);

CREATE TABLE IF NOT EXISTS source_logs (
  id TEXT PRIMARY KEY,
  raw_item_id TEXT,
  source_type TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (raw_item_id) REFERENCES raw_items(id)
);

CREATE INDEX IF NOT EXISTS idx_source_logs_text_hash ON source_logs(text_hash);
