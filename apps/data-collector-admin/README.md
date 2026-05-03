# 데이터 수집 관리자 앱

주린이 번역기와 분리된 표현 수집/검수용 React MVP입니다.

- `VITE_COLLECTOR_API_BASE`가 있으면 Worker API를 호출합니다.
- 환경 변수가 없으면 브라우저 localStorage와 mock 분석기로 동작합니다.
- 작성자명, 닉네임, 프로필, 원문 URL을 입력하거나 저장하지 않는 운영을 전제로 합니다.

실행 예시:

```bash
npm run dev:collector-admin
```

빌드 확인:

```bash
npm run build:collector-admin
```
