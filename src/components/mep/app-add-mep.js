import React from 'react'

import PropTypes from 'prop-types'

import './app-add-mep.css'

const AppAddMEP = (props) => {
  return (
    <div className={`app-add-mep-container ${props.rootClassName} `}>
      <button
        id="AddDuct"
        type="button"
        className="app-add-mep-add-duct-button button-icon2"
      >
        <svg
          id="AddDuctIcon"
          width="256"
          height="256"
          viewBox="0 0 256 256"
          className="app-add-mep-icon1 button2-icon"
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
        className="app-add-mep-add-piping button-icon2"
      >
        <svg
          id="AddPipingIcon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className="app-add-mep-icon3 button2-icon"
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
        className="app-add-mep-add-conduit button-icon2"
      >
        <svg
          id="AddConduitIcon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className="app-add-mep-icon5 button2-icon"
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
        className="app-add-mep-add-cable-tray thq-button-icon"
      >
        <svg
          id="AddCableTrayIcon"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className="app-add-mep-icon7 button2-icon"
        >
          <path
            d="M2 12h2v5h16v-5h2v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2Z"
            fill="currentColor"
          ></path>
        </svg>
      </button>
    </div>
  )
}

AppAddMEP.defaultProps = {
  rootClassName: '',
}

AppAddMEP.propTypes = {
  rootClassName: PropTypes.string,
}

export default AppAddMEP
