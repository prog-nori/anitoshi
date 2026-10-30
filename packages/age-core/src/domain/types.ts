export type Age = Readonly<{ value: number; unit: 'years' | 'months' }>;
export type Direction = 'human-to-animal' | 'animal-to-human';
export type ModelType =
  'research-formula' | 'reference-table' | 'milestone-based' | 'stage-only' | 'unavailable';
export type ConversionRequest = {
  direction: Direction;
  animalId: string;
  profileId?: string;
  age: Age;
};
export type Source = {
  id: string;
  title: string;
  authors: string;
  year: number | null;
  url: string;
  checkedAt: string;
  verification: 'verified' | 'needs-research';
};
export type ModelMetadata = {
  id: string;
  version: string;
  type: ModelType;
  speciesId: string;
  profileIds: readonly string[];
  population: string;
  animalAgeRange: { min: number; max: number } | null;
  table?: readonly { animalYears: number; humanYears: number }[];
  sourceIds: readonly string[];
  verification: 'verified' | 'needs-research';
  limitations: readonly string[];
  meaning: string;
  noticeKeys: readonly string[];
};
export type AnimalProfile = { id: string; modelId: string };
export type AnimalDefinition = {
  id: string;
  scientificName: string;
  modelId: string;
  profiles: readonly AnimalProfile[];
};
export type ConversionResult = {
  status: 'converted' | 'stage-only' | 'unavailable' | 'out-of-range' | 'invalid-input';
  animalId: string;
  profileId?: string;
  convertedAge: Age | null;
  lifeStage: string | null;
  modelId: string | null;
  modelVersion: string | null;
  modelType: ModelType;
  sourceIds: readonly string[];
  warnings: readonly string[];
  isExtrapolated: boolean;
};
