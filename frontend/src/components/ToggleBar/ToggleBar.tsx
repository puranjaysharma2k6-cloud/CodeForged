import { motion } from 'framer-motion';
import './ToggleBar.css';

// Use TypeScript Generics (T)  bar reusable for any set of tabs!
interface ToggleBarProps<T extends string> {
  activeTab: T;
  onChange: (tab: T) => void;
  tabs: T[];
  labels?: Record<T, string>; // Optional custom display names for each tab value
}

export default function ToggleBar<T extends string>({ 
  activeTab, 
  onChange, 
  tabs, 
  labels 
}: ToggleBarProps<T>) {
  return (
    <div className="misty-toggle-container">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`toggle-btn ${activeTab === tab ? 'active' : ''}`}
          onClick={() => onChange(tab)}
        >
          
          {activeTab === tab && (
            <motion.div
              layoutId="glass-pill"
              className="highlighter"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
            />
          )}
          
          
          <span className="tab-text">
            {labels?.[tab] || tab.charAt(0).toUpperCase() + tab.slice(1)}
          </span>
        </button>
      ))}
    </div>
  );
}