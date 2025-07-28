import React from 'react'
import ReactDOM from 'react-dom'
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom'

import './style.css'
import ProjectDashboard from './views/project-dashboard'
import Projects from './views/projects'
import Home from './views/home'
import AppPage from './views/app-page'
import SignupPage from './views/signup-page'
import Login from './views/login'
import NotFound from './views/not-found'

const App = () => {
  return (
    <Router>
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
  )
}

ReactDOM.render(<App />, document.getElementById('app'))
