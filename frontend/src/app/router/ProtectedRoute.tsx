import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { onboardingService } from "@/services/onboardingService";
import { useAuthStore } from "@/store/authStore";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const userId = useAuthStore((s) => s.userId) ?? 1;

    const { data, isLoading } = useQuery({
        queryKey: queryKeys.onboarding.byUser(userId),
        queryFn: () => onboardingService.getOnboarding(userId),
        enabled: !!userId,
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!data) {
        return <Navigate to="/onboarding/welcome" replace />;
    }

    return <>{children}</>;
}