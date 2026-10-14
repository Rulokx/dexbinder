interface TopBarProps {
  saveAvailable: boolean;
  onImport: () => void;
  onExport: () => void;
}

export function TopBar({ saveAvailable, onImport, onExport }: TopBarProps) {
  return (
    <div className="shell topbar">
      <div className="brand">
        <div className="brandmark" aria-hidden="true">◈</div>
        <div>
          <div className="brandname">
            DEX<span>BINDER</span>
          </div>
          <div className="brandsub">Pokémon TCG · Collection Tracker</div>
        </div>
      </div>
      <div className="topactions">
        {saveAvailable ? (
          <span className="pill" data-testid="save-indicator">
            <i className="dot" aria-hidden="true"></i>Saved in this browser
          </span>
        ) : (
          <span className="pill warn" data-testid="save-indicator">
            ⚠ Session only · Export a backup
          </span>
        )}
        <button className="btn" type="button" onClick={onImport}>
          ↑ Import Backup
        </button>
        <button className="btn primary" type="button" onClick={onExport}>
          ↓ Export Backup
        </button>
      </div>
    </div>
  );
}
