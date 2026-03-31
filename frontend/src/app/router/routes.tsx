import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { MainLayout } from '@/layouts';
import { ProtectedRoute } from './ProtectedRoute';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { GoalSettingPage, TDEECalculatorPage, WelcomePage } from '@/pages/Onboarding';

const AIAgentPage = lazy(() => import('@/pages/AIAgentPage'));
const StatsPage = lazy(() => import('@/pages/StatsPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const FoodSearchPage = lazy(() => import('@/pages/MealRecording/FoodSearchPage'));
const ImageUploadPage = lazy(() => import('@/pages/MealRecording/ImageUploadPage'));
const MealSavePage = lazy(() => import('@/pages/MealRecording/MealSavePage'));
const DailyMealViewPage = lazy(() => import('@/pages/MealView/DailyMealViewPage'));
const RecommendationPage = lazy(() => import('@/pages/Recommendation/RecommendationPage'));
const SettingsPage = lazy(() => import('@/pages/Recommendation/SettingsPage'));
const MyPage = lazy(() => import('@/pages/MyPage/MyPage'));

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
      { index: true, element: <HomePage /> },
      { path: ROUTES.MEAL_SEARCH.slice(1), element: withSuspense(<FoodSearchPage />) },
      { path: ROUTES.MEAL_UPLOAD.slice(1), element: withSuspense(<ImageUploadPage />) },
      { path: ROUTES.MEAL_SAVE.slice(1), element: withSuspense(<MealSavePage />) },
      { path: ROUTES.MEAL_VIEW.slice(1), element: withSuspense(<DailyMealViewPage />) },
      { path: ROUTES.RECOMMENDATION.slice(1), element: withSuspense(<RecommendationPage />) },
      {
        path: ROUTES.RECOMMENDATION_SETTINGS.slice(1),
        element: withSuspense(<SettingsPage />),
      },
      { path: ROUTES.MYPAGE.slice(1), element: withSuspense(<MyPage />) },
      { path: ROUTES.LEGACY_AI_AGENT.slice(1), element: withSuspense(<AIAgentPage />) },
      { path: ROUTES.LEGACY_STATS.slice(1), element: withSuspense(<StatsPage />) },
      { path: ROUTES.LEGACY_PROFILE.slice(1), element: withSuspense(<ProfilePage />) },
    ],
  },
  { path: ROUTES.ONBOARDING_WELCOME, element: <WelcomePage /> },
  { path: ROUTES.ONBOARDING_TDEE, element: <TDEECalculatorPage /> },
  { path: ROUTES.ONBOARDING_GOAL, element: <GoalSettingPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
