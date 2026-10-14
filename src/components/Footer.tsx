import type { CardSet } from '../domain/types';

interface FooterProps {
  set: CardSet;
  onExportCsv: () => void;
  onClearCollection: () => void;
}

export function Footer({ set, onExportCsv, onClearCollection }: FooterProps) {
  return (
    <footer className="shell footer">
      <div className="footer-details">
        <div>
          <b>Tools:</b>{' '}
          <button className="btn" type="button" onClick={onExportCsv}>
            ↓ Export CSV
          </button>{' '}
          <button className="btn danger" type="button" onClick={onClearCollection}>
            Clear Collection
          </button>
        </div>
        <div>DexBinder · Personal Local Collection</div>
      </div>
      <p>
        Your collection is saved locally when your browser allows it. To use it in another browser,
        computer, or iPhone, export a JSON backup and import it there.{' '}
        <b>There is no automatic sync across devices.</b> Card images require an internet connection
        and load from{' '}
        <a href={set.links.images.url} target="_blank" rel="noopener noreferrer">
          {set.links.images.label}
        </a>
        . Card list reference:{' '}
        <a href={set.links.reference.url} target="_blank" rel="noopener noreferrer">
          {set.links.reference.label}
        </a>
        . Card artwork belongs to its respective creators and rights holders.
      </p>
    </footer>
  );
}
