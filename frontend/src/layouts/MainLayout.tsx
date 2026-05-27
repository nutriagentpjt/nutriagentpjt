import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { OverlayScrollArea } from '@/components/common/OverlayScrollArea';
import { Header } from './Header';
import { TabNavigation } from './TabNavigation';

const headerTitles: Record<string, string> = {
  '/onboarding/welcome': '온보딩',
  '/onboarding/tdee': '기초 대사량 계산',
  '/onboarding/goal': '목표 설정',
  '/meals/search': '음식 검색',
  '/meals/upload': '이미지 업로드',
  '/meals/save': '식단 저장',
  '/meals': '내 식단',
  '/recommendations': '추천',
  '/recommendations/settings': '추천 설정',
  '/mypage': '마이페이지',
};

export default function MainLayout() {
  const location = useLocation();
  const [useNativeScroll, setUseNativeScroll] = useState(false);

  const headerTitle = useMemo(() => headerTitles[location.pathname], [location.pathname]);
  const isRecommendationOverlay = location.pathname === ROUTES.RECOMMENDATION;
  const hideTabNavigation =
    isRecommendationOverlay ||
    location.pathname === ROUTES.MEAL_UPLOAD ||
    location.pathname === ROUTES.RECOMMENDATION_SETTINGS;
  const hideLayoutHeader =
    isRecommendationOverlay ||
    location.pathname === ROUTES.MEAL_SEARCH ||
    location.pathname === ROUTES.MEAL_UPLOAD ||
    location.pathname === ROUTES.MYPAGE ||
    location.pathname === ROUTES.RECOMMENDATION_SETTINGS;
  const shouldBypassOverlayScroll = location.pathname === ROUTES.LEGACY_AI_AGENT;
  const shouldUseNativeScroll = useNativeScroll && !shouldBypassOverlayScroll;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(pointer: coarse)');
    const update = () => setUseNativeScroll(mediaQuery.matches);

    update();
    mediaQuery.addEventListener?.('change', update);

      return () => {
        mediaQuery.removeEventListener?.('change', update);
      };
  }, []);

  return (
    <div className="flex min-h-screen justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className={`relative flex w-full max-w-[390px] flex-col ${shouldUseNativeScroll ? 'min-h-[100dvh]' : 'h-[100dvh] min-h-0'}`}>
        {!hideLayoutHeader ? <Header title={headerTitle} /> : null}
        {shouldUseNativeScroll || shouldBypassOverlayScroll ? (
          <main className={hideTabNavigation ? 'flex h-0 min-h-0 flex-1 flex-col overflow-hidden' : 'flex h-0 min-h-0 flex-1 flex-col overflow-hidden pb-[68px]'}>
            <Outlet />
          </main>
        ) : (
          <OverlayScrollArea
            className={hideTabNavigation ? 'pb-0' : 'pb-[68px]'}
            containerClassName="flex-1 min-h-0"
            thumbInsetBottom={hideTabNavigation ? 4 : 84}
          >
            <Outlet />
          </OverlayScrollArea>
        )}
        {!hideTabNavigation ? <TabNavigation /> : null}
      </div>
    </div>
  );
}
