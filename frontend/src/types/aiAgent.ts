export type AIAgentMessageRole = 'user' | 'assistant';

export interface AIAgentMessage {
  id: number | string;
  role: AIAgentMessageRole;
  content: string;
  timestamp: Date;
}

export interface AIAgentPersona {
  name: string;
  displayName: string;
  description: string;
}

export interface AIAgentSession {
  id: string;
  title?: string | null;
  persona: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AIAgentConversation {
  threadId?: string;
  messages: AIAgentMessage[];
}

export interface AIAgentCreateSessionRequest {
  persona?: string;
}

export interface AIAgentChatRequest {
  message: string;
  threadId?: string;
  persona?: string;
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
