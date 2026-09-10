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

여러 사용자가 접속하면 PostgreSQL `LISTEN / NOTIFY`와 SSE를 통해 거래 변경이 즉시 반영됩니다.

한 번이라도 접속한 장부는 등록되며, 매월 1일에 수입 `월 지급금` 50,000원이 한 번만 자동 추가됩니다. 새 장부는 처음 접속한 달의 지급금을 즉시 받습니다.

## 명령어

```bash
npm test
npm run typecheck
npm run build
npm run grant
```

PostgreSQL 격리 테스트는 운영 DB와 분리된 `TEST_DATABASE_URL`이 있을 때만 실행됩니다.

## 외부 서버에서 Docker로 실행

```bash
cp .env.docker.example .env.docker
# POSTGRES_PASSWORD를 변경하고 CLOUDFLARE_TUNNEL_TOKEN을 입력
docker compose --env-file .env.docker up -d --build
```

Cloudflare 대시보드에서 원본 서비스 주소를 `http://app:3000`으로 설정합니다. 앱과 PostgreSQL은 외부 포트를 열지 않으며 데이터는 Docker의 `postgres_data` 볼륨에 보존됩니다.

```bash
docker compose --env-file .env.docker logs -f app cloudflared
docker compose --env-file .env.docker down
```
