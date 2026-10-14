import { useState } from 'react';
import type { Card, OwnedMap, VariantKey } from '../domain/types';
import { isOwned, ownedCount } from '../domain/collection';
import { variantLabel } from '../domain/variants';

interface CardTileProps {
  card: Card;
  owned: OwnedMap;
  secret: boolean;
  onToggle: (card: Card, variant: VariantKey, value: boolean) => void;
  onEnlarge: (card: Card) => void;
}

export function CardTile({ card, owned, secret, onToggle, onEnlarge }: CardTileProps) {
  const [broken, setBroken] = useState(false);
  const got = ownedCount(owned, card);
  const n = card.variants.length;
  const complete = got === n;

  return (
    <article className={`card${complete ? ' completed' : ''}`} data-card={card.num}>
      <div className="card-heading">
        <div>
          <div className="number">#{card.number}</div>
          <h2>{card.name}</h2>
        </div>
        <div className="right-label">{complete ? '✓ Complete' : `${got}/${n}`}</div>
      </div>
      <div className="card-main">
        <button
          className="art-button"
          type="button"
          aria-label={`Enlarge ${card.name}`}
          onClick={() => onEnlarge(card)}
        >
          <img
            src={card.image}
            loading="lazy"
            className={broken ? 'broken' : undefined}
            alt={broken ? 'Image temporarily unavailable' : `${card.name} Pokémon card`}
            onError={() => setBroken(true)}
          />
        </button>
      </div>
      <div className="rarity-line">
        <i className={`rarity-marker${secret ? ' secret' : ''}`}></i>
        {card.rarity}
        {secret ? ' · Secret Rare' : ''}
      </div>
      <div className="variants">
        {card.variants.map((variant) => {
          const checked = isOwned(owned, card, variant);
          return (
            <label key={variant} className={`variant${checked ? ' on' : ''}`}>
              <input
                type="checkbox"
                data-num={card.num}
                data-variant={variant}
                checked={checked}
                onChange={(e) => onToggle(card, variant, e.target.checked)}
                aria-label={`${card.name} ${variantLabel(variant)}`}
              />
              <span className="mark" aria-hidden="true">
                {checked ? '✓' : ''}
              </span>
              {variantLabel(variant)}
            </label>
          );
        })}
      </div>
      <div className="card-bottom">
        <span>{got ? 'Owned' : 'Missing'}</span>
        <div className="mini-track">
          <span style={{ width: `${(got / n) * 100}%` }}></span>
        </div>
        <b>
          {got}/{n}
        </b>
      </div>
    </article>
  );
}
