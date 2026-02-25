import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@constants/queryKeys";
import { onboardingService } from "@services/onboardingService";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { data, isLoading } = useQuery({
        queryKey: QUERY_KEYS.ONBOARDING.STATUS,
        queryFn: onboardingService.getStatus,
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!data?.completed) {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
}