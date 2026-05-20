import { Outlet, useLocation, useNavigate } from "react-router";
import { Home, Bot, BarChart3, User } from "lucide-react";
import { OverlayScrollArea } from "@/components/common/OverlayScrollArea";

export default function Root() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex justify-center">
      <div className="w-full max-w-[390px] relative flex flex-col h-screen">
        <OverlayScrollArea className="pb-[68px]" containerClassName="flex-1" thumbInsetBottom={84}>
          <Outlet />
        </OverlayScrollArea>

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
