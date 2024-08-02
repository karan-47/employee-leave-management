import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TextField, Button, Container, Typography, Box } from '@mui/material';

const CreateRequest = ({ authorId }) => {
  const [request, setRequest] = useState({
    author_id: authorId,
    manager_id: '',
    vacation_start_date: '',
    vacation_end_date: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchManagerId = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/manager_employee_relations/${authorId}`);
        if (response.status === 200) {
          setRequest((prevRequest) => ({
            ...prevRequest,
            manager_id: response.data.manager_id,
          }));
        }
      } catch (error) {
        setMessage('Failed to fetch manager ID.');
      }
    };

    fetchManagerId();
  }, [authorId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRequest((prevRequest) => ({ ...prevRequest, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/requests', {
        ...request,
        status: 'PENDING',  // Set the default status to PENDING
      });
      if (response.status === 200) {
        alert('Request created successfully.');
        setRequest({
          author_id: authorId,
          manager_id: request.manager_id,
          vacation_start_date: '',
          vacation_end_date: '',
        });
      }
    } catch (error) {
      alert('Failed to create request.');
    }
  };

  return (
    <Container maxWidth="sm" className="centered-form">
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create Request
        </Typography>
        <TextField
          label="Author ID"
          variant="outlined"
          fullWidth
          margin="normal"
          value={request.author_id}
          disabled
        />
        <TextField
          label="Manager ID"
          variant="outlined"
          fullWidth
          margin="normal"
          name="manager_id"
          value={request.manager_id}
          disabled
          required
        />
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
        {message && <Typography color="error">{message}</Typography>}
      </Box>
    </Container>
  );
};

export default CreateRequest;
