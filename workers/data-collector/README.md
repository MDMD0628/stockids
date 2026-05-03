# 데이터 수집 관리자 Worker

주린이 번역기와 분리된 표현 수집/검수용 Cloudflare Worker MVP입니다.

- API 키나 원문 URL, 작성자명, 닉네임, 프로필은 저장하지 않는 설계를 기본으로 합니다.
- 원문은 관리자가 붙여넣은 텍스트만 저장하고, 중복 확인용 `text_hash`를 함께 저장합니다.
- DB는 SQLite 호환 스키마(`schema.sql`)로 시작하며 Cloudflare D1 binding으로 옮기기 쉽게 `prepare().bind().run()` 형태의 어댑터를 사용합니다.
- AI 분석은 `src/ai/analyzer.ts`의 추상화 함수를 통과합니다. 현재 MVP는 휴리스틱 mock 분석기만 포함합니다.

예상 D1 binding 이름:

```toml
[[d1_databases]]
binding = "DB"
database_name = "stockids-expression-collector"
database_id = "replace-with-d1-id"
```

API:

- `POST /api/admin/analyze`
- `GET /api/admin/candidates`
- `PATCH /api/admin/candidates/:id`
- `GET /api/admin/approved`
- `GET /api/admin/categories`
