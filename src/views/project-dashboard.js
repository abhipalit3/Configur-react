import React, { Fragment } from 'react'
import { Link } from 'react-router-dom'

import { Helmet } from 'react-helmet'

import ProjectDashboardNavbar from '../components/project-dashboard-navbar'
import ProjectDashboardSidebar from '../components/project-dashboard-sidebar'
import AssemblyCard from '../components/assembly-card'
import './project-dashboard.css'

const ProjectDashboard = (props) => {
  return (
    <div className="project-dashboard-container1">
      <Helmet>
        <title>Project-Dashboard - Configur</title>
        <meta
          name="description"
          content="Configure prefabricated assemblies using AI and Natural language."
        />
        <meta property="og:title" content="Project-Dashboard - Configur" />
        <meta
          property="og:description"
          content="Configure prefabricated assemblies using AI and Natural language."
        />
      </Helmet>
      <ProjectDashboardNavbar
        button={
          <Fragment>
            <span className="project-dashboard-text10">Back to Projects</span>
          </Fragment>
        }
        login3={
          <Fragment>
            <span className="project-dashboard-text11">Login</span>
          </Fragment>
        }
        text15={
          <Fragment>
            <span className="project-dashboard-text12">About</span>
          </Fragment>
        }
        text16={
          <Fragment>
            <span className="project-dashboard-text13">Features</span>
          </Fragment>
        }
        text17={
          <Fragment>
            <span className="project-dashboard-text14">Pricing</span>
          </Fragment>
        }
        text18={
          <Fragment>
            <span className="project-dashboard-text15">Team</span>
          </Fragment>
        }
        text19={
          <Fragment>
            <span className="project-dashboard-text16">Blog</span>
          </Fragment>
        }
        register3={
          <Fragment>
            <span className="project-dashboard-text17">Register</span>
          </Fragment>
        }
        rootClassName="project-dashboard-navbarroot-class-name"
      ></ProjectDashboardNavbar>
      <div className="project-dashboard-container2">
        <ProjectDashboardSidebar
          help={
            <Fragment>
              <span className="project-dashboard-text18">Help</span>
            </Fragment>
          }
          recent={
            <Fragment>
              <span className="project-dashboard-text19">Recent</span>
            </Fragment>
          }
          support={
            <Fragment>
              <span className="project-dashboard-text20">Support</span>
            </Fragment>
          }
          projectName={
            <Fragment>
              <span className="project-dashboard-text21">Office Building</span>
            </Fragment>
          }
          myAssemblies={
            <Fragment>
              <span className="project-dashboard-text22">My Assemblies</span>
            </Fragment>
          }
          sharedWithMe={
            <Fragment>
              <span className="project-dashboard-text23">Shared With Me</span>
            </Fragment>
          }
          rootClassName="project-dashboard-sidebarroot-class-name"
          starrtedProjects={
            <Fragment>
              <span className="project-dashboard-text24">Starred</span>
            </Fragment>
          }
          newAssemblyButton={
            <Fragment>
              <span className="project-dashboard-text25">+ New Assembly</span>
            </Fragment>
          }
        ></ProjectDashboardSidebar>
        <div className="project-dashboard-container3">
          <div className="project-dashboard-container4">
            <div className="project-dashboard-container5">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="project-dashboard-icon1"
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
                placeholder="Search Assemblies"
                className="project-dashboard-textinput"
              />
            </div>
            <div className="project-dashboard-container6">
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
          <div className="project-dashboard-container7">
            <Link to="/app-page">
              <AssemblyCard
                createdBy={
                  <Fragment>
                    <span className="project-dashboard-text26">
                      Design Option 1 - Prefab MTR
                    </span>
                  </Fragment>
                }
                createdBy1={
                  <Fragment>
                    <span className="project-dashboard-text27">
                      Created by: John, Doe
                    </span>
                  </Fragment>
                }
                lastEdited={
                  <Fragment>
                    <span className="project-dashboard-text28">
                      Edited 1 day ago.
                    </span>
                  </Fragment>
                }
                assemblyName={
                  <Fragment>
                    <span className="project-dashboard-text29">
                      Prefabricated Multi Trade Rack
                    </span>
                  </Fragment>
                }
                projectImage="https://images.unsplash.com/photo-1661156565686-d5450ed3e42a?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDE5fHxyYWNrfGVufDB8fHx8MTc1NDI1Njg3NXww&amp;ixlib=rb-4.1.0&amp;w=1500"
                rootClassName="assembly-cardroot-class-name7"
                className="project-dashboard-component3"
              ></AssemblyCard>
            </Link>
            <AssemblyCard
              createdBy={
                <Fragment>
                  <span className="project-dashboard-text30">
                    Description of the Prefabricated Assembly
                  </span>
                </Fragment>
              }
              createdBy1={
                <Fragment>
                  <span className="project-dashboard-text31">
                    Created by: John, Doe
                  </span>
                </Fragment>
              }
              lastEdited={
                <Fragment>
                  <span className="project-dashboard-text32">
                    Edited 1 day ago.
                  </span>
                </Fragment>
              }
              assemblyName={
                <Fragment>
                  <span className="project-dashboard-text33">
                    Exterior Panels
                  </span>
                </Fragment>
              }
              projectImage="https://images.unsplash.com/photo-1483366774565-c783b9f70e2c?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDI0fHxidWlsZGluZ3xlbnwwfHx8fDE3NTI0NzE2NDB8MA&amp;ixlib=rb-4.1.0&amp;w=1500"
              rootClassName="assembly-cardroot-class-name8"
            ></AssemblyCard>
            <AssemblyCard
              createdBy={
                <Fragment>
                  <span className="project-dashboard-text34">
                    Description of the Prefabricated Assembly
                  </span>
                </Fragment>
              }
              createdBy1={
                <Fragment>
                  <span className="project-dashboard-text35">
                    Created by: John, Doe
                  </span>
                </Fragment>
              }
              lastEdited={
                <Fragment>
                  <span className="project-dashboard-text36">
                    Edited 1 day ago.
                  </span>
                </Fragment>
              }
              assemblyName={
                <Fragment>
                  <span className="project-dashboard-text37">
                    Exterior Glass Panels
                  </span>
                </Fragment>
              }
              projectImage="https://images.unsplash.com/photo-1490351267196-b7a67e26e41b?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDl8fGJ1aWxkaW5nfGVufDB8fHx8MTc1MjQ3MTY0MHww&amp;ixlib=rb-4.1.0&amp;w=1500"
              rootClassName="assembly-cardroot-class-name1"
            ></AssemblyCard>
            <AssemblyCard
              createdBy={
                <Fragment>
                  <span className="project-dashboard-text38">
                    Description of the Prefabricated Assembly
                  </span>
                </Fragment>
              }
              createdBy1={
                <Fragment>
                  <span className="project-dashboard-text39">
                    Created by: John, Doe
                  </span>
                </Fragment>
              }
              lastEdited={
                <Fragment>
                  <span className="project-dashboard-text40">
                    Edited 1 day ago.
                  </span>
                </Fragment>
              }
              assemblyName={
                <Fragment>
                  <span className="project-dashboard-text41">CLT Frames</span>
                </Fragment>
              }
              projectImage="https://images.unsplash.com/photo-1547334021-eb874c9909c0?ixid=M3w5MTMyMXwwfDF8c2VhcmNofDEwNnx8Y2x0JTIwcGFuZWx8ZW58MHx8fHwxNzUyNjEyNDYzfDA&amp;ixlib=rb-4.1.0&amp;w=1500"
              rootClassName="assembly-cardroot-class-name"
            ></AssemblyCard>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDashboard
