import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CircleAlert, CookingPot, Salad, Soup } from 'lucide-react';
import type { MealPlateData } from '@/utils/aiMealPlate';

interface MealPlateCardProps {
  plate: MealPlateData;
}

function normalizeDescription(text: string) {
  return text
    .split(/(?<=[.!?。！？])/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join(' ');
}

function DescriptionContent({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [showFadeHint, setShowFadeHint] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateScrollState = () => {
      const nextIsScrollable = element.scrollHeight > element.clientHeight + 1;
      const nextShowFadeHint = nextIsScrollable && element.scrollTop + element.clientHeight < element.scrollHeight - 1;
      setIsScrollable(nextIsScrollable);
      setShowFadeHint(nextShowFadeHint);
    };

    updateScrollState();

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [text]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        tabIndex={isScrollable ? 0 : undefined}
        role={isScrollable ? 'region' : undefined}
        aria-label={isScrollable ? '식단 설명 (스크롤 가능)' : undefined}
        onScroll={(event) => {
          const element = event.currentTarget;
          const nextShowFadeHint = element.scrollTop + element.clientHeight < element.scrollHeight - 1;
          setShowFadeHint(nextShowFadeHint);
        }}
        className={`max-h-10 overflow-y-auto pr-1 text-[11px] leading-5 text-gray-600 ${isScrollable ? 'app-scrollbar touch-pan-y overscroll-y-auto' : ''}`}
        title={text}
      >
        {normalizeDescription(text)}
      </div>
      {showFadeHint ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white via-white/80 to-transparent" />
      ) : null}
    </div>
  );
}

function normalizeMenuItems(text: string) {
  const delimiterSeparated = text
    .split(/\s*(?:,|\/|\||·|ㆍ|\n|(?:\s*[-•]\s*))\s*/g)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (delimiterSeparated.length > 1) {
    return delimiterSeparated;
  }

  const tokens = text
    .split(/\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  const attachableSuffixes = new Set([
    '구이',
    '볶음',
    '조림',
    '무침',
    '찜',
    '튀김',
    '전',
    '장아찌',
    '국',
    '탕',
    '찌개',
    '볶음밥',
    '덮밥',
    '샐러드',
    '스테이크',
    '초밥',
    '말이',
    '롤',
    '비빔',
    '볶음면',
    '파스타',
  ]);

  const mergedItems: string[] = [];

  tokens.forEach((token) => {
    const previous = mergedItems[mergedItems.length - 1];
    if (previous && attachableSuffixes.has(token)) {
      mergedItems[mergedItems.length - 1] = `${previous} ${token}`;
      return;
    }

    mergedItems.push(token);
  });

  return mergedItems;
}

function MenuContent({
  items,
  fadeHintClassName,
}: {
  items: string[];
  fadeHintClassName: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [showFadeHint, setShowFadeHint] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateScrollState = () => {
      const nextIsScrollable = element.scrollHeight > element.clientHeight + 1;
      const nextShowFadeHint = nextIsScrollable && element.scrollTop + element.clientHeight < element.scrollHeight - 1;
      setIsScrollable(nextIsScrollable);
      setShowFadeHint(nextShowFadeHint);
    };

    updateScrollState();

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [items]);

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        tabIndex={isScrollable ? 0 : undefined}
        role={isScrollable ? 'region' : undefined}
        aria-label={isScrollable ? '식판 항목 목록 (스크롤 가능)' : undefined}
        onScroll={(event) => {
          const element = event.currentTarget;
          const nextShowFadeHint = element.scrollTop + element.clientHeight < element.scrollHeight - 1;
          setShowFadeHint(nextShowFadeHint);
        }}
        className={`max-h-[104px] overflow-y-auto text-center text-[13px] font-medium leading-5 text-gray-900 ${isScrollable ? 'app-scrollbar touch-pan-y overscroll-y-auto pr-1' : ''}`}
      >
        <div className="space-y-1">
          {items.map((item, index) => (
            <p
              key={`${item}-${index}`}
              className="break-words [overflow-wrap:anywhere]"
              title={item}
            >
              {item}
            </p>
          ))}
        </div>
      </div>
      {showFadeHint ? (
        <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-5 ${fadeHintClassName}`} />
      ) : null}
    </div>
  );
}

function PlateSection({
  icon,
  label,
  value,
  className,
  fadeHintClassName,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className: string;
  fadeHintClassName: string;
}) {
  const items = normalizeMenuItems(value);

  return (
    <div className={`flex h-full min-h-[128px] flex-col rounded-2xl border px-3 py-3 ${className}`}>
      <div className="flex translate-x-[-4px] items-center justify-center gap-1.5 whitespace-nowrap">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/70 text-gray-700 shadow-sm">
          {icon}
        </div>
        <span className="text-[11px] font-bold tracking-[0.04em] text-gray-600">{label}</span>
      </div>
      <div className="flex flex-1 items-center justify-center overflow-hidden pt-2">
        <MenuContent items={items} fadeHintClassName={fadeHintClassName} />
      </div>
    </div>
  );
}

export function MealPlateCard({ plate }: MealPlateCardProps) {
  const macroSummary = [plate.carbs ? `탄수화물 ${plate.carbs}` : null, plate.protein ? `단백질 ${plate.protein}` : null, plate.fat ? `지방 ${plate.fat}` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="w-full overflow-hidden rounded-[24px] border border-[#D8DEE5] bg-white shadow-sm">
      <div className="relative min-h-[64px] border-b border-[#D8DEE5] bg-white pl-4 pr-12 py-2">
        <div className="flex items-start gap-2">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <div className="min-w-0">
            <DescriptionContent text={plate.description ?? '밥, 국, 반찬이 한 끼 기준으로 정리된 조합이에요.'} />
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2 top-2 flex items-center">
          <div className="h-9 w-7 rounded-[12px] border border-gray-200/80 bg-gray-50/70 shadow-[inset_0_2px_4px_rgba(148,163,184,0.10)]" />
        </div>
      </div>

      <div className="relative pl-2.5 pr-11 pb-3 pt-1.5">
        {macroSummary ? (
          <p className="mb-1 px-1 text-center text-[10px] font-medium leading-4 text-gray-400">
            {macroSummary}
          </p>
        ) : null}
        <div className="grid grid-cols-3 items-stretch gap-2">
          <div className="min-w-0 h-full">
            <PlateSection
              icon={<CookingPot className="h-3.5 w-3.5" />}
              label="밥"
              value={plate.rice}
              className="border-[#E8C97F] bg-amber-50/60"
              fadeHintClassName="bg-gradient-to-t from-amber-50 via-amber-50/85 to-transparent"
            />
          </div>
          <div className="min-w-0 h-full">
            <PlateSection
              icon={<Soup className="h-3.5 w-3.5" />}
              label="국"
              value={plate.soup}
              className="border-[#A9D2EE] bg-sky-50/60"
              fadeHintClassName="bg-gradient-to-t from-sky-50 via-sky-50/85 to-transparent"
            />
          </div>
          <div className="min-w-0 h-full">
            <PlateSection
              icon={<Salad className="h-3.5 w-3.5" />}
              label="반찬"
              value={plate.sideDish}
              className="border-[#A5DFC8] bg-emerald-50/60"
              fadeHintClassName="bg-gradient-to-t from-emerald-50 via-emerald-50/85 to-transparent"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-3 right-2 top-3 flex items-stretch">
          <div className="w-7 rounded-[14px] border border-gray-200/80 bg-gray-50/70 shadow-[inset_0_2px_5px_rgba(148,163,184,0.12)]" />
        </div>
      </div>
    </div>
  );
}
