import React, { useState } from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import ManagerDashboard from './ManagerDashboard';
import ManagerLogin from './ManagerLogin'; // Assuming you have a login component for managers

const Manager = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [managerId, setManagerId] = useState(null);

  const handleLoginSuccess = (id) => {
    setIsLoggedIn(true);
    setManagerId(id);
  };

  return (
    <Container className="manager-page">
      {isLoggedIn ? (
        <Box className="dashboard">
          <ManagerDashboard managerId={managerId} />
        </Box>
      ) : (
        <ManagerLogin onLoginSuccess={handleLoginSuccess} />
      )}
    </Container>
  );
};

export default Manager;
