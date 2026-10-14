import type { CollectionStats } from '../domain/types';

export function StatStrip({ stats }: { stats: CollectionStats }) {
  return (
    <section className="shell statstrip" aria-label="Collection summary">
      <div className="metric">
        <strong data-testid="stat-cards">{stats.totalCards}</strong>
        <span>Cards in Set</span>
      </div>
      <div className="metric good">
        <strong data-testid="stat-owned">{stats.ownedVariants}</strong>
        <span>Variants Owned</span>
      </div>
      <div className="metric gold">
        <strong data-testid="stat-missing">{stats.missingVariants}</strong>
        <span>Variants Missing</span>
      </div>
      <div className="metric">
        <strong data-testid="stat-completed">{stats.completedCards}</strong>
        <span>Completed Cards</span>
      </div>
    </section>
  );
}
