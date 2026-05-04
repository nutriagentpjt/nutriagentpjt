import { Suspense } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { MainLayout } from '@/layouts';
import { ProtectedRoute } from './ProtectedRoute';
import NotFoundPage from '@/pages/NotFoundPage';
import HomePage from '@/pages/HomePage';
import AIAgentPage from '@/pages/AIAgentPage';
import ProfilePage from '@/pages/ProfilePage';
import StatsPage from '@/pages/StatsPage';
import { FoodSearchPage, ImageUploadPage, MealSavePage } from '@/pages/MealRecording';
import { DailyMealViewPage } from '@/pages/MealView';
import { RecommendationPage, SettingsPage } from '@/pages/Recommendation';
import { GoalSettingPage, TDEECalculatorPage, WelcomePage } from '@/pages/Onboarding';
import { MyPage } from '@/pages/MyPage';

function withSuspense(element: ReactNode) {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">불러오는 중...</div>}>
      {element}
    </Suspense>
  );
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
        element: withSuspense(<HomePage />),
      },
      {
        path: ROUTES.MEAL_SEARCH.slice(1),
        element: withSuspense(<FoodSearchPage />),
      },
      {
        path: ROUTES.MEAL_UPLOAD.slice(1),
        element: withSuspense(<ImageUploadPage />),
      },
      {
        path: ROUTES.MEAL_SAVE.slice(1),
        element: withSuspense(<MealSavePage />),
      },
      {
        path: ROUTES.MEAL_VIEW.slice(1),
        element: withSuspense(<DailyMealViewPage />),
      },
      {
        path: ROUTES.RECOMMENDATION.slice(1),
        element: withSuspense(<RecommendationPage />),
      },
      {
        path: ROUTES.RECOMMENDATION_SETTINGS.slice(1),
        element: withSuspense(<SettingsPage />),
      },
      {
        path: ROUTES.MYPAGE.slice(1),
        element: withSuspense(<MyPage />),
      },
      {
        path: ROUTES.LEGACY_AI_AGENT.slice(1),
        element: withSuspense(<AIAgentPage />),
      },
      {
        path: ROUTES.LEGACY_STATS.slice(1),
        element: withSuspense(<StatsPage />),
      },
      {
        path: ROUTES.LEGACY_PROFILE.slice(1),
        element: withSuspense(<ProfilePage />),
      },
    ],
  },
  {
    path: ROUTES.ONBOARDING_WELCOME,
    element: withSuspense(<WelcomePage />),
  },
  {
    path: ROUTES.ONBOARDING_TDEE,
    element: withSuspense(<TDEECalculatorPage />),
  },
  {
    path: ROUTES.ONBOARDING_GOAL,
    element: withSuspense(<GoalSettingPage />),
  },
  { path: '*', element: <NotFoundPage /> },
]);
