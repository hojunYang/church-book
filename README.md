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

## 명령어

```bash
npm test
npm run typecheck
npm run build
```

PostgreSQL 격리 테스트는 운영 DB와 분리된 `TEST_DATABASE_URL`이 있을 때만 실행됩니다.

## 외부 서버에서 Docker로 실행

```bash
cp .env.docker.example .env.docker
# .env.docker의 POSTGRES_PASSWORD를 반드시 변경
docker compose --env-file .env.docker up -d --build
```

앱은 서버 내부의 `http://127.0.0.1:3000`에서 실행되며 Nginx 또는 Caddy를 통해 외부에 공개합니다. 데이터는 Docker의 `postgres_data` 볼륨에 보존됩니다.

```bash
docker compose --env-file .env.docker logs -f app
docker compose --env-file .env.docker down
```

도메인과 HTTPS는 서버의 Nginx 또는 Caddy에서 연결하고, 실시간 SSE가 동작하도록 프록시 버퍼링을 끕니다. PostgreSQL 포트는 외부에 공개하지 않습니다.
