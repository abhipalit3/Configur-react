/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './assembly-card.css'

const AssemblyCard = (props) => {
  return (
    <div className={`assembly-card-container1 ${props.rootClassName} `}>
      <div className="assembly-card-container2">
        <img
          alt={props.imageAlt}
          src={props.projectImage}
          className="assembly-card-image"
        />
      </div>
      <div className="assembly-card-container3">
        <span id="projectName" className="assembly-card-project-name">
          {props.assemblyName ?? (
            <Fragment>
              <span className="assembly-card-text4">Name of the Assembly</span>
            </Fragment>
          )}
        </span>
        <span className="assembly-card-description">
          {props.createdBy ?? (
            <Fragment>
              <span className="assembly-card-text2">
                Description of the Prefabricated Assembly
              </span>
            </Fragment>
          )}
        </span>
        <span className="assembly-card-created-by">
          {props.createdBy1 ?? (
            <Fragment>
              <span className="assembly-card-text1">Created by: John, Doe</span>
            </Fragment>
          )}
        </span>
        <span className="assembly-card-edited">
          {props.lastEdited ?? (
            <Fragment>
              <span className="assembly-card-text3">Edited 1 day ago.</span>
            </Fragment>
          )}
        </span>
      </div>
    </div>
  )
}

AssemblyCard.defaultProps = {
  createdBy1: undefined,
  createdBy: undefined,
  rootClassName: '',
  imageAlt: 'image',
  lastEdited: undefined,
  projectImage: 'https://play.teleporthq.io/static/svg/default-img.svg',
  assemblyName: undefined,
}

AssemblyCard.propTypes = {
  createdBy1: PropTypes.element,
  createdBy: PropTypes.element,
  rootClassName: PropTypes.string,
  imageAlt: PropTypes.string,
  lastEdited: PropTypes.element,
  projectImage: PropTypes.string,
  assemblyName: PropTypes.element,
}

export default AssemblyCard
