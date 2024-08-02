import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Modal, TextField, MenuItem, Select } from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import dayjs from 'dayjs';
import '../styles/Employee.css';

const EmployeeCalendar = ({ requests }) => {
  const getTileClassName = ({ date, view }) => {
    if (view === 'month' && date.getMonth() === 10 && date.getFullYear() === 2024) { // November 2024
      let highestPrecedence = 'none';

      for (const request of requests) {
        const start = dayjs(request.vacation_start_date).toDate();
        const end = dayjs(request.vacation_end_date).toDate();

        if (date >= start && date <= end) {
          if (request.status === 'APPROVED') {
            highestPrecedence = 'approved';
            break; // Approved has the highest precedence, no need to check further
          } else if (request.status === 'PENDING' && highestPrecedence !== 'approved') {
            highestPrecedence = 'pending';
          } else if (request.status === 'DENIED' && highestPrecedence !== 'approved' && highestPrecedence !== 'pending') {
            highestPrecedence = 'denied';
          }
        }
      }
      
      return highestPrecedence !== 'none' ? `react-calendar__tile--${highestPrecedence}` : null;
    }
    return null;
  };

  return (
    <Box flex="1">
      <Typography variant="h5">Your Calendar</Typography>
      <Calendar
        tileClassName={({ date, view }) => getTileClassName({ date, view })}
        defaultValue={new Date(2024, 10, 1)} // November 2024
      />
    </Box>
  );
};

const RequestsTable = ({ requests, onDelete, filter, onFilterChange }) => {
  const filteredRequests = filter === 'ALL' ? requests : requests.filter(request => request.status === filter);

  return (
    <Box flex="1" paddingLeft={10}>
      <Typography variant="h6">Your Requests</Typography>
      <Select
        value={filter}
        onChange={onFilterChange}
        variant="outlined"
        fullWidth
        margin="normal"
      >
        <MenuItem value="ALL">All</MenuItem>
        <MenuItem value="APPROVED">Approved</MenuItem>
        <MenuItem value="PENDING">Pending</MenuItem>
        <MenuItem value="DENIED">Denied</MenuItem>
      </Select>
      <TableContainer component={Paper} style={{ height: 270, width: 500 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{dayjs(request.vacation_start_date).format('MM-DD-YYYY')}</TableCell>
                <TableCell>{dayjs(request.vacation_end_date).format('MM-DD-YYYY')}</TableCell>
                <TableCell>{request.status}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this request?')) {
                        onDelete(request.id);
                      }
                    }}
                    disabled={request.status === 'DENIED'}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const CreateRequestModal = ({ open, onClose, authorId, onRequestCreated }) => {
  const [request, setRequest] = useState({
    author_id: authorId,
    manager_id: '',
    vacation_start_date: '',
    vacation_end_date: '',
  });
  const [managerId, setManagerId] = useState('');

  useEffect(() => {
    const fetchManagerId = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/manager_employee_relations/${authorId}`);
        setManagerId(response.data.manager_id);
      } catch (error) {
        console.error('Failed to fetch manager ID.');
      }
    };

    if (open) {
      fetchManagerId();
    }
  }, [open, authorId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRequest((prevRequest) => ({ ...prevRequest, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/requests', {
        ...request,
        manager_id: managerId
      });
      if (response.status === 200) {
        alert('Request created successfully.');
        
        onRequestCreated();
        onClose();
      }
    } catch (error) {
      alert('Failed to create request.');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box className="modal-box">
        <Typography variant="h5" gutterBottom>
          Create Request
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Vacation Start Date"
            variant="outlined"
            fullWidth
            margin="normal"
            name="vacation_start_date"
            type="date"
            value={request.vacation_start_date}
            onChange={handleChange}
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Vacation End Date"
            variant="outlined"
            fullWidth
            margin="normal"
            name="vacation_end_date"
            type="date"
            value={request.vacation_end_date}
            onChange={handleChange}
            required
            InputLabelProps={{ shrink: true }}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Submit
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

const EmployeeDashboard = ({ employeeId }) => {
  const [requests, setRequests] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [holidaysLeft, setHolidaysLeft] = useState(0);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/requests/employee/${employeeId}`);
        setRequests(response.data);
      } catch (error) {
        console.error('Failed to fetch requests.');
      }
    };

    const fetchEmployeeDetails = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/employees/${employeeId}`);
        setEmployeeName(response.data.name);
        setHolidaysLeft(response.data.holidays_left);
      } catch (error) {
        console.error('Failed to fetch employee details.');
      }
    };

    fetchRequests();
    fetchEmployeeDetails();
  }, [employeeId]);

  const handleRequestCreated = async () => {
    const response = await axios.get(`http://127.0.0.1:8000/requests/employee/${employeeId}`);
    setRequests(response.data);
    await fetchEmployeeDetails();  // Fetch employee details again to update holidays left
  };

  const handleDelete = async (requestId) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/requests/${requestId}`);
      setRequests((prevRequests) => prevRequests.filter((request) => request.id !== requestId));
      await fetchEmployeeDetails();  // Fetch employee details again to update holidays left
      alert('Request deleted successfully.');
    } catch (error) {
      alert('Failed to delete request.');
    }
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const fetchEmployeeDetails = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/employees/${employeeId}`);
      setEmployeeName(response.data.name);
      setHolidaysLeft(response.data.holidays_left);
    } catch (error) {
      console.error('Failed to fetch employee details.');
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        {employeeName} - {holidaysLeft} Holidays Left
      </Typography>
      <Box display="flex" flexDirection="row" padding="30px">
        <EmployeeCalendar requests={requests} />
        <RequestsTable requests={requests} onDelete={handleDelete} filter={filter} onFilterChange={handleFilterChange} />
      </Box>
      <Button variant="contained" color="primary" onClick={() => setModalOpen(true)}>
        Create New Request
      </Button>
      <CreateRequestModal open={modalOpen} onClose={() => setModalOpen(false)} authorId={employeeId} onRequestCreated={handleRequestCreated} />
    </div>
  );
};

export default EmployeeDashboard;
