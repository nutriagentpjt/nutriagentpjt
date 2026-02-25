/**
 * 날짜를 "YYYY-MM-DD" 형식으로 포맷
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * 날짜를 "MM월 DD일" 형식으로 포맷
 */
export function formatDateKorean(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일`;
}

/**
 * 날짜를 "YYYY년 MM월 DD일" 형식으로 포맷
 */
export function formatDateKoreanFull(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}년 ${month}월 ${day}일`;
}

/**
 * 시간을 "HH:MM" 형식으로 포맷
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 날짜와 시간을 "MM/DD HH:MM" 형식으로 포맷
 */
export function formatDateTime(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

/**
 * 두 날짜가 같은 날인지 확인
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2);
}

/**
 * 오늘인지 확인
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}
