export type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G';

type ManaPip =
  // Plain colored: {R}, {G}, etc.
  | { kind: 'COLORED'; color: ManaColor; amount: 1 }

  // Generic: {3}, {5}, etc.
  | { kind: 'GENERIC'; amount: number }

  // Colorless: {C}
  | { kind: 'COLORLESS'; amount: 1 }

  // Snow: {S}
  | { kind: 'SNOW'; amount: 1 }

  // Hybrid colored: {W/U}, {G/U}, etc.
  // You must pay one of the colors.
  | { kind: 'HYBRID_COLORED'; colors: [ManaColor, ManaColor] }

  // Hybrid 2-color: {2/W}, {2/U}, etc.
  // You must pay either N generic mana or one of the colors.
  | { kind: 'HYBRID_2_COLOR'; genericAmount: number; color: ManaColor }

  // Phyrexian: {U/P}, {G/P}, etc.
  // Pay 1 colored mana of that color OR 2 life.
  | { type: 'PHYREXIAN'; color: ManaColor }

  // X pip: {X}
  // Not a concrete number until casting; you’ll substitute an actual generic pip later.
  | { type: 'X' };

export interface ManaCost {
  pips: ManaPip[];
  raw?: string;
}

const MANA_COLORS: readonly ManaColor[] = Object.freeze([
  'W',
  'U',
  'B',
  'R',
  'G',
]);

const isManaColor = (value: string): value is ManaColor => {
  return MANA_COLORS.includes(value as ManaColor);
};

const isNumeric = (value: string): boolean => /^\d+$/.test(value);

function parseSimplePip(token: string): ManaPip | null {
  if (isNumeric(token)) {
    return { kind: 'GENERIC', amount: Number(token) };
  }

  if (isManaColor(token)) {
    return { kind: 'COLORED', color: token, amount: 1 };
  }

  if (token === 'C') {
    return { kind: 'COLORLESS', amount: 1 };
  }

  if (token === 'S') {
    return { kind: 'SNOW', amount: 1 };
  }

  if (token === 'X') {
    return { type: 'X' };
  }

  return null;
}

function parseHybridPip(token: string, originalToken: string): ManaPip {
  const pieces = token.split('/');
  if (pieces.length !== 2) {
    throw new Error(`Unknown mana pip: ${originalToken}`);
  }

  const [first, second] = pieces;

  if (isManaColor(first) && isManaColor(second)) {
    return { kind: 'HYBRID_COLORED', colors: [first, second] };
  }

  if (isNumeric(first) && isManaColor(second)) {
    return {
      kind: 'HYBRID_2_COLOR',
      genericAmount: Number(first),
      color: second,
    };
  }

  if (isManaColor(first) && second === 'P') {
    return { type: 'PHYREXIAN', color: first };
  }

  throw new Error(`Unknown mana pip: ${originalToken}`);
}

function parsePip(token: string, originalToken: string): ManaPip {
  const simplePip = parseSimplePip(token);
  if (simplePip !== null) {
    return simplePip;
  }

  if (token.includes('/')) {
    return parseHybridPip(token, originalToken);
  }

  throw new Error(`Unknown mana pip: ${originalToken}`);
}

export function parseManaCost(raw: string): ManaCost {
  const normalized = raw.trim();
  if (!normalized) {
    return { pips: [], raw: '' };
  }

  const pipRegex = /\{([^}]+)\}/g;
  const pips: ManaPip[] = [];
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = pipRegex.exec(normalized)) !== null) {
    if (match.index !== lastIndex) {
      throw new Error(`Invalid mana cost format: ${raw}`);
    }
    lastIndex = pipRegex.lastIndex;
    const token = match[1];
    pips.push(parsePip(token, match[0]));
  }

  if (lastIndex !== normalized.length) {
    throw new Error(`Invalid mana cost format: ${raw}`);
  }

  return { pips, raw: normalized };
}
