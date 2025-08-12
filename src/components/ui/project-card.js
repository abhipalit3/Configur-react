/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './project-card.css'

const ProjectCard = (props) => {
  return (
    <div className={`project-card-container1 ${props.rootClassName} `}>
      <div className="project-card-container2">
        <img
          alt={props.imageAlt}
          src={props.projectImage}
          className="project-card-image"
        />
      </div>
      <div className="project-card-container3">
        <span className="project-card-project-number">
          {props.projectNumber ?? (
            <Fragment>
              <span className="project-card-text4">DA-12-123456</span>
            </Fragment>
          )}
        </span>
        <span id="projectName" className="project-card-project-name">
          {props.projectName ?? (
            <Fragment>
              <span className="project-card-text5">Name of the Project</span>
            </Fragment>
          )}
        </span>
        <span className="project-card-proect-address">
          {props.projectAddress ?? (
            <Fragment>
              <span className="project-card-text3">Address of the Project</span>
            </Fragment>
          )}
        </span>
        <span className="project-card-created-by">
          {props.createdBy ?? (
            <Fragment>
              <span className="project-card-text1">Created by: John, Doe</span>
            </Fragment>
          )}
        </span>
        <span className="project-card-edited">
          {props.lastEdited ?? (
            <Fragment>
              <span className="project-card-text2">Edited 1 day ago.</span>
            </Fragment>
          )}
        </span>
      </div>
    </div>
  )
}

ProjectCard.defaultProps = {
  createdBy: undefined,
  lastEdited: undefined,
  imageAlt: 'image',
  projectAddress: undefined,
  projectNumber: undefined,
  projectImage: 'https://play.teleporthq.io/static/svg/default-img.svg',
  rootClassName: '',
  projectName: undefined,
}

ProjectCard.propTypes = {
  createdBy: PropTypes.element,
  lastEdited: PropTypes.element,
  imageAlt: PropTypes.string,
  projectAddress: PropTypes.element,
  projectNumber: PropTypes.element,
  projectImage: PropTypes.string,
  rootClassName: PropTypes.string,
  projectName: PropTypes.element,
}

export default ProjectCard
