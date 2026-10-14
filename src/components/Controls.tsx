import type { CardSet, SectionFilter, StatusFilter, ViewMode } from '../domain/types';

interface ControlsProps {
  set: CardSet;
  view: ViewMode;
  section: SectionFilter;
  query: string;
  status: StatusFilter;
  rarity: string;
  rarities: string[];
  onViewChange: (view: ViewMode) => void;
  onSectionChange: (section: SectionFilter) => void;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: StatusFilter) => void;
  onRarityChange: (rarity: string) => void;
  onClearFilters: () => void;
}

const SECTIONS: { id: SectionFilter; label: (set: CardSet) => string }[] = [
  { id: 'all', label: (s) => `All · ${s.cards.length}` },
  { id: 'base', label: (s) => `Base · ${s.baseCount}` },
  { id: 'secret', label: (s) => `Secret Rares · ${s.cards.length - s.baseCount}` },
];

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: 'album', label: '▦ Binder' },
  { id: 'list', label: '☷ List' },
];

export function Controls(props: ControlsProps) {
  const { set, view, section, query, status, rarity, rarities } = props;
  return (
    <section className="controls" aria-label="Catalog controls">
      <div className="shell controls-inner">
        <div className="control-row">
          <nav className="tabs" aria-label="Set sections">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={section === s.id ? 'active' : undefined}
                aria-pressed={section === s.id}
                onClick={() => props.onSectionChange(s.id)}
              >
                {s.label(set)}
              </button>
            ))}
          </nav>
          <div className="viewgroup" role="group" aria-label="Display mode">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                className={view === v.id ? 'active' : undefined}
                aria-pressed={view === v.id}
                onClick={() => props.onViewChange(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="filterrow">
          <label className="search">
            <input
              className="field"
              type="search"
              placeholder="Search Pokémon, card name, or number…"
              aria-label="Search cards"
              autoComplete="off"
              value={query}
              onChange={(e) => props.onQueryChange(e.target.value)}
            />
          </label>
          <select
            className="field"
            aria-label="Collection status"
            value={status}
            onChange={(e) => props.onStatusChange(e.target.value as StatusFilter)}
          >
            <option value="all">All Statuses</option>
            <option value="missing">Missing Cards</option>
            <option value="none">Not Owned</option>
            <option value="partial">Incomplete</option>
            <option value="complete">Complete</option>
            <option value="have">Partially Owned / Any Owned</option>
          </select>
          <select
            className="field"
            aria-label="Filter by rarity"
            value={rarity}
            onChange={(e) => props.onRarityChange(e.target.value)}
          >
            <option value="all">All Rarities</option>
            {rarities.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button className="btn" type="button" onClick={props.onClearFilters}>
            Clear Filters
          </button>
        </div>
      </div>
    </section>
  );
}
