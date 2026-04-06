import { useRef, useEffect, useMemo, useState } from "react";
import { Bot, Check, Ellipsis, MessageSquarePlus, Pencil, Pin, PanelsLeftBottom, Send, Sparkles, Trash2 } from "lucide-react";
import { useAIAgentChat } from "@/hooks";

export default function AIAgentPage() {
  const {
    messages,
    sessions,
    personas,
    selectedPersona,
    setSelectedPersona,
    startNewChat,
    selectSession,
    renameSession,
    togglePinnedSession,
    deleteSession,
    sessionUiState,
    isLoadingHistory,
    isCreatingSession,
    inputValue,
    isTyping,
    setInputValue,
    sendMessage: handleSend,
  } = useAIAgentChat();
  const [isScrolling, setIsScrolling] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const [activeMenuSessionId, setActiveMenuSessionId] = useState<string | null>(null);
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

  const handleStartNewChat = async () => {
    const created = await startNewChat();
    if (created) {
      setShowHistory(false);
    }
  };

  const handleRenameSession = (sessionId: string, currentTitle?: string | null) => {
    const nextTitle = window.prompt('새 대화 이름을 입력해주세요.', currentTitle ?? '');
    if (!nextTitle || !nextTitle.trim()) {
      return;
    }

    renameSession(sessionId, nextTitle);
    setActiveMenuSessionId(null);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shrink-0">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setShowPersonaPicker(false);
                setShowHistory(true);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 active:scale-95"
              aria-label="대화 목록 열기"
            >
              <PanelsLeftBottom className="w-4.5 h-4.5 text-gray-600" />
            </button>

            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">AI 어시스턴트</h1>
                <p className="text-[11px] text-gray-500 mt-0.5">AI 페르소나</p>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowHistory(false);
                  setShowPersonaPicker((current) => !current);
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors active:scale-95 ${
                  showPersonaPicker ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                aria-label="AI 페르소나 선택 열기"
              >
                <Bot className="h-4.5 w-4.5" />
              </button>

              {showPersonaPicker ? (
                <div className="absolute right-0 top-[calc(100%+10px)] z-40 w-[248px] rounded-2xl border border-gray-200 bg-white p-2 shadow-xl">
                  <div className="mb-1 px-2 py-1">
                    <h2 className="text-xs font-bold text-gray-900">AI 페르소나 선택</h2>
                    <p className="mt-1 text-[11px] leading-4 text-gray-500">답변 말투와 성격을 바꿀 수 있어요.</p>
                  </div>
                  <div className="space-y-1">
                    {personas.map((persona) => {
                      const selected = persona.name === selectedPersona;
                      return (
                        <button
                          key={persona.name}
                          type="button"
                          onClick={() => {
                            setSelectedPersona(persona.name);
                            setShowPersonaPicker(false);
                          }}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                            selected
                              ? 'border-green-200 bg-green-50'
                              : 'border-transparent bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-xs font-semibold ${selected ? 'text-green-700' : 'text-gray-900'}`}>
                                {persona.displayName}
                              </p>
                              <p className="mt-1 text-[11px] leading-4 text-gray-500">{persona.description}</p>
                            </div>
                            {selected ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" /> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-gray-500 text-center mt-3">
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
        {isLoadingHistory ? (
          <div className="flex justify-center py-6 text-sm text-gray-500">이전 대화를 불러오는 중입니다.</div>
        ) : null}

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

      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-center bg-black/40" onClick={() => setShowHistory(false)}>
          <div
            className="relative h-full w-full max-w-[390px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-y-0 left-0 flex w-[calc(100%-56px)] max-w-[320px] animate-[slide-in-left_220ms_ease-out] flex-col rounded-r-3xl bg-white shadow-2xl">
              <div className="border-b border-gray-200 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">대화 목록</h2>
                    <p className="mt-1 text-xs text-gray-500">최근 대화를 다시 열 수 있어요</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleStartNewChat()}
                    disabled={isCreatingSession}
                    className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                    {isCreatingSession ? '준비 중' : '새 대화'}
                  </button>
                </div>

              </div>

              <div className="h-[calc(100%-81px)] space-y-2 overflow-y-auto p-3">
                {sessions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    아직 저장된 대화가 없습니다.
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="group relative"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          void selectSession(session);
                          setShowHistory(false);
                        }}
                        className={`w-full rounded-2xl border border-gray-200 px-4 py-3 text-left transition-colors ${
                          activeMenuSessionId === session.id ? 'bg-gray-100' : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="pr-9">
                          <div className="flex items-center gap-2">
                            {sessionUiState[session.id]?.pinned ? (
                              <Pin className="h-3.5 w-3.5 shrink-0 text-green-600" />
                            ) : null}
                            <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                              {session.title || '새 대화'}
                            </p>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                            <span>{personas.find((persona) => persona.name === session.persona)?.displayName ?? session.persona}</span>
                            {session.updatedAt ? <span>· {new Date(session.updatedAt).toLocaleDateString("ko-KR")}</span> : null}
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setActiveMenuSessionId((current) => (current === session.id ? null : session.id));
                        }}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-500 transition ${
                          activeMenuSessionId === session.id
                            ? 'bg-white text-gray-700 shadow-sm'
                            : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 active:opacity-100'
                        }`}
                        aria-label="세션 메뉴 열기"
                      >
                        <Ellipsis className="h-4 w-4" />
                      </button>

                      {activeMenuSessionId === session.id ? (
                        <div className="absolute right-3 top-[calc(100%+4px)] z-10 w-40 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-xl">
                          <button
                            type="button"
                            onClick={() => handleRenameSession(session.id, session.title)}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                          >
                            <Pencil className="h-4 w-4" />
                            이름 바꾸기
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              togglePinnedSession(session.id);
                              setActiveMenuSessionId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                          >
                            <Pin className="h-4 w-4" />
                            {sessionUiState[session.id]?.pinned ? '고정 해제' : '채팅 고정'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteSession(session.id);
                              setActiveMenuSessionId(null);
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            삭제
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="absolute inset-y-0 right-0 w-14">
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="h-full w-full"
                aria-label="대화 목록 닫기"
              />
            </div>
          </div>
        </div>
      )}

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
