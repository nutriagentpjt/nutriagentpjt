import { Camera, Search } from 'lucide-react';

interface FoodSearchInputProps {
  onCameraClick?: () => void;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onSuggestionSelect?: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  value: string;
}

export function FoodSearchInput({
  onCameraClick,
  onChange,
  onSubmit,
  onSuggestionSelect,
  placeholder = '음식 검색...',
  suggestions = [],
  value,
}: FoodSearchInputProps) {
  return (
    <div className="flex items-center gap-2.5">
      <button
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-gray-100/50 bg-gradient-to-br from-white to-gray-50 shadow-sm transition-all hover:shadow-md active:scale-95"
        onClick={onCameraClick}
        type="button"
      >
        <Camera className="h-5 w-5 text-green-500" />
      </button>
      <div className="relative flex-1">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit?.();
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-gray-100/50 bg-gradient-to-br from-white to-gray-50/50 pl-11 pr-3.5 text-sm text-gray-900 shadow-sm transition-shadow placeholder:text-gray-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </form>

        {suggestions.length > 0 ? (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-100/50 bg-white shadow-lg">
            {suggestions.map((result, index) => (
              <button
                key={result}
                onClick={() => onSuggestionSelect?.(result)}
                className={`flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 ${
                  index !== suggestions.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                type="button"
              >
                <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="flex-1 text-sm text-gray-900">{result}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
