import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import dayjs from 'dayjs';

const ManagerRequestsOverview = ({ managerId }) => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/manager/${managerId}/employees`);
        setEmployees(response.data);
      } catch (error) {
        console.error('Failed to fetch employees and their requests.');
      }
    };

    fetchEmployees();
  }, [managerId]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Employee Requests Overview
      </Typography>
      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Employee Name</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee) =>
              employee.requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{dayjs(request.vacation_start_date).format('MM-DD-YYYY')}</TableCell>
                  <TableCell>{dayjs(request.vacation_end_date).format('MM-DD-YYYY')}</TableCell>
                  <TableCell>{request.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ManagerRequestsOverview;
