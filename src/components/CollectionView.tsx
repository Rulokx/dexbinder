import { useCallback, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { Card, CardSet, SectionFilter, StatusFilter, ViewMode } from '../domain/types';
import { filterCards, rarityOptions } from '../domain/collection';
import { buildCsv, parseBackup, serializeBackup } from '../domain/backup';
import { useCollection } from '../hooks/useCollection';
import { usePreferences } from '../hooks/usePreferences';
import { useToast } from '../hooks/useToast';
import { saveTextFile, type SaveResult } from '../utils/download';
import { TopBar } from './TopBar';
import { Hero } from './Hero';
import { StatStrip } from './StatStrip';
import { Controls } from './Controls';
import { CardGallery } from './CardGallery';
import { Pagination } from './Pagination';
import { Footer } from './Footer';
import { ImageDialog } from './ImageDialog';
import { Toast } from './Toast';

const PER_PAGE: Record<ViewMode, number> = { album: 9, list: 24 };

interface CollectionViewProps {
  set: CardSet;
  sets: readonly CardSet[];
  onSelectSet: (id: string) => void;
}

/**
 * Everything for ONE expansion. `App` remounts this component (via `key`)
 * when the active set changes, so per-set state starts fresh.
 */
export function CollectionView({ set, sets, onSelectSet }: CollectionViewProps) {
  const collection = useCollection(set);
  const [preferences, updatePreferences] = usePreferences(set);
  const [toastMessage, showToast] = useToast();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [rarity, setRarity] = useState('all');
  const [page, setPage] = useState(0);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLElement>(null);

  const rarities = useMemo(() => rarityOptions(set), [set]);

  const filtered = useMemo(
    () => filterCards(set, collection.owned, { section: preferences.section, query, rarity, status }),
    [set, collection.owned, preferences.section, query, rarity, status],
  );

  const perPage = PER_PAGE[preferences.view];
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.max(0, Math.min(page, pages - 1));
  const visible = filtered.slice(currentPage * perPage, (currentPage + 1) * perPage);
  const firstShown = filtered.length ? currentPage * perPage + 1 : 0;
  const lastShown = Math.min(filtered.length, (currentPage + 1) * perPage);

  // --- filters / navigation -------------------------------------------------
  const changeView = (view: ViewMode) => {
    updatePreferences({ view });
    setPage(0);
  };
  const changeSection = (section: SectionFilter) => {
    updatePreferences({ section });
    setPage(0);
  };
  const changeQuery = (value: string) => {
    setQuery(value);
    setPage(0);
  };
  const changeStatus = (value: StatusFilter) => {
    setStatus(value);
    setPage(0);
  };
  const changeRarity = (value: string) => {
    setRarity(value);
    setPage(0);
  };
  const clearFilters = () => {
    setQuery('');
    setRarity('all');
    setStatus('all');
    setPage(0);
  };

  const scrollToGallery = () => {
    const el = galleryRef.current;
    if (!el || typeof window === 'undefined') return;
    try {
      const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 170);
      window.scrollTo({ top, behavior: 'smooth' });
    } catch {
      /* non-browser environment */
    }
  };
  const goPrev = () => {
    setPage(Math.max(0, currentPage - 1));
    scrollToGallery();
  };
  const goNext = () => {
    setPage(Math.min(pages - 1, currentPage + 1));
    scrollToGallery();
  };

  // --- backup / export ------------------------------------------------------
  const exportToast = (what: string, result: SaveResult) => {
    if (result === 'downloaded') showToast(`${what} downloaded`);
    else if (result === 'shared') showToast(`${what} exported`);
    else showToast('Export cancelled');
  };

  const exportBackup = async () => {
    const result = await saveTextFile(
      set.files.backup,
      'application/json;charset=utf-8',
      serializeBackup(set, collection.owned),
    );
    exportToast('JSON backup', result);
  };

  const exportCsv = async () => {
    const result = await saveTextFile(set.files.csv, 'text/csv;charset=utf-8', buildCsv(set, collection.owned));
    exportToast('CSV checklist', result);
  };

  const openImportPicker = () => fileInputRef.current?.click();

  const handleImportFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target;
      const file = input.files?.[0];
      if (!file) return;
      try {
        const result = parseBackup(set, await file.text());
        if (!result.ok) throw new Error(result.error);
        const ok = window.confirm(
          'Import this backup and replace the collection currently saved in this browser?',
        );
        if (!ok) return;
        collection.replaceAll(result.owned);
        setPage(0);
        showToast(
          result.ignoredKeys > 0
            ? `Collection restored successfully (${result.ignoredKeys} unknown entries ignored)`
            : 'Collection restored successfully',
        );
      } catch (error) {
        window.alert('Import failed: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        input.value = '';
      }
    },
    [set, collection, showToast],
  );

  const clearCollection = () => {
    const ok = window.confirm(
      'Clear all the owned-card marks in this browser? Export a backup first if you want to keep your collection.',
    );
    if (!ok) return;
    collection.clearAll();
    setPage(0);
    showToast('All owned-card marks cleared');
  };

  return (
    <>
      <TopBar saveAvailable={collection.saveAvailable} onImport={openImportPicker} onExport={exportBackup} />
      <Hero set={set} stats={collection.stats} sets={sets} onSelectSet={onSelectSet} />
      <StatStrip stats={collection.stats} />
      <Controls
        set={set}
        view={preferences.view}
        section={preferences.section}
        query={query}
        status={status}
        rarity={rarity}
        rarities={rarities}
        onViewChange={changeView}
        onSectionChange={changeSection}
        onQueryChange={changeQuery}
        onStatusChange={changeStatus}
        onRarityChange={changeRarity}
        onClearFilters={clearFilters}
      />
      <main className="shell">
        <div className="meta">
          <div aria-live="polite" data-testid="results">
            <strong>{filtered.length} cards</strong> found · Showing {firstShown}–{lastShown} of{' '}
            {filtered.length}
          </div>
          <div className="legend">
            <span>○ Not Owned</span>
            <span>
              <b>✓</b> Owned
            </span>
            <span>Tap any card image to zoom in</span>
          </div>
        </div>
        <CardGallery
          ref={galleryRef}
          set={set}
          cards={visible}
          owned={collection.owned}
          view={preferences.view}
          onToggle={collection.setVariant}
          onEnlarge={setPreviewCard}
        />
        <Pagination page={currentPage} pages={pages} onPrev={goPrev} onNext={goNext} />
      </main>
      <Footer set={set} onExportCsv={exportCsv} onClearCollection={clearCollection} />
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        hidden
        data-testid="restore-input"
        onChange={handleImportFile}
      />
      <ImageDialog card={previewCard} onClose={() => setPreviewCard(null)} />
      <Toast message={toastMessage} />
    </>
  );
}
