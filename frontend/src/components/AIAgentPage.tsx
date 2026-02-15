import { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon, Sparkles } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIAgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "안녕하세요! 영양 AI 어시스턴트입니다. 🥗\n\n식단, 영양소, 운동, 건강 관련하여 궁금하신 점이 있으시면 언제든지 물어보세요!",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 메시지가 추가될 때마다 스크롤을 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

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

  // Mock AI 응답 생성
  const generateMockResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // 영양소 관련 질문
    if (lowerMessage.includes("단백질") || lowerMessage.includes("protein")) {
      return "단백질은 근육 성장과 회복에 필수적인 영양소입니다. 💪\n\n성인의 경우 체중 1kg당 0.8~1.2g의 단백질 섭취를 권장하며, 운동을 하시는 분들은 1.2~2.0g까지 섭취하시는 것이 좋습니다.\n\n좋은 단백질 공급원:\n• 닭가슴살, 계란\n• 그릭요거트, 두부\n• 연어, 참치\n• 렌틸콩, 병아리콩";
    }

    // 칼로리 관련 질문
    if (lowerMessage.includes("칼로리") || lowerMessage.includes("다이어트") || lowerMessage.includes("살")) {
      return "건강한 체중 감량을 위해서는 하루 칼로리 섭취량을 점진적으로 줄이는 것이 중요합니다. 🎯\n\n권장사항:\n• 현재 섭취량에서 300-500kcal 줄이기\n• 균형잡힌 영양소 비율 유지\n• 주 0.5-1kg 감량 목표\n• 충분한 수분 섭취 (하루 2L 이상)\n\n급격한 다이어트보다는 지속 가능한 식습관을 만드는 것이 중요합니다!";
    }

    // 운동 관련 질문
    if (lowerMessage.includes("운동") || lowerMessage.includes("헬스") || lowerMessage.includes("근육")) {
      return "규칙적인 운동은 건강한 삶의 핵심입니다! 🏃‍♂️\n\n추천 운동 스케줄:\n• 주 3-5회, 30-60분\n• 유산소 + 근력 운동 병행\n• 운동 전: 가벼운 탄수화물\n• 운동 후: 단백질 + 탄수화물\n\n운동 후 30분 이내에 단백질을 섭취하면 근육 회복에 도움이 됩니다.";
    }

    // 아침 식사 관련
    if (lowerMessage.includes("아침") || lowerMessage.includes("breakfast")) {
      return "건강한 아침 식사는 하루를 시작하는 에너지원입니다! ☀️\n\n추천 아침 메뉴:\n• 오트밀 + 베리 + 견과류\n• 그릭요거트 + 과일 + 그래놀라\n• 통밀빵 + 아보카도 + 계란\n• 프로틴 스무디 + 바나나\n\n균형잡힌 탄수화물, 단백질, 지방을 함께 섭취하세요!";
    }

    // 물 섭취 관련
    if (lowerMessage.includes("물") || lowerMessage.includes("수분")) {
      return "충분한 수분 섭취는 신진대사와 건강에 매우 중요합니다! 💧\n\n수분 섭취 가이드:\n• 하루 2-3L 권장\n• 운동 시: 추가 500ml-1L\n• 아침에 일어나자마자 물 한 잔\n• 식사 30분 전 물 마시기\n\n카페인 음료는 이뇨작용이 있으니, 물을 더 마셔주세요!";
    }

    // 간식 관련
    if (lowerMessage.includes("간식") || lowerMessage.includes("snack")) {
      return "건강한 간식으로 하루 중 에너지를 보충하세요! 🍎\n\n추천 간식:\n• 견과류 한 줌 (아몬드, 호두)\n• 그릭요거트\n• 당근 스틱 + 후무스\n• 과일 (사과, 바나나)\n• 단백질 바\n\n간식도 하루 총 칼로리에 포함되니, 적당량을 섭취하세요!";
    }

    // 기본 응답
    return `좋은 질문이네요! 😊\n\n"${userMessage}"에 대해 더 구체적으로 알려드리고 싶은데, 다음 중 어떤 부분이 궁금하신가요?\n\n• 영양소 정보\n• 칼로리 계산\n• 식단 추천\n• 운동 조언\n\n더 자세히 말씀해주시면 맞춤형 답변을 드리겠습니다!`;
  };

  // 메시지 전송
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Mock AI 응답 (실제로는 LLM API 호출)
    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: generateMockResponse(userMessage.content),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // 1-2초 랜덤 딜레이
  };

  // Enter 키로 전송 (Shift+Enter는 줄바꿈)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 시간 포맷팅
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shrink-0">
        <div className="px-5 py-4">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">AI 어시스턴트</h1>
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">
            영양, 식단, 운동에 대해 무엇이든 물어보세요
          </p>
        </div>
      </div>

      {/* Messages Area - 스크롤 가능 */}
      <div
        className={`flex-1 overflow-y-auto px-5 py-5 space-y-4 transition-all ${
          isScrolling
            ? "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:opacity-100"
            : "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:opacity-0"
        } [&::-webkit-scrollbar-thumb]:transition-opacity [&::-webkit-scrollbar-thumb]:duration-300`}
        ref={messagesEndRef}
        onScroll={handleScroll}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                message.role === "user"
                  ? "bg-green-500 text-white"
                  : "bg-gradient-to-br from-white to-gray-50/50 text-gray-900 border border-gray-100/50"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-[10px] mt-1 ${
                  message.role === "user" ? "text-green-100" : "text-gray-400"
                }`}
              >
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl px-4 py-3 shadow-sm border border-gray-100/50">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - 하단 고정 */}
      <div className="bg-white border-t border-gray-200 px-5 py-3 shrink-0">
        <div className="flex items-end gap-2.5">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            rows={1}
            className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none max-h-32 overflow-y-auto"
            style={{
              minHeight: "44px",
              height: "auto",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="w-11 h-11 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed active:bg-green-600 transition-colors"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
