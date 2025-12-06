import { defineCard } from '../../core/card/card';
import { parseManaCost } from '../../core/costs/mana-costs';

export default defineCard({
  scryfallId: 'ddaa110c-ee6e-4df5-a6c8-3fdf4b89293f',
  type: 'instant',
  name: 'Lightning Bolt',
  manaCost: parseManaCost('{R}'),
  abilities: [],
});
