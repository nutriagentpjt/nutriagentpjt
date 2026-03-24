import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface CalorieProgressProps {
  consumed: number;
  goal: number;
  percentage: number;
}

export function CalorieProgress({ consumed, goal, percentage }: CalorieProgressProps) {
  const isOverGoal = consumed > goal;
  const remaining = goal - consumed;

  const data = isOverGoal
    ? [
        { name: '초과량', value: consumed - goal },
        { name: '목표량', value: goal },
      ]
    : [
        { name: '섭취량', value: consumed },
        { name: '남은량', value: remaining > 0 ? remaining : 0 },
      ];

  const colors = isOverGoal
    ? ['url(#yellowGradient)', 'url(#redGradient)']
    : ['url(#greenGradient)', '#f0f0f0'];

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-44 w-44" style={{ minHeight: '176px', minWidth: '176px' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={176}>
          <PieChart>
            <defs>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
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
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-3xl font-bold text-transparent">{consumed}</p>
          <p className="text-xs text-gray-500">{goal} kcal 중</p>
        </div>
      </div>
      <div className="mt-3 text-center">
        <p
          className={`bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent ${
            isOverGoal ? 'from-red-500 to-rose-600' : 'from-green-500 to-emerald-600'
          }`}
        >
          {percentage}%
        </p>
        <p className="mt-0.5 text-xs text-gray-600">
          {isOverGoal ? `${consumed - goal} kcal 초과` : remaining > 0 ? `${remaining} kcal 남음` : '목표 달성!'}
        </p>
      </div>
    </div>
  );
}
