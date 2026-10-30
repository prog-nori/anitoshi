import { personas, type Persona } from '../data/personas';
import { AnimalIcon } from './ui/AnimalIcon';
export function AnimalSelector({
  selected,
  onSelect,
}: {
  selected: Persona;
  onSelect: (p: Persona) => void;
}) {
  return (
    <section className="selector panel" aria-labelledby="animal-heading">
      <div className="panel-heading">
        <h2 id="animal-heading">
          <span className="step">01</span> 動物をえらぶ
        </h2>
        <span className="micro">全10種のペルソナ</span>
      </div>
      <p className="section-hint">気になる動物を、ひとつ。</p>
      <div className="animal-grid">
        {personas.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`animal-card ${selected.id === p.id ? 'selected' : ''}`}
            aria-pressed={selected.id === p.id}
            onClick={() => onSelect(p)}
          >
            <span className="card-number">{p.number}</span>
            <span className="selection-mark" aria-hidden="true">
              {selected.id === p.id ? '✓' : '+'}
            </span>
            <AnimalIcon src={p.icon} />
            <strong>{p.name}</strong>
            <span className="representative">{p.representative}</span>
          </button>
        ))}
      </div>
      <p className="selector-note">
        <span aria-hidden="true">※</span> 犬の5体格は共通の参考モデルを使用します。
        <br />
        代表犬種は選択のための目印です。
      </p>
    </section>
  );
}
