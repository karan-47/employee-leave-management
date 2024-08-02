import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Box, Paper } from '@mui/material';
import EmployeeCarousel from './EmployeeCarousel';

const ViewEmployeesRequests = ({ managerId }) => {
  const [employees, setEmployees] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/manager/${managerId}/employees`);
        console.log(response.data);
        setEmployees(response.data);
      } catch (error) {
        setMessage('Failed to fetch employees and their requests.');
      }
    };

    fetchEmployees();
  }, [managerId]);

  const handleApproveRequest = async (requestId) => {
    try {
      await axios.put(`http://127.0.0.1:8000/requests/${requestId}`, { status: 'APPROVED' });
      setEmployees((prevEmployees) =>
        prevEmployees.map((employee) => ({
          ...employee,
          requests: employee.requests.map((request) =>
            request.id === requestId ? { ...request, status: 'APPROVED' } : request
          ),
        }))
      );
      alert('Request approved successfully.');
    } catch (error) {
      alert('Failed to approve request.');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3 }}>
        {message && <Typography color="error">{message}</Typography>}
        <Paper elevation={3} style={{ padding: '20px', minHeight: 'auto' }}>
          <EmployeeCarousel employees={employees} onApproveRequest={handleApproveRequest} managerId={managerId} />
        </Paper>
      </Box>
    </Container>
  );
};

export default ViewEmployeesRequests;
