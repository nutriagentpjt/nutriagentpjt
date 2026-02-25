import api from "./api";
import type {
    OnboardingRequest,
    OnboardingResponse,
} from "../types/onboarding";

export const onboardingService = {
    saveOnboarding: (data: OnboardingRequest) =>
        api.post<OnboardingResponse>("/onboarding", data),

    getOnboarding: (userId: number) =>
        api.get<OnboardingResponse>("/onboarding", {
            params: { userId },
        }),

    deleteOnboarding: (userId: number) =>
        api.delete("/onboarding", {
            params: { userId },
        }),
};