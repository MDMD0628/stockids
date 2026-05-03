# 주린이 번역기 MVP

자연어 문장을 주식 조건검색 지표로 바꿔 보여주는 React + Tailwind CSS MVP입니다. 실제 종목 데이터 조회는 붙이지 않고, 번역 결과를 `조건검색 참고용`으로만 표시합니다.

## 실행

```bash
npm install
npm run dev
```

PowerShell 실행 정책 때문에 `npm`이 막히면 Windows에서는 `npm.cmd install`, `npm.cmd run dev`를 사용하면 됩니다.

## 구조

- `src/lib/translator.ts`: mock 번역 엔진과 추후 외부 API 연결 지점
- `src/lib/types.ts`: 조건검색 번역 결과 타입
- `functions/api/translate.ts`: Cloudflare Pages Functions용 mock API
- `apps/data-collector-admin`: 표현 수집/검수 관리자 React 앱
- `workers/data-collector`: 표현 분석 관리자 API와 SQLite/D1 스키마
- `packages/shared`: 관리자 앱과 Worker가 공유하는 표현 수집 타입
- `.env.example`: `/api/translate` 연결 예시

## 데이터 수집 관리자

표현 수집 관리자는 주린이 번역기 본 서비스와 분리되어 있습니다. 커뮤니티
문장을 붙여넣으면 표현 후보를 추출하고, 관리자가 카테고리와 조건검색 번역
후보를 검수합니다. 작성자명, 닉네임, 프로필, 원문 URL은 저장하지 않는 운영을
전제로 합니다.

```bash
npm run dev:collector-admin
npm run build:collector-admin
npm run check:collector-worker
```

## Cloudflare Pages

1. GitHub 저장소에 이 프로젝트를 올립니다.
2. Cloudflare Pages에서 해당 저장소를 연결합니다.
3. Build command는 `npm run build`, output directory는 `dist`로 설정합니다.
4. Pages Functions를 함께 쓰려면 환경 변수 `VITE_TRANSLATOR_ENDPOINT`를 `/api/translate`로 설정합니다.

OpenAI API를 붙일 때는 Cloudflare 환경 변수에 서버 전용 키를 두고, 클라이언트에는 키가 노출되지 않도록 `functions/api/translate.ts`에서 호출하도록 바꾸면 됩니다.
