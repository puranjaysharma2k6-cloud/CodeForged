import React from 'react';
import { motion } from 'framer-motion';
import './ToggleBar.css';

interface ToggleBarProps {
  activeTab: 'upcoming' | 'past';
  onChange: (tab: 'upcoming' | 'past') => void;
}

const ToggleBar = ({ activeTab, onChange }: ToggleBarProps) => {
  // Define our tabs in an array so we can map over them cleanly
  const tabs: ('upcoming' | 'past')[] = ['upcoming', 'past'];

  return (
    <div className="misty-toggle-container">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`toggle-btn ${activeTab === tab ? 'active' : ''}`}
          onClick={() => onChange(tab)}
        >
          {/* Framer Motion Magic: 
            This pill only exists inside the active button. 
            When activeTab changes, layoutId animates it smoothly to the new button.
          */}
          {activeTab === tab && (
            <motion.div
              layoutId="glass-pill"
              className="highlighter"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
            />
          )}
          
          {/* Wrap text in a span so we can z-index it above the glass */}
          <span className="tab-text">
            {tab === 'upcoming' ? 'Upcoming' : 'Past'}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ToggleBar;