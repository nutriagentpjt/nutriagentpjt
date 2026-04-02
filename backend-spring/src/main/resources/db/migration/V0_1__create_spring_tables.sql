-- Spring Boot 관리 테이블 초기 스키마
-- Hibernate ddl-auto=none 이므로 Flyway가 직접 생성

CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    guest_id      VARCHAR(255) NOT NULL UNIQUE,
    created_at    TIMESTAMP    NOT NULL,
    last_accessed_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id                   BIGSERIAL PRIMARY KEY,
    user_id              BIGINT       NOT NULL UNIQUE REFERENCES users(id),
    age                  INTEGER      NOT NULL,
    gender               VARCHAR(10)  NOT NULL,
    height               DOUBLE PRECISION NOT NULL,
    weight               DOUBLE PRECISION NOT NULL,
    health_goal          VARCHAR(30)  NOT NULL,
    activity_level       VARCHAR(30)  NOT NULL,
    exercise_frequency   INTEGER      NOT NULL,
    exercise_time        VARCHAR(20),
    diseases             JSONB,
    onboarding_completed BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at           TIMESTAMP    NOT NULL,
    updated_at           TIMESTAMP    NOT NULL
);

CREATE TABLE IF NOT EXISTS dietary_preferences (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT      NOT NULL UNIQUE REFERENCES users(id),
    meal_pattern    VARCHAR(30) NOT NULL,
    preferred_foods JSONB,
    disliked_foods  JSONB,
    allergies       JSONB,
    diet_styles     JSONB,
    water_intake_goal DOUBLE PRECISION,
    constraints     JSONB,
    updated_at      TIMESTAMP   NOT NULL
);

CREATE TABLE IF NOT EXISTS nutrition_targets (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT           NOT NULL UNIQUE REFERENCES users(id),
    calories        DOUBLE PRECISION NOT NULL,
    protein         DOUBLE PRECISION NOT NULL,
    carbs           DOUBLE PRECISION NOT NULL,
    fat             DOUBLE PRECISION NOT NULL,
    bmr             DOUBLE PRECISION,
    tdee            DOUBLE PRECISION,
    manual_override BOOLEAN          NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP        NOT NULL,
    updated_at      TIMESTAMP        NOT NULL
);

CREATE TABLE IF NOT EXISTS foods (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100),
    category      VARCHAR(100),
    weight        DOUBLE PRECISION,
    calories      INTEGER,
    protein       DOUBLE PRECISION,
    carbs         DOUBLE PRECISION,
    fat           DOUBLE PRECISION,
    sodium        DOUBLE PRECISION,
    saturated_fat DOUBLE PRECISION,
    sugar         DOUBLE PRECISION,
    dietary_fiber DOUBLE PRECISION,
    potassium     DOUBLE PRECISION,
    purine_level  VARCHAR(10),
    iodine        DOUBLE PRECISION,
    selenium      DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS meals (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT           NOT NULL REFERENCES users(id),
    food_name  VARCHAR(255)     NOT NULL,
    amount     DOUBLE PRECISION NOT NULL,
    calories   DOUBLE PRECISION NOT NULL,
    protein    DOUBLE PRECISION,
    carbs      DOUBLE PRECISION,
    fat        DOUBLE PRECISION,
    meal_type  VARCHAR(20)      NOT NULL,
    date       DATE             NOT NULL,
    source     VARCHAR(20),
    set_id     VARCHAR(36),
    created_at TIMESTAMP        NOT NULL,
    updated_at TIMESTAMP        NOT NULL
);
