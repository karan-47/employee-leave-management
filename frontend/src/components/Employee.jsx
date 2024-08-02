
import React, { useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import EmployeeLogin from './EmployeeLogin';
import EmployeeDashboard from './EmployeeDashboard';
import '../styles/Employee.css';

const Employee = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);

  const handleLoginSuccess = (id) => {
    setIsLoggedIn(true);
    setEmployeeId(id);
  };

  return (
    <Container className="employee-page">
      {isLoggedIn ? (
        <Box className="dashboard">
          <Typography variant="h4" gutterBottom>
            Employee Dashboard
          </Typography>
          <EmployeeDashboard employeeId={employeeId} />
        </Box>
      ) : (
        <EmployeeLogin onLoginSuccess={handleLoginSuccess} />
      )}
    </Container>
  );
};

export default Employee;
