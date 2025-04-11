import { Button } from '@mui/material'

export default function CTAButton({
  label,
  onClick,
  disabled = false,
  type = 'button',
  sx = {},
  fullWidth = false,
  startIcon
}) {
  return (
    <Button
      variant="contained"
      onClick={onClick}
      disabled={disabled}
      type={type}
      fullWidth={fullWidth}
      startIcon={startIcon}
      sx={{
        borderRadius: '999px',
        backgroundColor: disabled ? '#D9D9D9' : '#004D9F',
        color: '#FFFFFF',
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: '12px',
        px: 3,
        py: 0.5,
        minWidth: 100,
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: !disabled && '#143d8a',
        },
        '&.Mui-disabled': {
          color: '#FFFFFF',
        },
        ...sx,
      }}
    >
      {label}
    </Button>
  )
}
