import type { Age, Direction } from '@anitoshi/age-core';
export function AgeInput({
  direction,
  name,
  value,
  unit,
  error,
  onValue,
  onUnit,
}: {
  direction: Direction;
  name: string;
  value: string;
  unit: Age['unit'];
  error: string | null;
  onValue: (v: string) => void;
  onUnit: (u: Age['unit']) => void;
}) {
  return (
    <section className="input-panel panel" aria-labelledby="age-heading">
      <div className="panel-heading">
        <h2 id="age-heading">
          <span className="step">02</span> 年齢をいれる
        </h2>
      </div>
      <label htmlFor="age" className="age-label">
        {direction === 'human-to-animal' ? 'あなた' : name}の年齢
      </label>
      <div className="age-controls">
        <input
          id="age"
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onValue(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? 'age-error age-hint' : 'age-hint'}
          autoComplete="off"
        />
        <label className="sr-only" htmlFor="unit">
          年齢の単位
        </label>
        <select id="unit" value={unit} onChange={(e) => onUnit(e.target.value as Age['unit'])}>
          <option value="years">歳（年）</option>
          <option value="months">か月</option>
        </select>
      </div>
      <p id="age-hint" className="input-hint">
        小数も入力できます。例：2.5歳 ＝ 2歳6か月
        {direction === 'human-to-animal' && (
          <>
            <br />
            入力範囲：0歳0か月〜128歳0か月（1536か月）
          </>
        )}
      </p>
      {error && (
        <p id="age-error" role="alert" className="input-error">
          {error}
        </p>
      )}
    </section>
  );
}
