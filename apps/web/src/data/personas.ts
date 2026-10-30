import { listAnimals } from '@anitoshi/age-core';
export type Persona = {
  id: string;
  animalId: string;
  profileId?: string;
  name: string;
  representative: string;
  icon: string;
  number: string;
};
const presentation: Record<string, { name: string; representative: string }> = {
  'dog-toy': { name: '超小型犬', representative: 'チワワ' },
  'dog-small': { name: '小型犬', representative: 'ミニチュアダックスフンド' },
  'dog-medium': { name: '中型犬', representative: '柴犬' },
  'dog-large': { name: '大型犬', representative: 'ゴールデンレトリバー' },
  'dog-giant': { name: '超大型犬', representative: 'グレートデーン' },
  cat: { name: '猫', representative: '家庭猫' },
  rabbit: { name: 'うさぎ', representative: 'カイウサギ' },
  hamster: { name: 'ハムスター', representative: 'ゴールデンハムスター' },
  budgerigar: { name: 'インコ', representative: 'セキセイインコ' },
  ferret: { name: 'フェレット', representative: '家畜化されたフェレット' },
};
const icons = import.meta.glob('../assets/animals/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;
export const personas: Persona[] = listAnimals()
  .flatMap<{ animalId: string; profileId?: string; id: string }>((a) =>
    a.profiles.length
      ? a.profiles.map((p) => ({ animalId: a.id, profileId: p.id, id: `${a.id}-${p.id}` }))
      : [{ animalId: a.id, profileId: undefined, id: a.id }],
  )
  .map((p, i) => ({
    ...p,
    ...(presentation[p.id] ?? { name: p.id, representative: '追加された動物' }),
    icon: icons[`../assets/animals/${p.id}.svg`] ?? '',
    number: String(i + 1).padStart(2, '0'),
  }));
