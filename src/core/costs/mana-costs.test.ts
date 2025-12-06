import { parseManaCost } from './mana-costs';

describe('parseManaCost', () => {
  it('parses colored and generic costs', () => {
    expect(parseManaCost('{3}{R}{G}')).toEqual({
      pips: [
        { kind: 'GENERIC', amount: 3 },
        { kind: 'COLORED', color: 'R', amount: 1 },
        { kind: 'COLORED', color: 'G', amount: 1 }
      ],
      raw: '{3}{R}{G}'
    });
  });

  it('parses colorless and snow pips', () => {
    expect(parseManaCost('{C}{S}')).toEqual({
      pips: [
        { kind: 'COLORLESS', amount: 1 },
        { kind: 'SNOW', amount: 1 }
      ],
      raw: '{C}{S}'
    });
  });

  it('parses hybrid, hybrid 2-color, phyrexian, and X pips', () => {
    expect(parseManaCost('{W/U}{2/G}{U/P}{X}')).toEqual({
      pips: [
        { kind: 'HYBRID_COLORED', colors: ['W', 'U'] },
        { kind: 'HYBRID_2_COLOR', genericAmount: 2, color: 'G' },
        { type: 'PHYREXIAN', color: 'U' },
        { type: 'X' }
      ],
      raw: '{W/U}{2/G}{U/P}{X}'
    });
  });

  it('returns an empty cost for blank strings', () => {
    expect(parseManaCost('')).toEqual({ pips: [], raw: '' });
    expect(parseManaCost('   ')).toEqual({ pips: [], raw: '' });
  });

  it('throws for unknown pip text', () => {
    expect(() => parseManaCost('{Q}')).toThrow('Unknown mana pip: {Q}');
  });
});
