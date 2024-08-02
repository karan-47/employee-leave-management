import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Container, Typography, Box } from '@mui/material';

const CreateEmployee = () => {
  const [employee, setEmployee] = useState({
    name: '',
    age: '',
    contact_details: '',
    holidays_left: '',
    manager_id: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee((prevEmployee) => ({ ...prevEmployee, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      // Check if the manager exists
      const managerResponse = await axios.get(`http://127.0.0.1:8000/managers/${employee.manager_id}`);
      if (managerResponse.status !== 200) {
        setMessage('Manager does not exist.');
        return;
      }

      // If manager exists, proceed with employee creation
      const response = await axios.post('http://127.0.0.1:8000/employees', employee);
      if (response.status === 200) {
        alert('Employee created successfully.');
        setEmployee({
          name: '',
          age: '',
          contact_details: '',
          holidays_left: '',
          manager_id: ''
        });
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setMessage('Manager does not exist.');
      } else {
        alert('Failed to create employee.');
      }
    }
  };

  return (
    <Container maxWidth="sm" className="centered-form">
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create Employee
        </Typography>
        <TextField
          label="Name"
          variant="outlined"
          fullWidth
          margin="normal"
          name="name"
          value={employee.name}
          onChange={handleChange}
          required
        />
        <TextField
          label="Age"
          variant="outlined"
          fullWidth
          margin="normal"
          name="age"
          value={employee.age}
          onChange={handleChange}
          required
        />
        <TextField
          label="Contact Details"
          variant="outlined"
          fullWidth
          margin="normal"
          name="contact_details"
          value={employee.contact_details}
          onChange={handleChange}
          required
        />
        <TextField
          label="Holidays Left"
          variant="outlined"
          fullWidth
          margin="normal"
          name="holidays_left"
          value={employee.holidays_left}
          onChange={handleChange}
          required
        />
        <TextField
          label="Manager ID"
          variant="outlined"
          fullWidth
          margin="normal"
          name="manager_id"
          value={employee.manager_id}
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

export default CreateEmployee;
