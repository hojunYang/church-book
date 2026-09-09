# 한달 가계부

영문 ID 링크별로 독립된 수입·지출을 관리하는 모바일 우선 Next.js 가계부입니다.

## 실행

```bash
npm install
cp .env.example .env.local
npm run migrate
npm run dev
```

브라우저에서 `/{영문 ID}`를 엽니다. 예: `/my-church`

ID는 영문 소문자, 숫자, 하이픈만 사용해 3~40자로 입력합니다. 별도 등록이나 DB 마이그레이션 없이 원하는 주소에 접속하면 빈 가계부로 시작하고, 서버가 영문 ID를 고정된 내부 UUID로 변환합니다.

## 명령어

```bash
npm test
npm run typecheck
npm run build
```

PostgreSQL 격리 테스트는 운영 DB와 분리된 `TEST_DATABASE_URL`이 있을 때만 실행됩니다.
