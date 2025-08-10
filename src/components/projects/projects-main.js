import React, { Fragment } from 'react'

import PropTypes from 'prop-types'

import { ProjectCard } from '../ui'
import './projects-main.css'

const ProjectsMain = (props) => {
  return (
    <div className={`projects-main-container1 ${props.rootClassName} `}>
      <div className="projects-main-container2">
        <div className="projects-main-container3">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="projects-main-icon1"
          >
            <g fill="none" fill-rule="evenodd">
              <path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"></path>
              <path
                d="M10.5 2a8.5 8.5 0 1 0 5.262 15.176l3.652 3.652a1 1 0 0 0 1.414-1.414l-3.652-3.652A8.5 8.5 0 0 0 10.5 2M4 10.5a6.5 6.5 0 1 1 13 0a6.5 6.5 0 0 1-13 0"
                fill="currentColor"
              ></path>
            </g>
          </svg>
          <input
            type="text"
            id="search-project"
            placeholder="Search Projects"
            className="projects-main-textinput"
          />
        </div>
        <div className="projects-main-container4">
          <select>
            <option value="All">All</option>
            <option value="Created by me">Created by me</option>
            <option value="Shared with me">Shared with me</option>
          </select>
          <select name="SortBy">
            <option value="Name">Name</option>
            <option value="Date Created">Date Created</option>
            <option value="Last Modified">Last Modified</option>
          </select>
        </div>
      </div>
      <div className="projects-main-container5">
        <ProjectCard
          createdBy={
            <Fragment>
              <span className="projects-main-text10">
                Created by: John, Doe
              </span>
            </Fragment>
          }
          lastEdited={
            <Fragment>
              <span className="projects-main-text11">Edited 1 day ago.</span>
            </Fragment>
          }
          projectName={
            <Fragment>
              <span className="projects-main-text12">Name of the Project</span>
            </Fragment>
          }
          projectImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDJ8fGJ1aWxkaW5nfGVufDB8fHx8MTc1MjQ3MTY0MHww&amp;ixlib=rb-4.1.0&amp;h=1500"
          projectNumber={
            <Fragment>
              <span className="projects-main-text13">DA-12-123456</span>
            </Fragment>
          }
          rootClassName="project-cardroot-class-name"
          projectAddress={
            <Fragment>
              <span className="projects-main-text14">
                1761 Warburton Avenue
              </span>
            </Fragment>
          }
        ></ProjectCard>
        <ProjectCard
          createdBy={
            <Fragment>
              <span className="projects-main-text15">
                Created by: John, Doe
              </span>
            </Fragment>
          }
          lastEdited={
            <Fragment>
              <span className="projects-main-text16">Edited 1 day ago.</span>
            </Fragment>
          }
          projectName={
            <Fragment>
              <span className="projects-main-text17">Name of the Project</span>
            </Fragment>
          }
          projectImage="https://images.unsplash.com/photo-1470075801209-17f9ec0cada6?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDE1fHxidWlsZGluZ3xlbnwwfHx8fDE3NTI0NzE2NDB8MA&amp;ixlib=rb-4.1.0&amp;h=1500"
          projectNumber={
            <Fragment>
              <span className="projects-main-text18">DA-12-123456</span>
            </Fragment>
          }
          rootClassName="project-cardroot-class-name2"
          projectAddress={
            <Fragment>
              <span className="projects-main-text19">
                Address of the Project
              </span>
            </Fragment>
          }
        ></ProjectCard>
        <ProjectCard
          createdBy={
            <Fragment>
              <span className="projects-main-text20">
                Created by: John, Doe
              </span>
            </Fragment>
          }
          lastEdited={
            <Fragment>
              <span className="projects-main-text21">Edited 1 day ago.</span>
            </Fragment>
          }
          projectName={
            <Fragment>
              <span className="projects-main-text22">Name of the Project</span>
            </Fragment>
          }
          projectImage="https://images.unsplash.com/photo-1527576539890-dfa815648363?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDZ8fGJ1aWxkaW5nfGVufDB8fHx8MTc1MjQ3MTY0MHww&amp;ixlib=rb-4.1.0&amp;h=1500"
          projectNumber={
            <Fragment>
              <span className="projects-main-text23">DA-12-123456</span>
            </Fragment>
          }
          rootClassName="project-cardroot-class-name5"
          projectAddress={
            <Fragment>
              <span className="projects-main-text24">
                Address of the Project
              </span>
            </Fragment>
          }
        ></ProjectCard>
        <ProjectCard
          createdBy={
            <Fragment>
              <span className="projects-main-text25">
                Created by: John, Doe
              </span>
            </Fragment>
          }
          lastEdited={
            <Fragment>
              <span className="projects-main-text26">Edited 1 day ago.</span>
            </Fragment>
          }
          projectName={
            <Fragment>
              <span className="projects-main-text27">Name of the Project</span>
            </Fragment>
          }
          projectImage="https://images.unsplash.com/photo-1435575653489-b0873ec954e2?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDE5fHxidWlsZGluZ3xlbnwwfHx8fDE3NTI0NzE2NDB8MA&amp;ixlib=rb-4.1.0&amp;h=1500"
          projectNumber={
            <Fragment>
              <span className="projects-main-text28">DA-12-123456</span>
            </Fragment>
          }
          rootClassName="project-cardroot-class-name11"
          projectAddress={
            <Fragment>
              <span className="projects-main-text29">
                Address of the Project
              </span>
            </Fragment>
          }
        ></ProjectCard>
        <ProjectCard
          createdBy={
            <Fragment>
              <span className="projects-main-text30">
                Created by: John, Doe
              </span>
            </Fragment>
          }
          lastEdited={
            <Fragment>
              <span className="projects-main-text31">Edited 1 day ago.</span>
            </Fragment>
          }
          projectName={
            <Fragment>
              <span className="projects-main-text32">Name of the Project</span>
            </Fragment>
          }
          projectImage="https://images.unsplash.com/photo-1443641723753-250ff9bb3c83?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDE4fHxidWlsZGluZ3xlbnwwfHx8fDE3NTI0NzE2NDB8MA&amp;ixlib=rb-4.1.0&amp;h=1500"
          projectNumber={
            <Fragment>
              <span className="projects-main-text33">DA-12-123456</span>
            </Fragment>
          }
          rootClassName="project-cardroot-class-name12"
          projectAddress={
            <Fragment>
              <span className="projects-main-text34">
                Address of the Project
              </span>
            </Fragment>
          }
        ></ProjectCard>
        <ProjectCard
          createdBy={
            <Fragment>
              <span className="projects-main-text35">
                Created by: John, Doe
              </span>
            </Fragment>
          }
          lastEdited={
            <Fragment>
              <span className="projects-main-text36">Edited 1 day ago.</span>
            </Fragment>
          }
          projectName={
            <Fragment>
              <span className="projects-main-text37">Name of the Project</span>
            </Fragment>
          }
          projectImage="https://images.unsplash.com/photo-1518005020951-eccb494ad742?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDEwfHxidWlsZGluZ3xlbnwwfHx8fDE3NTI0NzE2NDB8MA&amp;ixlib=rb-4.1.0&amp;h=1500"
          projectNumber={
            <Fragment>
              <span className="projects-main-text38">DA-12-123456</span>
            </Fragment>
          }
          rootClassName="project-cardroot-class-name13"
          projectAddress={
            <Fragment>
              <span className="projects-main-text39">
                Address of the Project
              </span>
            </Fragment>
          }
        ></ProjectCard>
        <ProjectCard
          createdBy={
            <Fragment>
              <span className="projects-main-text40">
                Created by: John, Doe
              </span>
            </Fragment>
          }
          lastEdited={
            <Fragment>
              <span className="projects-main-text41">Edited 1 day ago.</span>
            </Fragment>
          }
          projectName={
            <Fragment>
              <span className="projects-main-text42">Name of the Project</span>
            </Fragment>
          }
          projectImage="https://images.unsplash.com/photo-1483366774565-c783b9f70e2c?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDI0fHxidWlsZGluZ3xlbnwwfHx8fDE3NTI0NzE2NDB8MA&amp;ixlib=rb-4.1.0&amp;h=1500"
          projectNumber={
            <Fragment>
              <span className="projects-main-text43">DA-12-123456</span>
            </Fragment>
          }
          rootClassName="project-cardroot-class-name14"
          projectAddress={
            <Fragment>
              <span className="projects-main-text44">
                Address of the Project
              </span>
            </Fragment>
          }
        ></ProjectCard>
        <ProjectCard
          createdBy={
            <Fragment>
              <span className="projects-main-text45">
                Created by: John, Doe
              </span>
            </Fragment>
          }
          lastEdited={
            <Fragment>
              <span className="projects-main-text46">Edited 1 day ago.</span>
            </Fragment>
          }
          projectName={
            <Fragment>
              <span className="projects-main-text47">Name of the Project</span>
            </Fragment>
          }
          projectImage="https://images.unsplash.com/photo-1468127225977-85bc4aa3fe0f?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDIzfHxidWlsZGluZ3xlbnwwfHx8fDE3NTI0NzE2NDB8MA&amp;ixlib=rb-4.1.0&amp;h=1500"
          projectNumber={
            <Fragment>
              <span className="projects-main-text48">DA-12-123456</span>
            </Fragment>
          }
          rootClassName="project-cardroot-class-name15"
          projectAddress={
            <Fragment>
              <span className="projects-main-text49">
                Address of the Project
              </span>
            </Fragment>
          }
        ></ProjectCard>
      </div>
    </div>
  )
}

ProjectsMain.defaultProps = {
  rootClassName: '',
}

ProjectsMain.propTypes = {
  rootClassName: PropTypes.string,
}

export default ProjectsMain
