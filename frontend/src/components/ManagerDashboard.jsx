import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, Button, Select, MenuItem, Modal } from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import dayjs from 'dayjs';
import '../styles/Manager.css';

const ManagerDashboard = ({ managerId }) => {
  const [requests, setRequests] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date(2024, 10, 1)); // Initialize to November 1, 2024
  const [employeeStatus, setEmployeeStatus] = useState({});
  const [tooltipContent, setTooltipContent] = useState('');
  const [employeesStatusDetails, setEmployeesStatusDetails] = useState({ working: [], on_leave: [], pending: [] });
  const [filter, setFilter] = useState('ALL'); // Add state for filter
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeRequests, setEmployeeRequests] = useState([]); // State to store employee requests
  const [modalSelectedDate, setModalSelectedDate] = useState(new Date(2024, 10, 1));
  const [modalTooltipContent, setModalTooltipContent] = useState('');
  const [modalStatus, setModalStatus] = useState({ working: [], on_leave: [], pending: [] });
  const [modalFilter, setModalFilter] = useState('ALL'); // Add state for filter in modal

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/manager/${managerId}/employees`);
        setRequests(response.data);
      } catch (error) {
        console.error('Failed to fetch requests.');
      }
    };

    fetchRequests();
  }, [managerId]);

  useEffect(() => {
    handleDateClick(new Date(2024, 10, 1)); // Fetch status for November 1, 2024 on component mount
  }, [managerId]);

  const handleDateClick = async (date) => {
    setSelectedDate(date);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/manager/${managerId}/employee-status-details/${dayjs(date).format('YYYY-MM-DD')}`);
      setEmployeeStatus(response.data);
      setTooltipContent(`Working: ${response.data.working.length}\nOn Leave: ${response.data.on_leave.length}\nPending Leave: ${response.data.pending.length}`);
      setEmployeesStatusDetails(response.data);
    } catch (error) {
      console.error('Failed to fetch employee status.');
    }
  };

  const handleModalDateClick = async (date) => {
    setModalSelectedDate(date);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/manager/${managerId}/employee-status-details/${dayjs(date).format('YYYY-MM-DD')}`);
      setModalStatus(response.data);
      setModalTooltipContent(`Working: ${response.data.working.length}\nOn Leave: ${response.data.on_leave.length}\nPending Leave: ${response.data.pending.length}`);
    } catch (error) {
      console.error('Failed to fetch modal employee status.');
    }
  };

  const updateTooltipContent = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/manager/${managerId}/employee-status-details/${dayjs(selectedDate).format('YYYY-MM-DD')}`);
      setEmployeeStatus(response.data);
      setTooltipContent(`Working: ${response.data.working.length}\nOn Leave: ${response.data.on_leave.length}\nPending Leave: ${response.data.pending.length}`);
      setEmployeesStatusDetails(response.data);
    } catch (error) {
      console.error('Failed to update tooltip content.');
    }
  };

  const updateModalTooltipContent = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/manager/${managerId}/employee-status-details/${dayjs(modalSelectedDate).format('YYYY-MM-DD')}`);
      setModalStatus(response.data);
      setModalTooltipContent(`Working: ${response.data.working.length}\nOn Leave: ${response.data.on_leave.length}\nPending Leave: ${response.data.pending.length}`);
    } catch (error) {
      console.error('Failed to update modal tooltip content.');
    }
  };

  const handleApprove = async (requestId) => {
    if (window.confirm('Are you sure you want to approve this request?')) {
      try {
        await axios.put(`http://127.0.0.1:8000/requests/${requestId}`, { status: 'APPROVED' });
        setRequests(prevRequests => {
          return prevRequests.map(employee => ({
            ...employee,
            requests: employee.requests.map(request => 
              request.id === requestId ? { ...request, status: 'APPROVED' } : request
            )
          }));
        });

        setEmployeeRequests(prevRequests => prevRequests.map(request => 
          request.id === requestId ? { ...request, status: 'APPROVED' } : request
        ));

        await updateTooltipContent();
        await updateModalTooltipContent();
        handleModalDateClick(modalSelectedDate)
        handleDateClick(selectedDate);
        alert('Request approved successfully.');
      } catch (error) {
        alert('Failed to approve request.');
      }
    }
  };

  const handleDeny = async (requestId) => {
    if (window.confirm('Are you sure you want to deny this request?')) {
      try {
        await axios.put(`http://127.0.0.1:8000/requests/${requestId}`, { status: 'DENIED' });
        setRequests(prevRequests => {
          return prevRequests.map(employee => ({
            ...employee,
            requests: employee.requests.map(request => 
              request.id === requestId ? { ...request, status: 'DENIED' } : request
            )
          }));
        });

        setEmployeeRequests(prevRequests => prevRequests.map(request => 
          request.id === requestId ? { ...request, status: 'DENIED' } : request
        ));

        await updateTooltipContent();
        await updateModalTooltipContent();
        handleModalDateClick(modalSelectedDate)
        handleDateClick(selectedDate)
        alert('Request denied successfully.');
      } catch (error) {
        alert('Failed to deny request.');
      }
    }
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const handleModalFilterChange = (event) => {
    setModalFilter(event.target.value);
  };

  const getTileClassName = ({ date, view }) => {
    if (view === 'month' && date.getMonth() === 10 && date.getFullYear() === 2024) { // November 2024
      return 'highlight';
    }
    return null;
  };

  const getModalTileClassName = ({ date, view }) => {
    if (view === 'month' && date.getMonth() === 10 && date.getFullYear() === 2024) { // November 2024
      let highestPrecedence = 'none';

      for (const request of filteredEmployeeRequests) {
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

  const filteredRequests = filter === 'ALL' ? requests : requests.map(employee => ({
    ...employee,
    requests: employee.requests.filter(request => request.status === filter)
  }));

  const filteredEmployeeRequests = modalFilter === 'ALL' ? employeeRequests : employeeRequests.filter(request => request.status === modalFilter);

  const handleEmployeeClick = async (employee) => {
    setSelectedEmployee(employee);
    setModalOpen(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/requests/employee/${employee.id}`);
      setEmployeeRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch employee requests.');
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedEmployee(null);
    setEmployeeRequests([]); // Clear employee requests when modal closes
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Manager Dashboard
      </Typography>
      <Box display="flex" flexDirection="row" padding="30px">
        <Box flex="1">
          <Typography variant="h5">November Calendar</Typography>
          <Calendar
            tileClassName={({ date, view }) => getTileClassName({ date, view })}
            defaultValue={new Date(2024, 10, 1)} // November 2024
            onClickDay={handleDateClick}
          />
          {selectedDate && !modalOpen && (
            <Tooltip title={tooltipContent} open={Boolean(tooltipContent)}>
              <Typography variant="h6">
                {`Status on ${dayjs(selectedDate).format('MM-DD-YYYY')}`}
              </Typography>
            </Tooltip>
          )}
        </Box>
        <Box flex="1" paddingLeft={10}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Requests</Typography>
            <Select
              value={filter}
              onChange={handleFilterChange}
              variant="outlined"
              size="small"
              style={{ minWidth: 120 }}
            >
              <MenuItem value="ALL">All</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="DENIED">Denied</MenuItem>
            </Select>
          </Box>
          <TableContainer component={Paper} style={{ height: 300, width: 450 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell style={{ padding: '4px' }}>Name</TableCell>
                  <TableCell style={{ padding: '4px' }}>Start</TableCell>
                  <TableCell style={{ padding: '4px' }}>End</TableCell>
                  <TableCell style={{ padding: '4px' }}>Status</TableCell>
                  <TableCell style={{ padding: '4px' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((employee) =>
                  employee.requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell style={{ padding: '1px', fontSize: '14px', paddingTop: '10px' }}>{employee.name}</TableCell>
                      <TableCell style={{ padding: '1px', fontSize: '14px', paddingTop: '10px'  }}>{dayjs(request.vacation_start_date).format('MM-DD-YYYY')}</TableCell>
                      <TableCell style={{ padding: '1px', fontSize: '14px', paddingTop: '10px'  }}>{dayjs(request.vacation_end_date).format('MM-DD-YYYY')}</TableCell>
                      <TableCell style={{ padding: '1px', fontSize: '14px', paddingTop: '10px'  }}>{request.status}</TableCell>
                      <TableCell style={{ padding: '1px', fontSize: '14px', paddingTop: '10px'  }}>
                        {request.status === 'PENDING' && (
                          <>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={() => handleApprove(request.id)}
                              style={{ marginRight: '5px', padding: '2px 5px', fontSize: '10px' }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="contained"
                              color="secondary"
                              size="small"
                              onClick={() => handleDeny(request.id)}
                              style={{ padding: '2px 5px', fontSize: '10px' }}
                            >
                              Deny
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        {selectedDate && (
          <Box flex="1" paddingLeft={10}>
            <Typography variant="h6" gutterBottom>
              Employee Status Summary for {dayjs(selectedDate).format('MM-DD-YYYY')}
            </Typography>
            <TableContainer component={Paper} style={{ marginBottom: '20px', height: 250 }}>
              <Table stickyHeader style={{ fontSize: '12px' }}>
                <TableHead>
                  <TableRow>
                    <TableCell style={{ padding: '4px' }}>Working</TableCell>
                    <TableCell style={{ padding: '4px' }}>Leave</TableCell>
                    <TableCell style={{ padding: '4px' }}>Pending</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell style={{ padding: '4px' }}>
                      {employeesStatusDetails.working.map(employee => (
                        <Typography key={employee.id} onClick={() => handleEmployeeClick(employee)} style={{ cursor: 'pointer', color: 'blue' }}>
                          {employee.name}
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell style={{ padding: '4px' }}>
                      {employeesStatusDetails.on_leave.map(employee => (
                        <Typography key={employee.id} onClick={() => handleEmployeeClick(employee)} style={{ cursor: 'pointer', color: 'blue' }}>
                          {employee.name}
                        </Typography>
                      ))}
                    </TableCell>
                    <TableCell style={{ padding: '4px' }}>
                      {employeesStatusDetails.pending.map(employee => (
                        <Typography key={employee.id} onClick={() => handleEmployeeClick(employee)} style={{ cursor: 'pointer', color: 'blue' }}>
                          {employee.name}
                        </Typography>
                      ))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Box>

      <Modal open={modalOpen} onClose={handleClose}>
        <Box className="modal-box" display="flex" style={{ width: '80vw', maxHeight: '80vh', overflow: 'auto' }}>
          {selectedEmployee && (
            <>
              <Box flex="1" marginRight="20px">
                <Typography variant="h5" gutterBottom>
                  {selectedEmployee.name}'s Calendar
                </Typography>
                <Calendar
                  tileClassName={({ date, view }) => getModalTileClassName({ date, view })}
                  defaultValue={modalSelectedDate}
                  onClickDay={handleModalDateClick}
                />
                {modalSelectedDate && (
                  <Tooltip title={modalTooltipContent} open={Boolean(modalTooltipContent)}>
                    <Typography variant="h6">
                      {`Status on ${dayjs(modalSelectedDate).format('MM-DD-YYYY')}`}
                    </Typography>
                  </Tooltip>
                )}
              </Box>
              <Box flex="1">
                <Typography variant="h5" gutterBottom>
                  {selectedEmployee.holidays_left} leave days left
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="10px">
                  <Typography variant="h6">Requests</Typography>
                  <Select
                    value={modalFilter}
                    onChange={handleModalFilterChange}
                    variant="outlined"
                    size="small"
                    style={{ minWidth: 120 }}
                  >
                    <MenuItem value="ALL">All</MenuItem>
                    <MenuItem value="APPROVED">Approved</MenuItem>
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="DENIED">Denied</MenuItem>
                  </Select>
                </Box>
                <TableContainer component={Paper} style={{ height: 250, overflowY: 'auto' }}>
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
                      {filteredEmployeeRequests.map(request => (
                        <TableRow key={request.id}>
                          <TableCell>{dayjs(request.vacation_start_date).format('MM-DD-YYYY')}</TableCell>
                          <TableCell>{dayjs(request.vacation_end_date).format('MM-DD-YYYY')}</TableCell>
                          <TableCell>{request.status}</TableCell>
                          <TableCell>
                            {request.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  size="small"
                                  onClick={() => handleApprove(request.id)}
                                  style={{ marginRight: '5px', padding: '2px 5px', fontSize: '10px' }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="contained"
                                  color="secondary"
                                  size="small"
                                  onClick={() => handleDeny(request.id)}
                                  style={{ padding: '2px 5px', fontSize: '10px' }}
                                >
                                  Deny
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default ManagerDashboard;
