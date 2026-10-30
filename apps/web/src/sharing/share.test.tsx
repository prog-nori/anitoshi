import { describe, expect, it } from 'vitest';
import { convertAge } from '@anitoshi/age-core';
import { publicShareUrl, shareContent } from './share';
const persona = {
  id: 'cat',
  animalId: 'cat',
  name: '猫',
  representative: '家庭猫',
  icon: '',
  number: '06',
};
describe('sharing', () => {
  it('strips input parameters and rejects local or unsafe URLs', () => {
    expect(publicShareUrl(undefined, 'https://example.com/app/?age=40#result')).toBe(
      'https://example.com/app/',
    );
    expect(publicShareUrl('https://example.org/', 'http://localhost:5173')).toBe(
      'https://example.org/',
    );
    for (const url of [
      'http://localhost:5173',
      'https://127.0.0.1/',
      'https://192.168.1.2/',
      'https://[::1]/',
      'javascript:alert(1)',
      'https://user:pass@example.com',
    ])
      expect(publicShareUrl(url, '')).toBeNull();
  });
  it('encodes the preview faithfully for X and LINE', () => {
    const result = convertAge({
      animalId: 'cat',
      direction: 'human-to-animal',
      age: { value: 40, unit: 'years' },
    });
    const content = shareContent(result, persona, 'human-to-animal', 'https://example.com/');
    expect(content.amount).toBe('約6歳');
    expect(content.text).not.toContain('40');
    expect(new URL(content.xUrl).searchParams.get('text')).toBe(content.text);
    expect(new URL(content.lineUrl).searchParams.get('text')).toBe(
      content.text + '\nhttps://example.com/',
    );
  });
  it('preserves extension warnings at zero and the upper boundary', () => {
    for (const value of [0, 128]) {
      const result = convertAge({
        animalId: 'cat',
        direction: 'human-to-animal',
        age: { value, unit: 'years' },
      });
      const content = shareContent(result, persona, 'human-to-animal', null);
      expect(content.text).toContain('仮の計算');
      expect(content.caution).toContain('生存可能性を示しません');
      expect(new URL(content.xUrl).searchParams.has('url')).toBe(false);
    }
  });
  it('names the human result in the reverse direction', () => {
    const result = convertAge({
      animalId: 'cat',
      direction: 'animal-to-human',
      age: { value: 2, unit: 'years' },
    });
    expect(shareContent(result, persona, 'animal-to-human', null).headline).toContain('人間の年齢');
  });
});
