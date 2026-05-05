import { ThumbsDown, ThumbsUp } from 'lucide-react';

interface FeedbackButtonsProps {
  preference?: 'liked' | 'disliked' | null;
  onLike?: () => void;
  onDislike?: () => void;
}

export default function FeedbackButtons({
  preference = null,
  onLike,
  onDislike,
}: FeedbackButtonsProps) {
  return (
    <>
      <button
        onClick={onLike}
        className={`min-touch flex-1 rounded-xl py-3.5 font-semibold transition-all active:scale-[0.97] ${
          preference === 'liked' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        aria-label="선호"
        aria-pressed={preference === 'liked'}
      >
        <span className="flex items-center justify-center gap-2 text-sm">
          <ThumbsUp className="h-5 w-5" />
          좋아요
        </span>
      </button>

      <button
        onClick={onDislike}
        className={`min-touch flex-1 rounded-xl py-3.5 font-semibold transition-all active:scale-[0.97] ${
          preference === 'disliked'
            ? 'bg-rose-500 text-white shadow-md'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        aria-label="비선호"
        aria-pressed={preference === 'disliked'}
      >
        <span className="flex items-center justify-center gap-2 text-sm">
          <ThumbsDown className="h-5 w-5" />
          싫어요
        </span>
      </button>
    </>
  );
}
