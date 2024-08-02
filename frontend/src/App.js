import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Button, Container, Typography } from '@mui/material';
import Employee from './components/Employee';
import Manager from './components/Manager';
import Admin from './components/Admin';
import Logout from './components/Logout';
import './styles/App.css';

function Home() {
  return (
    <Container maxWidth="lg" className="home">
      <Typography variant="h2" align="center" gutterBottom>
        Welcome to Employee Manager System
      </Typography>
      <div className="button-group">
        <Button variant="contained" color="primary" component={Link} to="/employee" className="home-button">
          Employee
        </Button>
        <Button variant="contained" color="secondary" component={Link} to="/manager" className="home-button">
          Manager
        </Button>
        <Button variant="contained" color="info" component={Link} to="/admin" className="home-button">
          Admin
        </Button>
      </div>
    </Container>
  );
}

function App() {
  const location = useLocation();

  return (
    <div className="app-container">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" style={{ flexGrow: 1 }}>
            EMS
          </Typography>
          {location.pathname !== '/' && <Logout />}
        </Toolbar>
      </AppBar>
      <Container className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/employee/*" element={<Employee />} />
          <Route path="/manager/*" element={<Manager />} />
          <Route path="/admin/*" element={<Admin />} />
        </Routes>
      </Container>
    </div>
  );
}

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;
