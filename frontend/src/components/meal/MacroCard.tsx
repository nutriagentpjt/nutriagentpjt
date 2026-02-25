interface MacroCardProps {
  name: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
}

export function MacroCard({ name, current, goal, unit, color }: MacroCardProps) {
  const percentage = Math.round((current / goal) * 100);
  
  // 색상별 그라데이션 정의
  const gradientMap: { [key: string]: string } = {
    "#10b981": "from-emerald-500 to-green-600",
    "#3b82f6": "from-blue-500 to-blue-600",
    "#f59e0b": "from-amber-500 to-orange-600",
  };
  
  const gradientClass = gradientMap[color] || "from-gray-500 to-gray-600";

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl p-3.5 shadow-sm border border-gray-100/50 hover:shadow-md transition-shadow duration-200">
      <p className="text-[10px] text-gray-500 mb-1.5 uppercase tracking-wide">{name}</p>
      <p className="text-base font-bold text-gray-900 mb-1">
        {current}
        <span className="text-xs font-normal text-gray-500">/{goal}{unit}</span>
      </p>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 bg-gradient-to-r ${gradientClass}`}
          style={{
            width: `${Math.min(percentage, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}
