import {
    Box,
    Container,
    Divider,
    InputAdornment,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import UploadIcon from '@mui/icons-material/CloudUpload'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useState } from 'react'
import RoundedOutlinedButton from './RoundedOutlinedButton'
import CTAButton from './CTAButton'

export default function CloakForm() {
    const [text, setText] = useState('')
  
    const handleUpload = () => {
      // TODO: integrate file picker and extract content
    }
  
    const handleCopy = () => {
      navigator.clipboard.writeText(text)
    }
  
    const handleScan = () => {
      // TODO: trigger redaction engine
    }
  
    return (
        <Container sx={{ py: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" >
            <Box
                sx={{
                width: 49,
                height: 49,
                bgcolor: '#004D9F'
                }}
            />
            <Box>
                <Typography
                sx={{ fontSize: '36px', lineHeight: 1 }}
                fontWeight={700}
                >
                Cloak
                </Typography>
                <Typography
                sx={{ fontSize: '13px', color: 'text.secondary', mt: 0.5 }}
                >
                Know what to share. Protect what you shouldn't.
                </Typography>
            </Box>
            </Stack>
            <Divider/>
  
        <Typography sx={{ fontSize: "14px" }} mt={4} mb={1} fontWeight={700}>
          Enter text or upload a document to Cloak.
        </Typography>
  
        <Box sx={{ position: 'relative' }}>
            <TextField
                multiline
                minRows={6}
                fullWidth
                placeholder="Enter the text you wish to Cloak"
                value={text}
                onChange={(e) => setText(e.target.value)}
                sx={{
                '& .MuiInputBase-input::placeholder': {
                    fontStyle: 'italic',
                    fontSize: '12px',
                },
                }}
            />

            <Box
                sx={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                }}
            >
                <CTAButton
                    label="SCAN"
                    onClick={handleScan}
                    disabled={!text}
                    sx={{ height: 40, width: 70 }}
                />
            </Box>
        </Box>
  
        <Stack direction="row" spacing={2} mt={2}>
        <RoundedOutlinedButton
            icon={<UploadIcon />}
            label="Upload document to Cloak"
            onClick={handleUpload}
        />

        <RoundedOutlinedButton
            icon={<ContentCopyIcon />}
            label="Copy contents"
            onClick={handleCopy}
        />

        </Stack>
      </Container>
    )
}
  