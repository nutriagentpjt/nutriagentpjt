export interface MealPlateData {
  rice: string;
  soup: string;
  sideDish: string;
  description?: string;
}

export type MealPlateSegment =
  | { type: 'text'; content: string }
  | { type: 'plate'; content: MealPlateData };

const MEAL_PLATE_BLOCK_REGEX = /\[MEAL_PLATE\]([\s\S]*?)\[\/MEAL_PLATE\]/g;
const RICE_REGEX = /^밥\s*:\s*(.+)$/m;
const SOUP_REGEX = /^국\s*:\s*(.+)$/m;
const SIDE_DISH_REGEX = /^반찬\s*:\s*(.+)$/m;
const DESCRIPTION_REGEX = /^설명\s*:\s*(.+)$/m;

function parseMealPlateBlock(block: string): MealPlateData | null {
  const rice = block.match(RICE_REGEX)?.[1]?.trim();
  const soup = block.match(SOUP_REGEX)?.[1]?.trim();
  const sideDish = block.match(SIDE_DISH_REGEX)?.[1]?.trim();
  const description = block.match(DESCRIPTION_REGEX)?.[1]?.trim();

  if (!rice || !soup || !sideDish) {
    return null;
  }

  return {
    rice,
    soup,
    sideDish,
    description,
  };
}

export function parseMealPlateSegments(content: string): MealPlateSegment[] {
  const segments: MealPlateSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(MEAL_PLATE_BLOCK_REGEX)) {
    const start = match.index ?? 0;
    const rawBlock = match[0];
    const body = match[1];

    if (start > lastIndex) {
      const text = content.slice(lastIndex, start).trim();
      if (text) {
        segments.push({ type: 'text', content: text });
      }
    }

    const parsed = parseMealPlateBlock(body);
    if (parsed) {
      segments.push({ type: 'plate', content: parsed });
    } else {
      segments.push({ type: 'text', content: rawBlock.trim() });
    }

    lastIndex = start + rawBlock.length;
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex).trim();
    if (text) {
      segments.push({ type: 'text', content: text });
    }
  }

  if (segments.length === 0) {
    return [{ type: 'text', content }];
  }

  return segments;
}
