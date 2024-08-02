import React, { useState, useRef, useEffect } from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import dayjs from 'dayjs';
import axios from 'axios';
import '../styles/Styles.css';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const EmployeeCarousel = ({ employees, onApproveRequest, managerId }) => {
  const [hoveredRequest, setHoveredRequest] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [tooltipContent, setTooltipContent] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);

  const getTileClassName = ({ date, view }, requests) => {
    if (view === 'month' && date.getMonth() === 10 && date.getFullYear() === 2024) { // November 2024
      if (hoveredRequest) {
        const start = dayjs(hoveredRequest.vacation_start_date).toDate();
        const end = dayjs(hoveredRequest.vacation_end_date).toDate();
        if (date >= start && date <= end) {
          return hoveredRequest.status === 'APPROVED' ? 'hovered-approved' : 'hovered-pending';
        }
      }
      for (const request of requests) {
        const start = dayjs(request.vacation_start_date).toDate();
        const end = dayjs(request.vacation_end_date).toDate();
        if (date >= start && date <= end) {
          return request.status === 'APPROVED' ? 'approved' : 'pending';
        }
      }
    }
    return null;
  };

  const handleDateClick = async (date, event) => {
    setSelectedDate(date);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/manager/${managerId}/employee-status/${date.toISOString()}`);
      console.log(response.data);
      setTooltipContent(`Working: ${response.data.working}\nOn Leave: ${response.data.on_leave}\nPending Leave: ${response.data.pending_leave}`);
      setShowTooltip(true);
    } catch (error) {
      setTooltipContent( error.message);
      setShowTooltip(true);
    }
  };

  const handleOutsideClick = (event) => {
    if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
      setShowTooltip(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  return (
    <Carousel showThumbs={false} dynamicHeight={true}>
      {employees.map((employee) => (
        <Box key={employee.id} display="flex" flexDirection="row" justifyContent="space-between" padding={2}>
          <Box flex="1" position="relative">
            <Typography variant="h5">{employee.name} - {employee.holidays_left} Holidays Left</Typography>
            <Calendar
              tileClassName={({ date, view }) => getTileClassName({ date, view }, employee.requests)}
              defaultValue={new Date(2024, 10, 1)} // November 2024
              onClickDay={(date, event) => handleDateClick(date, event)}
            />
            {showTooltip && (
              <Box
                ref={tooltipRef}
                position="absolute"
                padding="10px"
                bgcolor="rgba(0, 0, 0, 0.7)"
                color="white"
                borderRadius="5px"
                zIndex="10"
              >
                {tooltipContent}
              </Box>
            )}
          </Box>
          <Box flex="1" paddingLeft={2}>
            <Typography variant="h6">Requests</Typography>
            <TableContainer component={Paper} style={{ maxHeight: 240 }}>
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
                  {employee.requests.map((request) => (
                    <TableRow
                      key={request.id}
                      onMouseEnter={() => setHoveredRequest(request)}
                      onMouseLeave={() => setHoveredRequest(null)}
                    >
                      <TableCell>{dayjs(request.vacation_start_date).format('MM-DD-YYYY')}</TableCell>
                      <TableCell>{dayjs(request.vacation_end_date).format('MM-DD-YYYY')}</TableCell>
                      <TableCell>{request.status}</TableCell>
                      <TableCell>
                        {request.status === 'PENDING' && (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to approve the leave?')) {
                                onApproveRequest(request.id);
                              }
                            }}
                          >
                            Approve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      ))}
    </Carousel>
  );
};

export default EmployeeCarousel;