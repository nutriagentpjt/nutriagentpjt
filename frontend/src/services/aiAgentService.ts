import api from './api';
import type { AIAgentChatRequest, AIAgentChatResponse } from '@/types';

const DEFAULT_GREETING =
  '안녕하세요! 영양 AI 어시스턴트입니다. 🥗\n\n식단, 영양소, 운동, 건강 관련하여 궁금하신 점이 있으시면 언제든지 물어보세요!';

function generateMockResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('단백질') || lowerMessage.includes('protein')) {
    return '단백질은 근육 성장과 회복에 필수적인 영양소입니다. 💪\n\n성인의 경우 체중 1kg당 0.8~1.2g의 단백질 섭취를 권장하며, 운동을 하시는 분들은 1.2~2.0g까지 섭취하시는 것이 좋습니다.\n\n좋은 단백질 공급원:\n• 닭가슴살, 계란\n• 그릭요거트, 두부\n• 연어, 참치\n• 렌틸콩, 병아리콩';
  }

  if (lowerMessage.includes('칼로리') || lowerMessage.includes('다이어트') || lowerMessage.includes('살')) {
    return '건강한 체중 감량을 위해서는 하루 칼로리 섭취량을 점진적으로 줄이는 것이 중요합니다. 🎯\n\n권장사항:\n• 현재 섭취량에서 300-500kcal 줄이기\n• 균형잡힌 영양소 비율 유지\n• 주 0.5-1kg 감량 목표\n• 충분한 수분 섭취 (하루 2L 이상)\n\n급격한 다이어트보다는 지속 가능한 식습관을 만드는 것이 중요합니다!';
  }

  if (lowerMessage.includes('운동') || lowerMessage.includes('헬스') || lowerMessage.includes('근육')) {
    return '규칙적인 운동은 건강한 삶의 핵심입니다! 🏃‍♂️\n\n추천 운동 스케줄:\n• 주 3-5회, 30-60분\n• 유산소 + 근력 운동 병행\n• 운동 전: 가벼운 탄수화물\n• 운동 후: 단백질 + 탄수화물\n\n운동 후 30분 이내에 단백질을 섭취하면 근육 회복에 도움이 됩니다.';
  }

  if (lowerMessage.includes('아침') || lowerMessage.includes('breakfast')) {
    return '건강한 아침 식사는 하루를 시작하는 에너지원입니다! ☀️\n\n추천 아침 메뉴:\n• 오트밀 + 베리 + 견과류\n• 그릭요거트 + 과일 + 그래놀라\n• 통밀빵 + 아보카도 + 계란\n• 프로틴 스무디 + 바나나\n\n균형잡힌 탄수화물, 단백질, 지방을 함께 섭취하세요!';
  }

  if (lowerMessage.includes('물') || lowerMessage.includes('수분')) {
    return '충분한 수분 섭취는 신진대사와 건강에 매우 중요합니다! 💧\n\n수분 섭취 가이드:\n• 하루 2-3L 권장\n• 운동 시: 추가 500ml-1L\n• 아침에 일어나자마자 물 한 잔\n• 식사 30분 전 물 마시기\n\n카페인 음료는 이뇨작용이 있으니, 물을 더 마셔주세요!';
  }

  if (lowerMessage.includes('간식') || lowerMessage.includes('snack')) {
    return '건강한 간식으로 하루 중 에너지를 보충하세요! 🍎\n\n추천 간식:\n• 견과류 한 줌 (아몬드, 호두)\n• 그릭요거트\n• 당근 스틱 + 후무스\n• 과일 (사과, 바나나)\n• 단백질 바\n\n간식도 하루 총 칼로리에 포함되니, 적당량을 섭취하세요!';
  }

  return `좋은 질문이네요! 😊\n\n"${userMessage}"에 대해 더 구체적으로 알려드리고 싶은데, 다음 중 어떤 부분이 궁금하신가요?\n\n• 영양소 정보\n• 칼로리 계산\n• 식단 추천\n• 운동 조언\n\n더 자세히 말씀해주시면 맞춤형 답변을 드리겠습니다!`;
}

function shouldUseMockMode() {
  return import.meta.env.VITE_AI_AGENT_MODE !== 'api';
}

export const aiAgentService = {
  getInitialGreeting(): string {
    return DEFAULT_GREETING;
  },

  async sendMessage(request: AIAgentChatRequest): Promise<AIAgentChatResponse> {
    if (shouldUseMockMode()) {
      return new Promise((resolve) => {
        window.setTimeout(() => {
          resolve({
            threadId: request.threadId,
            message: {
              role: 'assistant',
              content: generateMockResponse(request.message),
            },
          });
        }, 1000 + Math.random() * 1000);
      });
    }

    const response = await api.post<AIAgentChatResponse>('/assistant/chat', request);
    return response.data;
  },
};
