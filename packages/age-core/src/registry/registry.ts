import { animals } from '../animals/animals.js';
import { models } from '../models/models.js';
import { sources } from '../evidence/sources.js';
import type { AnimalDefinition, ModelMetadata, Source } from '../domain/types.js';
function clone<T>(value: T): T {
  return value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T);
}
// Copies protect deterministic conversion against mutations by API consumers.
export const listAnimals = (): AnimalDefinition[] => clone([...animals]);
export const listProfiles = (animalId: string) =>
  clone(animals.find((a) => a.id === animalId)?.profiles ?? []);
export const getModelDetails = (id: string): ModelMetadata | undefined =>
  clone(models.find((m) => m.id === id));
export const getSourceDetails = (id: string): Source | undefined =>
  clone(sources.find((s) => s.id === id));
export function validateRegistry(
  a: readonly AnimalDefinition[] = animals,
  m: readonly ModelMetadata[] = models,
  s: readonly Source[] = sources,
): string[] {
  const errors: string[] = [];
  for (const [label, rows] of [
    ['animal', a],
    ['model', m],
    ['source', s],
  ] as const) {
    if (new Set(rows.map((r) => r.id)).size !== rows.length) errors.push(`duplicate-${label}`);
  }
  for (const animal of a) {
    if (new Set(animal.profiles.map((p) => p.id)).size !== animal.profiles.length)
      errors.push(`duplicate-profile:${animal.id}`);
    for (const id of [animal.modelId, ...animal.profiles.map((p) => p.modelId)]) {
      if (!m.some((model) => model.id === id && model.speciesId === animal.id))
        errors.push(`missing-model:${id}`);
    }
    for (const p of animal.profiles)
      if (!m.find((model) => model.id === p.modelId)?.profileIds.includes(p.id))
        errors.push(`missing-profile:${p.id}`);
  }
  for (const model of m) {
    if (model.type === 'reference-table') {
      const points = model.table;
      if (
        !points ||
        points.length < 2 ||
        points.some(
          (p, i) =>
            !Number.isFinite(p.animalYears) ||
            !Number.isFinite(p.humanYears) ||
            p.animalYears <= 0 ||
            p.humanYears <= 0 ||
            (i > 0 &&
              (p.animalYears <= points[i - 1]!.animalYears ||
                p.humanYears <= points[i - 1]!.humanYears)),
        )
      )
        errors.push(`invalid-table:${model.id}`);
    }
    if (!a.some((animal) => animal.id === model.speciesId))
      errors.push(`missing-animal:${model.id}`);
    if (!model.sourceIds.length) errors.push(`missing-source:${model.id}`);
    for (const id of model.sourceIds)
      if (!s.some((source) => source.id === id)) errors.push(`missing-source:${id}`);
    if (
      ['research-formula', 'reference-table'].includes(model.type) &&
      (model.verification !== 'verified' ||
        model.sourceIds.some(
          (id) => s.find((source) => source.id === id)?.verification !== 'verified',
        ))
    )
      errors.push(`unverified-numeric-model:${model.id}`);
  }
  return errors;
}
