import { useState, useEffect } from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp, Droplet, Scale, Flame, ChevronLeft, ChevronRight } from "lucide-react";

type PeriodType = "week" | "month" | "year";

interface Meal {
  id: number;
  name: string;
  calories: number;
  time: string;
  protein: number;
  carbs: number;
  fat: number;
}

interface DayData {
  date: string;
  calories: number;
  weight: number;
  carbs: number;
  protein: number;
  fat: number;
  water: number;
}

export default function StatsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("week");
  const [periodOffset, setPeriodOffset] = useState(0);
  const [mealsByDate, setMealsByDate] = useState<{ [key: string]: Meal[] }>({});
  const [healthData, setHealthData] = useState<{ [key: string]: { weight?: number; water?: number } }>({});

  // localStorage에서 실제 데이터 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nutriagent_meals_v2');
      if (saved) {
        const data = JSON.parse(saved);
        setMealsByDate(data);
      }
      const savedHealth = localStorage.getItem('nutriagent_health_data');
      if (savedHealth) {
        const healthDataParsed = JSON.parse(savedHealth);
        setHealthData(healthDataParsed);
      }
    } catch (error) {
      console.error('Failed to load meals from localStorage:', error);
    }
  }, []);

  // 지난 10일 동안의 더미 데이터 생성
  const generateDummyDataForPastDays = () => {
    const dummyData: { [key: string]: Meal[] } = {};
    const today = new Date();

    for (let i = 1; i <= 10; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - i);
      const dateKey = pastDate.toISOString().split('T')[0];

      // 이미 데이터가 있으면 스킵
      if (mealsByDate[dateKey]) continue;

      // 랜덤 식단 생성 (하루 3-5끼)
      const mealCount = 3 + Math.floor(Math.random() * 3);
      const meals: Meal[] = [];

      const foodOptions = [
        { name: "닭가슴살 샐러드", calories: 350, protein: 35, carbs: 30, fat: 10 },
        { name: "연어 덮밥", calories: 520, protein: 28, carbs: 55, fat: 18 },
        { name: "그릭 요거트", calories: 150, protein: 15, carbs: 12, fat: 5 },
        { name: "현미밥", calories: 300, protein: 6, carbs: 65, fat: 2 },
        { name: "베리 스무디", calories: 220, protein: 8, carbs: 42, fat: 4 },
        { name: "에그 샌드위치", calories: 380, protein: 20, carbs: 35, fat: 16 },
        { name: "참치 샐러드", calories: 280, protein: 30, carbs: 15, fat: 12 },
        { name: "고구마", calories: 180, protein: 3, carbs: 40, fat: 1 },
        { name: "프로틴 쉐이크", calories: 160, protein: 30, carbs: 8, fat: 2 },
        { name: "닭가슴살", calories: 165, protein: 31, carbs: 0, fat: 4 },
      ];

      for (let j = 0; j < mealCount; j++) {
        const food = foodOptions[Math.floor(Math.random() * foodOptions.length)];
        const variance = 0.8 + Math.random() * 0.4; // 80-120% 변동

        meals.push({
          id: Date.now() + j + i * 1000,
          name: food.name,
          calories: Math.round(food.calories * variance),
          time: `${8 + j * 3}:${Math.floor(Math.random() * 6) * 10}`,
          protein: Math.round(food.protein * variance),
          carbs: Math.round(food.carbs * variance),
          fat: Math.round(food.fat * variance),
        });
      }

      dummyData[dateKey] = meals;
    }

    return dummyData;
  };

  // 실제 데이터와 더미 데이터 병합
  const getAllMeals = () => {
    const dummyData = generateDummyDataForPastDays();
    return { ...dummyData, ...mealsByDate };
  };

  // 이전 날짜의 몸무게 가져오기
  const getPreviousWeight = (dateKey: string): number => {
    const date = new Date(dateKey);
    for (let i = 1; i <= 30; i++) { // 최대 30일 전까지 검색
      const prevDate = new Date(date);
      prevDate.setDate(date.getDate() - i);
      const prevKey = prevDate.toISOString().split('T')[0];
      if (healthData[prevKey]?.weight !== undefined) {
        return healthData[prevKey].weight!;
      }
    }
    // 기본값: 칼로리 기반 시뮬레이션
    return 72.0;
  };

  // 날짜별 데이터 집계
  const aggregateDataByDate = (dateKey: string): DayData => {
    const allMeals = getAllMeals();
    const meals = allMeals[dateKey] || [];

    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
    const totalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
    const totalFat = meals.reduce((sum, meal) => sum + meal.fat, 0);

    // 실제 건강 데이터 사용 또는 시뮬레이션
    let weight: number;
    let water: number;

    if (healthData[dateKey]?.weight !== undefined) {
      // 사용자가 입력한 실제 몸무게
      weight = healthData[dateKey].weight!;
    } else {
      // 이전 날짜의 몸무게를 가져오거나 시뮬레이션
      const prevWeight = getPreviousWeight(dateKey);
      const weightVariation = (totalCalories - 1800) / 1000; // 칼로리에 따른 변동
      weight = prevWeight + weightVariation + (Math.random() * 0.4 - 0.2);
    }

    if (healthData[dateKey]?.water !== undefined) {
      // 사용자가 입력한 실제 물 섭취량
      water = healthData[dateKey].water!;
    } else {
      // 시뮬레이션
      water = 1.8 + Math.random() * 0.8; // 1.8-2.6L
    }

    return {
      date: dateKey,
      calories: totalCalories,
      weight: parseFloat(weight.toFixed(1)),
      carbs: totalCarbs,
      protein: totalProtein,
      fat: totalFat,
      water: parseFloat(water.toFixed(1)),
    };
  };

  // 기간 변경 시 offset 초기화
  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period);
    setPeriodOffset(0);
  };

  // 이전 기간으로 이동
  const handlePreviousPeriod = () => {
    setPeriodOffset(periodOffset - 1);
  };

  // 다음 기간으로 이동
  const handleNextPeriod = () => {
    if (periodOffset < 0) {
      setPeriodOffset(periodOffset + 1);
    }
  };

  // 현재 기간 텍스트 생성
  const getCurrentPeriodText = () => {
    const today = new Date();

    if (selectedPeriod === "week") {
      // 이번 주의 월요일 구하기
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + (periodOffset * 7));
      const day = targetDate.getDay();
      const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1); // 일요일이면 -6, 아니면 +1
      const monday = new Date(targetDate.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return `${monday.getFullYear()}.${monday.getMonth() + 1}.${monday.getDate()}~${sunday.getFullYear()}.${sunday.getMonth() + 1}.${sunday.getDate()}`;
    } else if (selectedPeriod === "month") {
      const targetDate = new Date(today);
      targetDate.setMonth(targetDate.getMonth() + periodOffset);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      const firstDay = new Date(year, targetDate.getMonth(), 1);
      const lastDay = new Date(year, targetDate.getMonth() + 1, 0);

      return `${year}.${month}.${firstDay.getDate()}~${year}.${month}.${lastDay.getDate()}`;
    } else {
      const year = today.getFullYear() + periodOffset;
      return `${year}.1.1~${year}.12.31`;
    }
  };

  // 주간 데이터 생성 (실제 데이터 기반)
  const generateWeekData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 자정으로 설정
    const weekData: any[] = [];
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + (periodOffset * 7));
    const day = targetDate.getDay();
    const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(targetDate.setDate(diff));

    const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);

      // 미래 날짜는 제외
      if (date > today) continue;

      const dateKey = date.toISOString().split('T')[0];
      const dayData = aggregateDataByDate(dateKey);

      weekData.push({
        date: dayLabels[i],
        calories: dayData.calories,
        weight: dayData.weight,
        carbs: dayData.carbs,
        protein: dayData.protein,
        fat: dayData.fat,
        water: dayData.water,
      });
    }

    return weekData;
  };

  // 월간 데이터 생성 (일별 데이터로 변경)
  const generateMonthData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 자정으로 설정
    const monthData: any[] = [];
    const targetDate = new Date(today);
    targetDate.setMonth(targetDate.getMonth() + periodOffset);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    // 해당 월의 첫날과 마지막 날
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 일별 데이터 생성
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      // 미래 날짜는 제외
      if (d > today) break;

      const dateKey = d.toISOString().split('T')[0];
      const dayData = aggregateDataByDate(dateKey);

      monthData.push({
        date: `${d.getDate()}일`,
        calories: dayData.calories,
        weight: dayData.weight,
        carbs: dayData.carbs,
        protein: dayData.protein,
        fat: dayData.fat,
        water: dayData.water,
      });
    }

    return monthData;
  };

  // 연간 데이터 생성 (실제 데이터 기반, 월별 평균)
  const generateYearData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 자정으로 설정
    const yearData: any[] = [];
    const year = today.getFullYear() + periodOffset;

    const monthLabels = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      // 미래 월은 제외
      if (firstDay > today) break;

      // 월 단위 데이터 집계
      const monthDays: DayData[] = [];
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        // 미래 날짜는 제외
        if (d > today) break;

        const dateKey = d.toISOString().split('T')[0];
        monthDays.push(aggregateDataByDate(dateKey));
      }

      // 데이터가 없으면 스킵
      if (monthDays.length === 0) continue;

      // 평균 계산
      const avgCalories = Math.round(monthDays.reduce((sum, d) => sum + d.calories, 0) / monthDays.length) || 0;
      const avgWeight = parseFloat((monthDays.reduce((sum, d) => sum + d.weight, 0) / monthDays.length).toFixed(1)) || 0;
      const avgCarbs = Math.round(monthDays.reduce((sum, d) => sum + d.carbs, 0) / monthDays.length) || 0;
      const avgProtein = Math.round(monthDays.reduce((sum, d) => sum + d.protein, 0) / monthDays.length) || 0;
      const avgFat = Math.round(monthDays.reduce((sum, d) => sum + d.fat, 0) / monthDays.length) || 0;
      const avgWater = parseFloat((monthDays.reduce((sum, d) => sum + d.water, 0) / monthDays.length).toFixed(1)) || 0;

      yearData.push({
        date: monthLabels[month],
        calories: avgCalories,
        weight: avgWeight,
        carbs: avgCarbs,
        protein: avgProtein,
        fat: avgFat,
        water: avgWater,
      });
    }

    return yearData;
  };

  // 현재 기간에 따른 데이터 가져오기
  const getCurrentData = () => {
    switch (selectedPeriod) {
      case "week":
        return generateWeekData();
      case "month":
        return generateMonthData();
      case "year":
        return generateYearData();
      default:
        return generateWeekData();
    }
  };

  const data = getCurrentData();

  // 평균 계산
  const avgCalories = Math.round(data.reduce((sum, item) => sum + item.calories, 0) / data.length);
  const avgWeight = (data.reduce((sum, item) => sum + item.weight, 0) / data.length).toFixed(1);
  const avgWater = (data.reduce((sum, item) => sum + item.water, 0) / data.length).toFixed(1);

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100">
          <p className="text-xs font-semibold text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}{entry.unit || ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-5 py-4">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent text-center">통계</h1>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Period Tabs */}
        <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
          <button
            onClick={() => handlePeriodChange("week")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              selectedPeriod === "week"
                ? "bg-green-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            주간
          </button>
          <button
            onClick={() => handlePeriodChange("month")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              selectedPeriod === "month"
                ? "bg-green-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            월간
          </button>
          <button
            onClick={() => handlePeriodChange("year")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              selectedPeriod === "year"
                ? "bg-green-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            연간
          </button>
        </div>

        {/* Period Navigation */}
        <div className="flex items-center justify-center gap-2">
          <button
            className="w-9 h-9 flex items-center justify-center text-gray-600 active:bg-gray-100 rounded-lg transition-colors"
            onClick={handlePreviousPeriod}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl shadow-sm">
            <span className="text-xs font-medium text-gray-900">{getCurrentPeriodText()}</span>
          </div>
          <button
            className={`w-9 h-9 flex items-center justify-center text-gray-600 rounded-lg transition-colors ${
              periodOffset >= 0 ? 'opacity-50 cursor-not-allowed' : 'active:bg-gray-100'
            }`}
            onClick={handleNextPeriod}
            disabled={periodOffset >= 0}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-3 border border-orange-200/50">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
            </div>
            <p className="text-xs text-orange-700 mb-0.5">평균 칼로리</p>
            <p className="text-lg font-bold text-orange-900">{avgCalories}</p>
            <p className="text-[10px] text-orange-600">kcal</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 border border-blue-200/50">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
                <Scale className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-blue-700 mb-0.5">평균 몸무게</p>
            <p className="text-lg font-bold text-blue-900">{avgWeight}</p>
            <p className="text-[10px] text-blue-600">kg</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl p-3 border border-cyan-200/50">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
                <Droplet className="w-4 h-4 text-cyan-500" />
              </div>
            </div>
            <p className="text-xs text-cyan-700 mb-0.5">평균 수분</p>
            <p className="text-lg font-bold text-cyan-900">{avgWater}</p>
            <p className="text-[10px] text-cyan-600">L</p>
          </div>
        </div>

        {/* Calorie Chart */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Flame className="w-4.5 h-4.5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">칼로리 섭취량</h3>
              <p className="text-xs text-gray-500">일일 칼로리 추이</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ fill: "#f97316", r: 4 }}
                activeDot={{ r: 6 }}
                name="칼로리"
                unit="kcal"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Weight Chart */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Scale className="w-4.5 h-4.5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">몸무게 변화</h3>
              <p className="text-xs text-gray-500">체중 추이</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ fill: "#3b82f6", r: 4 }}
                activeDot={{ r: 6 }}
                name="몸무게"
                unit="kg"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Nutrition Ratio Chart */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-green-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">영양소 비율</h3>
              <p className="text-xs text-gray-500">탄수화물 · 단백질 · 지방</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="carbs"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                name="탄수화물"
                unit="g"
              />
              <Area
                type="monotone"
                dataKey="protein"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="단백질"
                unit="g"
              />
              <Area
                type="monotone"
                dataKey="fat"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.6}
                name="지방"
                unit="g"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Water Intake Chart */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Droplet className="w-4.5 h-4.5 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">물 섭취량</h3>
              <p className="text-xs text-gray-500">일일 수분 섭취 추이</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" domain={[0, 3]} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="water"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={{ fill: "#06b6d4", r: 4 }}
                activeDot={{ r: 6 }}
                name="물"
                unit="L"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
