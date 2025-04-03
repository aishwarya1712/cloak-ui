import {
    Box,
    Container,
    Divider,
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
    const [isLoading, setIsLoading] = useState(false)
    const [data, setData] = useState({})
  
    const handleUpload = () => {
      // TODO: integrate file picker and extract content
    }
  
    const handleCopy = () => {
      navigator.clipboard.writeText(text)
    }
  
    const handleScan = () => {
      // TODO: trigger redaction engine
      setIsLoading(true)
      fetch('http://127.0.0.1:5000/redact', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: 'Aishwarya',
            message: 'Hello from the Chrome extension!',
        }),
      })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            return response.json()
        })
        .then((data) => {
            console.log('Response from server:', data)
            setData(data.message)
            setIsLoading(false)
        })
        .catch((error) => {
            setIsLoading(false)
            console.error('Error sending POST request:', error)
        })

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
                <Typography sx={{ fontSize: '13px', color: 'text.secondary', mt: 0.5 }}>
                    Know what to share. Protect what you shouldn't.
                </Typography>
            </Box>
            </Stack>
            <Divider sx={{mx: "-2rem", my: "1rem"}}/>
  
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
                    label={isLoading ? "SCANNING..." : "SCAN"}
                    onClick={handleScan}
                    disabled={isLoading ? true : !text}
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