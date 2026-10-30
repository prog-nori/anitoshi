import type { ConversionRequest, ConversionResult } from '../domain/types.js';
import { interpolateTable } from '../models/reference-tables.js';
import { animals } from '../animals/animals.js';
import { models, dogRange, dogToHuman, humanToDog, catStage } from '../models/models.js';
export function convertAge(request: ConversionRequest): ConversionResult {
  const result: ConversionResult = {
    status: 'invalid-input',
    animalId: request?.animalId ?? '',
    profileId: request?.profileId,
    convertedAge: null,
    lifeStage: null,
    modelId: null,
    modelVersion: null,
    modelType: 'unavailable',
    sourceIds: [],
    warnings: [],
    isExtrapolated: false,
  };
  const invalid = (code: string): ConversionResult => ({ ...result, warnings: [code] });
  if (!request || !['human-to-animal', 'animal-to-human'].includes(request.direction))
    return invalid('invalid-direction');
  if (!request.age || !['years', 'months'].includes(request.age.unit))
    return invalid('invalid-unit');
  if (
    typeof request.age.value !== 'number' ||
    !Number.isFinite(request.age.value) ||
    request.age.value < 0
  )
    return invalid('invalid-age');
  const animal = animals.find((a) => a.id === request.animalId);
  if (!animal) return invalid('unknown-animal');
  if (request.profileId !== undefined && !animal.profiles.some((p) => p.id === request.profileId))
    return invalid('unknown-profile');
  const model = models.find(
    (m) =>
      m.id === (animal.profiles.find((p) => p.id === request.profileId)?.modelId ?? animal.modelId),
  );
  if (!model) return invalid('missing-model');
  Object.assign(result, {
    modelId: model.id,
    modelVersion: model.version,
    modelType: model.type,
    sourceIds: [...model.sourceIds],
  });
  const years = request.age.unit === 'months' ? request.age.value / 12 : request.age.value;
  if (request.direction === 'human-to-animal' && years > 128)
    return { ...result, status: 'out-of-range', warnings: ['outside-human-input-range'] };
  if (model.verification !== 'verified' || model.type === 'unavailable')
    return { ...result, status: 'unavailable', warnings: ['needs-research'] };
  if (model.type === 'reference-table' && model.table) {
    const forward = request.direction === 'animal-to-human';
    const calculation = interpolateTable(model.table, years, forward);
    if (!Number.isFinite(calculation.value))
      return { ...result, status: 'out-of-range', warnings: ['numeric-overflow'] };
    return {
      ...result,
      status: 'converted',
      convertedAge: { value: calculation.value, unit: 'years' },
      lifeStage: animal.id === 'cat' && forward ? catStage(years) : null,
      isExtrapolated: calculation.extrapolated,
      warnings: [
        'reference-estimate',
        ...(calculation.extrapolated ? ['table-extension'] : []),
        ...(calculation.originAssumption ? ['table-origin-assumption'] : []),
      ],
    };
  }
  if (model.id === 'cat-stages')
    return request.direction === 'animal-to-human'
      ? {
          ...result,
          status: 'stage-only',
          lifeStage: catStage(years),
          warnings: ['no-human-equivalent'],
        }
      : { ...result, status: 'unavailable', warnings: ['reverse-unavailable'] };
  if (model.id === 'dog-wang') {
    const forward = request.direction === 'animal-to-human';
    const min = forward ? dogRange.min : dogToHuman(dogRange.min);
    const max = forward ? dogRange.max : dogToHuman(dogRange.max);
    const outsideReferenceRange = years < min || years > max;
    if (forward && outsideReferenceRange)
      return {
        ...result,
        status: 'out-of-range',
        warnings: ['outside-display-range', 'shared-dog-model'],
      };
    return {
      ...result,
      status: 'converted',
      convertedAge: { value: forward ? dogToHuman(years) : humanToDog(years), unit: 'years' },
      isExtrapolated: outsideReferenceRange || request.profileId !== undefined,
      warnings: [
        outsideReferenceRange ? 'mathematical-extension' : 'research-estimate',
        ...(!forward && years === 0 ? ['birth-not-aligned'] : []),
        'shared-dog-model',
        ...(request.profileId ? ['population-extrapolation'] : []),
      ],
    };
  }
  return { ...result, status: 'unavailable', warnings: ['unsupported-model'] };
}
