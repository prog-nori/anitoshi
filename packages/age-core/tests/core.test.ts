import { describe, it, expect } from 'vitest';
import {
  convertAge,
  listAnimals,
  listProfiles,
  getModelDetails,
  getSourceDetails,
  validateRegistry,
  type ConversionRequest,
} from '../src/index.js';
const dog = (n: number, direction: ConversionRequest['direction'] = 'animal-to-human') =>
  convertAge({ animalId: 'dog', profileId: 'medium', direction, age: { value: n, unit: 'years' } });
describe('research model', () => {
  it('matches representative values without rounding', () => {
    expect(dog(2).convertedAge?.value).toBeCloseTo(42.090354889);
    expect(dog(5).convertedAge?.value).toBeCloseTo(56.751006599);
  });
  it('suppresses extrapolation beyond display bounds', () => {
    for (const n of [0, 0.1, 0.99999, 16.0001, 100]) {
      expect(dog(n).status).toBe('out-of-range');
      expect(dog(n).convertedAge).toBeNull();
    }
    expect(dog(1).status).toBe('converted');
    expect(dog(16).status).toBe('converted');
  });
  it('checks inverse boundaries before exponential evaluation', () => {
    expect(dog(31, 'human-to-animal').convertedAge?.value).toBe(1);
    expect(dog(16 * Math.log(16) + 31, 'human-to-animal').convertedAge?.value).toBeCloseTo(16);
    for (const n of [128.0001, Number.MAX_VALUE])
      expect(dog(n, 'human-to-animal').status).toBe('out-of-range');
  });
  it('accepts every human month from birth through 128 years with explicit extension warnings', () => {
    let previous = 0;
    for (let month = 0; month <= 1536; month++) {
      const result = convertAge({
        animalId: 'dog',
        direction: 'human-to-animal',
        age: { value: month, unit: 'months' },
      });
      expect(result.status).toBe('converted');
      expect(result.convertedAge!.value).toBeGreaterThan(previous);
      expect(result.convertedAge!.value).toBeCloseTo(Math.exp((month / 12 - 31) / 16), 10);
      const extension = month / 12 < 31 || month / 12 > 16 * Math.log(16) + 31;
      expect(result.warnings.includes('mathematical-extension')).toBe(extension);
      expect(result.isExtrapolated).toBe(extension);
      previous = result.convertedAge!.value;
    }
    expect(dog(0, 'human-to-animal').warnings).toContain('birth-not-aligned');
    expect(dog(1, 'human-to-animal').convertedAge!.value).toBeGreaterThan(0);
    expect(dog(28, 'human-to-animal').status).toBe('converted');
    expect(dog(40, 'human-to-animal').warnings).not.toContain('mathematical-extension');
    expect(dog(128, 'human-to-animal').convertedAge!.value).toBeGreaterThan(400);
    expect(
      convertAge({
        animalId: 'dog',
        direction: 'human-to-animal',
        age: { value: 1537, unit: 'months' },
      }).status,
    ).toBe('out-of-range');
  });
  it('is monotonic and round-trips across its interval', () => {
    let previous = 0;
    for (let n = 1; n <= 16; n += 0.125) {
      const value = dog(n).convertedAge!.value;
      expect(value).toBeGreaterThan(previous);
      expect(dog(value, 'human-to-animal').convertedAge!.value).toBeCloseTo(n, 10);
      previous = value;
    }
  });
  it('uses the same model for every dog persona and flags population extrapolation', () => {
    for (const p of listProfiles('dog')) {
      const r = convertAge({
        animalId: 'dog',
        profileId: p.id,
        direction: 'animal-to-human',
        age: { value: 2, unit: 'years' },
      });
      expect(r.convertedAge).toEqual(dog(2).convertedAge);
      expect(r.isExtrapolated).toBe(true);
      expect(r.warnings).toContain('population-extrapolation');
    }
  });
  it('normalizes months', () =>
    expect(
      convertAge({
        animalId: 'dog',
        direction: 'animal-to-human',
        age: { value: 24, unit: 'months' },
      }).convertedAge,
    ).toEqual(dog(2).convertedAge));
});
describe('validation and stage results', () => {
  it.each([-1, NaN, Infinity, -Infinity])('rejects %s', (value) =>
    expect(dog(value).status).toBe('invalid-input'),
  );
  it.each([
    { animalId: 'missing' },
    { profileId: 'unknown' },
    { direction: 'sideways' },
    { age: { value: 1, unit: 'days' } },
    { age: { value: '2', unit: 'years' } },
    { age: null },
  ])('rejects malformed runtime request %s', (patch) => {
    expect(
      convertAge({
        animalId: 'dog',
        direction: 'animal-to-human',
        age: { value: 2, unit: 'years' },
        ...patch,
      } as ConversionRequest).status,
    ).toBe('invalid-input');
  });
  it('handles absent request', () =>
    expect(convertAge(null as unknown as ConversionRequest).status).toBe('invalid-input'));
  it.each([
    [0, 'kitten'],
    [0.999, 'kitten'],
    [1, 'young-adult'],
    [6.9, 'young-adult'],
    [7, 'mature-adult'],
    [10, 'mature-adult'],
    [10.01, 'senior'],
  ])('classifies cat %s', (value, stage) => {
    const r = convertAge({
      animalId: 'cat',
      direction: 'animal-to-human',
      age: { value: value as number, unit: 'years' },
    });
    expect(r.status).toBe('converted');
    expect(r.lifeStage).toBe(stage);
    expect(r.convertedAge).not.toBeNull();
  });
  it('converts cat human age without treating the result as an observed life stage', () => {
    const result = convertAge({
      animalId: 'cat',
      direction: 'human-to-animal',
      age: { value: 40, unit: 'years' },
    });
    expect(result.convertedAge?.value).toBe(6);
    expect(result.lifeStage).toBeNull();
  });
});
describe('registry and independent API', () => {
  it('has 6 species and 10 personas, complete evidence and no duplicate references', () => {
    expect(validateRegistry()).toEqual([]);
    expect(listAnimals()).toHaveLength(6);
    expect(listAnimals().reduce((n, a) => n + Math.max(1, a.profiles.length), 0)).toBe(10);
    for (const a of listAnimals()) {
      const m = getModelDetails(a.modelId)!;
      expect(m.version).toBeTruthy();
      for (const id of m.sourceIds) expect(getSourceDetails(id)?.url).toMatch(/^https:/);
    }
  });
  it('detects duplicates, missing models and sources', () => {
    const a = listAnimals();
    expect(validateRegistry([...a, a[0]!])).toContain('duplicate-animal');
    expect(validateRegistry([{ ...a[0]!, modelId: 'absent' }])).toContain('missing-model:absent');
    expect(validateRegistry(a, undefined, []).some((e) => e.startsWith('missing-source:'))).toBe(
      true,
    );
  });
  it('does not expose mutable internal state', () => {
    const a = listAnimals();
    a[0]!.id = 'broken';
    const m = getModelDetails('dog-wang')!;
    m.id = 'broken';
    expect(dog(2).status).toBe('converted');
    expect(validateRegistry()).toEqual([]);
  });
  it('returns no model for unknown IDs', () => expect(getModelDetails('missing')).toBeUndefined());
});

describe('sourced reference tables', () => {
  const ids = ['cat', 'rabbit', 'hamster', 'budgerigar', 'ferret'];
  const convert = (
    animalId: string,
    value: number,
    direction: ConversionRequest['direction'] = 'animal-to-human',
  ) => convertAge({ animalId, direction, age: { value, unit: 'years' } });
  it.each([
    ['cat', 2, 24],
    ['rabbit', 4, 40],
    ['hamster', 1, 26],
    ['budgerigar', 5, 44],
    ['ferret', 2, 28],
  ])('matches published anchor %s', (id, a, h) => {
    expect(convert(id as string, a as number).convertedAge?.value).toBe(h);
    expect(convert(id as string, h as number, 'human-to-animal').convertedAge?.value).toBe(a);
  });
  it('preserves every published anchor, including irregular slopes', () => {
    for (const id of ids)
      for (const point of getModelDetails(`${id}-reference`)!.table!) {
        const forward = convert(id, point.animalYears);
        expect(forward.convertedAge?.value).toBeCloseTo(point.humanYears, 10);
        expect(forward.isExtrapolated).toBe(false);
        expect(convert(id, point.humanYears, 'human-to-animal').convertedAge?.value).toBeCloseTo(
          point.animalYears,
          10,
        );
      }
    expect(convert('rabbit', 13).convertedAge?.value).toBe(91);
    expect(convert('hamster', 21 / 365.25).convertedAge?.value).toBe(3);
  });
  it('interpolates instead of rounding to table rows', () =>
    expect(convert('cat', 1.5).convertedAge?.value).toBe(19.5));
  it('is monotonic and round-trips every human month through 128 years', () => {
    for (const id of ids) {
      let previous = -1;
      for (let month = 0; month <= 1536; month++) {
        const human = month / 12;
        const inverse = convert(id, human, 'human-to-animal');
        expect(inverse.status).toBe('converted');
        const value = inverse.convertedAge!.value;
        expect(value).toBeGreaterThan(previous);
        expect(convert(id, value).convertedAge!.value).toBeCloseTo(human, 9);
        previous = value;
      }
    }
  });
  it('distinguishes origin assumptions, interpolation and upper extrapolation', () => {
    for (const id of ids) {
      expect(convert(id, 0, 'human-to-animal').convertedAge?.value).toBe(0);
      expect(convert(id, 0).warnings).toContain('table-origin-assumption');
      expect(convert(id, 40, 'human-to-animal').warnings).not.toContain('table-extension');
      expect(convert(id, 128, 'human-to-animal').warnings).toContain('table-extension');
      expect(convert(id, 128, 'human-to-animal').isExtrapolated).toBe(true);
      expect(convert(id, 128.01, 'human-to-animal').status).toBe('out-of-range');
    }
  });
  it('rejects invalid and overflowing input without producing NaN/Infinity', () => {
    for (const id of ids) {
      for (const value of [-1, NaN, Infinity])
        expect(convert(id, value).status).toBe('invalid-input');
      expect(convert(id, Number.MAX_VALUE).status).toBe('out-of-range');
    }
  });
  it('validates table shape and strict monotonicity', () => {
    const m = getModelDetails('cat-reference')!;
    expect(
      validateRegistry(undefined, [
        {
          ...m,
          table: [
            { animalYears: 1, humanYears: 15 },
            { animalYears: 2, humanYears: 14 },
          ],
        },
      ]).some((e) => e.startsWith('invalid-table:')),
    ).toBe(true);
  });
});
