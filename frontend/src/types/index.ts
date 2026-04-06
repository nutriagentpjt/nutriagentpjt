export type { Food, FoodSearchResponse } from './food';

export type {
  ApiMealType,
  CreateMealRequest,
  Meal,
  MealImageRecognitionCandidate,
  MealImageUploadResponse,
  MealListResponse,
  MealListSummary,
  MealSource,
  MealSummaryResponse,
  MealType,
  UpdateMealRequest,
} from './meal';

export type {
  ActivityLevel,
  Disease,
  DietStyle,
  MealPattern,
  OnboardingRequest,
  OnboardingResponse,
  SaveOnboardingInput,
  UserProfile,
} from './onboarding';

export type {
  AddPreferenceFoodRequest,
  FoodPreferenceType,
  NutritionTargetResponse,
  PreferenceResponse,
  ProfileResponse,
  ProfileUpdateRequest,
  RemovePreferenceFoodRequest,
} from './profile';

export type {
  NutritionGap,
  Recommendation,
  RecommendationEventRequest,
  RecommendationFeedbackRequest,
  RecommendationResponse,
  RecommendationSettings,
  SaveRecommendationRequest,
} from './recommendation';

export type { ApiError } from './api';
export type {
  AIAgentCreateSessionRequest,
  AIAgentChatRequest,
  AIAgentChatResponse,
  AIAgentConversation,
  AIAgentMessage,
  AIAgentMessageRole,
  AIAgentPersona,
  AIAgentSession,
} from './aiAgent';

export type {
  NutritionTargetUpdateRequest,
  PreferenceUpdateRequest,
} from './profile';
