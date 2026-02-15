import { User } from "lucide-react";

export default function ProfilePage() {
  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-5 py-4">
          <h1 className="text-lg font-semibold text-gray-900 text-center">프로필</h1>
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <User className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-base font-semibold text-gray-900">프로필 페이지</h2>
        </div>
      </div>
    </>
  );
}
