import React from 'react';
import { Modal, Box, Stack, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function ConfirmModal({
  open,
  onClose,
  titleIcon,
  title,
  description,
  secondaryButton,
  ctaButton
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          borderRadius: '20px',
          boxShadow: 24,
          p: '40px 32px',
        }}
      >
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              {titleIcon}
              <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>
                {title}
              </Typography>
            </Stack>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>

          {/* Description */}
          <Typography sx={{ fontStyle: 'italic', color: '#757575' }} component="div">
            {description}
          </Typography>

          {/* Actions */}
          <Stack direction="row" spacing={1}>
            {secondaryButton}
            {ctaButton}
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}
