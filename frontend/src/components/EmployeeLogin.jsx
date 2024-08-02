import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Container, Typography, Box } from '@mui/material';

const EmployeeLogin = ({ onLoginSuccess }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`http://127.0.0.1:8000/employees/${employeeId}`);
      console.log(response);
      if (response.status === 200) {
        setMessage('Employee exists. Login successful.');
        onLoginSuccess(employeeId);
      } else {
        setMessage('Employee does not exist.');
      }
    } catch (error) {
      setMessage('Employee does not exist.');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box className="login-form">
        <Typography variant="h5" gutterBottom>
          Employee Login
        </Typography>
        <form onSubmit={handleLogin}>
          <TextField
            label="Employee ID"
            variant="outlined"
            fullWidth
            margin="normal"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Login
          </Button>
        </form>
        {message && <Typography color="error">{message}</Typography>}
      </Box>
    </Container>
  );
};

export default EmployeeLogin;
