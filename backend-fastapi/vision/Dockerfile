FROM python:3.12-slim

WORKDIR /app

# psycopg 빌드에 libpq-dev, PyTorch OpenMP에 libgomp1 필요
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpq-dev \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# 의존성을 먼저 설치해 코드 변경 시 캐시 재활용
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 앱 코드 복사
COPY app/ ./app/
COPY scripts/ ./scripts/
COPY sql/ ./sql/

# data/ 는 docker-compose 볼륨(bind mount)으로 주입
# - merged_food_db_keyword_avg.csv : git에 포함 → 호스트 경로에서 마운트
# - pgvector_rows.parquet          : 214MB, git 미포함 → EC2에 별도 업로드 후 마운트

EXPOSE 8000

# Readiness probe: /health/ready 가 200이 될 때까지 unhealthy
# --start-period=120s: DINOv2 최초 다운로드(~330MB)를 감안한 넉넉한 준비 시간
# docker-compose 의 vision-api depends_on condition: service_healthy 와 연동된다.
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/ready', timeout=8)" || exit 1

# 운영: --workers 2 (워커당 DINOv2 ~330MB RAM 사용)
# 워커 수는 .env의 VISION_WORKERS 로 조정 가능
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${VISION_WORKERS:-2}"]
