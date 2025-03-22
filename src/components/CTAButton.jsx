import { Button } from '@mui/material'

export default function CTAButton({
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
        backgroundColor: disabled ? '#D9D9D9' : '#194AA4',
        color: '#FFFFFF',
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: '12px',
        px: 3,
        py: 0.5,
        minWidth: 100,
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
