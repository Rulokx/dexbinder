import { useEffect, useRef } from 'react';
import type { Card } from '../domain/types';

interface ImageDialogProps {
  card: Card | null;
  onClose: () => void;
}

/**
 * Full-size card preview using the native <dialog> element.
 * Falls back to a non-modal open dialog where `showModal` is unavailable.
 */
export function ImageDialog({ card, onClose }: ImageDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (card) {
      if (typeof dialog.showModal === 'function') {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    } else if (dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [card]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-label={card ? `Full-size card artwork for ${card.name}` : 'Card preview'}
      onClose={onClose}
      onClick={(e) => {
        // Clicking the backdrop (outside the content) closes the preview.
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-title">
        <span data-testid="dialog-name">{card ? `${card.name} · #${card.number}` : ''}</span>
        <button className="btn" type="button" onClick={onClose}>
          ✕ Close
        </button>
      </div>
      {card && <img src={card.large} alt={`Full-size card artwork for ${card.name}`} />}
    </dialog>
  );
}
