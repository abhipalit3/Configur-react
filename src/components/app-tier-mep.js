import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './app-tier-mep.css'

const AppTierMEP = (props) => {
  return (
    <div className={`app-tier-mep-container1 ${props.rootClassName} `}>
      <div className="app-tier-mep-heading">
        <input
          type="text"
          placeholder="Search"
          className="app-tier-mep-textinput input-form"
        />
      </div>
      <div className="app-tier-mep-container2">
        <div className="app-tier-mep-added-mep1">
          <span className="app-tier-mep-text10">
            {props.floortodeck11 ?? (
              <Fragment>
                <span className="app-tier-mep-text22">
                  0&quot; Conduit Group
                </span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="app-tier-mep-added-mep2">
          <span className="app-tier-mep-text11">
            {props.floortodeck1110 ?? (
              <Fragment>
                <span className="app-tier-mep-text25">
                  0&quot; Conduit Group
                </span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="app-tier-mep-added-mep3">
          <span className="app-tier-mep-text12">
            {props.floortodeck119 ?? (
              <Fragment>
                <span className="app-tier-mep-text20">
                  0&quot; Conduit Group
                </span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="app-tier-mep-added-mep4">
          <span className="app-tier-mep-text13">
            {props.floortodeck118 ?? (
              <Fragment>
                <span className="app-tier-mep-text21">
                  0&quot; Conduit Group
                </span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="app-tier-mep-added-mep5">
          <span className="app-tier-mep-text14">
            {props.floortodeck1185 ?? (
              <Fragment>
                <span className="app-tier-mep-text19">
                  0&quot; Conduit Group
                </span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="app-tier-mep-added-mep6">
          <span className="app-tier-mep-text15">
            {props.floortodeck1184 ?? (
              <Fragment>
                <span className="app-tier-mep-text23">
                  0&quot; Conduit Group
                </span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="app-tier-mep-added-mep7">
          <span className="app-tier-mep-text16">
            {props.floortodeck1183 ?? (
              <Fragment>
                <span className="app-tier-mep-text27">
                  0&quot; Conduit Group
                </span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="app-tier-mep-added-mep8">
          <span className="app-tier-mep-text17">
            {props.floortodeck1182 ?? (
              <Fragment>
                <span className="app-tier-mep-text26">
                  0&quot; Conduit Group
                </span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="app-tier-mep-added-mep9">
          <span className="app-tier-mep-text18">
            {props.floortodeck1181 ?? (
              <Fragment>
                <span className="app-tier-mep-text24">
                  0&quot; Conduit Group
                </span>
              </Fragment>
            )}
          </span>
        </div>
      </div>
      <div className="app-tier-mep-title">
        <svg
          height="24"
          width="24"
          viewBox="0 0 24 24"
          className="app-tier-mep-icon10"
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
  floortodeck1185: undefined,
  floortodeck119: undefined,
  floortodeck118: undefined,
  floortodeck11: undefined,
  floortodeck1184: undefined,
  rootClassName: '',
  floortodeck1181: undefined,
  floortodeck1110: undefined,
  floortodeck1182: undefined,
  floortodeck1183: undefined,
}

AppTierMEP.propTypes = {
  floortodeck1185: PropTypes.element,
  floortodeck119: PropTypes.element,
  floortodeck118: PropTypes.element,
  floortodeck11: PropTypes.element,
  floortodeck1184: PropTypes.element,
  rootClassName: PropTypes.string,
  floortodeck1181: PropTypes.element,
  floortodeck1110: PropTypes.element,
  floortodeck1182: PropTypes.element,
  floortodeck1183: PropTypes.element,
}

export default AppTierMEP
