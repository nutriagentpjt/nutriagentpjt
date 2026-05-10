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
    <div className={`flex min-h-[128px] flex-col rounded-2xl border px-3 py-3 ${className}`}>
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
  return (
    <div className="w-full overflow-hidden rounded-[24px] border border-[#D8DEE5] bg-white shadow-sm">
      <div className="border-b border-[#D8DEE5] bg-white px-4 py-3">
        <div className="flex items-start gap-2">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <p className="text-[11px] leading-5 text-gray-600">
            {renderDescriptionContent(plate.description ?? '밥, 국, 반찬이 한 끼 기준으로 정리된 조합이에요.')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[1.08fr_1.18fr_1.34fr] gap-2 px-2.5 py-3">
        <div className="min-w-0">
          <PlateSection
            icon={<CookingPot className="h-3.5 w-3.5" />}
            label="밥"
            value={plate.rice}
            className="border-[#E8C97F] bg-amber-50/60"
          />
        </div>
        <div className="min-w-0">
          <PlateSection
            icon={<Soup className="h-3.5 w-3.5" />}
            label="국"
            value={plate.soup}
            className="border-[#A9D2EE] bg-sky-50/60"
          />
        </div>
        <div className="min-w-0">
          <PlateSection
            icon={<Salad className="h-3.5 w-3.5" />}
            label="반찬"
            value={plate.sideDish}
            className="border-[#A5DFC8] bg-emerald-50/60"
          />
        </div>
      </div>
    </div>
  );
}
