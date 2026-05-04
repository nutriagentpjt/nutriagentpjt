import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { aiAgentService } from '@/services';
import type { AIAgentConversation, AIAgentMessage, AIAgentPersona, AIAgentSession } from '@/types';
import { showToast } from '@/components/common/Toast/Toast';

const SESSION_UI_STORAGE_KEY = 'nutriagent_ai_session_ui_v1';

function createAssistantMessage(content: string): AIAgentMessage {
  return {
    id: Date.now() + Math.random(),
    role: 'assistant',
    content,
    timestamp: new Date(),
  };
}

type SessionUiState = Record<
  string,
  {
    title?: string;
    pinned?: boolean;
    deleted?: boolean;
  }
>;

function loadSessionUiState(): SessionUiState {
  try {
    const raw = localStorage.getItem(SESSION_UI_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as SessionUiState;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function saveSessionUiState(state: SessionUiState) {
  localStorage.setItem(SESSION_UI_STORAGE_KEY, JSON.stringify(state));
}

export function useAIAgentChat() {
  const [conversation, setConversation] = useState<AIAgentConversation>(() => ({
    messages: [createAssistantMessage(aiAgentService.getInitialGreeting())],
  }));
  const [sessions, setSessions] = useState<AIAgentSession[]>([]);
  const [sessionUiState, setSessionUiState] = useState<SessionUiState>(() => loadSessionUiState());
  const [personas, setPersonas] = useState<AIAgentPersona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState('strong_strong');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const activeRequestIdRef = useRef(0);

  useEffect(() => {
    saveSessionUiState(sessionUiState);
  }, [sessionUiState]);

  const invalidateActiveRequest = useCallback(() => {
    activeRequestIdRef.current += 1;
  }, []);

  const applySessionUiState = useCallback(
    (items: AIAgentSession[]) =>
      items
        .filter((item) => !sessionUiState[item.id]?.deleted)
        .map((item) => ({
          ...item,
          title: sessionUiState[item.id]?.title ?? item.title,
        }))
        .sort((left, right) => {
          const leftPinned = sessionUiState[left.id]?.pinned ? 1 : 0;
          const rightPinned = sessionUiState[right.id]?.pinned ? 1 : 0;
          if (leftPinned !== rightPinned) {
            return rightPinned - leftPinned;
          }
          return new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() - new Date(left.updatedAt ?? left.createdAt ?? 0).getTime();
        }),
    [sessionUiState],
  );

  const refreshSessions = useCallback(async () => {
    try {
      const items = await aiAgentService.getSessions();
      setSessions(items);
    } catch {
      // Ignore refresh failures to keep the current conversation usable.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const [personaItems, sessionItems] = await Promise.all([
          aiAgentService.getPersonas(),
          aiAgentService.getSessions(),
        ]);

        if (cancelled) {
          return;
        }

        setPersonas(personaItems);
        if (personaItems[0]?.name) {
          setSelectedPersona((current) => current || personaItems[0].name);
        }
        setSessions(sessionItems);
      } catch {
        if (!cancelled) {
          setPersonas([]);
          setSessions([]);
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const startNewChat = useCallback(async () => {
    setIsCreatingSession(true);
    invalidateActiveRequest();
    setIsTyping(false);

    try {
      const session = await aiAgentService.createSession({ persona: selectedPersona });

      setConversation({
        threadId: session.id,
        messages: [createAssistantMessage(aiAgentService.getInitialGreeting())],
      });
      setSessions((current) => [session, ...current.filter((item) => item.id !== session.id)]);
      await refreshSessions();
      return true;
    } catch {
      showToast.error('새 대화를 준비하지 못했어요.\n잠시 후 다시 시도해주세요.');
      return false;
    } finally {
      setIsCreatingSession(false);
    }
  }, [invalidateActiveRequest, refreshSessions, selectedPersona]);

  const renameSession = useCallback((sessionId: string, title: string) => {
    setSessionUiState((current) => ({
      ...current,
      [sessionId]: {
        ...current[sessionId],
        title: title.trim(),
        deleted: false,
      },
    }));
  }, []);

  const togglePinnedSession = useCallback((sessionId: string) => {
    setSessionUiState((current) => ({
      ...current,
      [sessionId]: {
        ...current[sessionId],
        pinned: !current[sessionId]?.pinned,
      },
    }));
  }, []);

  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessionUiState((current) => ({
        ...current,
        [sessionId]: {
          ...current[sessionId],
          deleted: true,
        },
      }));

      if (conversation.threadId === sessionId) {
        invalidateActiveRequest();
        setIsTyping(false);
        setConversation({
          messages: [createAssistantMessage(aiAgentService.getInitialGreeting())],
        });
      }
    },
    [conversation.threadId, invalidateActiveRequest],
  );

  const selectSession = useCallback(async (session: AIAgentSession) => {
    invalidateActiveRequest();
    setIsTyping(false);
    setIsLoadingHistory(true);

    try {
      const history = await aiAgentService.getMessages(session.id);
      setConversation({
        threadId: session.id,
        messages: history.length > 0 ? history : [createAssistantMessage(aiAgentService.getInitialGreeting())],
      });
      setSelectedPersona(session.persona || 'strong_strong');
    } catch {
      setConversation({
        threadId: session.id,
        messages: [createAssistantMessage('이전 대화를 불러오지 못했어요. 잠시 후 다시 시도해주세요.')],
      });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [invalidateActiveRequest]);

  const sendMessage = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) {
      return;
    }

    const userMessage: AIAgentMessage = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setConversation((current) => ({
      ...current,
      messages: [...current.messages, userMessage],
    }));
    setInputValue('');
    setIsTyping(true);
    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    const isActiveRequest = () => activeRequestIdRef.current === requestId;

    try {
      let threadId = conversation.threadId;

      if (!threadId) {
        const session = await aiAgentService.createSession({ persona: selectedPersona });
        threadId = session.id;
        setSessions((current) => [session, ...current.filter((item) => item.id !== session.id)]);
      }

      const assistantMessageId = `${Date.now()}-assistant`;
      let streamed = false;

      try {
        const response = await aiAgentService.streamMessage(
          {
            message: trimmed,
            threadId,
          },
          (content) => {
            streamed = true;
            if (!isActiveRequest()) {
              return;
            }
            setIsTyping(false);
            setConversation((current) => {
              if (!isActiveRequest()) {
                return current;
              }

              const hasMessage = current.messages.some((message) => message.id === assistantMessageId);

              if (hasMessage) {
                return {
                  ...current,
                  threadId: threadId ?? current.threadId,
                  messages: current.messages.map((message) =>
                    message.id === assistantMessageId
                      ? { ...message, content, timestamp: new Date() }
                      : message,
                  ),
                };
              }

              return {
                ...current,
                threadId: threadId ?? current.threadId,
                messages: [
                  ...current.messages,
                  {
                    id: assistantMessageId,
                    role: 'assistant',
                    content,
                    timestamp: new Date(),
                  },
                ],
              };
            });
          },
        );

        if (!streamed && isActiveRequest()) {
          setConversation((current) => ({
            ...current,
            threadId: response.threadId ?? threadId ?? current.threadId,
            messages: [
              ...current.messages,
              {
                id: assistantMessageId,
                role: response.message.role,
                content: response.message.content,
                timestamp: new Date(),
              },
            ],
          }));
        }
      } catch {
        if (!isActiveRequest()) {
          return;
        }

        if (streamed) {
          await refreshSessions();
          return;
        }

        setConversation((current) => ({
          ...current,
          messages: current.messages.filter((message) => message.id !== assistantMessageId),
        }));

        const response = await aiAgentService.sendMessage({
          message: trimmed,
          threadId,
          persona: selectedPersona,
          messages: [...conversation.messages, userMessage].map((message) => ({
            role: message.role,
            content: message.content,
          })),
        });

        if (!isActiveRequest()) {
          return;
        }

        setConversation((current) => ({
          ...current,
          threadId: response.threadId ?? threadId ?? current.threadId,
          messages: [
            ...current.messages,
            {
              id: assistantMessageId,
              role: response.message.role,
              content: response.message.content,
              timestamp: new Date(),
            },
          ],
        }));
      }

      await refreshSessions();
    } catch {
      if (!isActiveRequest()) {
        return;
      }

      setConversation((current) => ({
        ...current,
        messages: [
          ...current.messages,
          createAssistantMessage('지금은 답변을 가져오지 못했어요. 잠시 후 다시 시도해주세요.'),
        ],
      }));
    } finally {
      setIsTyping(false);
    }
  }, [conversation.messages, conversation.threadId, inputValue, isTyping, refreshSessions, selectedPersona]);

  return useMemo(
    () => ({
      messages: conversation.messages,
      threadId: conversation.threadId,
      sessions: applySessionUiState(sessions),
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
      sendMessage,
    }),
    [
      conversation.messages,
      conversation.threadId,
      inputValue,
      applySessionUiState,
      isTyping,
      isLoadingHistory,
      isCreatingSession,
      personas,
      deleteSession,
      renameSession,
      selectedPersona,
      sessionUiState,
      selectSession,
      sendMessage,
      sessions,
      startNewChat,
      togglePinnedSession,
    ],
  );
}
