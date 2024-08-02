import React from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Container, Button, Box } from '@mui/material';
import CreateEmployee from './CreateEmployee';
import CreateManager from './CreateManager';
import '../styles/Admin.css';

const Admin = () => {
  return (
    <Container className="admin-page">
      
      <Box className="nav-buttons">
        <Button variant="contained" component={Link} to="create-employee" className="nav-button">
          Create Employee
        </Button>
        <Button variant="contained" component={Link} to="create-manager" className="nav-button">
          Create Manager
        </Button>
      </Box>
      <Box className="form-container">
        <Routes>
          <Route path="create-employee" element={<CreateEmployee />} />
          <Route path="create-manager" element={<CreateManager />} />
        </Routes>
      </Box>
    </Container>
  );
};

export default Admin;
