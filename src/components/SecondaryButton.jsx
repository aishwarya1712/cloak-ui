import { Button } from '@mui/material'

export default function SecondaryButton({
  label,
  onClick,
  disabled = false,
  type = 'button',
  sx = {},
  fullWidth = false
}) {
  return (
    <Button
      variant="contained"
      onClick={onClick}
      disabled={disabled}
      type={type}
      fullWidth={fullWidth}
      sx={{
        borderRadius: '999px',
        backgroundColor: disabled ? '#D9D9D9' : '#FFFFFF',
        border: "1px solid rgba(0, 77, 159, 0.60)",
        color: 'rgba(0, 77, 159, 0.60)',
        fontWeight: 700,
        textTransform: 'none',
        fontSize: '12px',
        px: 3,
        py: 0.5,
        minWidth: 100,
        boxShadow: 'none',
        '&:hover': {
          backgroundColor: !disabled && '#FFFFFF',
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
