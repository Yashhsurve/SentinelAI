/**
 * TabNavigation Component
 * ARIA-accessible tablist supporting arrow-key keyboard navigation
 * between Messages (ThreatLens) and Code (CodeShield) workspaces.
 */
import React, { useRef } from 'react';

export default function TabNavigation({ activeTab, onSelectTab }) {
  const tabs = [
    { id: 'messages', label: 'Messages' },
    { id: 'code', label: 'Code' },
  ];

  const tabRefs = useRef([]);

  const handleKeyDown = (e, index) => {
    let nextIndex = null;
    if (e.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      nextIndex = 0;
    } else if (e.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      onSelectTab(tabs[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <nav className="tabs-container" aria-label="Investigation modules">
      <div className="tablist" role="tablist" aria-orientation="horizontal">
        {tabs.map((tab, idx) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[idx] = el)}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isSelected ? 0 : -1}
              className="tab-button"
              onClick={() => onSelectTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
