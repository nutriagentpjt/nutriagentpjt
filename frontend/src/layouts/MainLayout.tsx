import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
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
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const headerTitle = useMemo(() => headerTitles[location.pathname], [location.pathname]);

  const handleScroll = () => {
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  const handleMouseEnter = () => {
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsScrolling(false);
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex min-h-screen justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="relative flex h-screen w-full max-w-[390px] flex-col">
        <Header title={headerTitle} />
        <div
          className={`flex-1 overflow-y-auto pb-[68px] transition-all ${
            isScrolling
              ? '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:opacity-100'
              : '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:opacity-0'
          } [&::-webkit-scrollbar-thumb]:transition-opacity [&::-webkit-scrollbar-thumb]:duration-300`}
          onScroll={handleScroll}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Outlet />
        </div>
        <TabNavigation />
      </div>
    </div>
  );
}
