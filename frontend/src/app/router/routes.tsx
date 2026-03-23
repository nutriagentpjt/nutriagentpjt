import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { MainLayout } from '@/layouts';
import { ProtectedRoute } from './ProtectedRoute';
import HomePage from '@/pages/HomePage';
import AIAgentPage from '@/pages/AIAgentPage';
import StatsPage from '@/pages/StatsPage';
import ProfilePage from '@/pages/ProfilePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { FoodSearchPage, ImageUploadPage, MealSavePage } from '@/pages/MealRecording';
import { DailyMealViewPage } from '@/pages/MealView';
import { RecommendationPage, SettingsPage } from '@/pages/Recommendation';
import { GoalSettingPage, TDEECalculatorPage, WelcomePage } from '@/pages/Onboarding';
import { MyPage } from '@/pages/MyPage';

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
      { path: ROUTES.MEAL_SEARCH.slice(1), element: <FoodSearchPage /> },
      { path: ROUTES.MEAL_UPLOAD.slice(1), element: <ImageUploadPage /> },
      { path: ROUTES.MEAL_SAVE.slice(1), element: <MealSavePage /> },
      { path: ROUTES.MEAL_VIEW.slice(1), element: <DailyMealViewPage /> },
      { path: ROUTES.RECOMMENDATION.slice(1), element: <RecommendationPage /> },
      {
        path: ROUTES.RECOMMENDATION_SETTINGS.slice(1),
        element: <SettingsPage />,
      },
      { path: ROUTES.MYPAGE.slice(1), element: <MyPage /> },
      { path: ROUTES.LEGACY_AI_AGENT.slice(1), element: <AIAgentPage /> },
      { path: ROUTES.LEGACY_STATS.slice(1), element: <StatsPage /> },
      { path: ROUTES.LEGACY_PROFILE.slice(1), element: <ProfilePage /> },
    ],
  },
  { path: ROUTES.ONBOARDING_WELCOME, element: <WelcomePage /> },
  { path: ROUTES.ONBOARDING_TDEE, element: <TDEECalculatorPage /> },
  { path: ROUTES.ONBOARDING_GOAL, element: <GoalSettingPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
