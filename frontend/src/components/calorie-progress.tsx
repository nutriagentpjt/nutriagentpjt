import { DonutChart } from "@/components/chart";

interface CalorieProgressProps {
  consumed: number;
  goal: number;
  percentage: number;
}

export function CalorieProgress({ consumed, goal, percentage }: CalorieProgressProps) {
  return <DonutChart consumed={consumed} goal={goal} percentage={percentage} />;
}
