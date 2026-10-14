import type { Ref } from 'react';
import type { Card, CardSet, OwnedMap, VariantKey, ViewMode } from '../domain/types';
import { isSecretRare } from '../domain/collection';
import { CardTile } from './CardTile';

interface CardGalleryProps {
  set: CardSet;
  cards: Card[];
  owned: OwnedMap;
  view: ViewMode;
  onToggle: (card: Card, variant: VariantKey, value: boolean) => void;
  onEnlarge: (card: Card) => void;
  /** Used by the pagination controls to scroll back to the top of the grid. */
  ref?: Ref<HTMLElement>;
}

export function CardGallery({ set, cards, owned, view, onToggle, onEnlarge, ref }: CardGalleryProps) {
  return (
    <section ref={ref} className={`gallery ${view}`} aria-label="Cards in Set" data-testid="gallery">
      {cards.length === 0 ? (
        <div className="empty">
          <strong>No matching cards</strong>Try changing the search, filters, or set section.
        </div>
      ) : (
        cards.map((card) => (
          <CardTile
            key={card.num}
            card={card}
            owned={owned}
            secret={isSecretRare(set, card)}
            onToggle={onToggle}
            onEnlarge={onEnlarge}
          />
        ))
      )}
    </section>
  );
}
