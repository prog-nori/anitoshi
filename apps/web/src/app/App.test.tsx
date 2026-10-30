// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, it, expect } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { App } from './App';
import { AnimalIcon } from '../components/ui/AnimalIcon';
afterEach(cleanup);
describe('conversion interface', () => {
  it('registers all 10 personas and displays a sourced reference estimate', () => {
    render(<App />);
    expect(
      screen.getAllByRole('button', { pressed: false }).length +
        screen.getAllByRole('button', { pressed: true }).length,
    ).toBe(12);
    expect(screen.getByText('1.8')).toBeInTheDocument();
    expect(screen.getByText(/医学的なライフステージや生物学的年齢/)).toBeVisible();
    fireEvent.click(screen.getByText('換算方法について'));
    expect(screen.getByRole('link', { name: /Quantitative Translation/ })).toHaveAttribute(
      'href',
      'https://doi.org/10.1016/j.cels.2020.06.006',
    );
  });
  it('supports selection, direction, decimal and month input', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: '動物 → 人間' }));
    const input = screen.getByLabelText('中型犬の年齢');
    await user.clear(input);
    await user.type(input, '24');
    await user.selectOptions(screen.getByLabelText('年齢の単位'), 'months');
    expect(screen.getByText('42.1')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /家庭猫/ }));
    expect(screen.getByText(/動物の実年齢による区分：若い成猫期/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: /カイウサギ/ }));
    expect(screen.getByRole('status')).toHaveTextContent('28');
  });
  it('does not coerce blanks to zero and rejects invalid values', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText('あなたの年齢');
    await user.clear(input);
    expect(screen.getByRole('alert')).toHaveTextContent('空欄は0歳として扱いません');
    expect(screen.getByText('年齢を入力してみよう。')).toBeVisible();
    await user.type(input, '-1');
    expect(screen.getByRole('alert')).toHaveTextContent('0以上');
  });
  it('shows range and reverse-stage limitations', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText('あなたの年齢');
    await user.clear(input);
    await user.type(input, '129');
    expect(screen.getByText('この年齢は、表示範囲外。')).toBeVisible();
    await user.clear(input);
    await user.type(input, '28');
    await user.click(screen.getByRole('button', { name: /家庭猫/ }));
    expect(screen.getByRole('status')).toHaveTextContent('3歳');
    expect(screen.getByText('慣用換算表による目安')).toBeVisible();
  });
  it('labels birth, young and extreme human ages as mathematical extensions', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText('あなたの年齢');
    for (const [value, output] of [
      ['0', '1.7'],
      ['1', '1.8'],
      ['28', '9.9'],
      ['128', '429.4'],
    ]) {
      await user.clear(input);
      await user.type(input, value!);
      expect(screen.getByText('式を延長した仮の計算')).toBeVisible();
      expect(screen.getByRole('status')).toHaveTextContent(output!);
      expect(screen.getByRole('status')).toHaveTextContent(
        '科学的な年齢対応・生存可能性を示す値ではありません',
      );
    }
  });
  it('falls back if an icon fails', () => {
    const { container } = render(<AnimalIcon src="missing.svg" />);
    fireEvent.error(container.querySelector('img')!);
    expect(screen.getByText('◇')).toBeInTheDocument();
  });
});

it('converts all five added animals and distinguishes table extensions', async () => {
  const user = userEvent.setup();
  render(<App />);
  for (const name of [
    '家庭猫',
    'カイウサギ',
    'ゴールデンハムスター',
    'セキセイインコ',
    '家畜化されたフェレット',
  ]) {
    await user.click(screen.getByRole('button', { name: new RegExp(name) }));
    fireEvent.change(screen.getByLabelText('あなたの年齢'), { target: { value: '40' } });
    expect(screen.getByText('慣用換算表による目安')).toBeVisible();
    fireEvent.change(screen.getByLabelText('あなたの年齢'), { target: { value: '0' } });
    expect(screen.getByRole('status')).toHaveTextContent('0か月');
    expect(screen.getByText('表の範囲外の仮の計算')).toBeVisible();
    fireEvent.change(screen.getByLabelText('あなたの年齢'), { target: { value: '128' } });
    expect(screen.getByText('表の範囲外の仮の計算')).toBeVisible();
  }
});
