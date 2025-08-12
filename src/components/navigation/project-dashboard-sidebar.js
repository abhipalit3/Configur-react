/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import './project-dashboard-sidebar.css'

const ProjectDashboardSidebar = (props) => {
  return (
    <div
      className={`project-dashboard-sidebar-container10 ${props.rootClassName} `}
    >
      <div className="project-dashboard-sidebar-container11">
        <div className="project-dashboard-sidebar-container12">
          <span className="project-dashboard-sidebar-text10">
            {props.projectName ?? (
              <Fragment>
                <span className="project-dashboard-sidebar-text13">
                  Project Name
                </span>
              </Fragment>
            )}
          </span>
        </div>
        <button
          type="button"
          className="project-dashboard-sidebar-button button thq-button-outline"
        >
          <span>
            {props.newAssemblyButton ?? (
              <Fragment>
                <span className="project-dashboard-sidebar-text12">
                  + New Assembly
                </span>
              </Fragment>
            )}
          </span>
        </button>
      </div>
      <hr className="project-dashboard-sidebar-separator1"></hr>
      <div className="project-dashboard-sidebar-container13">
        <div className="project-dashboard-sidebar-container14">
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
                <span className="project-dashboard-sidebar-text18">Recent</span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="project-dashboard-sidebar-container15">
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
            {props.myAssemblies ?? (
              <Fragment>
                <span className="project-dashboard-sidebar-text15">
                  My Assemblies
                </span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="project-dashboard-sidebar-container16">
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
                <span className="project-dashboard-sidebar-text17">
                  Starred
                </span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="project-dashboard-sidebar-container17">
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
                <span className="project-dashboard-sidebar-text14">
                  Shared With Me
                </span>
              </Fragment>
            )}
          </span>
        </div>
      </div>
      <hr className="project-dashboard-sidebar-separator2"></hr>
      <div className="project-dashboard-sidebar-container18">
        <div className="project-dashboard-sidebar-container19">
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
                <span className="project-dashboard-sidebar-text19">Help</span>
              </Fragment>
            )}
          </span>
        </div>
        <div className="project-dashboard-sidebar-container20">
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
                <span className="project-dashboard-sidebar-text16">
                  Support
                </span>
              </Fragment>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}

ProjectDashboardSidebar.defaultProps = {
  newAssemblyButton: undefined,
  projectName: undefined,
  sharedWithMe: undefined,
  myAssemblies: undefined,
  support: undefined,
  starrtedProjects: undefined,
  recent: undefined,
  rootClassName: '',
  help: undefined,
}

ProjectDashboardSidebar.propTypes = {
  newAssemblyButton: PropTypes.element,
  projectName: PropTypes.element,
  sharedWithMe: PropTypes.element,
  myAssemblies: PropTypes.element,
  support: PropTypes.element,
  starrtedProjects: PropTypes.element,
  recent: PropTypes.element,
  rootClassName: PropTypes.string,
  help: PropTypes.element,
}

export default ProjectDashboardSidebar
