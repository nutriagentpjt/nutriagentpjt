import { ChevronLeft } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Switch } from '@/components/ui/switch';
import { showToast } from '@/components/common/Toast/Toast';
import { useSettingsStore } from '@/store';
import type { WeeklyReminderDay } from '@/store/settingsStore';
import { useShallow } from 'zustand/react/shallow';

interface NotificationSettingsProps {
  onClose: () => void;
}

const weeklyDayLabelMap: Record<WeeklyReminderDay, string> = {
  MONDAY: '월요일',
  TUESDAY: '화요일',
  WEDNESDAY: '수요일',
  THURSDAY: '목요일',
  FRIDAY: '금요일',
  SATURDAY: '토요일',
  SUNDAY: '일요일',
};

function SettingSection({
  title,
  enabled,
  onEnabledChange,
  disabled,
  children,
}: {
  title: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  disabled: boolean;
  children?: ReactNode;
}) {
  const isSectionEnabled = !disabled && enabled;

  return (
    <section className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-opacity ${disabled ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
        </div>
        <Switch
          checked={isSectionEnabled}
          disabled={disabled}
          onCheckedChange={onEnabledChange}
          aria-label={`${title} 켜기/끄기`}
        />
      </div>

      <div
        aria-hidden={!isSectionEnabled}
        className={`grid transition-all duration-300 ease-out ${
          isSectionEnabled ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className={`space-y-3 ${isSectionEnabled ? 'mt-4' : 'mt-0'}`}>{children}</div>
        </div>
      </div>
    </section>
  );
}

function TimeField({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenPicker = () => {
    if (disabled) {
      return;
    }

    const input = inputRef.current;
    if (!input) {
      return;
    }

    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  };

  return (
    <div className="block">
      <label htmlFor={inputId} className="mb-2 block text-xs font-semibold text-gray-600">
        {label}
      </label>
      <div onClick={handleOpenPicker} className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}>
        <input
          id={inputId}
          ref={inputRef}
          type="time"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="w-full min-w-0 cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/70 disabled:cursor-not-allowed disabled:bg-gray-100"
        />
      </div>
    </div>
  );
}

export default function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [waterTimeError, setWaterTimeError] = useState('');

  const {
    notifications,
    setNotificationsEnabled,
    updateMealReminders,
    updateWaterReminder,
    updateWeightReminder,
    updateAiCoachingReminder,
  } = useSettingsStore(
    useShallow((state) => ({
      notifications: state.notifications,
      setNotificationsEnabled: state.setNotificationsEnabled,
      updateMealReminders: state.updateMealReminders,
      updateWaterReminder: state.updateWaterReminder,
      updateWeightReminder: state.updateWeightReminder,
      updateAiCoachingReminder: state.updateAiCoachingReminder,
    })),
  );

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (feedbackTimeoutRef.current != null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  const isNotificationsDisabled = !notifications.enabled;
  const waterIntervalOptions = useMemo(() => [1, 2, 3, 4], []);
  const showSavedFeedback = (message: string) => {
    setFeedbackMessage(message);
    if (feedbackTimeoutRef.current != null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedbackMessage('');
    }, 1800);
  };

  const handleWaterTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const nextStartTime = field === 'startTime' ? value : notifications.waterReminder.startTime;
    const nextEndTime = field === 'endTime' ? value : notifications.waterReminder.endTime;

    if (nextStartTime >= nextEndTime) {
      const message = '물 알림 시작 시간은 종료 시간보다 빨라야 해요.';
      setWaterTimeError(message);
      showToast.error(message);
      return;
    }

    setWaterTimeError('');
    updateWaterReminder({ [field]: value });
    showSavedFeedback('물 알림 설정이 저장되었어요.');
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-settings-title"
    >
      <div className="relative flex h-full w-full flex-col bg-white sm:max-w-[390px] sm:shadow-2xl">
        <div
          className={`pointer-events-none absolute left-1/2 z-10 w-[calc(100%-2.5rem)] max-w-[320px] -translate-x-1/2 transition-all duration-200 ${
            feedbackMessage
              ? 'translate-y-0 opacity-100'
              : 'translate-y-2 opacity-0'
          }`}
          style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
          aria-live="polite"
        >
          <div className="rounded-2xl border border-green-200 bg-white/95 px-4 py-3 text-xs font-semibold text-green-700 shadow-lg backdrop-blur-sm">
            {feedbackMessage}
          </div>
        </div>

        <div className="flex-shrink-0 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-5 py-4">
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="알림 설정 닫기"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100 active:bg-gray-200"
            >
              <ChevronLeft className="h-6 w-6 text-gray-700" />
            </button>
            <h1 id="notification-settings-title" className="text-lg font-bold text-gray-900">
              알림 설정
            </h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 px-5 py-4">
          <div className="space-y-3">
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">전체 알림</h2>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    푸시 알림 전체를 한 번에 켜거나 끌 수 있어요.
                  </p>
                </div>
                <Switch
                  checked={notifications.enabled}
                  onCheckedChange={(enabled) => {
                    setNotificationsEnabled(enabled);
                    showSavedFeedback(enabled ? '전체 알림이 켜졌어요.' : '전체 알림이 꺼졌어요.');
                  }}
                  aria-label="전체 알림 켜기/끄기"
                />
              </div>
            </section>

            <SettingSection
              title="식사 알림"
              enabled={notifications.mealReminders.enabled}
              onEnabledChange={(enabled) => {
                updateMealReminders({ enabled });
                showSavedFeedback(enabled ? '식사 알림이 켜졌어요.' : '식사 알림이 꺼졌어요.');
              }}
              disabled={isNotificationsDisabled}
            >
              <div className="space-y-3">
                <TimeField
                  label="아침"
                  value={notifications.mealReminders.breakfastTime}
                  onChange={(value) => {
                    updateMealReminders({ breakfastTime: value });
                    showSavedFeedback('식사 알림 시간이 저장되었어요.');
                  }}
                  disabled={isNotificationsDisabled || !notifications.mealReminders.enabled}
                />
                <TimeField
                  label="점심"
                  value={notifications.mealReminders.lunchTime}
                  onChange={(value) => {
                    updateMealReminders({ lunchTime: value });
                    showSavedFeedback('식사 알림 시간이 저장되었어요.');
                  }}
                  disabled={isNotificationsDisabled || !notifications.mealReminders.enabled}
                />
                <TimeField
                  label="저녁"
                  value={notifications.mealReminders.dinnerTime}
                  onChange={(value) => {
                    updateMealReminders({ dinnerTime: value });
                    showSavedFeedback('식사 알림 시간이 저장되었어요.');
                  }}
                  disabled={isNotificationsDisabled || !notifications.mealReminders.enabled}
                />
              </div>
            </SettingSection>

            <SettingSection
              title="물 알림"
              enabled={notifications.waterReminder.enabled}
              onEnabledChange={(enabled) => {
                updateWaterReminder({ enabled });
                showSavedFeedback(enabled ? '물 알림이 켜졌어요.' : '물 알림이 꺼졌어요.');
              }}
              disabled={isNotificationsDisabled}
            >
              <div className="grid grid-cols-2 gap-3">
                <TimeField
                  label="시작 시간"
                  value={notifications.waterReminder.startTime}
                  onChange={(value) => handleWaterTimeChange('startTime', value)}
                  disabled={isNotificationsDisabled || !notifications.waterReminder.enabled}
                />
                <TimeField
                  label="종료 시간"
                  value={notifications.waterReminder.endTime}
                  onChange={(value) => handleWaterTimeChange('endTime', value)}
                  disabled={isNotificationsDisabled || !notifications.waterReminder.enabled}
                />
              </div>
              {waterTimeError ? (
                <p className="text-xs font-medium text-rose-500">{waterTimeError}</p>
              ) : null}
              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-gray-600">알림 간격</span>
                <select
                  value={notifications.waterReminder.intervalHours}
                  disabled={isNotificationsDisabled || !notifications.waterReminder.enabled}
                  onChange={(event) => {
                    updateWaterReminder({ intervalHours: Number.parseInt(event.target.value, 10) as 1 | 2 | 3 | 4 });
                    showSavedFeedback('물 알림 간격이 저장되었어요.');
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/70 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  {waterIntervalOptions.map((hours) => (
                    <option key={hours} value={hours}>
                      {hours}시간마다
                    </option>
                  ))}
                </select>
              </label>
            </SettingSection>

            <SettingSection
              title="체중 기록 알림"
              enabled={notifications.weightReminder.enabled}
              onEnabledChange={(enabled) => {
                updateWeightReminder({ enabled });
                showSavedFeedback(enabled ? '체중 기록 알림이 켜졌어요.' : '체중 기록 알림이 꺼졌어요.');
              }}
              disabled={isNotificationsDisabled}
            >
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-gray-600">요일</span>
                  <select
                    value={notifications.weightReminder.day}
                    disabled={isNotificationsDisabled || !notifications.weightReminder.enabled}
                    onChange={(event) => {
                      updateWeightReminder({ day: event.target.value as WeeklyReminderDay });
                      showSavedFeedback('체중 기록 알림 요일이 저장되었어요.');
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 transition-colors focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/70 disabled:cursor-not-allowed disabled:bg-gray-100"
                  >
                    {Object.entries(weeklyDayLabelMap).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <TimeField
                  label="알림 시간"
                  value={notifications.weightReminder.time}
                  onChange={(value) => {
                    updateWeightReminder({ time: value });
                    showSavedFeedback('체중 기록 알림 시간이 저장되었어요.');
                  }}
                  disabled={isNotificationsDisabled || !notifications.weightReminder.enabled}
                />
              </div>
            </SettingSection>

            <SettingSection
              title="AI 코칭 알림"
              enabled={notifications.aiCoachingReminder.enabled}
              onEnabledChange={(enabled) => {
                updateAiCoachingReminder({ enabled });
                showSavedFeedback(enabled ? 'AI 코칭 알림이 켜졌어요.' : 'AI 코칭 알림이 꺼졌어요.');
              }}
              disabled={isNotificationsDisabled}
            >
              <TimeField
                label="알림 시간"
                value={notifications.aiCoachingReminder.time}
                onChange={(value) => {
                  updateAiCoachingReminder({ time: value });
                  showSavedFeedback('AI 코칭 알림 시간이 저장되었어요.');
                }}
                disabled={isNotificationsDisabled || !notifications.aiCoachingReminder.enabled}
              />
            </SettingSection>
          </div>
        </div>
      </div>
    </div>
  );
}
