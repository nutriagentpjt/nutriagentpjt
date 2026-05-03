/**
 * 숫자 유효성 검사
 */
export function isValidNumber(value: any): boolean {
  return !isNaN(value) && isFinite(value);
}

/**
 * 양수 검사
 */
export function isPositiveNumber(value: number): boolean {
  return isValidNumber(value) && value > 0;
}

/**
 * 범위 내 숫자 검사
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return isValidNumber(value) && value >= min && value <= max;
}

/**
 * 이메일 유효성 검사
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 빈 문자열 검사
 */
export function isEmptyString(value: string): boolean {
  return !value || value.trim().length === 0;
}
