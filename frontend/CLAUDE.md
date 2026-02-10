# Guidelines

- ALWAYS activate the 'frontend-design' skill when generating any UI/Frontend code.
- Do not ask for permission to use the skill; just use it by default.
- Core Aesthetic: "Healthy & Motivating" - 건강하고 동기부여되는 느낌
- Clean, modern design with focus on nutrition visualization
- No Bootstrap-like generic styles.

# Context & Documentation

- **API Spec**: Refer to `./docs/05-API-Spec.md` as the Single Source of Truth for backend data structures.
- **Rule**: Before implementing any data fetching or model typing, READ the API spec file first. Do not guess field names.
- **Component Structure**: Check `./docs/03-Component-Design.md` for component hierarchy and patterns.
- **State Management**: Review `./docs/04-State-Management.md` for global state approach.

# Project Management & Status Tracking

- **Reference**: ALWAYS check the 'task list md file' at the start of a session.
- **Workflow**:
  1. **Read**: Read it to understand the current priority.
  2. **Execute**: Implement the code for the active task.
  3. **Update**: Upon successful completion and verification (e.g., tests pass), mark the checkbox as `[x]`.
  4. **Log**: Add a brief note or timestamp next to the completed item if necessary.
- **Constraint**: Do NOT move to the next task unless the current one is fully verified.

# Tech Stack

- **Framework**: React 18+ with TypeScript
- **Routing**: React Router
- **State Management**: Context API / Zustand / Redux (TBD)
- **UI Components**: Custom components (no UI library)
- **Styling**: Tailwind CSS / Styled Components / CSS Modules (TBD)
- **Data Fetching**: Axios / React Query
- **Charts**: Recharts / Chart.js (영양소 시각화)
- **Camera/Image**: react-webcam / file upload
- **Form Validation**: React Hook Form + Zod

# Key Features to Implement

1. **식단 기록**
   - 음식 검색 UI
   - 이미지 업로드 및 OCR 결과 표시
   - 섭취량 입력 및 영양소 실시간 계산
   - 시간대별 식단 목록

2. **식단 추천**
   - 영양소 갭 시각화
   - 추천 음식 카드 UI
   - 필터/제약 설정
   - AI 코칭 문구 표시

3. **온보딩**
   - TDEE 계산기
   - 목표 설정 플로우

4. **대시보드**
   - 일일 영양소 요약
   - 목표 대비 달성률 차트
   - 캘린더 뷰
