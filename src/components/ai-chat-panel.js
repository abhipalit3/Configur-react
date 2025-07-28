import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './ai-chat-panel.css'

const AIChatPanel = ({ rootClassName, text1, button, onClose }) => {
  return (
    <div className={`ai-chat-panel-container1 ${rootClassName} `}>
      <div className="ai-chat-panel-container2">
        <h1 className="ai-chat-panel-text1 heading">Rack Design AI</h1>
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          className="ai-chat-panel-icon1 button-icon"
          onClick={onClose}
          style={{ cursor: 'pointer' }}
        >
          <path
            d="M17.414 16L26 7.414L24.586 6L16 14.586L7.414 6L6 7.414L14.586 16L6 24.586L7.414 26L16 17.414L24.586 26L26 24.586z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
      <div className="ai-chat-panel-container3">
        <span className="ai-chat-panel-text2">
          {text1 ?? (
            <Fragment>
              <span className="ai-chat-panel-text4">
                Design your rack layout with AI-describe your rack and MEP
                systems, and AI will design the layout for you
              </span>
            </Fragment>
          )}
        </span>
        <textarea
          placeholder="Describe your rack and MEP system for AI to design for you"
          className="ai-chat-panel-textarea"
        ></textarea>
        <button type="button" className="ai-chat-panel-button save-button">
          <span className="ai-chat-panel-text3">
            {button ?? (
              <Fragment>
                <span className="ai-chat-panel-text5">Send</span>
              </Fragment>
            )}
          </span>
        </button>
      </div>
    </div>
  )
}

AIChatPanel.defaultProps = {
  text1: undefined,
  button: undefined,
  rootClassName: '',
}

AIChatPanel.propTypes = {
  text1: PropTypes.element,
  button: PropTypes.element,
  rootClassName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
}

export default AIChatPanel
