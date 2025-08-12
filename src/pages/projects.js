/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'

import { Helmet } from 'react-helmet'

import { ProjectsNavbar, ProjectsSidebar } from '../components/navigation'
import { ProjectCard } from '../components/ui'
import './projects.css'

const Projects = (props) => {
  return (
    <div className="projects-container1">
      <Helmet>
        <title>Projects - Configur</title>
        <meta
          name="description"
          content="Configure prefabricated assemblies using AI and Natural language."
        />
        <meta property="og:title" content="Projects - Configur" />
        <meta
          property="og:description"
          content="Configure prefabricated assemblies using AI and Natural language."
        />
      </Helmet>
      <ProjectsNavbar
        login3={
          <Fragment>
            <span className="projects-text10">Login</span>
          </Fragment>
        }
        text15={
          <Fragment>
            <span className="projects-text11">About</span>
          </Fragment>
        }
        text16={
          <Fragment>
            <span className="projects-text12">Features</span>
          </Fragment>
        }
        text17={
          <Fragment>
            <span className="projects-text13">Pricing</span>
          </Fragment>
        }
        text18={
          <Fragment>
            <span className="projects-text14">Team</span>
          </Fragment>
        }
        text19={
          <Fragment>
            <span className="projects-text15">Blog</span>
          </Fragment>
        }
        register3={
          <Fragment>
            <span className="projects-text16">Register</span>
          </Fragment>
        }
        rootClassName="projects-navbarroot-class-name3"
      ></ProjectsNavbar>
      <div className="projects-container2">
        <ProjectsSidebar
          help={
            <Fragment>
              <span className="projects-text17">Help</span>
            </Fragment>
          }
          recent={
            <Fragment>
              <span className="projects-text18">Recent</span>
            </Fragment>
          }
          support={
            <Fragment>
              <span className="projects-text19">Support</span>
            </Fragment>
          }
          myProjects={
            <Fragment>
              <span className="projects-text20">My Projects</span>
            </Fragment>
          }
          addNewButton={
            <Fragment>
              <span className="projects-text21">+ New Project</span>
            </Fragment>
          }
          sharedWithMe={
            <Fragment>
              <span className="projects-text22">Shared With Me</span>
            </Fragment>
          }
          rootClassName="projects-sidebarroot-class-name2"
          starrtedProjects={
            <Fragment>
              <span className="projects-text23">Starred</span>
            </Fragment>
          }
          projectCompanyName={
            <Fragment>
              <span className="projects-text24">DPR Construction</span>
            </Fragment>
          }
        ></ProjectsSidebar>
        <div className="projects-project-list">
          <div className="projects-container3">
            <div className="projects-container4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="projects-icon1"
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
                className="projects-textinput"
              />
            </div>
            <div className="projects-container5">
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
          <div className="projects-container6">
            <Link to="/project-dashboard">
              <ProjectCard
                createdBy={
                  <Fragment>
                    <span className="projects-text25">
                      Created by: John, Doe
                    </span>
                  </Fragment>
                }
                lastEdited={
                  <Fragment>
                    <span className="projects-text26">Edited 1 day ago.</span>
                  </Fragment>
                }
                projectName={
                  <Fragment>
                    <span className="projects-text27">Office Building</span>
                  </Fragment>
                }
                projectImage="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDJ8fGJ1aWxkaW5nfGVufDB8fHx8MTc1MjQ3MTY0MHww&amp;ixlib=rb-4.1.0&amp;h=1500"
                projectNumber={
                  <Fragment>
                    <span className="projects-text28">DA-12-123456</span>
                  </Fragment>
                }
                rootClassName="project-cardroot-class-name16"
                projectAddress={
                  <Fragment>
                    <span className="projects-text29">
                      Address of the Project
                    </span>
                  </Fragment>
                }
                className="projects-component12"
              ></ProjectCard>
            </Link>
            <ProjectCard
              createdBy={
                <Fragment>
                  <span className="projects-text30">Created by: John, Doe</span>
                </Fragment>
              }
              lastEdited={
                <Fragment>
                  <span className="projects-text31">Edited 5 mins ago.</span>
                </Fragment>
              }
              projectName={
                <Fragment>
                  <span className="projects-text32">Hospital</span>
                </Fragment>
              }
              projectImage="https://images.unsplash.com/photo-1470075801209-17f9ec0cada6?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDE1fHxidWlsZGluZ3xlbnwwfHx8fDE3NTI0NzE2NDB8MA&amp;ixlib=rb-4.1.0&amp;h=1500"
              projectNumber={
                <Fragment>
                  <span className="projects-text33">DA-12-123456</span>
                </Fragment>
              }
              rootClassName="project-cardroot-class-name17"
              projectAddress={
                <Fragment>
                  <span className="projects-text34">
                    Address of the Project
                  </span>
                </Fragment>
              }
            ></ProjectCard>
            <ProjectCard
              createdBy={
                <Fragment>
                  <span className="projects-text35">Created by: John, Doe</span>
                </Fragment>
              }
              lastEdited={
                <Fragment>
                  <span className="projects-text36">Edited 20 day ago.</span>
                </Fragment>
              }
              projectName={
                <Fragment>
                  <span className="projects-text37">Hotel</span>
                </Fragment>
              }
              projectImage="https://images.unsplash.com/photo-1527576539890-dfa815648363?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDZ8fGJ1aWxkaW5nfGVufDB8fHx8MTc1MjQ3MTY0MHww&amp;ixlib=rb-4.1.0&amp;h=1500"
              projectNumber={
                <Fragment>
                  <span className="projects-text38">DA-12-123456</span>
                </Fragment>
              }
              rootClassName="project-cardroot-class-name18"
              projectAddress={
                <Fragment>
                  <span className="projects-text39">
                    Address of the Project
                  </span>
                </Fragment>
              }
            ></ProjectCard>
            <ProjectCard
              createdBy={
                <Fragment>
                  <span className="projects-text40">Created by: John, Doe</span>
                </Fragment>
              }
              lastEdited={
                <Fragment>
                  <span className="projects-text41">Edited 1 day ago.</span>
                </Fragment>
              }
              projectName={
                <Fragment>
                  <span className="projects-text42">Data Center</span>
                </Fragment>
              }
              projectImage="https://images.unsplash.com/photo-1435575653489-b0873ec954e2?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDE5fHxidWlsZGluZ3xlbnwwfHx8fDE3NTI0NzE2NDB8MA&amp;ixlib=rb-4.1.0&amp;h=1500"
              projectNumber={
                <Fragment>
                  <span className="projects-text43">DA-12-123456</span>
                </Fragment>
              }
              rootClassName="project-cardroot-class-name19"
              projectAddress={
                <Fragment>
                  <span className="projects-text44">
                    Address of the Project
                  </span>
                </Fragment>
              }
            ></ProjectCard>
            <ProjectCard
              createdBy={
                <Fragment>
                  <span className="projects-text45">Created by: John, Doe</span>
                </Fragment>
              }
              lastEdited={
                <Fragment>
                  <span className="projects-text46">Edited 1 day ago.</span>
                </Fragment>
              }
              projectName={
                <Fragment>
                  <span className="projects-text47">Life Sciences</span>
                </Fragment>
              }
              projectImage="https://images.unsplash.com/photo-1443641723753-250ff9bb3c83?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDE4fHxidWlsZGluZ3xlbnwwfHx8fDE3NTI0NzE2NDB8MA&amp;ixlib=rb-4.1.0&amp;h=1500"
              projectNumber={
                <Fragment>
                  <span className="projects-text48">DA-12-123456</span>
                </Fragment>
              }
              rootClassName="project-cardroot-class-name20"
              projectAddress={
                <Fragment>
                  <span className="projects-text49">
                    Address of the Project
                  </span>
                </Fragment>
              }
            ></ProjectCard>
            <ProjectCard
              createdBy={
                <Fragment>
                  <span className="projects-text50">Created by: John, Doe</span>
                </Fragment>
              }
              lastEdited={
                <Fragment>
                  <span className="projects-text51">Edited 1 day ago.</span>
                </Fragment>
              }
              projectName={
                <Fragment>
                  <span className="projects-text52">
                    Multi Speciality Clinic
                  </span>
                </Fragment>
              }
              projectImage="https://images.unsplash.com/photo-1518005020951-eccb494ad742?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDEwfHxidWlsZGluZ3xlbnwwfHx8fDE3NTI0NzE2NDB8MA&amp;ixlib=rb-4.1.0&amp;h=1500"
              projectNumber={
                <Fragment>
                  <span className="projects-text53">DA-12-123456</span>
                </Fragment>
              }
              rootClassName="project-cardroot-class-name21"
              projectAddress={
                <Fragment>
                  <span className="projects-text54">
                    Address of the Project
                  </span>
                </Fragment>
              }
            ></ProjectCard>
            <ProjectCard
              createdBy={
                <Fragment>
                  <span className="projects-text55">Created by: John, Doe</span>
                </Fragment>
              }
              lastEdited={
                <Fragment>
                  <span className="projects-text56">Edited 1 day ago.</span>
                </Fragment>
              }
              projectName={
                <Fragment>
                  <span className="projects-text57">Name of the Project</span>
                </Fragment>
              }
              projectImage="https://images.unsplash.com/photo-1483366774565-c783b9f70e2c?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDI0fHxidWlsZGluZ3xlbnwwfHx8fDE3NTI0NzE2NDB8MA&amp;ixlib=rb-4.1.0&amp;h=1500"
              projectNumber={
                <Fragment>
                  <span className="projects-text58">DA-12-123456</span>
                </Fragment>
              }
              rootClassName="project-cardroot-class-name22"
              projectAddress={
                <Fragment>
                  <span className="projects-text59">
                    Address of the Project
                  </span>
                </Fragment>
              }
            ></ProjectCard>
            <ProjectCard
              createdBy={
                <Fragment>
                  <span className="projects-text60">Created by: John, Doe</span>
                </Fragment>
              }
              lastEdited={
                <Fragment>
                  <span className="projects-text61">Edited 1 day ago.</span>
                </Fragment>
              }
              projectName={
                <Fragment>
                  <span className="projects-text62">Name of the Project</span>
                </Fragment>
              }
              projectImage="https://images.unsplash.com/photo-1468127225977-85bc4aa3fe0f?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDIzfHxidWlsZGluZ3xlbnwwfHx8fDE3NTI0NzE2NDB8MA&amp;ixlib=rb-4.1.0&amp;h=1500"
              projectNumber={
                <Fragment>
                  <span className="projects-text63">DA-12-123456</span>
                </Fragment>
              }
              rootClassName="project-cardroot-class-name23"
              projectAddress={
                <Fragment>
                  <span className="projects-text64">
                    Address of the Project
                  </span>
                </Fragment>
              }
            ></ProjectCard>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Projects
