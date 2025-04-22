import { Button } from '@mui/material'

export default function RoundedOutlinedButton({
  icon,
  label,
  onClick,
  disabled = false,
  sx = {},
  type = 'button',
  fullWidth = false,
  size = 'medium',
}) {
  return (
    <Button
      startIcon={icon}
      variant="outlined"
      onClick={onClick}
      disabled={disabled}
      type={type}
      fullWidth={fullWidth}
      size={size}
      sx={{
        fontSize: '12px',
        borderRadius: '999px',
        borderColor: '#D9D9D9',
        textTransform: 'none',
        color: '#757575',
        fontWeight: 400,
        px: 2.5,
        py: 1,
        ...sx,
      }}
    >
      {label}
    </Button>
  )
}
