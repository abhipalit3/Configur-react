import React, { Fragment, useState } from 'react'

import PropTypes from 'prop-types'

import './app-tier-mep.css'

const AppTierMEP = (props) => {
  const { mepItems = [], onRemoveItem } = props
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filter items based on search term
  const filteredItems = mepItems.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    const itemText = (getItemDisplayText(item) || '').toLowerCase();
    return itemText.includes(searchLower)
  })
  
  function getItemDisplayText(item) {
  if (!item || typeof item !== 'object') return '';

  if (item.type === 'duct') {
    const name = item.name || 'Duct';
    return `${name} - ${item.width || 0}"x${item.height || 0}`;
  }
  if (item.type === 'pipe') {
    return `${item.pipeType || 'Pipe'} - ${item.diameter || 0} Ø`;
  }
  if (item.type === 'conduit') {
    return `${item.conduitType || 'Conduit'} - ${item.diameter || 0} Ø x${item.count || 1}`;
  }
  if (item.type === 'cableTray') {
    return `Cable Tray - ${item.width || 0}"x${item.height || 0}`;
  }

  return ''; // Ensure fallback is always a string
}

  
  return (
    <div className={`app-tier-mep-container1 ${props.rootClassName} `}>
      <div className="app-tier-mep-heading">
        <input
          type="text"
          placeholder="Search MEP items..."
          className="app-tier-mep-textinput input-form"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="app-tier-mep-container2">
        {mepItems.length === 0 ? (
          <div className="app-tier-mep-added-mep1">
            <span className="app-tier-mep-text10">
              No MEP items added yet
            </span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="app-tier-mep-added-mep1">
            <span className="app-tier-mep-text10">
              No items match your search
            </span>
          </div>
        ) : (
          filteredItems.map((item, index) => (
            <div key={item.id} className="app-tier-mep-added-mep1">
              <span className="app-tier-mep-text10">
                {getItemDisplayText(item)}
                {item.count > 1 && ` (${item.count}x)`}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 32 32"
                className="app-tier-mep-remove-icon"
                onClick={() => onRemoveItem(item.id)}
                style={{ 
                  marginLeft: 'auto', 
                  cursor: 'pointer',
                  minWidth: '16px'
                }}
              >
                <path
                  d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
          ))
        )}
      </div>
      <div className="app-tier-mep-title">
        <span style={{fontSize: '11px', color: '#666', padding: '4px'}}>
          Total items: {mepItems.length}
        </span>
        <svg
          height="24"
          width="24"
          viewBox="0 0 24 24"
          className="app-tier-mep-icon10"
          style={{marginLeft: 'auto'}}
        >
          <path
            fill="currentColor"
            d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"
          ></path>
        </svg>
        <svg
          height="48"
          width="48"
          viewBox="0 0 48 48"
          className="app-tier-mep-icon12"
        >
          <g
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="4"
          >
            <path d="M6 24.008V42h36V24"></path>
            <path d="m33 23l-9 9l-9-9m8.992-17v26"></path>
          </g>
        </svg>
        <svg
          height="48"
          width="48"
          viewBox="0 0 48 48"
          className="app-tier-mep-icon16"
        >
          <g
            fill="none"
            stroke="currentColor"
            stroke-linejoin="round"
            stroke-width="4"
          >
            <path d="M9 10v34h30V10z"></path>
            <path stroke-linecap="round" d="M20 20v13m8-13v13M4 10h40"></path>
            <path d="m16 10l3.289-6h9.488L32 10z"></path>
          </g>
        </svg>
      </div>
    </div>
  )
}

AppTierMEP.defaultProps = {
  rootClassName: '',
  mepItems: [],
  onRemoveItem: () => {},
}

AppTierMEP.propTypes = {
  rootClassName: PropTypes.string,
  mepItems: PropTypes.array,
  onRemoveItem: PropTypes.func,
}

export default AppTierMEP