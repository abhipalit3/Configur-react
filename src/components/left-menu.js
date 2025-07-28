import React from 'react'

import PropTypes from 'prop-types'

import './left-menu.css'

const LeftMenu = ({ rootClassName, onChatClick, onRackClick, activeChat,
  activeRack }) => {
  return (
    <div className={`left-menu-container1 ${rootClassName} `}>
      <button type="button" className="left-menu-button1 thq-button-icon" onClick={onChatClick}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          className={"left-menu-icon10" + (activeChat ? ' active' : '')}
        >
          <path
            d="m14.878.282l.348 1.071a2.2 2.2 0 0 0 1.399 1.397l1.071.348l.021.006a.423.423 0 0 1 0 .798l-1.071.348a2.2 2.2 0 0 0-1.399 1.397l-.348 1.07a.423.423 0 0 1-.798 0l-.349-1.07a2.2 2.2 0 0 0-.532-.867a2.2 2.2 0 0 0-.866-.536l-1.071-.348a.423.423 0 0 1 0-.798l1.071-.348a2.2 2.2 0 0 0 1.377-1.397l.348-1.07a.423.423 0 0 1 .799 0m4.905 7.931l-.766-.248a1.58 1.58 0 0 1-.998-.999l-.25-.764a.302.302 0 0 0-.57 0l-.248.764a1.58 1.58 0 0 1-.984.999l-.765.248a.303.303 0 0 0 0 .57l.765.249a1.58 1.58 0 0 1 1 1.002l.248.764a.302.302 0 0 0 .57 0l.249-.764a1.58 1.58 0 0 1 .999-.999l.765-.248a.303.303 0 0 0 0-.57zM9.5 3q.294.002.553.105a1.43 1.43 0 0 0 .918 1.743l.029.01V7.5A1.5 1.5 0 0 1 9.5 9h-5A1.5 1.5 0 0 1 3 7.5v-3A1.5 1.5 0 0 1 4.5 3zm6 14a1.5 1.5 0 0 0 1.5-1.5v-3a1.5 1.5 0 0 0-1.5-1.5h-5A1.5 1.5 0 0 0 9 12.5v3a1.5 1.5 0 0 0 1.5 1.5zm.5-1.5a.5.5 0 0 1-.5.5h-5a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5zm-6-8v-3a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5M5.5 17A1.5 1.5 0 0 0 7 15.5v-3A1.5 1.5 0 0 0 5.5 11h-1A1.5 1.5 0 0 0 3 12.5v3A1.5 1.5 0 0 0 4.5 17zm.5-1.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"
            fill="currentColor"
          ></path>
        </svg>
      </button>
      <div className="left-menu-container2">
        <button type="button" className="left-menu-button2 button-icon2">
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            className="left-menu-icon12 button2-icon"
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
        <button type="button" className={"left-menu-button3 button-icon2" + (activeRack ? ' active' : '')} onClick={onRackClick}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="left-menu-icon15 button2-icon"
          >
            <path
              d="M3 3.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5m0 5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM4 13v2a1 1 0 0 0 1 1h2v-3zm8 3v-3H8v3zm1 0h2a1 1 0 0 0 1-1v-2h-3zm0-4h3V9h-3zm-1-3H8v3h4zM4 9v3h3V9z"
              fill="currentColor"
            ></path>
          </svg>
        </button>
        <button type="button" className="left-menu-button4 thq-button-icon">
          <svg
            width="256"
            height="256"
            viewBox="0 0 256 256"
            className="left-menu-icon17 button2-icon"
          >
            <path
              d="M232 106h-26V54h26a6 6 0 0 0 0-12h-27.37A14 14 0 0 0 192 34h-16a14 14 0 0 0-12.63 8H144A102.12 102.12 0 0 0 42 144v19.37A14 14 0 0 0 34 176v16a14 14 0 0 0 8 12.63V232a6 6 0 0 0 12 0v-26h52v26a6 6 0 0 0 12 0v-27.37a14 14 0 0 0 8-12.63v-16a14 14 0 0 0-8-12.63V144a26 26 0 0 1 26-26h19.37a14 14 0 0 0 12.63 8h16a14 14 0 0 0 12.63-8H232a6 6 0 0 0 0-12m-120 68a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H48a2 2 0 0 1-2-2v-16a2 2 0 0 1 2-2Zm-6-30v18H54v-18a90.1 90.1 0 0 1 90-90h18v52h-18a38 38 0 0 0-38 38m86-30h-16a2 2 0 0 1-2-2V48a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v64a2 2 0 0 1-2 2"
              fill="currentColor"
            ></path>
          </svg>
        </button>
      </div>
      <button type="button" className="left-menu-button5">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="left-menu-icon19"
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

LeftMenu.propTypes = {
  rootClassName: PropTypes.string,
  onChatClick:   PropTypes.func,
  onRackClick:   PropTypes.func,
  activeChat:    PropTypes.bool,
  activeRack:    PropTypes.bool
}

LeftMenu.defaultProps = {
  rootClassName: '',
  onChatClick:   () => {},
  onRackClick:   () => {},
  activeChat:    false,
  activeRack:    false
}

export default LeftMenu
