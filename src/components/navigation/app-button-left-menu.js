/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { useState } from 'react'

import PropTypes from 'prop-types'

import './app-button-left-menu.css'

const AppButtonLeftMenu = (props) => {
  const [buildingIsVisible, setBuildingIsVisible] = useState(false)
  
  const { onPanelClick, activePanel, isRackPropertiesVisible } = props
  
  return (
    <div className={`app-button-left-menu-container ${props.rootClassName} `}>
      <button
        id="AI_ChatButton"
        type="button"
        className={`app-button-left-menu-ai-chat-button thq-button-icon ${activePanel === 'aiChat' ? 'active' : ''}`}
        onClick={() => onPanelClick('aiChat')}
        data-tooltip="AI Chat"
      >
        <svg
          id="AI_ChatIcon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          className="app-button-left-menu-icon10"
        >
          <path
            d="m14.878.282l.348 1.071a2.2 2.2 0 0 0 1.399 1.397l1.071.348l.021.006a.423.423 0 0 1 0 .798l-1.071.348a2.2 2.2 0 0 0-1.399 1.397l-.348 1.07a.423.423 0 0 1-.798 0l-.349-1.07a2.2 2.2 0 0 0-.532-.867a2.2 2.2 0 0 0-.866-.536l-1.071-.348a.423.423 0 0 1 0-.798l1.071-.348a2.2 2.2 0 0 0 1.377-1.397l.348-1.07a.423.423 0 0 1 .799 0m4.905 7.931l-.766-.248a1.58 1.58 0 0 1-.998-.999l-.25-.764a.302.302 0 0 0-.57 0l-.248.764a1.58 1.58 0 0 1-.984.999l-.765.248a.303.303 0 0 0 0 .57l.765.249a1.58 1.58 0 0 1 1 1.002l.248.764a.302.302 0 0 0 .57 0l.249-.764a1.58 1.58 0 0 1 .999-.999l.765-.248a.303.303 0 0 0 0-.57zM9.5 3q.294.002.553.105a1.43 1.43 0 0 0 .918 1.743l.029.01V7.5A1.5 1.5 0 0 1 9.5 9h-5A1.5 1.5 0 0 1 3 7.5v-3A1.5 1.5 0 0 1 4.5 3zm6 14a1.5 1.5 0 0 0 1.5-1.5v-3a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 0 9 12.5v3a1.5 1.5 0 0 0 1.5 1.5zm.5-1.5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5zm-6-8v-3a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5M5.5 17A1.5 1.5 0 0 0 7 15.5v-3A1.5 1.5 0 0 0 5.5 11h-1A1.5 1.5 0 0 0 3 12.5v3A1.5 1.5 0 0 0 4.5 17zm.5-1.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"
            fill="currentColor"
          ></path>
        </svg>
      </button>
      <div className="app-button-left-menu-properties-buttons">
        <button
          id="BuildingPropButton"
          type="button"
          className={`app-button-left-menu-building-prop button-icon2 ${activePanel === 'building' ? 'active' : ''}`}
          onClick={() => onPanelClick('building')}
          data-tooltip="Building Properties"
        >
          <svg
            id="BuildingProperties"
            width="32"
            height="32"
            viewBox="0 0 32 32"
            className="app-button-left-menu-icon12 button2-icon"
          >
            <path
              d="M28 2H16a2 2 0 0 0-2 2v10H4a2 2 0 0 0-2 2v14h28V4a2 2 0 0 0-2-2M9 28v-7h4v7Zm19 0H15v-8a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v8H4V16h12V4h12Z"
              fill="currentColor"
            ></path>
            <path
              d="M18 8h2v2h-2zm6 0h2v2h-2zm-6 6h2v2h-2zm6 0h2v2h-2zm-6 6h2v2h-2zm6 0h2v2h-2zM2 10h5v2H2zm8-8h2v5h-2zM4 5.414L5.414 4L9 7.585L7.585 9z"
              fill="currentColor"
            ></path>
          </svg>
        </button>
        <button
          id="TradeRackPropButton"
          type="button"
          className={`app-button-left-menu-trade-rack-prop button-icon2 ${isRackPropertiesVisible ? 'active' : ''}`}
          onClick={() => onPanelClick('tradeRack')}
          data-tooltip="Trade Rack Properties"
        >
          <svg
            id="TradeRackPropIcon"
            width="32"
            height="32"
            viewBox="0 0 32 32"
            className="app-button-left-menu-icon-trade-rack button2-icon"
          >
            <path
              d="M26 6v4H6V6zm0-2H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2M10 16v10H6V16zm0-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V16a2 2 0 0 0-2-2m16 2v10H16V16zm0-2H16a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V16a2 2 0 0 0-2-2"
              fill="currentColor"
            />
          </svg>
        </button>
        <button
          id="AddDuct"
          type="button"
          className={`app-button-left-menu-add-duct-button button-icon2 ${activePanel === 'ductwork' ? 'active' : ''}`}
          onClick={() => onPanelClick('ductwork')}
          data-tooltip="Add Ductwork"
        >
          <svg
            id="AddDuctIcon"
            width="256"
            height="256"
            viewBox="0 0 256 256"
            className="app-button-left-menu-icon15 button2-icon"
          >
            <path
              d="M220.24 91.75L164 35.56a5.93 5.93 0 0 0-4-1.56H40a6 6 0 0 0-6 6v120a6 6 0 0 0 1.76 4.25l56 56A6 6 0 0 0 96 222h120a6 6 0 0 0 6-6V96a6 6 0 0 0-1.76-4.25M166 54.48L201.52 90H166Zm-76 147L54.48 166H90ZM90 154H46V54.48l44 44ZM54.48 46H154v44H98.48ZM154 102v52h-52v-52Zm-52 108v-44h55.52l44 44Zm108-8.48l-44-44V102h44Z"
              fill="currentColor"
            ></path>
          </svg>
        </button>
        <button
          id="AddPipingButton"
          type="button"
          className={`app-button-left-menu-add-piping button-icon2 ${activePanel === 'piping' ? 'active' : ''}`}
          onClick={() => onPanelClick('piping')}
          data-tooltip="Add Piping"
        >
          <svg
            id="AddPipingIcon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="app-button-left-menu-icon17 button2-icon"
          >
            <path
              d="M22 20v-8a2 2 0 0 0-2-2h-5V9h-2v6h2v-1h3v6h-1v2h6v-2Zm-1 0h-2v-7h-4v-2h5a1 1 0 0 1 1 1ZM9 9v1H6V4h1V2H1v2h1v8a2 2 0 0 0 2 2h5v1h2V9Zm0 4H4a1 1 0 0 1-1-1V4h2v7h4Z"
              fill="currentColor"
            ></path>
          </svg>
        </button>
        <button
          id="AddConduitButton"
          type="button"
          className={`app-button-left-menu-add-conduit button-icon2 ${activePanel === 'conduits' ? 'active' : ''}`}
          onClick={() => onPanelClick('conduits')}
          data-tooltip="Add Conduits"
        >
          <svg
            id="AddConduitIcon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="app-button-left-menu-icon19 button2-icon"
          >
            <path
              d="M15 4a8 8 0 0 1 8 8a8 8 0 0 1-8 8a8 8 0 0 1-8-8a8 8 0 0 1 8-8m0 14a6 6 0 0 0 6-6a6 6 0 0 0-6-6a6 6 0 0 0-6 6a6 6 0 0 0 6 6M3 12a5.99 5.99 0 0 0 4 5.65v2.09c-3.45-.89-6-4.01-6-7.74s2.55-6.85 6-7.74v2.09C4.67 7.17 3 9.39 3 12"
              fill="currentColor"
            ></path>
          </svg>
        </button>
        <button
          id="AddCableTrayButton"
          type="button"
          className={`app-button-left-menu-add-cable-tray thq-button-icon ${activePanel === 'cableTrays' ? 'active' : ''}`}
          onClick={() => onPanelClick('cableTrays')}
          data-tooltip="Add Cable Trays"
        >
          <svg
            id="AddCableTrayIcon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="app-button-left-menu-icon21 button2-icon"
          >
            <path
              d="M2 12h2v5h16v-5h2v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"
              fill="currentColor"
            ></path>
          </svg>
        </button>
        <button
          id="OptimizeRackButton"
          type="button"
          className={`app-button-left-menu-optimize-rack button-icon2 ${activePanel === 'optimization' ? 'active' : ''}`}
          onClick={() => onPanelClick('optimization')}
          data-tooltip="Optimize Rack Configuration"
        >
          <svg
            id="OptimizeRackIcon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="app-button-left-menu-icon-optimize button2-icon"
          >
            <path
              d="M12.9 6.858l2.828 2.828l1.414-1.414L12.9 4.03L8.657 8.272l1.414 1.414zm-1.8 10.283l-2.828-2.828l-1.414 1.414l4.242 4.243l4.243-4.243l-1.414-1.414z"
              fill="currentColor"
            ></path>
            <path
              d="M4 12h7v-2H4zm13 0h3v-2h-3zm-4 0h2v-2h-2zm-9 2h3v2H4zm5 0h7v2H9zm9 0h2v2h-2z"
              fill="currentColor"
            ></path>
          </svg>
        </button>
      </div>
      <button
        id="EditViewPropButton"
        type="button"
        className="app-button-left-menu-edit-view-prop-button"
        data-tooltip="View Properties"
      >
        <svg
          id="EditViewPropIcon"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-button-left-menu-icon23"
        >
          <path
            d="M30 8h-4.1c-.5-2.3-2.5-4-4.9-4s-4.4 1.7-4.9 4H2v2h14.1c.5 2.3 2.5 4 4.9 4s4.4-1.7 4.9-4H30zm-9 4c-1.7 0-3-1.3-3-3s1.3-3 3-3s3 1.3 3 3s-1.3 3-3 3M2 24h4.1c.5 2.3 2.5 4 4.9 4s4.4-1.7 4.9-4H30v-2H15.9c-.5-2.3-2.5-4-4.9-4s-4.4 1.7-4.9 4H2zm9-4c1.7 0 3 1.3 3 3s-1.3 3-3 3s-3-1.3-3-3s1.3-3 3-3"
            fill="currentColor"
          ></path>
        </svg>
      </button>
    </div>
  )
}

AppButtonLeftMenu.defaultProps = {
  rootClassName: '',
  onPanelClick: () => {},
  activePanel: null,
  isRackPropertiesVisible: false,
}

AppButtonLeftMenu.propTypes = {
  rootClassName: PropTypes.string,
  onPanelClick: PropTypes.func,
  activePanel: PropTypes.string,
  isRackPropertiesVisible: PropTypes.bool,
}

export default AppButtonLeftMenu