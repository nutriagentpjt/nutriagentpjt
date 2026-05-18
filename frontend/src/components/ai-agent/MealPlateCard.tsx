import type { ReactNode } from 'react';
import { CircleAlert, CookingPot, Salad, Soup } from 'lucide-react';
import type { MealPlateData } from '@/utils/aiMealPlate';

interface MealPlateCardProps {
  plate: MealPlateData;
}

function renderDescriptionContent(text: string) {
  return text
    .split(/(?<=[.!?。！？])/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment, index) => (
      <span key={`${segment}-${index}`} className="block">
        {segment}
      </span>
    ));
}

function renderMenuContent(text: string) {
  return text
    .split(/\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment, index) => (
      <span key={`${segment}-${index}`} className="block">
        {segment}
      </span>
    ));
}

function PlateSection({
  icon,
  label,
  value,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className={`flex h-full min-h-[128px] flex-col rounded-2xl border px-3 py-3 ${className}`}>
      <div className="flex translate-x-[-4px] items-center justify-center gap-1.5 whitespace-nowrap">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/70 text-gray-700 shadow-sm">
          {icon}
        </div>
        <span className="text-[11px] font-bold tracking-[0.04em] text-gray-600">{label}</span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-center text-[14px] font-medium leading-6 text-gray-900 whitespace-normal break-keep">
          {renderMenuContent(value)}
        </p>
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
      <div className="relative border-b border-[#D8DEE5] bg-white pl-4 pr-12 py-2">
        <div className="flex items-start gap-2">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <div className="min-w-0">
            <p className="text-[11px] leading-5 text-gray-600">
              {renderDescriptionContent(plate.description ?? '밥, 국, 반찬이 한 끼 기준으로 정리된 조합이에요.')}
            </p>
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
            />
          </div>
          <div className="min-w-0 h-full">
            <PlateSection
              icon={<Soup className="h-3.5 w-3.5" />}
              label="국"
              value={plate.soup}
              className="border-[#A9D2EE] bg-sky-50/60"
            />
          </div>
          <div className="min-w-0 h-full">
            <PlateSection
              icon={<Salad className="h-3.5 w-3.5" />}
              label="반찬"
              value={plate.sideDish}
              className="border-[#A5DFC8] bg-emerald-50/60"
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
