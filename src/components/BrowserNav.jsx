import { memo } from 'react'

const NAV_ITEMS = [
  { id: 'browserContentPicks', icon: 'account_balance', label: "Editors' Picks" },
  { id: 'browserContentPop', icon: 'trending_up', label: 'Popular' },
  { id: 'browserContentSubs', icon: 'notifications_active', label: 'Subscriptions' },
  { id: 'browserContentRec', icon: 'loyalty', label: 'Recommended' },
  { id: 'browserContentRand', icon: 'gesture', label: 'Random' },
  { id: 'browserContentChannel', icon: 'podcasts', label: 'Channel' }
]

const BrowserNav = memo(function BrowserNav({ activePage, onSwitchPage }) {
  return (
    <nav id="browserNav" className="browser-nav" role="tablist" aria-label="Content navigation">
      <div className="browser-nav-fuck" style={{ width: '100%' }}>
        {NAV_ITEMS.map(({ id, icon, label }) => (
          <button
            key={id}
            id={id.replace('browserContent', 'browserNav')}
            className={`browser-nav-item ${activePage === id ? 'active' : ''}`}
            onClick={() => onSwitchPage?.(id)}
            role="tab"
            aria-selected={activePage === id}
            aria-controls={id}
            aria-label={label}
          >
            <i className="material-icons" aria-hidden="true">{icon}</i>
            <span className="browser-nav-label">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
})

export default BrowserNav
