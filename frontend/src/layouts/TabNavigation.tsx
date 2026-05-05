import { Bot, BarChart3, Home, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

const navItems = [
  { label: '홈', path: ROUTES.HOME, icon: Home },
  { label: 'AI 에이전트', path: ROUTES.LEGACY_AI_AGENT, icon: Bot },
  { label: '통계', path: ROUTES.LEGACY_STATS, icon: BarChart3 },
  { label: '프로필', path: ROUTES.LEGACY_PROFILE, icon: User },
] as const;

export function TabNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === ROUTES.HOME) {
      return location.pathname === ROUTES.HOME;
    }

    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[390px] -translate-x-1/2 border-t border-gray-200/50 bg-white/80 backdrop-blur-md shadow-lg">
      <div className="px-5 py-2.5">
        <div className="flex items-center justify-around">
          {navItems.map(({ label, path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              aria-label={label}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all active:scale-95 ${
                isActive(path) ? 'text-green-500' : 'text-gray-400 active:text-gray-600'
              }`}
            >
              <Icon className={`h-5.5 w-5.5 transition-transform ${isActive(path) ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium">{isActive(path) ? label : ''}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
