# 서버 배포 체크리스트

## 1. 환경 변수 설정

`.env`는 gitignore 처리되어 있으므로 서버에서 직접 생성.

```bash
# 프로젝트 루트 (docker-compose.yml 위치)
cat > .env << EOF
POSTGRES_DB=NutriAgent
POSTGRES_USER=<변경 필요>
POSTGRES_PASSWORD=<강력한 패스워드>
INTERNAL_API_KEY=<랜덤 시크릿 키>
EOF
```

FastAPI는 `AWS Bedrock` 사용 → IAM 인증 필요:
```bash
# EC2라면 IAM Role 부여 권장 (키 하드코딩 금지)
# 로컬 키 방식이라면
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=us-east-1   # Bedrock 모델 지원 리전 확인
```

> `BEDROCK_MODEL_ID`는 `anthropic.claude-sonnet-4-20250514` — 해당 리전에서 모델 접근 권한 활성화 필요 (Bedrock 콘솔 → Model access)

---

## 2. 음식 데이터 초기화 (최초 1회)

`foods` 테이블은 146,987건의 영양성분 데이터가 필요하며 Git에 포함되지 않음.

```bash
# 로컬에 있는 fooddata_fixed.sql을 서버로 전송
scp fooddata_fixed.sql user@server:/home/user/

# 서버에서 postgres 컨테이너 실행 후 임포트
docker-compose up -d postgres
sleep 10  # postgres 헬스체크 대기

docker exec -i nutriagent-postgres psql -U $POSTGRES_USER -d NutriAgent \
  < /home/user/fooddata_fixed.sql

# 확인
docker exec nutriagent-postgres psql -U $POSTGRES_USER -d NutriAgent \
  -c "SELECT COUNT(*) FROM foods;"
# → 146987
```

> Spring Boot Flyway가 `V0_1__create_spring_tables.sql`로 `foods` 테이블을 미리 생성함.
> dump가 `CREATE TABLE`을 포함하므로 충돌 발생 → 먼저 DROP 후 임포트:
> ```bash
> docker exec nutriagent-postgres psql -U $POSTGRES_USER -d NutriAgent \
>   -c "DROP TABLE IF EXISTS foods CASCADE;"
> docker exec -i nutriagent-postgres psql -U $POSTGRES_USER -d NutriAgent \
>   < /home/user/fooddata_fixed.sql
> # 임포트 후 인덱스 재생성
> docker exec nutriagent-postgres psql -U $POSTGRES_USER -d NutriAgent \
>   -c "CREATE INDEX IF NOT EXISTS idx_food_name ON foods(name);"
> ```

---

## 3. FastAPI Alembic 마이그레이션

`chat_sessions`, `chat_messages`, `user_food_feedback` 테이블은 Alembic이 관리.

```bash
# 전체 스택 기동 후
docker-compose up -d

# FastAPI 컨테이너 안에서 마이그레이션 실행
docker exec nutriagent-fastapi uv run alembic upgrade head
```

> **주의**: `user_food_feedback` 테이블은 Alembic 관리 대상으로 등록되어 있지만
> 마이그레이션 파일이 없음 → FastAPI 팀에서 마이그레이션 파일 추가 필요.
> 없으면 피드백 API 호출 시 오류 발생 (추천 자체는 동작함).

---

## 4. 전체 기동

```bash
cd /path/to/nutriagentpjt
docker-compose up --build -d

# 상태 확인
docker-compose ps
docker logs nutriagent-spring  | tail -5   # "Started OnboardApplication" 확인
docker logs nutriagent-fastapi | tail -5   # uvicorn 기동 확인
```

---

## 5. 배포 후 스모크 테스트

```bash
BASE=http://<서버IP>:8080

# 게스트 세션 발급
curl -c /tmp/c.txt -X POST $BASE/guest/session

# 헬스체크
curl $BASE/actuator/health 2>/dev/null || curl $BASE/guest/session
```

---

## 요약 순서

```
1. .env 파일 생성 (패스워드, INTERNAL_API_KEY, AWS 설정)
2. docker-compose up -d postgres  (postgres 먼저)
3. fooddata_fixed.sql 임포트  (foods 테이블 데이터)
4. docker-compose up --build -d  (전체 기동)
5. docker exec nutriagent-fastapi uv run alembic upgrade head  (채팅 테이블 생성)
6. 스모크 테스트
```
