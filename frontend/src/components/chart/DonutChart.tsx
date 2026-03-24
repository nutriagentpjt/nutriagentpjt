import { ProgressCircle } from "./ProgressCircle";

interface DonutChartProps {
  consumed: number;
  goal: number;
  percentage?: number;
}

export function DonutChart({ consumed, goal, percentage }: DonutChartProps) {
  return <ProgressCircle consumed={consumed} goal={goal} percentage={percentage} />;
}
