import { Sparkles } from 'lucide-react';

interface CoachingMessageProps {
  message?: string;
}

export default function CoachingMessage({ message }: CoachingMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-500/10">
          <Sparkles className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">AI 코칭</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
}
