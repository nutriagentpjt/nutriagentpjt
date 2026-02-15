import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface CalorieProgressProps {
  consumed: number;
  goal: number;
  percentage: number;
}

export function CalorieProgress({
  consumed,
  goal,
  percentage,
}: CalorieProgressProps) {
  const remaining = goal - consumed;
  const data = [
    { name: "섭취량", value: consumed },
    { name: "남은량", value: remaining > 0 ? remaining : 0 },
  ];

  const COLORS = ["url(#greenGradient)", "#f0f0f0"];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent">{consumed}</p>
          <p className="text-xs text-gray-500">{goal} kcal 중</p>
        </div>
      </div>
      <div className="mt-3 text-center">
        <p className="text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">{percentage}%</p>
        <p className="text-xs text-gray-600 mt-0.5">
          {remaining > 0 ? `${remaining} kcal 남음` : "목표 달성!"}
        </p>
      </div>
    </div>
  );
}