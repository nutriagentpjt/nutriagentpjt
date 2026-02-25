import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/layouts';

console.log(MainLayout);

import HomePage from '@/pages/HomePage';
import AIAgentPage from '@/pages/AIAgentPage';
import StatsPage from '@/pages/StatsPage';
import ProfilePage from '@/pages/ProfilePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'ai-agent', element: <AIAgentPage /> },
      { path: 'stats', element: <StatsPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
]);