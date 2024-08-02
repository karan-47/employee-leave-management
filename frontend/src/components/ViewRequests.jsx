import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';

const ViewRequests = ({ employeeId }) => {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/requests/employee/${employeeId}`);
        
        setRequests(response.data);
      } catch (error) {
        setMessage('Failed to fetch requests.');
      }
    };

    fetchRequests();
  }, [employeeId]);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/requests/${id}`);
      setRequests(requests.filter((request) => request.id !== id));
    } catch (error) {
      setMessage('Failed to delete request.');
    }
  };

  const calculateDaysBetween = (startDate, endDate) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    return end.diff(start, 'day');
  };

  const formatDate = (date) => {
    return dayjs(date).format('MM-DD-YYYY');
  };

  return (
    <Container maxWidth="md" className="centered-form">
      <Box sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          View Requests for Employee ID: {employeeId}
        </Typography>
        {message && <Typography color="error">{message}</Typography>}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {/* <TableCell>Request ID</TableCell> */}
                <TableCell>Status</TableCell>
                {/* <TableCell>Manager ID</TableCell> */}
                <TableCell>Vacation Start Date</TableCell>
                <TableCell>Vacation End Date</TableCell>
                <TableCell>Number of Days</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  {/* <TableCell>{request.id}</TableCell> */}
                  <TableCell>{request.status}</TableCell>
                  {/* <TableCell>{request.manager_id}</TableCell> */}
                  <TableCell>{formatDate(request.vacation_start_date)}</TableCell>
                  <TableCell>{formatDate(request.vacation_end_date)}</TableCell>
                  <TableCell>{calculateDaysBetween(request.vacation_start_date, request.vacation_end_date)}</TableCell>
                  <TableCell>
                    <IconButton 
                      onClick={() => handleDelete(request.id)} 
                      color="secondary"
                      disabled={request.status === 'APPROVED'}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default ViewRequests;
