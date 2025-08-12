/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './app-ai-chat-panel.css'

const AppAIChatPanel = (props) => {
  return (
    <div className={`app-ai-chat-panel-container1 ${props.rootClassName} `}>
      <div className="app-ai-chat-panel-container2">
        <h1 id="AI_ChatHeading" className="app-ai-chat-panel-text1 heading">
          Rack Design AI
        </h1>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="app-ai-chat-panel-icon1 button-icon"
          onClick={props.onClose}
        >
          <path
            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
      <div className="app-ai-chat-panel-container3">
        <span className="app-ai-chat-panel-text2">
          {props.aIChatDescription ?? (
            <Fragment>
              <span className="app-ai-chat-panel-text4">
                Design your rack layout with AI-describe your rack and MEP
                systems, and AI will design the layout for you
              </span>
            </Fragment>
          )}
        </span>
        <textarea
          id="ChatBox"
          name="ChatBox"
          placeholder="Describe your rack and MEP system for AI to design for you"
          className="app-ai-chat-panel-textarea"
        ></textarea>
        <button type="button" className="app-ai-chat-panel-button save-button">
          <span className="app-ai-chat-panel-text3">
            {props.aIChatSendButton ?? (
              <Fragment>
                <span className="app-ai-chat-panel-text5">Send</span>
              </Fragment>
            )}
          </span>
        </button>
      </div>
    </div>
  )
}

AppAIChatPanel.defaultProps = {
  aIChatDescription: undefined,
  aIChatSendButton: undefined,
  rootClassName: '',
}

AppAIChatPanel.propTypes = {
  aIChatDescription: PropTypes.element,
  aIChatSendButton: PropTypes.element,
  rootClassName: PropTypes.string,
}

export default AppAIChatPanel
