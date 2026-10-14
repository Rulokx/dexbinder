import type { CardSet, CollectionStats } from '../domain/types';

interface HeroProps {
  set: CardSet;
  stats: CollectionStats;
  /** All registered sets; the switcher only renders when there is more than one. */
  sets: readonly CardSet[];
  onSelectSet: (id: string) => void;
}

function pad3(n: number): string {
  return String(n).padStart(3, '0');
}

export function Hero({ set, stats, sets, onSelectSet }: HeroProps) {
  const secretCount = set.cards.length - set.baseCount;
  return (
    <header className="shell hero">
      <div>
        <div className="eyebrow">EXPANSION · {set.code} · MASTER SET</div>
        <h1>
          {set.name} <span>Collection</span>
        </h1>
        <p>
          Your Pokémon TCG collection, one card at a time. Explore the card artwork, track Regular,
          Holo, Reverse Holo, and Special variants, and see exactly what you still need.
        </p>
        <div className="featureline">
          <span className="mini-pill">{set.cards.length} numbered cards</span>
          <span className="mini-pill">{stats.totalVariants} variants</span>
          {secretCount > 0 && (
            <span className="mini-pill">
              #{pad3(set.baseCount + 1)}–{pad3(set.cards.length)} secret rares
            </span>
          )}
        </div>
        {sets.length > 1 && (
          <label className="setpicker">
            Expansion
            <select
              className="field"
              aria-label="Choose expansion"
              value={set.id}
              onChange={(e) => onSelectSet(e.target.value)}
            >
              {sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.code}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="completion" aria-label="Overall collection progress">
        <div className="completion-top">
          <div>
            <small>Master Set Progress</small>
            <div className="bigpercent" data-testid="percent">
              {stats.percent.toFixed(1)}%
            </div>
          </div>
          <div className="pill">✧ Your Collection</div>
        </div>
        <div className="bar">
          <span style={{ width: `${stats.percent}%` }}></span>
        </div>
        <div className="bar-meta">
          <span data-testid="progress-number">
            {stats.ownedVariants} of {stats.totalVariants} variants
          </span>
          <span>{stats.missingVariants} remaining</span>
        </div>
      </div>
    </header>
  );
}
