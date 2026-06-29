import { useState } from 'react';
import ToggleBar from '../../../components/ToggleBar/ToggleBar';

// 1. Declare your allowed tab strings for this component
type ArenaTab = 'problems' | 'standings';

export default function ContestArena() {
  const [activeTab, setActiveTab] = useState<ArenaTab>('problems');

  return (
    <div>
      
      <ToggleBar<ArenaTab>
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={['problems', 'standings']}
        labels={{
          problems: 'Problem Set',
          standings: 'Live Leaderboard'
        }}
      />
    </div>
  );
}