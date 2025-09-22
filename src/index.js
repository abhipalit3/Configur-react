/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React from 'react'
import ReactDOM from 'react-dom'
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom'
import { Amplify } from 'aws-amplify'
import { amplifyConfig } from './amplifyconfig'
import manifestSyncService from './services/manifestSync'
import { AuthProvider } from './components/AuthProvider'
import { AuthWrapper } from './components/AuthWrapper'

import './style.css'

Amplify.configure(amplifyConfig)

import {
  ProjectDashboard,
  Projects,
  Home,
  AppPage,
  SignupPage,
  Login,
  NotFound
} from './pages'

const App = () => {
  React.useEffect(() => {
    manifestSyncService.initializeManifest()
  }, [])

  return (
    <AuthProvider>
      <AuthWrapper>
        <Router basename="/Configur-react">
          <Switch>
            <Route component={ProjectDashboard} exact path="/project-dashboard" />
            <Route component={Projects} exact path="/projects" />
            <Route component={Home} exact path="/" />
            <Route component={AppPage} exact path="/app-page" />
            <Route component={SignupPage} exact path="/signup-page" />
            <Route component={Login} exact path="/login" />
            <Route component={NotFound} path="**" />
            <Redirect to="**" />
          </Switch>
        </Router>
      </AuthWrapper>
    </AuthProvider>
  )
}

ReactDOM.render(<App />, document.getElementById('app'))
