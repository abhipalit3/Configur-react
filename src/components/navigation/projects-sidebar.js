/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './projects-sidebar.css'

const ProjectsSidebar = (props) => {
  return (
    <div className={`projects-sidebar-container10 ${props.rootClassName} `}>
      <div className="projects-sidebar-container11">
        <div className="projects-sidebar-container12">
          <span className="projects-sidebar-text10">
            {props.projectCompanyName ?? (
              <Fragment>
                <span className="projects-sidebar-text19">
                  DPR Construction
                </span>
              </Fragment>
            )}
          </span>
        </div>
        <button
          type="button"
          className="projects-sidebar-button button thq-button-outline"
        >
          <span>
            {props.addNewButton ?? (
              <Fragment>
                <span className="projects-sidebar-text18">+ New Project</span>
              </Fragment>
            )}
          </span>
        </button>
      </div>
      <hr className="projects-sidebar-separator1"></hr>
      <div className="projects-sidebar-container13">
        <div className="projects-sidebar-container14">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle r="10" cx="12" cy="12"></circle>
              <path d="M12 6v6l4 2"></path>
            </g>
          </svg>
          <span>
            {props.recent ?? (
              <Fragment>
                <span className="projects-sidebar-text12">Recent</span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="projects-sidebar-container15">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path
              d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          <span>
            {props.myProjects ?? (
              <Fragment>
                <span className="projects-sidebar-text13">My Projects</span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="projects-sidebar-container16">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path
              d="m12 2l3.09 6.26L22 9.27l-5 4.87l1.18 6.88L12 17.77l-6.18 3.25L7 14.14L2 9.27l6.91-1.01z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            ></path>
          </svg>
          <span>
            {props.starrtedProjects ?? (
              <Fragment>
                <span className="projects-sidebar-text14">Starred</span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="projects-sidebar-container17">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 19.75c0-2.09-1.67-5.068-4-5.727m-2 5.727c0-2.651-2.686-6-6-6s-6 3.349-6 6"></path>
              <circle r="3" cx="9" cy="7.25"></circle>
              <path d="M15 10.25a3 3 0 1 0 0-6"></path>
            </g>
          </svg>
          <span>
            {props.sharedWithMe ?? (
              <Fragment>
                <span className="projects-sidebar-text17">Shared With Me</span>
              </Fragment>
            )}
          </span>
        </div>
      </div>
      <hr className="projects-sidebar-separator2"></hr>
      <div className="projects-sidebar-container18">
        <div className="projects-sidebar-container19">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10"></path>
              <path d="M9 9c0-3.5 5.5-3.5 5.5 0c0 2.5-2.5 2-2.5 5m0 4.01l.01-.011"></path>
            </g>
          </svg>
          <span>
            {props.help ?? (
              <Fragment>
                <span className="projects-sidebar-text15">Help</span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="projects-sidebar-container20">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <g
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" rx="2" ry="2" width="18" height="11"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </g>
          </svg>
          <span>
            {props.support ?? (
              <Fragment>
                <span className="projects-sidebar-text16">Support</span>
              </Fragment>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

ProjectsSidebar.defaultProps = {
  recent: undefined,
  myProjects: undefined,
  starrtedProjects: undefined,
  help: undefined,
  support: undefined,
  sharedWithMe: undefined,
  addNewButton: undefined,
  rootClassName: '',
  projectCompanyName: undefined,
}

ProjectsSidebar.propTypes = {
  recent: PropTypes.element,
  myProjects: PropTypes.element,
  starrtedProjects: PropTypes.element,
  help: PropTypes.element,
  support: PropTypes.element,
  sharedWithMe: PropTypes.element,
  addNewButton: PropTypes.element,
  rootClassName: PropTypes.string,
  projectCompanyName: PropTypes.element,
}

export default ProjectsSidebar
