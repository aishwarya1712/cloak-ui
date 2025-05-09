import React from 'react';
import { Dialog, Box, Typography, CircularProgress } from '@mui/material';

export default function LoadingModal({ open }) {
  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            borderRadius: '20px',
            boxShadow: 24,
            p: '40px 32px',
        },
      }}
      BackdropProps={{ sx: { backgroundColor: 'rgba(0,0,0,0.3)' } }}
    >
      <Box sx={{ display: 'flex', mb: 2 }}>
        <CircularProgress size={48} />
      </Box>
      <Typography variant="h6" gutterBottom fontWeight={"bold"}>
        Cloaking in Progress...
      </Typography>
      <Typography fontSize={"12px"} color="#757575">
      Our redaction system may make mistakes. If something looks wrong, it's not your fault — we're working on it.
      </Typography>
    </Dialog>
  );
}
