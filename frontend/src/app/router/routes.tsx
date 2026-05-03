import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { MainLayout } from '@/layouts';
import { ProtectedRoute } from './ProtectedRoute';
import NotFoundPage from '@/pages/NotFoundPage';
import PlaceholderPage from '@/pages/PlaceholderPage';

function withSuspense(element: ReactNode) {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">불러오는 중...</div>}>
      {element}
    </Suspense>
  );
}

function createPlaceholder(title: string, description: string) {
  return <PlaceholderPage title={title} description={description} />;
}

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: createPlaceholder('홈 화면', '홈 화면 기능은 후속 PR에서 추가됩니다.'),
      },
      {
        path: ROUTES.MEAL_SEARCH.slice(1),
        element: withSuspense(createPlaceholder('식단 검색', '식단 검색 기능은 후속 PR에서 추가됩니다.')),
      },
      {
        path: ROUTES.MEAL_UPLOAD.slice(1),
        element: withSuspense(createPlaceholder('이미지 업로드', '이미지 업로드 기능은 후속 PR에서 추가됩니다.')),
      },
      {
        path: ROUTES.MEAL_SAVE.slice(1),
        element: withSuspense(createPlaceholder('식단 저장', '식단 저장 기능은 후속 PR에서 추가됩니다.')),
      },
      {
        path: ROUTES.MEAL_VIEW.slice(1),
        element: withSuspense(createPlaceholder('식단 보기', '식단 보기 기능은 후속 PR에서 추가됩니다.')),
      },
      {
        path: ROUTES.RECOMMENDATION.slice(1),
        element: withSuspense(createPlaceholder('추천 식단', '추천 식단 기능은 후속 PR에서 추가됩니다.')),
      },
      {
        path: ROUTES.RECOMMENDATION_SETTINGS.slice(1),
        element: withSuspense(createPlaceholder('추천 설정', '추천 설정 기능은 후속 PR에서 추가됩니다.')),
      },
      {
        path: ROUTES.MYPAGE.slice(1),
        element: withSuspense(createPlaceholder('마이페이지', '마이페이지 기능은 후속 PR에서 추가됩니다.')),
      },
      {
        path: ROUTES.LEGACY_AI_AGENT.slice(1),
        element: withSuspense(createPlaceholder('AI 어시스턴트', 'AI 어시스턴트 기능은 후속 PR에서 추가됩니다.')),
      },
      {
        path: ROUTES.LEGACY_STATS.slice(1),
        element: withSuspense(createPlaceholder('통계', '통계 기능은 후속 PR에서 추가됩니다.')),
      },
      {
        path: ROUTES.LEGACY_PROFILE.slice(1),
        element: withSuspense(createPlaceholder('프로필', '프로필 기능은 후속 PR에서 추가됩니다.')),
      },
    ],
  },
  {
    path: ROUTES.ONBOARDING_WELCOME,
    element: createPlaceholder('온보딩', '온보딩 화면은 후속 PR에서 추가됩니다.'),
  },
  {
    path: ROUTES.ONBOARDING_TDEE,
    element: createPlaceholder('TDEE 계산', 'TDEE 계산 화면은 후속 PR에서 추가됩니다.'),
  },
  {
    path: ROUTES.ONBOARDING_GOAL,
    element: createPlaceholder('목표 설정', '목표 설정 화면은 후속 PR에서 추가됩니다.'),
  },
  { path: '*', element: <NotFoundPage /> },
]);
