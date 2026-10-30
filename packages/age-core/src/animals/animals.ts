import type { AnimalDefinition } from '../domain/types.js';
import { dogProfiles } from '../models/models.js';
export const animals: readonly AnimalDefinition[] = [
  {
    id: 'dog',
    scientificName: 'Canis lupus familiaris',
    modelId: 'dog-wang',
    profiles: dogProfiles.map((id) => ({ id, modelId: 'dog-wang' })),
  },
  { id: 'cat', scientificName: 'Felis catus', modelId: 'cat-reference', profiles: [] },
  ...Object.entries({
    rabbit: 'Oryctolagus cuniculus (domestic)',
    hamster: 'Mesocricetus auratus',
    budgerigar: 'Melopsittacus undulatus',
    ferret: 'Mustela putorius furo',
  }).map(([id, scientificName]) => ({
    id,
    scientificName,
    modelId: `${id}-reference`,
    profiles: [],
  })),
];
