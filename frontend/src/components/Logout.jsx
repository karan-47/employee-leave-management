import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Perform any necessary cleanup here, like clearing local storage
    navigate('/');
  };

  return (
    <Button color="inherit" onClick={handleLogout}>
      Log Out
    </Button>
  );
};

export default Logout;
