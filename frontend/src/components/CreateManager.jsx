import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Container, Typography, Box } from '@mui/material';

const CreateManager = () => {
  const [manager, setManager] = useState({
    employee_id: ''
  });
  const [message] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setManager((prevManager) => ({ ...prevManager, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/managers', manager);
      if (response.status === 200) {
        alert('Manager created successfully.');
        setManager({ employee_id: '' });
      }
    } catch (error) {
      alert('Failed to create manager.');
    }
  };

  return (
    <Container maxWidth="sm" className="centered-form">
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create Manager
        </Typography>
        <TextField
          label="Employee ID"
          variant="outlined"
          fullWidth
          margin="normal"
          name="employee_id"
          value={manager.employee_id}
          onChange={handleChange}
          required
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Submit
        </Button>
        {message && <Typography color="error">{message}</Typography>}
      </Box>
    </Container>
  );
};

export default CreateManager;
