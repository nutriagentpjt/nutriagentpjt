import type { Food } from '@/types';

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

export function scoreNameRelevance(name: string, query: string): number {
  const normalizedName = normalizeText(name);
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return 0;
  }

  if (normalizedName === normalizedQuery) {
    return 10_000 - normalizedName.length;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return 8_000 - normalizedName.length;
  }

  const includesIndex = normalizedName.indexOf(normalizedQuery);
  if (includesIndex >= 0) {
    return 6_000 - includesIndex * 100 - normalizedName.length;
  }

  const queryTokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  const matchedTokens = queryTokens.filter((token) => normalizedName.includes(token)).length;

  if (matchedTokens > 0) {
    return 4_000 + matchedTokens * 100 - normalizedName.length;
  }

  return -normalizedName.length;
}

export function sortFoodsByRelevance<T extends Pick<Food, 'name'>>(foods: T[], query: string): T[] {
  return [...foods].sort((left, right) => {
    const scoreDiff = scoreNameRelevance(right.name, query) - scoreNameRelevance(left.name, query);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return left.name.localeCompare(right.name, 'ko');
  });
}

export function sortNamesByRelevance(names: string[], query: string): string[] {
  return [...names].sort((left, right) => {
    const scoreDiff = scoreNameRelevance(right, query) - scoreNameRelevance(left, query);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return left.localeCompare(right, 'ko');
  });
}
