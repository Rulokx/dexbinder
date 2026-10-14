import { useState } from 'react';
import { DEFAULT_SET_ID, SETS, getSet } from './data/sets';
import { CollectionView } from './components/CollectionView';

export default function App() {
  const [activeSetId, setActiveSetId] = useState(DEFAULT_SET_ID);
  const set = getSet(activeSetId) ?? SETS[0];
  if (!set) {
    return <p className="shell">No card sets are registered.</p>;
  }
  // `key` remounts the view with fresh per-set state when the expansion changes.
  return <CollectionView key={set.id} set={set} sets={SETS} onSelectSet={setActiveSetId} />;
}
