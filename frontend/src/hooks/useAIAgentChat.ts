import { useCallback, useMemo, useState } from 'react';
import { aiAgentService } from '@/services';
import type { AIAgentConversation, AIAgentMessage } from '@/types';

function createAssistantMessage(content: string): AIAgentMessage {
  return {
    id: Date.now() + Math.random(),
    role: 'assistant',
    content,
    timestamp: new Date(),
  };
}

export function useAIAgentChat() {
  const [conversation, setConversation] = useState<AIAgentConversation>(() => ({
    messages: [createAssistantMessage(aiAgentService.getInitialGreeting())],
  }));
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

    try {
      const response = await aiAgentService.sendMessage({
        message: trimmed,
        threadId: conversation.threadId,
        messages: [...conversation.messages, userMessage].map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });

      setConversation((current) => ({
        threadId: response.threadId ?? current.threadId,
        messages: [
          ...current.messages,
          {
            id: Date.now() + Math.random(),
            role: response.message.role,
            content: response.message.content,
            timestamp: new Date(),
          },
        ],
      }));
    } catch {
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
  }, [conversation.messages, conversation.threadId, inputValue, isTyping]);

  return useMemo(
    () => ({
      messages: conversation.messages,
      threadId: conversation.threadId,
      inputValue,
      isTyping,
      setInputValue,
      sendMessage,
    }),
    [conversation.messages, conversation.threadId, inputValue, isTyping, sendMessage],
  );
}
