import type { Food } from '@/types';

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

function getVariantsBoost(variants?: number): number {
  if (!variants || variants <= 0) {
    return 0;
  }

  return Math.min(variants, 1000) * 5;
}

export function scoreNameRelevance(name: string, query: string): number {
  const normalizedName = normalizeText(name);
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return 0;
  }

  if (normalizedName === normalizedQuery) {
    return 100_000 - normalizedName.length * 10;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    const extraLength = normalizedName.length - normalizedQuery.length;
    return 80_000 - extraLength * 100 - normalizedName.length;
  }

  const includesIndex = normalizedName.indexOf(normalizedQuery);
  if (includesIndex >= 0) {
    const extraLength = normalizedName.length - normalizedQuery.length;
    return 60_000 - includesIndex * 1_000 - extraLength * 100 - normalizedName.length;
  }

  const queryTokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const matchedTokens = queryTokens.filter((token) => normalizedName.includes(token)).length;

  if (matchedTokens > 0) {
    return 40_000 + matchedTokens * 500 - normalizedName.length;
  }

  return -normalizedName.length;
}

export function sortFoodsByRelevance<T extends Pick<Food, 'name'> & Partial<Pick<Food, 'variants'>>>(foods: T[], query: string): T[] {
  return [...foods].sort((left, right) => {
    const leftScore = scoreNameRelevance(left.name, query) + getVariantsBoost(left.variants);
    const rightScore = scoreNameRelevance(right.name, query) + getVariantsBoost(right.variants);
    const scoreDiff = rightScore - leftScore;
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return left.name.localeCompare(right.name, 'ko');
  });
}

export function sortNamesByRelevance(
  names: string[],
  query: string,
  counts?: Record<string, number>,
): string[] {
  return [...names].sort((left, right) => {
    const scoreDiff =
      scoreNameRelevance(right, query) + getVariantsBoost(counts?.[right]) -
      (scoreNameRelevance(left, query) + getVariantsBoost(counts?.[left]));
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return left.localeCompare(right, 'ko');
  });
}
