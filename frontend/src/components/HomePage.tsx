import { CalorieProgress } from "./calorie-progress";
import { MacroCard } from "./macro-card";
import { MealList } from "./meal-list";
import { TimePickerWheel } from "./time-picker-wheel";
import { Camera, Search, ChevronLeft, ChevronRight, Calendar, Star, X, Circle, Loader2, AlertCircle, Image as ImageIcon, Check, Plus, Scale, Droplet, Coffee, Sun, Moon, Utensils, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ImageSourceModal } from "@/components/camera";
import { AddFoodModal } from "@/components/food";
import AIRecommendations from "@/components/recommendation/AIRecommendations";
import { useFoodAutocomplete, useFoodSearch, useMealSummary } from "@/hooks";
import type { RecommendationCardItem } from "@/components/recommendation";
import type { Food } from "@/types";
import { ROUTES } from "@/constants/routes";
import { useImageUploadStore } from "@/store";
import { formatDate, getStoredMeals } from "@/utils";

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const setImageUploadFile = useImageUploadStore((state) => state.setSelectedFile);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<{ query: string; timestamp: number }[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [favoriteFoods, setFavoriteFoods] = useState<Array<{ id: number; name: string; calories: number; protein: number; carbs: number; fat: number; source?: string }>>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [galleryMode, setGalleryMode] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedFood, setAnalyzedFood] = useState<string | null>(null);
  const [recognitionFailed, setRecognitionFailed] = useState(false);
  const [showEmptySearchWarning, setShowEmptySearchWarning] = useState(false);
  const [showNoResultsWarning, setShowNoResultsWarning] = useState(false);
  const [showServerErrorModal, setShowServerErrorModal] = useState(false);
  const [showTimeoutErrorModal, setShowTimeoutErrorModal] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  const [editingMeal, setEditingMeal] = useState<any | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editUnit, setEditUnit] = useState<"serving" | "gram">("gram");
  const [editHour, setEditHour] = useState(12);
  const [editMinute, setEditMinute] = useState(0);
  const [showAmountWarning, setShowAmountWarning] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 커스텀 음식 추가 관련 state
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customFoodName, setCustomFoodName] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");
  const [customAmount, setCustomAmount] = useState("100");
  const [customUnit, setCustomUnit] = useState<"serving" | "gram">("gram");
  const [customHour, setCustomHour] = useState(12);
  const [customMinute, setCustomMinute] = useState(0);
  const [showCustomFoodWarning, setShowCustomFoodWarning] = useState(false);
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [selectedSearchFood, setSelectedSearchFood] = useState<Food | null>(null);
  const [addFoodModalSource, setAddFoodModalSource] = useState<'search' | 'ai' | null>(null);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [showRecentFoods, setShowRecentFoods] = useState(false);
  const [showMealEditModal, setShowMealEditModal] = useState(false);
  const [hoveredMealType, setHoveredMealType] = useState<string | null>(null);

  // 건강 데이터 수정 모달 state
  const [healthModalType, setHealthModalType] = useState<'weight' | 'water' | null>(null);
  const [editingWeight, setEditingWeight] = useState("");
  const [editingWater, setEditingWater] = useState("");

  const sanitizeLegacyMeals = (rawMealsByDate: { [key: string]: any[] }) => {
    const dates = Object.keys(rawMealsByDate);
    const allMeals = dates.flatMap((dateKey) => rawMealsByDate[dateKey] ?? []);

    if (allMeals.length === 0) {
      return rawMealsByDate;
    }

    const legacyMealCount = allMeals.filter((meal) => meal.amount == null && meal.mealType == null).length;
    const looksLikeLegacySeed =
      dates.length >= 5 && legacyMealCount / allMeals.length >= 0.8;

    if (!looksLikeLegacySeed) {
      return rawMealsByDate;
    }

    const cleanedEntries = Object.entries(rawMealsByDate)
      .map(([dateKey, mealsForDate]) => [
        dateKey,
        (mealsForDate ?? []).filter((meal) => meal.amount != null || meal.mealType != null),
      ] as const)
      .filter(([, mealsForDate]) => mealsForDate.length > 0);

    return Object.fromEntries(cleanedEntries);
  };

  const syncMealsFromStorage = () => {
    setMealsByDate(sanitizeLegacyMeals(getStoredMeals()));
  };

  const resetSearchView = () => {
    setSearchQuery("");
    setAnalyzedFood(null);
    setShowAutocomplete(false);
    setShowRecentSearches(false);
    setAutocompleteResults([]);
    setShowServerErrorModal(false);
    setShowTimeoutErrorModal(false);
    searchInputRef.current?.blur();
  };

  // localStorage에서 실제 저장된 식단만 로드
  const [mealsByDate, setMealsByDate] = useState<{ [key: string]: any[] }>(() => {
    try {
      const saved = localStorage.getItem('nutriagent_meals_v2');
      if (saved) {
        return sanitizeLegacyMeals(JSON.parse(saved));
      }
      return {};
    } catch (error) {
      console.error('Failed to load meals from localStorage:', error);
      return {};
    }
  });

  // nextMealId는 타임스탬프 기반으로 생성 (충돌 방지)
  const generateMealId = () => {
    return Date.now();
  };

  // mealsByDate가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem('nutriagent_meals_v2', JSON.stringify(mealsByDate));
    } catch (error) {
      console.error('Failed to save meals to localStorage:', error);
    }
  }, [mealsByDate]);

  // 몸무게와 물 섭취량 관리
  const [healthData, setHealthData] = useState<{ [key: string]: { weight?: number; water?: number } }>(() => {
    try {
      const saved = localStorage.getItem('nutriagent_health_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load health data from localStorage:', error);
    }
    return {};
  });

  // healthData가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    try {
      localStorage.setItem('nutriagent_health_data', JSON.stringify(healthData));
    } catch (error) {
      console.error('Failed to save health data to localStorage:', error);
    }
  }, [healthData]);

  // 선택된 날짜의 키 생성
  const getDateKey = (date: Date) => {
    return formatDate(date);
  };

  // 현재 선택된 날짜의 식단
  const currentDateKey = getDateKey(selectedDate);
  const meals = mealsByDate[currentDateKey] || [];
  const { data: mealSummary } = useMealSummary({
    date: currentDateKey,
    enabled: Boolean(currentDateKey),
  });

  // 이전 날짜의 몸무게 가져오기
  const getPreviousWeight = (dateKey: string): number | undefined => {
    const date = new Date(dateKey);
    for (let i = 1; i <= 30; i++) { // 최대 30일 전까지 검색
      const prevDate = new Date(date);
      prevDate.setDate(date.getDate() - i);
      const prevKey = formatDate(prevDate);
      if (healthData[prevKey]?.weight !== undefined) {
        return healthData[prevKey].weight;
      }
    }
    return undefined;
  };

  // 현재 날짜의 건강 데이터
  const currentHealthData = healthData[currentDateKey] || {};
  const currentWeight = currentHealthData.weight ?? getPreviousWeight(currentDateKey);
  const currentWater = currentHealthData.water ?? 0;

  // 날짜 변경 핸들러
  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    const today = new Date();

    // 현재 날짜를 넘지 않도록 제한
    if (newDate <= today) {
      setSelectedDate(newDate);
    }
  };

  // 오늘 날짜인지 확인
  const isToday = () => {
    const today = new Date();
    return getDateKey(selectedDate) === getDateKey(today);
  };

  // 달력 관련 함수들
  const handleOpenCalendar = () => {
    setCalendarViewDate(new Date(selectedDate));
    setShowCalendar(true);
  };

  const handleCalendarPreviousMonth = () => {
    const newDate = new Date(calendarViewDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCalendarViewDate(newDate);
  };

  const handleCalendarNextMonth = () => {
    const newDate = new Date(calendarViewDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCalendarViewDate(newDate);
  };

  const handleSelectCalendarDate = (date: Date) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 오늘의 끝으로 설정

    if (date <= today) {
      setSelectedDate(date);
      setShowCalendar(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // 이전 달의 빈 칸
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // 현재 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isSameDay = (date1: Date | null, date2: Date) => {
    if (!date1) return false;
    return getDateKey(date1) === getDateKey(date2);
  };

  const isBeforeToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const isTodayDate = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return getDateKey(date) === getDateKey(today);
  };

  const isAfterToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
  };

  const today = selectedDate.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  // meals에서 영양소 총합 계산
  const localCaloriesConsumed = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const localTotalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const localTotalCarbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const localTotalFat = meals.reduce((sum, meal) => sum + meal.fat, 0);

  const caloriesConsumed = mealSummary?.consumed.calories ?? localCaloriesConsumed;
  const totalProtein = mealSummary?.consumed.protein ?? localTotalProtein;
  const totalCarbs = mealSummary?.consumed.carbs ?? localTotalCarbs;
  const totalFat = mealSummary?.consumed.fat ?? localTotalFat;

  const caloriesGoal = 2000;
  const percentage = Math.round((caloriesConsumed / caloriesGoal) * 100);
  const activeSearchKeyword = (analyzedFood || searchQuery).trim();
  const {
    data: searchedFoods = [],
    error: searchError,
  } = useFoodSearch(activeSearchKeyword, activeSearchKeyword.length > 0);
  const { data: foodAutocompleteSuggestions = [] } = useFoodAutocomplete(
    searchQuery,
    !analyzedFood && searchQuery.trim().length > 0,
  );

  const macros = [
    { name: "단백질", current: totalProtein, goal: 150, unit: "g", color: "#10b981" },
    { name: "탄수화물", current: totalCarbs, goal: 250, unit: "g", color: "#3b82f6" },
    { name: "지방", current: totalFat, goal: 65, unit: "g", color: "#f59e0b" },
  ];

  useEffect(() => {
    const nextState = location.state as { focusSearch?: boolean } | null;

    if (!nextState?.focusSearch) {
      return;
    }

    let isCancelled = false;
    let attemptCount = 0;
    let timerId: number | undefined;
    let cleanupStateTimer: number | undefined;

    const focusSearchInput = () => {
      if (isCancelled) {
        return;
      }

      const input = searchInputRef.current;
      attemptCount += 1;

      if (!input) {
        timerId = window.setTimeout(focusSearchInput, 100);
        return;
      }

      input.focus({ preventScroll: true });
      input.click();
      const cursorPosition = input.value.length;
      input.setSelectionRange(cursorPosition, cursorPosition);

      if (document.activeElement !== input && attemptCount < 10) {
        timerId = window.setTimeout(focusSearchInput, 100);
        return;
      }

      cleanupStateTimer = window.setTimeout(() => {
        navigate(location.pathname, { replace: true, state: null });
      }, 0);
    };

    timerId = window.setTimeout(focusSearchInput, 150);

    return () => {
      isCancelled = true;
      if (timerId) {
        window.clearTimeout(timerId);
      }
      if (cleanupStateTimer) {
        window.clearTimeout(cleanupStateTimer);
      }
    };
  }, [location.pathname, location.state, navigate]);
  // 검색어 변경 시 자동완성 업데이트
  useEffect(() => {
    if (searchQuery.trim().length > 0 && !analyzedFood) {
      setAutocompleteResults(foodAutocompleteSuggestions);
      setShowAutocomplete(foodAutocompleteSuggestions.length > 0);
      setShowRecentSearches(false);
    } else {
      setShowAutocomplete(false);
      setAutocompleteResults([]);
    }
  }, [searchQuery, analyzedFood, foodAutocompleteSuggestions]);

  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
        setShowRecentSearches(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addRecentSearch = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const now = Date.now();
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.query !== trimmedQuery);
      return [{ query: trimmedQuery, timestamp: now }, ...filtered].slice(0, 7);
    });
  };

  const getFilteredRecentSearches = () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    return recentSearches.filter((item) => now - item.timestamp < oneDayMs).slice(0, 7);
  };

  const removeRecentSearch = (query: string) => {
    setRecentSearches((prev) => prev.filter((item) => item.query !== query));
  };

  const handleRecentSearchSelect = (query: string) => {
    setSearchQuery(query);
    setShowRecentSearches(false);
    setLastSearchQuery(query);
    addRecentSearch(query);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim() === "" && !analyzedFood) {
      const filtered = getFilteredRecentSearches();
      if (filtered.length > 0) {
        setShowRecentSearches(true);
      }
    }
  };
  // 자동완성 항목 선택
  const handleAutocompleteSelect = (item: string) => {
    setSearchQuery(item);
    setShowAutocomplete(false);
    setShowRecentSearches(false);
    setLastSearchQuery(item);
    addRecentSearch(item);
  };

  const filteredResults = searchedFoods.map((food) => ({
    id: food.id,
    food: food.name,
    brand: food.brand ?? "일반식품",
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    servingSize: Number(food.servingSize) || 100,
    servingUnit: food.servingUnit ?? "g",
    weight: food.weight ?? (typeof food.servingSize === "number" ? food.servingSize : 100),
  }));
  const showSearchResults = searchQuery.trim() !== "" || analyzedFood !== null;

  const toggleFavoriteFood = (food: { id: number; name: string; calories: number; protein: number; carbs: number; fat: number }, source: string = 'search') => {
    setFavoriteFoods((prev) => {
      const exists = prev.find((item) => item.id === food.id);
      if (exists) {
        return prev.filter((item) => item.id !== food.id);
      }
      return [...prev, { ...food, source }];
    });
  };

  const isFavoriteFood = (foodId: number) => {
    return favoriteFoods.some((food) => food.id === foodId);
  };

  const removeFavoriteFood = (foodId: number) => {
    setFavoriteFoods((prev) => prev.filter((food) => food.id !== foodId));
  };

  const getCurrentMealType = (): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 10) return 'breakfast';
    if (hour >= 11 && hour <= 14) return 'lunch';
    if (hour >= 17 && hour <= 20) return 'dinner';
    return 'snack';
  };

  const addFavoriteFoodToMeal = (food: { id: number; name: string; calories: number; protein: number; carbs: number; fat: number }) => {
    const now = new Date();
    const newMeal = {
      id: generateMealId(),
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      time: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }),
      mealType: getCurrentMealType(),
    };

    setMealsByDate((prev) => ({
      ...prev,
      [currentDateKey]: [...(prev[currentDateKey] || []), newMeal],
    }));

    setToastMessage(`${food.name}이(가) 오늘의 식단에 추가되었습니다`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    setShowFavorites(false);
  };

  const getRecentFoods = () => {
    const entries = Object.entries(mealsByDate)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 3)
      .flatMap(([, dayMeals]) => dayMeals as Array<{ id: number; name: string; calories: number; protein: number; carbs: number; fat: number }>);

    const uniqueMap = new Map<number, { id: number; name: string; calories: number; protein: number; carbs: number; fat: number }>();
    entries.forEach((meal) => {
      if (!uniqueMap.has(meal.id)) {
        uniqueMap.set(meal.id, meal);
      }
    });
    return Array.from(uniqueMap.values()).slice(0, 10);
  };

  const addRecentFoodToMeal = (food: { id: number; name: string; calories: number; protein: number; carbs: number; fat: number }) => {
    addFavoriteFoodToMeal(food);
    setShowRecentFoods(false);
  };

  const handleRemoveMeal = (id: number) => {
    setMealsByDate((prev) => ({
      ...prev,
      [currentDateKey]: (prev[currentDateKey] || []).filter((meal) => meal.id !== id),
    }));
  };

  const handleEditMeal = (meal: any) => {
    setEditingMeal(meal);
    setEditAmount("100");
    setEditUnit("gram");
    const [hour, minute] = meal.time.split(":").map(Number);
    setEditHour(hour);
    setEditMinute(minute);
  };

  const handleSaveEdit = () => {
    const amount = parseFloat(editAmount);

    // 섭취량 유효성 검사
    if (isNaN(amount) || amount < 1 || amount > 10000) {
      setShowAmountWarning(true);
      return;
    }

    // 영양소 비율 계산 (100g 기준으로 환산)
    const ratio = editUnit === "gram" ? amount / 100 : amount;

    setMealsByDate((prev) => ({
      ...prev,
      [currentDateKey]: (prev[currentDateKey] || []).map((meal) => {
        if (meal.id === editingMeal.id) {
          return {
            ...meal,
            calories: Math.round((editingMeal.calories * ratio)),
            protein: Math.round((editingMeal.protein * ratio)),
            carbs: Math.round((editingMeal.carbs * ratio)),
            fat: Math.round((editingMeal.fat * ratio)),
            time: `${editHour.toString().padStart(2, '0')}:${editMinute.toString().padStart(2, '0')}`,
          };
        }
        return meal;
      }),
    }));

    setEditingMeal(null);
  };

  const handleCameraClick = () => {
    setShowImageSourceModal(true);
    setSearchQuery("");
    setAnalyzedFood(null);
    setRecognitionFailed(false);
  };

  const handleCameraOption = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryOption = () => {
    galleryInputRef.current?.click();
  };

  const handleSelectedUploadFile = (file?: File) => {
    setShowImageSourceModal(false);

    if (!file) {
      return;
    }

    setImageUploadFile(file);
    navigate(ROUTES.MEAL_UPLOAD);
  };

  const handleCameraCapture = () => {
    setIsAnalyzing(true);
    // 2초 후 인식 실패 시뮬레이션
    setTimeout(() => {
      setIsAnalyzing(false);
      setRecognitionFailed(true);
      setCameraMode(false);
    }, 2000);
  };

  const handleCameraClose = () => {
    setCameraMode(false);
    setIsAnalyzing(false);
    setRecognitionFailed(false);
  };

  const handleGalleryClose = () => {
    setGalleryMode(false);
    setSelectedGalleryImage(null);
  };

  const handleGalleryImageSelect = (imageId: number) => {
    setSelectedGalleryImage(imageId);
  };

  const handleGalleryConfirm = () => {
    if (selectedGalleryImage !== null) {
      setGalleryMode(false);
      setIsAnalyzing(true);

      // 2초 후 김치찌개로 인식 성공
      setTimeout(() => {
        setIsAnalyzing(false);
        setSelectedGalleryImage(null);
        setAnalyzedFood("김치찌개");
      }, 2000);
    }
  };

  const handleRetrySearch = () => {
    setRecognitionFailed(false);
    // 검색창에 포커스
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() === "") {
      setShowEmptySearchWarning(true);
    } else {
      setLastSearchQuery(searchQuery);
      addRecentSearch(searchQuery);
    }
  };

  // 재시도 핸들러
  const handleRetryServerSearch = () => {
    setShowServerErrorModal(false);
  };

  // 타임아웃 에러 재시도 핸들러
  const handleRetryTimeoutSearch = () => {
    setShowTimeoutErrorModal(false);
  };

  // 음식 추가 핸들러
  const handleAddFood = (food: any) => {
    const normalizedFood: Food = {
      id: food.id,
      name: food.food,
      brand: food.brand,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      servingSize: food.servingSize ?? 100,
      servingUnit: food.servingUnit ?? "g",
      weight: food.weight ?? 100,
    };

    setSelectedSearchFood(normalizedFood);
    setAddFoodModalSource('search');
    setShowAddFoodModal(true);
  };

  useEffect(() => {
    if (!searchError) {
      return;
    }

    const message =
      typeof searchError === "object" &&
      searchError &&
      "message" in searchError &&
      typeof searchError.message === "string"
        ? searchError.message
        : "";

    if (message.includes("Timeout")) {
      setShowTimeoutErrorModal(true);
      return;
    }

    setShowServerErrorModal(true);
  }, [searchError]);

  // 커스텀 음식 추가 핸들러
  const handleOpenAddCustomModal = () => {
    const now = new Date();
    setCustomHour(now.getHours());
    setCustomMinute(now.getMinutes());
    setShowAddCustomModal(true);
  };

  const handleSaveCustomFood = () => {
    // 유효성 검사
    const calories = parseFloat(customCalories);
    const protein = parseFloat(customProtein);
    const carbs = parseFloat(customCarbs);
    const fat = parseFloat(customFat);
    const amount = parseFloat(customAmount);

    if (!customFoodName.trim()) {
      setShowCustomFoodWarning(true);
      return;
    }

    if (isNaN(calories) || isNaN(protein) || isNaN(carbs) || isNaN(fat) || isNaN(amount)) {
      setShowCustomFoodWarning(true);
      return;
    }

    if (calories < 0 || protein < 0 || carbs < 0 || fat < 0 || amount < 1 || amount > 10000) {
      setShowCustomFoodWarning(true);
      return;
    }

    // 영양소 비율 계산 (100g 기준으로 환산)
    const ratio = customUnit === "gram" ? amount / 100 : amount;

    const newMeal = {
      id: generateMealId(),
      name: customFoodName,
      calories: Math.round(calories * ratio),
      protein: Math.round(protein * ratio),
      carbs: Math.round(carbs * ratio),
      fat: Math.round(fat * ratio),
      time: `${customHour.toString().padStart(2, '0')}:${customMinute.toString().padStart(2, '0')}`,
    };

    setMealsByDate((prev) => ({
      ...prev,
      [currentDateKey]: [...(prev[currentDateKey] || []), newMeal],
    }));

    // 모달 닫기 및 상태 초기화
    setShowAddCustomModal(false);
    setCustomFoodName("");
    setCustomCalories("");
    setCustomProtein("");
    setCustomCarbs("");
    setCustomFat("");
    setCustomAmount("100");
    setCustomUnit("gram");
  };

  // 몸무게 업데이트
  const handleUpdateWeight = (weight: number) => {
    setHealthData((prev) => ({
      ...prev,
      [currentDateKey]: {
        ...prev[currentDateKey],
        weight,
      },
    }));
  };

  // 물 섭취량 업데이트
  const handleUpdateWater = (water: number) => {
    setHealthData((prev) => ({
      ...prev,
      [currentDateKey]: {
        ...prev[currentDateKey],
        water,
      },
    }));
  };

  // 물 한잔 추가 (250ml = 0.25L)
  const handleAddWaterGlass = () => {
    const newWater = currentWater + 0.25;
    handleUpdateWater(newWater);
  };

  // 몸무게 수정 모달 열기
  const handleOpenWeightModal = () => {
    setEditingWeight(currentWeight?.toString() || "");
    setHealthModalType('weight');
  };

  // 물 섭취량 수정 모달 열기
  const handleOpenWaterModal = () => {
    setEditingWater(currentWater?.toString() || "0");
    setHealthModalType('water');
  };

  // 몸무게 저장
  const handleSaveWeightData = () => {
    const weight = parseFloat(editingWeight);

    if (!isNaN(weight) && weight > 0 && weight < 500) {
      handleUpdateWeight(weight);
    }

    setHealthModalType(null);
  };

  // 물 섭취량 저장
  const handleSaveWaterData = () => {
    const water = parseFloat(editingWater);

    if (!isNaN(water) && water >= 0 && water < 20) {
      handleUpdateWater(water);
    }

    setHealthModalType(null);
  };

  // 갤러리 이미지 데이터
  const galleryImages = [
    { id: 1, url: "https://images.unsplash.com/photo-1759150595639-d128196ab6b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBmb29kJTIwZGlzaCUyMHBsYXRlfGVufDF8fHx8MTc2OTU0MzIxM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
    { id: 2, url: "https://images.unsplash.com/photo-1667499745120-f9bcef8f584e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWxhZCUyMGJvd2wlMjBoZWFsdGh5JTIwbWVhbHxlbnwxfHx8fDE3Njk1NDMyMTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
    { id: 3, url: "https://images.unsplash.com/photo-1712746784067-e9e1bd86c043?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0YSUyMGRpc2glMjByZXN0YXVyYW50fGVufDF8fHx8MTc2OTQ4Nzk0M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
    { id: 4, url: "https://images.unsplash.com/photo-1688912739425-67191f6823f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXJnZXIlMjBmcmllcyUyMGZhc3QlMjBmb29kfGVufDF8fHx8MTc2OTQ5MTA1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
    { id: 5, url: "https://images.unsplash.com/photo-1559680013-f7b27f33cb0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmVha2Zhc3QlMjB0b2FzdCUyMGNvZmZlZXxlbnwxfHx8fDE3Njk1NDMyMTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
    { id: 6, url: "https://images.unsplash.com/photo-1700324822763-956100f79b0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXNoaSUyMGphcGFuZXNlJTIwZm9vZHxlbnwxfHx8fDE3Njk0NzQyMjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
    { id: 7, url: "https://images.unsplash.com/photo-1546993641-097e8366bba0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMHNsaWNlJTIwY2hlZXNlfGVufDF8fHx8MTc2OTQ5MTIwMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
    { id: 8, url: "https://images.unsplash.com/photo-1655633584060-c875b9821061?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNzZXJ0JTIwY2FrZSUyMHN3ZWV0fGVufDF8fHx8MTc2OTQ4MDY1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  ];

  return (
    <>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          handleSelectedUploadFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleSelectedUploadFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {/* Camera Mode Full Screen */}
      {cameraMode && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative w-screen h-screen origin-center rotate-90" style={{ width: '100vh', height: '100vw' }}>
            {/* Camera Preview */}
            <div className="relative w-full h-full overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1629385350553-a5d6e195dd9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjBkZXNrJTIwd29ya3NwYWNlJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3Njk1NDIxNjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="카메라 프리뷰"
                decoding="async"
                className="w-full h-full object-cover object-center"
              />

              {/* Overlay Guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-96 h-64 border-2 border-white/50 rounded-2xl"></div>
              </div>

              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
                <button
                  onClick={handleCameraClose}
                  className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
                <div className="bg-black/50 px-4 py-2.5 rounded-full backdrop-blur-sm">
                  <p className="text-sm text-white font-medium">음식을 촬영하세요</p>
                </div>
                <div className="w-12"></div>
              </div>

              {/* Analyzing Overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-14 h-14 text-green-500 animate-spin" />
                  <div className="text-center">
                    <p className="text-white font-semibold text-lg">음식 분석 중...</p>
                    <p className="text-white/70 text-base mt-1">AI가 음식을 인식하고 있습니다</p>
                  </div>
                </div>
              )}

              {/* Capture Button - Right Center */}
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <button
                  onClick={handleCameraCapture}
                  disabled={isAnalyzing}
                  className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 active:scale-95 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center shadow-lg"
                >
                  <Circle className="w-16 h-16 text-white fill-white" />
                </button>
              </div>

              {/* Bottom Info Text */}
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
                <p className="text-center text-white/70 text-sm">
                  음식 사진을 촬영하면 자동으로 인식됩니다
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Mode Full Screen */}
      {galleryMode && (
        <div className="fixed inset-0 bg-black z-50">
          <div className="relative w-full h-full bg-gray-900">
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-5 flex items-center justify-between z-10 bg-gradient-to-b from-black/70 to-transparent">
              <button
                onClick={handleGalleryClose}
                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm active:bg-white/30"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="flex-1 text-center">
                <p className="text-base text-white font-semibold">갤러리</p>
                {selectedGalleryImage && (
                  <p className="text-xs text-white/70 mt-0.5">이미지를 선택했습니다</p>
                )}
              </div>
              <button
                onClick={handleGalleryConfirm}
                disabled={!selectedGalleryImage || isAnalyzing}
                className="px-4 py-2 bg-green-500 rounded-full text-white text-sm font-medium disabled:opacity-40 disabled:bg-gray-500 active:bg-green-600 transition-colors"
              >
                선택
              </button>
            </div>

            {/* Gallery Grid */}
            <div className="h-full pt-20 pb-5 px-2.5 overflow-y-auto">
              <div className="grid grid-cols-3 gap-1.5">
                {galleryImages.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => handleGalleryImageSelect(image.id)}
                    className="relative aspect-square overflow-hidden bg-gray-800 active:opacity-80"
                  >
                    <img
                      src={image.url}
                      alt={`갤러리 이미지 ${image.id}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    {selectedGalleryImage === image.id && (
                      <>
                        <div className="absolute inset-0 bg-green-500/40"></div>
                        <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        </div>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Analyzing Overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-4 z-20">
                <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
                <div className="text-center">
                  <p className="text-white font-semibold text-base">음식 분석 중...</p>
                  <p className="text-white/70 text-sm mt-1">AI가 음식을 인식하고 있습니다</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-5 py-4">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent text-center">NutriAgent</h1>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Search Bar with Camera */}
        <div className="flex items-center gap-2.5">
          <button
            className="w-11 h-11 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-100/50 flex items-center justify-center flex-shrink-0 active:scale-95 transition-all hover:shadow-md"
            onClick={handleCameraClick}
          >
            <Camera className="w-5 h-5 text-green-500" />
          </button>
          <div className="flex-1 relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none z-10" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="음식 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                className="w-full h-11 bg-gradient-to-br from-white to-gray-50/50 rounded-xl shadow-sm border border-gray-100/50 pl-11 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow hover:shadow-md"
              />
              <button
                type="button"
                onClick={() => setShowFavorites(true)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center active:scale-90 transition-transform"
                aria-label="즐겨찾기"
              >
                <Star className="w-5 h-5 text-green-500 fill-green-500 hover:text-green-600 hover:fill-green-600 transition-colors" />
              </button>
            </form>

            {/* Recent Searches */}
            {showRecentSearches && !showAutocomplete && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100/50 overflow-hidden z-20">
                <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-600">최근 검색어</p>
                </div>
                {getFilteredRecentSearches().map((item, index) => (
                  <div
                    key={item.query}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 ${
                      index !== getFilteredRecentSearches().length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <button
                      onClick={() => handleRecentSearchSelect(item.query)}
                      className="flex-1 text-left text-sm text-gray-900 hover:text-green-600 transition-colors"
                    >
                      {item.query}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentSearch(item.query);
                      }}
                      className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="삭제"
                    >
                      <X className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Autocomplete Suggestions */}
            {showAutocomplete && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100/50 overflow-hidden z-20">
                {autocompleteResults.map((result, index) => (
                  <button
                    key={result}
                    onClick={() => handleAutocompleteSelect(result)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                      index !== autocompleteResults.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="flex-1 text-sm text-gray-900">{result}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {showSearchResults && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100/50 overflow-hidden">
            <div className="px-3.5 py-2.5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">
                  {analyzedFood ? (
                    <>
                      <span className="inline-flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-green-500" />
                        <span>"{analyzedFood}" 인식 결과</span>
                      </span>
                    </>
                  ) : (
                    `검색 결과 ${filteredResults.length}개`
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  관심 음식 {favoriteFoods.length}개
                </p>
              </div>
            </div>
            {filteredResults.length > 0 ? (
              <div>
                {filteredResults.map((result, index) => (
                  <div
                    key={result.id}
                    className={`flex items-center gap-2.5 px-3.5 py-3.5 ${
                      index !== filteredResults.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 mb-1">
                        <span className="font-medium">{result.food}</span>
                        <span className="text-gray-400 mx-1.5">|</span>
                        <span className="text-gray-600">{result.brand}</span>
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {result.calories}kcal · 단백질 {result.protein}g · 탄수화물 {result.carbs}g · 지방 {result.fat}g
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        toggleFavoriteFood(
                          {
                            id: result.id,
                            name: `${result.food} | ${result.brand}`,
                            calories: result.calories,
                            protein: result.protein,
                            carbs: result.carbs,
                            fat: result.fat,
                          },
                          'search',
                        )
                      }
                      className="w-9 h-9 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                      aria-label={
                        isFavoriteFood(result.id)
                          ? "관심 음식 해제"
                          : "관심 음식 추가"
                      }
                    >
                      <Star
                        className={`w-5 h-5 transition-all ${
                          isFavoriteFood(result.id)
                            ? "text-green-500 fill-green-500"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleAddFood(result)}
                      className="w-9 h-9 bg-white border border-gray-300 text-gray-400 rounded-full flex items-center justify-center flex-shrink-0 active:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3.5 py-8 text-center">
                <p className="text-xs text-gray-500">검색 결과가 없습니다</p>
              </div>
            )}
          </div>
        )}

        {/* Date Control */}
        {!showSearchResults && (
          <div className="flex items-center justify-center gap-2">
            <button className="w-9 h-9 flex items-center justify-center text-gray-600 active:bg-gray-100 rounded-lg transition-colors" onClick={handlePreviousDay}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-xl shadow-sm active:bg-gray-50 transition-colors"
              onClick={handleOpenCalendar}
            >
              <Calendar className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-gray-900">{today}</span>
            </button>
            <button
              className={`w-9 h-9 flex items-center justify-center text-gray-600 rounded-lg transition-colors ${
                isToday() ? 'opacity-50 cursor-not-allowed' : 'active:bg-gray-100'
              }`}
              onClick={handleNextDay}
              disabled={isToday()}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Calorie Progress */}
        {!showSearchResults && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <CalorieProgress
              consumed={caloriesConsumed}
              goal={caloriesGoal}
              percentage={percentage}
            />
          </div>
        )}

        {/* Macro Cards */}
        {!showSearchResults && (
          <div>
            <h2 className="text-xs font-semibold text-gray-700 mb-2.5 px-0.5">
              영양소
            </h2>
            <div className="grid grid-cols-3 gap-2.5">
              {macros.map((macro) => (
                <MacroCard key={macro.name} {...macro} />
              ))}
            </div>
          </div>
        )}

        {/* Health Tracking: Weight & Water */}
        {!showSearchResults && (
          <div className="grid grid-cols-2 gap-3">
            {/* Weight Tracker */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 relative">
              <button
                onClick={handleOpenWeightModal}
                className="absolute top-2 right-2 text-[10px] text-gray-500 hover:text-green-600 font-medium px-2 py-1 hover:bg-gray-50 rounded transition-colors"
              >
                수정
              </button>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Scale className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <h3 className="text-[11px] font-semibold text-gray-700">몸무게</h3>
              </div>
              <div className="mt-auto">
                <p className="text-2xl font-bold text-blue-900">
                  {currentWeight ? currentWeight.toFixed(1) : '-'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {currentWeight && !currentHealthData.weight ? '이전 기록' : 'kg'}
                </p>
              </div>
            </div>

            {/* Water Tracker */}
            <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 relative">
              <button
                onClick={handleOpenWaterModal}
                className="absolute top-2 right-2 text-[10px] text-gray-500 hover:text-green-600 font-medium px-2 py-1 hover:bg-gray-50 rounded transition-colors"
              >
                수정
              </button>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-6 h-6 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Droplet className="w-3.5 h-3.5 text-cyan-500" />
                </div>
                <h3 className="text-[11px] font-semibold text-gray-700">물 섭취량</h3>
              </div>
              <div className="mt-auto">
                <p className="text-2xl font-bold text-cyan-900">
                  {currentWater ? currentWater.toFixed(1) : '0'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">리터</p>
              </div>
            </div>
          </div>
        )}

        {/* Meals List */}
        {!showSearchResults && (
          <div>
            <h2 className="text-xs font-semibold text-gray-700 mb-2.5 px-0.5">
              오늘의 식단
            </h2>
            <button
              onClick={() => setShowAIRecommendations(true)}
              className="w-full mb-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">AI 추천 받기</p>
                  <p className="text-xs text-gray-500">맞춤형 식단을 추천해드려요</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            <div className="flex justify-end mb-1.5">
              <button
                onClick={() => setShowRecentFoods(true)}
                className="text-[10px] text-green-600 hover:text-green-700 font-medium px-2 py-1 hover:bg-green-50 rounded transition-colors flex items-center gap-1"
              >
                <Coffee className="w-3.5 h-3.5" />
                최근에 먹은 음식
              </button>
            </div>
            <MealList meals={meals} onRemoveMeal={handleRemoveMeal} onEditMeal={handleEditMeal} onAddCustomMeal={handleOpenAddCustomModal} onHeaderClick={() => setShowMealEditModal(true)} />
          </div>
        )}
      </div>

      {/* Health Data Edit Modal */}
      {healthModalType && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-5">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-5">
              {healthModalType === 'weight' ? '몸무게 수정' : '물 섭취량 수정'}
            </h3>

            {healthModalType === 'weight' ? (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  몸무게 (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={editingWeight}
                    onChange={(e) => setEditingWeight(e.target.value)}
                    placeholder="예: 70.5"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Scale className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  물 섭취량 (L)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={editingWater}
                    onChange={(e) => setEditingWater(e.target.value)}
                    placeholder="예: 2.0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Droplet className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    const current = parseFloat(editingWater) || 0;
                    setEditingWater((current + 0.25).toFixed(2));
                  }}
                  className="mt-2 text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  + 한잔 추가 (250ml)
                </button>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2.5">
              <button
                onClick={() => setHealthModalType(null)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm active:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={healthModalType === 'weight' ? handleSaveWeightData : handleSaveWaterData}
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-medium text-sm active:bg-green-600 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recognition Failed Modal */}
      {recognitionFailed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-5">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">음식 인식 실패</h3>
              <p className="text-sm text-gray-600 mb-6">
                사진에서 음식을 인식할 수 없습니다.<br />
                음식이 잘 보이도록 다시 촬영하거나<br />
                직접 검색해 주세요.
              </p>
              <div className="flex gap-2.5 w-full">
                <button
                  onClick={() => {
                    setRecognitionFailed(false);
                    navigate(ROUTES.MEAL_UPLOAD);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm active:bg-gray-200 transition-colors"
                >
                  다시 촬영
                </button>
                <button
                  onClick={handleRetrySearch}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-medium text-sm active:bg-green-600 transition-colors"
                >
                  직접 검색
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Source Modal */}
      <ImageSourceModal
        isOpen={showImageSourceModal}
        onClose={() => setShowImageSourceModal(false)}
        onCamera={handleCameraOption}
        onGallery={handleGalleryOption}
      />

      {/* Empty Search Warning Modal */}
      {showEmptySearchWarning && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-5"
          onClick={() => setShowEmptySearchWarning(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">검색어를 입력해주세요</h3>
              <p className="text-sm text-gray-600 mb-6">
                음식 이름을 입력하거나<br />
                카메라로 음식을 촬영해 주세요.
              </p>
              <button
                onClick={() => setShowEmptySearchWarning(false)}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-xl font-medium text-sm active:bg-green-600 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Results Warning Modal */}
      {showNoResultsWarning && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-5"
          onClick={() => setShowNoResultsWarning(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="w-7 h-7 text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">검색 결과가 없습니다</h3>
              <p className="text-sm text-gray-600 mb-6">
                다른 검색어를 입력하거나<br />
                카메라로 음식을 촬영해 주세요.
              </p>
              <div className="flex gap-2.5 w-full">
                <button
                  onClick={() => {
                    setShowNoResultsWarning(false);
                    navigate(ROUTES.MEAL_UPLOAD);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm active:bg-gray-200 transition-colors"
                >
                  카메라로 촬영
                </button>
                <button
                  onClick={() => setShowNoResultsWarning(false)}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-medium text-sm active:bg-green-600 transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Server Error Modal */}
      {showServerErrorModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-5"
          onClick={() => setShowServerErrorModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">서버 오류</h3>
              <p className="text-sm text-gray-600 mb-6">
                데이터베이스 연결에 실패했습니다.<br />
                다시 시도해 주세요.
              </p>
              <div className="flex gap-2.5 w-full">
                <button
                  onClick={handleRetryServerSearch}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm active:bg-gray-200 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeout Error Modal */}
      {showTimeoutErrorModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-5"
          onClick={() => setShowTimeoutErrorModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">검색시간 초과</h3>
              <p className="text-sm text-gray-600 mb-6">
                검색 시간이 초과되었습니다.<br />
                다시 시도해주세요.
              </p>
              <div className="flex gap-2.5 w-full">
                <button
                  onClick={handleRetryTimeoutSearch}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm active:bg-gray-200 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Meal Modal */}
      {editingMeal && (
        <div
          className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center px-5"
          onClick={() => setEditingMeal(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-4">음식 정보 수정</h3>

              {/* 음식 이름 */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">{editingMeal.name}</p>
                <p className="text-xs text-gray-500">
                  기본 영양소 (100g 기준): {editingMeal.calories}kcal · 단백질 {editingMeal.protein}g · 탄수화물 {editingMeal.carbs}g · 지방 {editingMeal.fat}g
                </p>
              </div>

              {/* 섭취량 입력 */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">섭취량</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="섭취량"
                  />
                  <select
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value as "serving" | "gram")}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="gram">g</option>
                    <option value="serving">인분</option>
                  </select>
                </div>
              </div>

              {/* 섭취 시간 입력 */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-3 block">섭취 시간</label>
                <div className="flex items-center justify-center gap-4">
                  <TimePickerWheel
                    value={editHour}
                    max={23}
                    onChange={(hour) => setEditHour(hour)}
                    label="시"
                  />
                  <div className="text-2xl font-bold text-gray-900 pb-6">:</div>
                  <TimePickerWheel
                    value={editMinute}
                    max={59}
                    onChange={(minute) => setEditMinute(minute)}
                    label="분"
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => setEditingMeal(null)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm active:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-medium text-sm active:bg-green-600 transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Amount Warning Modal */}
      {showAmountWarning && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-5"
          onClick={() => setShowAmountWarning(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">잘못된 섭취량</h3>
              <p className="text-sm text-gray-600 mb-6">
                섭취량은 1~10,000g 사이여야 합니다.
              </p>
              <button
                onClick={() => setShowAmountWarning(false)}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-xl font-medium text-sm active:bg-green-600 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-5"
          onClick={() => setShowCalendar(false)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-[340px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={handleCalendarPreviousMonth}
                className="w-9 h-9 flex items-center justify-center text-gray-600 active:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-base font-bold text-gray-900">
                {calendarViewDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long" })}
              </h3>
              <button
                onClick={handleCalendarNextMonth}
                className="w-9 h-9 flex items-center justify-center text-gray-600 active:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
                <div key={day} className="text-center py-2">
                  <span className={`text-xs font-semibold ${index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'}`}>
                    {day}
                  </span>
                </div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(calendarViewDate).map((date, index) => {
                const isDisabled = !date || isAfterToday(date);
                const isSelected = date && isSameDay(date, selectedDate);
                const isToday = date && isTodayDate(date);
                const isPast = date && isBeforeToday(date);

                return (
                  <button
                    key={index}
                    onClick={() => date && handleSelectCalendarDate(date)}
                    disabled={isDisabled}
                    className={`
                      aspect-square flex items-center justify-center rounded-lg text-sm transition-colors
                      ${!date ? 'invisible' : ''}
                      ${isDisabled ? 'text-gray-300 cursor-not-allowed' : ''}
                      ${isSelected ? 'bg-green-500 text-white font-bold' : ''}
                      ${!isSelected && isToday ? 'bg-green-100 text-green-600 font-semibold' : ''}
                      ${!isSelected && !isToday && !isDisabled ? 'text-gray-900 hover:bg-gray-100 active:bg-gray-200' : ''}
                    `}
                  >
                    {date?.getDate()}
                  </button>
                );
              })}
            </div>

            {/* 하단 버튼 */}
            <div className="mt-5 flex gap-2.5">
              <button
                onClick={() => setShowCalendar(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm active:bg-gray-200 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Food Modal */}
      {showAddCustomModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-5"
          onClick={() => setShowAddCustomModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 mb-4">커스텀 음식 추가</h3>

              {/* 음식 이름 */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">음식 이름</label>
                <input
                  type="text"
                  value={customFoodName}
                  onChange={(e) => setCustomFoodName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="음식 이름"
                />
              </div>

              {/* 영양소 입력 */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">영양소 (100g 기준)</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">칼로리 (kcal)</label>
                    <input
                      type="number"
                      value={customCalories}
                      onChange={(e) => setCustomCalories(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="칼로리"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">단백질 (g)</label>
                    <input
                      type="number"
                      value={customProtein}
                      onChange={(e) => setCustomProtein(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="단백질"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">탄수화물 (g)</label>
                    <input
                      type="number"
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="탄수화물"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">지방 (g)</label>
                    <input
                      type="number"
                      value={customFat}
                      onChange={(e) => setCustomFat(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="지방"
                    />
                  </div>
                </div>
              </div>

              {/* 섭취량 입력 */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">섭취량</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="섭취량"
                  />
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value as "serving" | "gram")}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="gram">g</option>
                    <option value="serving">인분</option>
                  </select>
                </div>
              </div>

              {/* 섭취 시간 입력 */}
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 mb-3 block">섭취 시간</label>
                <div className="flex items-center justify-center gap-4">
                  <TimePickerWheel
                    value={customHour}
                    max={23}
                    onChange={(hour) => setCustomHour(hour)}
                    label="시"
                  />
                  <div className="text-2xl font-bold text-gray-900 pb-6">:</div>
                  <TimePickerWheel
                    value={customMinute}
                    max={59}
                    onChange={(minute) => setCustomMinute(minute)}
                    label="분"
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowAddCustomModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm active:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveCustomFood}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-medium text-sm active:bg-green-600 transition-colors"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Food Warning Modal */}
      {showCustomFoodWarning && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-5"
          onClick={() => setShowCustomFoodWarning(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-[340px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">잘못된 입력</h3>
              <p className="text-sm text-gray-600 mb-6">
                모든 필드를 올바르게 입력해주세요.
              </p>
              <button
                onClick={() => setShowCustomFoodWarning(false)}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-xl font-medium text-sm active:bg-green-600 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>      )}

      {/* AI Recommendations Screen */}
      {showAIRecommendations && (
        <AIRecommendations
          onClose={() => setShowAIRecommendations(false)}
          mealType={getCurrentMealType()}
          date={currentDateKey}
          onSaveFood={(food: RecommendationCardItem) => {
            setSelectedSearchFood({
              id: food.foodId,
              name: food.foodName,
              servingSize: 100,
              calories: food.nutrients.calories,
              carbs: food.nutrients.carbs,
              protein: food.nutrients.protein,
              fat: food.nutrients.fat,
              servingUnit: 'g',
              weight: 100,
            });
            setAddFoodModalSource('ai');
            setShowAddFoodModal(true);
          }}
          onToggleFavorite={(food) => toggleFavoriteFood(food, 'ai')}
          isFavorite={isFavoriteFood}
        />
      )}

      {/* Meal Edit Modal */}
      {showMealEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center" onClick={() => setShowMealEditModal(false)}>
          <div className="w-full sm:max-w-[390px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-gray-100">
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">오늘의 식단</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{meals.length}개의 식사</p>
                </div>
                <button onClick={() => setShowMealEditModal(false)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all" aria-label="닫기">
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex-shrink-0 px-5 py-3 bg-gray-50 border-b border-gray-100">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { type: 'breakfast', label: '아침', icon: Sun },
                  { type: 'lunch', label: '점심', icon: Utensils },
                  { type: 'dinner', label: '저녁', icon: Moon },
                  { type: 'snack', label: '간식', icon: Coffee },
                ].map((item) => {
                  const Icon = item.icon;
                  const count = meals.filter((meal) => {
                    const hour = parseInt(meal.time.split(':')[0]);
                    if (item.type === 'breakfast') return hour >= 6 && hour <= 10;
                    if (item.type === 'lunch') return hour >= 11 && hour <= 14;
                    if (item.type === 'dinner') return hour >= 17 && hour <= 20;
                    return hour < 6 || (hour > 10 && hour < 11) || (hour > 14 && hour < 17) || hour > 20;
                  }).length;

                  return (
                    <div key={item.type} className="flex flex-col items-center justify-center p-2.5 bg-white rounded-xl border border-gray-200">
                      <Icon className="w-4 h-4 text-green-600 mb-1" />
                      <span className="text-[10px] font-medium text-gray-700">{item.label}</span>
                      <span className="text-xs font-semibold text-green-600 mt-0.5">{count}개</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {meals.length > 0 ? (
                <div className="space-y-3">
                  {[
                    { type: 'breakfast', label: '아침', timeRange: [6, 10], icon: Sun, timeText: '06:00-10:59' },
                    { type: 'lunch', label: '점심', timeRange: [11, 14], icon: Utensils, timeText: '11:00-14:59' },
                    { type: 'dinner', label: '저녁', timeRange: [17, 20], icon: Moon, timeText: '17:00-20:59' },
                    { type: 'snack', label: '간식', timeRange: null, icon: Coffee, timeText: '식사 시간 외' },
                  ].map((mealType) => {
                    const Icon = mealType.icon;
                    const mealItems = meals.filter((meal) => {
                      const hour = parseInt(meal.time.split(':')[0]);
                      if (mealType.type === 'snack') {
                        return hour < 6 || (hour > 10 && hour < 11) || (hour > 14 && hour < 17) || hour > 20;
                      }
                      const [start, end] = mealType.timeRange;
                      return hour >= start && hour <= end;
                    });

                    if (mealItems.length === 0) return null;

                    return (
                      <div key={mealType.type} className="mb-4">
                        <div className="flex items-center gap-2 mb-2.5">
                          <Icon className="w-4 h-4 text-green-600" />
                          <div className="relative inline-block" onMouseEnter={() => setHoveredMealType(mealType.type)} onMouseLeave={() => setHoveredMealType(null)} onTouchStart={() => setHoveredMealType(mealType.type)}>
                            <h3 className="text-sm font-semibold text-gray-900 cursor-help">{mealType.label}</h3>
                            {hoveredMealType === mealType.type && (
                              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-white text-gray-900 text-xs rounded-lg border border-gray-200 shadow-lg whitespace-nowrap z-[70] animate-fade-in">
                                {mealType.timeText}
                                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-b-[5px] border-r-[5px] border-transparent border-r-white" style={{ filter: 'drop-shadow(-1px 0 1px rgba(0,0,0,0.05))' }}></div>
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{mealItems.length}개</span>
                        </div>
                        <div className="space-y-2">
                          {mealItems.map((meal) => (
                            <div key={meal.id} className="bg-white rounded-xl p-3.5 border border-gray-200 hover:border-green-300 transition-colors">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate mb-1">{meal.name}</p>
                                  <p className="text-xs text-gray-500">{meal.time}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-sm font-semibold text-gray-900">{meal.calories}</p>
                                  <p className="text-[10px] text-gray-500">kcal</p>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <button onClick={() => handleEditMeal(meal)} className="flex-1 px-3 py-2 bg-green-50 hover:bg-green-100 active:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors">수정</button>
                                <button onClick={() => handleRemoveMeal(meal.id)} className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 rounded-lg text-xs font-medium transition-colors">삭제</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center py-10">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Utensils className="h-8 w-8 text-gray-300" />
                  </div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">아직 등록된 식단이 없습니다</h3>
                  <p className="text-xs text-gray-500">검색 또는 직접 추가로 오늘의 식단을 채워보세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Favorites Screen */}
      {showFavorites && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="w-full sm:max-w-[390px] h-full bg-white flex flex-col sm:shadow-2xl">
            <div className="flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-500 px-5 pt-8 pb-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-white fill-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">즐겨찾기</h1>
                    <p className="text-xs text-green-50">{favoriteFoods.length}개의 음식</p>
                  </div>
                </div>
                <button onClick={() => setShowFavorites(false)} className="icon-button bg-white/20 backdrop-blur-sm hover:bg-white/30" aria-label="닫기">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 bg-gray-50">
              {favoriteFoods.length > 0 ? (
                <div className="space-y-2.5">
                  {favoriteFoods.map((food) => (
                    <div key={food.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                      <button onClick={() => addFavoriteFoodToMeal(food)} className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900 mb-1.5">{food.name}</h3>
                        <p className="text-xs text-gray-500">{food.calories}kcal · 단백질 {food.protein}g · 탄수화물 {food.carbs}g · 지방 {food.fat}g</p>
                      </button>
                      <button onClick={() => removeFavoriteFood(food.id)} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 active:scale-90 transition-all" aria-label="즐겨찾기 제거">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-5">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Star className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">즐겨찾기가 비어있습니다</h3>
                  <p className="text-sm text-gray-500 mb-6">음식 검색이나 AI 추천에서<br />별 아이콘을 눌러 즐겨찾기에 추가하세요</p>
                  <button onClick={() => setShowFavorites(false)} className="btn btn-primary">음식 검색하기</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Foods Screen */}
      {showRecentFoods && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="w-full sm:max-w-[390px] h-full bg-white flex flex-col sm:shadow-2xl">
            <div className="flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-500 px-5 pt-8 pb-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Coffee className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">최근에 먹은 음식</h1>
                    <p className="text-xs text-green-50">최근 3일간의 기록</p>
                  </div>
                </div>
                <button onClick={() => setShowRecentFoods(false)} className="icon-button bg-white/20 backdrop-blur-sm hover:bg-white/30" aria-label="닫기">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 bg-gray-50">
              {getRecentFoods().length > 0 ? (
                <div className="space-y-2.5">
                  {getRecentFoods().map((food) => (
                    <div key={food.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
                      <button onClick={() => addRecentFoodToMeal(food)} className="flex-1 text-left">
                        <h3 className="font-semibold text-gray-900 mb-1.5">{food.name}</h3>
                        <p className="text-xs text-gray-500">{food.calories}kcal · 단백질 {food.protein}g · 탄수화물 {food.carbs}g · 지방 {food.fat}g</p>
                      </button>
                      <button onClick={() => toggleFavoriteFood(food, 'recent')} className="w-9 h-9 flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform" aria-label={isFavoriteFood(food.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'}>
                        <Star className={`w-5 h-5 transition-all ${isFavoriteFood(food.id) ? 'text-green-500 fill-green-500' : 'text-gray-300'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-5">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Coffee className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">최근 기록이 없습니다</h3>
                  <p className="text-sm text-gray-500 mb-6">최근 3일간 먹은 음식이 없습니다.<br />음식을 추가하면 여기에 표시됩니다.</p>
                  <button onClick={() => setShowRecentFoods(false)} className="btn btn-primary">음식 검색하기</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <AddFoodModal
        food={selectedSearchFood}
        isOpen={showAddFoodModal}
        initialDate={selectedDate}
        onSaved={() => {
          syncMealsFromStorage();

          if (addFoodModalSource === 'search') {
            resetSearchView();
          }
        }}
        onClose={() => {
          setShowAddFoodModal(false);
          setSelectedSearchFood(null);
          setAddFoodModalSource(null);
        }}
      />
    </>
  );
}
