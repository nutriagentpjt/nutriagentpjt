import { Outlet, useLocation, useNavigate } from "react-router";
import { Home, Bot, BarChart3, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    setIsScrolling(true);

    // 이전 타이머 취소
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // 1초 후 스크롤바 숨기기
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  // 마우스 호버 이벤트 핸들러
  const handleMouseEnter = () => {
    setIsScrolling(true);
    // 타이머 취소
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    // 마우스가 나가면 즉시 숨김
    setIsScrolling(false);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex justify-center">
      <div className="w-full max-w-[390px] relative flex flex-col h-screen">
        <div
          className={`flex-1 overflow-y-auto pb-[68px] transition-all ${
            isScrolling
              ? "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:opacity-100"
              : "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:opacity-0"
          } [&::-webkit-scrollbar-thumb]:transition-opacity [&::-webkit-scrollbar-thumb]:duration-300`}
          onScroll={handleScroll}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Outlet />
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white/80 backdrop-blur-md border-t border-gray-200/50 z-40 shadow-lg">
          <div className="px-5 py-2.5">
            <div className="flex items-center justify-around">
              <button
                onClick={() => navigate("/")}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 transition-all active:scale-95 ${
                  isActive("/") ? "text-green-500" : "text-gray-400 active:text-gray-600"
                }`}
              >
                <Home className={`w-5.5 h-5.5 transition-transform ${isActive("/") ? "scale-110" : ""}`} />
                <span className="text-[10px] font-medium">{isActive("/") && "홈"}</span>
              </button>
              <button
                onClick={() => navigate("/ai-agent")}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 transition-all active:scale-95 ${
                  isActive("/ai-agent") ? "text-green-500" : "text-gray-400 active:text-gray-600"
                }`}
              >
                <Bot className={`w-5.5 h-5.5 transition-transform ${isActive("/ai-agent") ? "scale-110" : ""}`} />
                <span className="text-[10px] font-medium">{isActive("/ai-agent") && "AI 에이전트"}</span>
              </button>
              <button
                onClick={() => navigate("/stats")}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 transition-all active:scale-95 ${
                  isActive("/stats") ? "text-green-500" : "text-gray-400 active:text-gray-600"
                }`}
              >
                <BarChart3 className={`w-5.5 h-5.5 transition-transform ${isActive("/stats") ? "scale-110" : ""}`} />
                <span className="text-[10px] font-medium">{isActive("/stats") && "통계"}</span>
              </button>
              <button
                onClick={() => navigate("/profile")}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-3 transition-all active:scale-95 ${
                  isActive("/profile") ? "text-green-500" : "text-gray-400 active:text-gray-600"
                }`}
              >
                <User className={`w-5.5 h-5.5 transition-transform ${isActive("/profile") ? "scale-110" : ""}`} />
                <span className="text-[10px] font-medium">{isActive("/profile") && "프로필"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
