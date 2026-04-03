export type AIAgentMessageRole = 'user' | 'assistant';

export interface AIAgentMessage {
  id: number;
  role: AIAgentMessageRole;
  content: string;
  timestamp: Date;
}

export interface AIAgentConversation {
  threadId?: string;
  messages: AIAgentMessage[];
}

export interface AIAgentChatRequest {
  message: string;
  threadId?: string;
  messages?: Array<{
    role: AIAgentMessageRole;
    content: string;
  }>;
}

export interface AIAgentChatResponse {
  threadId?: string;
  message: {
    role: 'assistant';
    content: string;
  };
}
