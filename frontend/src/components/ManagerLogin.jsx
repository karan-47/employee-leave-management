import React, { useState } from 'react';
import axios from 'axios';
import { Container, TextField, Button, Typography } from '@mui/material';

const ManagerLogin = ({ onLoginSuccess }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`http://127.0.0.1:8000/managers/${employeeId}`);
      if (response.status === 200) {
        onLoginSuccess(response.data.employee_id);
      } else {
        setMessage('Manager does not exist.');
      }
    } catch (error) {
      setMessage('Manager does not exist.');
    }
  };

  return (
    <Container className="login-form">
      <Typography variant="h4" gutterBottom>
        Manager Login
      </Typography>
      {message && <Typography color="error">{message}</Typography>}
      <form onSubmit={handleLogin}>
        <TextField
          label="Employee ID"
          variant="outlined"
          fullWidth
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          required
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Login
        </Button>
      </form>
    </Container>
  );
};

export default ManagerLogin;
