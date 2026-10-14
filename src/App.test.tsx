import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { PITCH_BLACK } from './data/sets';

const OWNED_KEY = PITCH_BLACK.storage.ownedKey;
const PREFS_KEY = PITCH_BLACK.storage.preferencesKey;

function cardsOnScreen() {
  return within(screen.getByTestId('gallery')).queryAllByRole('article');
}

function storedOwned(): Record<string, number> {
  return JSON.parse(localStorage.getItem(OWNED_KEY) ?? '{}');
}

async function blobText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') return blob.text();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsText(blob);
  });
}

/** Capture the content of the next download triggered through URL.createObjectURL. */
function captureDownload(): () => Promise<string> {
  let captured: Blob | null = null;
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    captured = blob as Blob;
    return 'blob:captured';
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  return async () => {
    if (!captured) throw new Error('No download captured');
    return blobText(captured);
  };
}

describe('DexBinder app', () => {
  beforeEach(() => {
    // A save written by the Spanish-era prototype. Ownership must survive.
    localStorage.setItem(OWNED_KEY, JSON.stringify({ '1|Normal': 1, '4|Especial': 1 }));
  });

  it('loads legacy ownership, shows English UI and a 9-card binder page', () => {
    render(<App />);

    expect(screen.getByTestId('stat-cards')).toHaveTextContent('120');
    expect(screen.getByTestId('stat-owned')).toHaveTextContent('2');
    expect(screen.getByTestId('stat-missing')).toHaveTextContent('192');
    expect(screen.getByTestId('stat-completed')).toHaveTextContent('1'); // Lurantis ex (1/1)
    expect(screen.getByTestId('percent')).toHaveTextContent('1.0%');
    expect(screen.getByTestId('progress-number')).toHaveTextContent('2 of 194 variants');
    expect(screen.getByTestId('save-indicator')).toHaveTextContent('Saved in this browser');

    const cards = cardsOnScreen();
    expect(cards).toHaveLength(9);
    expect(screen.getByTestId('page-label')).toHaveTextContent('Page 1 of 14');
    expect(screen.getByTestId('results')).toHaveTextContent('120 cards found · Showing 1–9 of 120');

    // English variant labels; legacy internal keys never shown.
    const tropius = cards[0]!;
    expect(within(tropius).getByText('Regular')).toBeInTheDocument();
    expect(within(tropius).getByText('Reverse Holo')).toBeInTheDocument();
    expect(within(tropius).getByLabelText('Tropius Regular')).toBeChecked();
    expect(within(tropius).getByLabelText('Tropius Reverse Holo')).not.toBeChecked();
    const lurantis = cards[3]!;
    expect(within(lurantis).getByText('Special')).toBeInTheDocument();
    expect(within(lurantis).getByText('✓ Complete')).toBeInTheDocument();

    const html = document.body.innerHTML;
    expect(html).not.toMatch(/>Especial<|>Normal<|Común|Poco común|Ver grande|Todas las rarezas/);
    expect(screen.getByRole('button', { name: 'Clear Collection' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Missing Cards' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Secret Rares · 36' })).toBeInTheDocument();
  });

  it('toggling a variant checkbox updates progress and persists to the legacy key', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByLabelText('Tropius Reverse Holo'));

    expect(screen.getByTestId('stat-owned')).toHaveTextContent('3');
    expect(screen.getByTestId('stat-completed')).toHaveTextContent('2');
    expect(storedOwned()).toEqual({ '1|Normal': 1, '4|Especial': 1, '1|Reverse Holo': 1 });
    expect(within(cardsOnScreen()[0]!).getByText('✓ Complete')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Tropius Regular'));
    expect(screen.getByTestId('stat-owned')).toHaveTextContent('2');
    expect(storedOwned()).toEqual({ '4|Especial': 1, '1|Reverse Holo': 1 });
  });

  it('list view shows 24 cards and the Secret Rares tab starts at 085/084', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '☷ List' }));
    expect(cardsOnScreen()).toHaveLength(24);
    expect(screen.getByTestId('gallery')).toHaveClass('list');

    await user.click(screen.getByRole('button', { name: 'Secret Rares · 36' }));
    expect(cardsOnScreen()).toHaveLength(24);
    expect(screen.getByText('#085/084')).toBeInTheDocument();
    expect(screen.queryByText('#001/084')).not.toBeInTheDocument();
    expect(screen.getByTestId('page-label')).toHaveTextContent('Page 1 of 2');

    // View + section are remembered under the legacy preferences key.
    expect(JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')).toEqual({ view: 'list', section: 'secret' });
  });

  it('search, rarity and status filters narrow the catalog; Clear Filters resets them', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Search cards'), 'darkrai');
    expect(screen.getByTestId('results')).toHaveTextContent('4 cards found');

    await user.selectOptions(screen.getByLabelText('Filter by rarity'), 'Mega Hyper Rare');
    expect(cardsOnScreen()).toHaveLength(1);
    expect(screen.getByText('#120/084')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear Filters' }));
    expect(screen.getByTestId('results')).toHaveTextContent('120 cards found');

    await user.selectOptions(screen.getByLabelText('Collection status'), 'complete');
    expect(cardsOnScreen()).toHaveLength(1);
    expect(screen.getByText('Lurantis ex')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Collection status'), 'partial');
    expect(cardsOnScreen()).toHaveLength(1);
    expect(screen.getByText('Tropius')).toBeInTheDocument();
  });

  it('paginates with Previous / Next', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('button', { name: '← Previous' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next →' }));
    expect(screen.getByTestId('page-label')).toHaveTextContent('Page 2 of 14');
    expect(screen.getByText('#010/084')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '← Previous' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: '← Previous' }));
    expect(screen.getByText('#001/084')).toBeInTheDocument();
  });

  it('exports a version-2 JSON backup with the legacy internal keys', async () => {
    const user = userEvent.setup();
    const read = captureDownload();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '↓ Export Backup' }));
    const backup = JSON.parse(await read());
    expect(backup.set).toBe('me5');
    expect(backup.version).toBe(2);
    expect(backup.owned).toEqual({ '1|Normal': 1, '4|Especial': 1 });
    expect(typeof backup.exported).toBe('string');
    expect(screen.getByRole('status')).toHaveTextContent('JSON backup downloaded');
  });

  it('exports an English CSV checklist with 120 rows', async () => {
    const user = userEvent.setup();
    const read = captureDownload();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '↓ Export CSV' }));
    const csv = await read();
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(121);
    expect(lines[0]).toContain('"Card Number","Card Name","Rarity","Regular","Holo","Reverse Holo","Special","Owned","Missing"');
    expect(csv).toContain('"Yes"');
    expect(csv).toContain('"No"');
  });

  it('imports a legacy backup after confirmation and discards unknown keys', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<App />);

    const legacy = { set: 'me5', version: 2, owned: { '2|Normal': 1, '4|Especial': 1, '999|Especial': 1 } };
    const file = new File([JSON.stringify(legacy)], 'DexBinder_Backup.json', { type: 'application/json' });
    await user.upload(screen.getByTestId('restore-input'), file);

    await waitFor(() => expect(screen.getByTestId('stat-owned')).toHaveTextContent('2'));
    expect(Object.keys(storedOwned()).sort()).toEqual(['2|Normal', '4|Especial']);
    expect(window.confirm).toHaveBeenCalledWith(
      'Import this backup and replace the collection currently saved in this browser?',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Collection restored successfully (1 unknown entries ignored)');
    expect((screen.getByTestId('restore-input') as HTMLInputElement).value).toBe('');
  });

  it('keeps the current collection when the import is cancelled', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<App />);

    const file = new File([JSON.stringify({ set: 'me5', version: 2, owned: { '2|Normal': 1 } })], 'b.json');
    await user.upload(screen.getByTestId('restore-input'), file);

    await waitFor(() => expect(window.confirm).toHaveBeenCalled());
    expect(screen.getByTestId('stat-owned')).toHaveTextContent('2');
    expect(storedOwned()).toEqual({ '1|Normal': 1, '4|Especial': 1 });
  });

  it('reports invalid backups with an English error and leaves the collection alone', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<App />);

    const file = new File([JSON.stringify({ set: 'sv1', version: 2, owned: {} })], 'other.json');
    await user.upload(screen.getByTestId('restore-input'), file);

    await waitFor(() => expect(alert).toHaveBeenCalledWith('Import failed: Not a valid Pitch Black backup.'));
    expect(window.confirm).not.toHaveBeenCalled();
    expect(storedOwned()).toEqual({ '1|Normal': 1, '4|Especial': 1 });
  });

  it('clears the collection only after confirmation', async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Clear Collection' }));
    expect(screen.getByTestId('stat-owned')).toHaveTextContent('2');

    confirm.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Clear Collection' }));
    expect(screen.getByTestId('stat-owned')).toHaveTextContent('0');
    expect(storedOwned()).toEqual({});
    expect(screen.getByRole('status')).toHaveTextContent('All owned-card marks cleared');
  });

  it('opens the full-size preview from the card artwork', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Enlarge Tropius' }));
    expect(screen.getByTestId('dialog-name')).toHaveTextContent('Tropius · #001/084');
    expect(screen.getByAltText('Full-size card artwork for Tropius')).toHaveAttribute('src', PITCH_BLACK.cards[0]!.large);

    await user.click(screen.getByRole('button', { name: '✕ Close' }));
    expect(screen.getByTestId('dialog-name')).toHaveTextContent('');
  });

  it('falls back to a graceful alt text when a card image fails to load', () => {
    render(<App />);
    const img = screen.getByAltText('Tropius Pokémon card');
    fireEvent.error(img);
    expect(screen.getByAltText('Image temporarily unavailable')).toHaveClass('broken');
  });

  it('shows session-only mode when the browser blocks localStorage', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    render(<App />);
    expect(screen.getByTestId('save-indicator')).toHaveTextContent('Session only · Export a backup');
    expect(screen.getByTestId('stat-owned')).toHaveTextContent('2'); // reading still works
  });
});
