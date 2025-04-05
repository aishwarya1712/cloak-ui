import React, { useState } from 'react';
import {
  Box,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  List,
  ListItem,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/CloudUpload';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RoundedOutlinedButton from './RoundedOutlinedButton';
import CTAButton from './CTAButton';
import SecondaryButton from './SecondaryButton';
import solarCopyBrokenIcon from '../assets/icons/solar_copy-broken.svg';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function CloakForm() {
  // Initially, the user inputs plain text.
  const [text, setText] = useState(
    "Can you help me plan a vacation? My name is Emily Davis, and I live in Dallas, Texas. I'm looking to go to Hawaii next month with my family for my birthday, which is on May 10th. I'd like to book flights from Dallas/Fort Worth Airport to Honolulu. What should my itinerary be?"
  );
  // Mode: "edit" = TextField, "highlight" = preview with PII highlighted, "redacted" = preview with redacted text.
  const [mode, setMode] = useState("edit");
  // piiData holds the detected PII objects.
  const [piiData, setPiiData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleCheckboxChange = (event) => {
    setChecked(event.target.checked);
  };

  const handleUpload = () => {
    // TODO: integrate file picker and extract content
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  // Helper: Return an array of React nodes with detected PII highlighted.
  const getHighlightedComponents = (plainText, piiData) => {
    if (!piiData || piiData.length === 0) return plainText;
    const sorted = [...piiData].sort((a, b) => a.pii_start_index - b.pii_start_index);
    let lastIndex = 0;
    const components = [];
    sorted.forEach((item, idx) => {
      // Plain text before this PII.
      components.push(plainText.slice(lastIndex, item.pii_start_index));
      // Detected PII, styled.
      components.push(
        <span
          key={idx}
          style={{ color: '#004D9F', fontWeight: 'bold' }}
        >
          {plainText.slice(item.pii_start_index, item.pii_end_index)}
        </span>
      );
      lastIndex = item.pii_end_index;
    });
    components.push(plainText.slice(lastIndex));
    return components;
  };

  // Helper: Return an array of React nodes with detected PII replaced by redacted text.
  const getRedactedComponents = (plainText, piiData) => {
    if (!piiData || piiData.length === 0) return plainText;
    const sorted = [...piiData].sort((a, b) => a.pii_start_index - b.pii_start_index);
    let lastIndex = 0;
    const components = [];
    sorted.forEach((item, idx) => {
      components.push(plainText.slice(lastIndex, item.pii_start_index));
      components.push(
        <span key={idx} style={{ fontWeight: 'bold', color: '#004D9F' }}>
          {item.redacted_text}
        </span>
      );
      lastIndex = item.pii_end_index;
    });
    components.push(plainText.slice(lastIndex));
    return components;
  };

  // handleScan: Mock the server response.
  const handleScan = () => {
    setIsLoading(true);
    const json_data_response = [
      {
        "id": "pii_001",
        "original_text": "Emily Davis",
        "redacted_text": "NAME1",
        "pii_start_index": 44,
        "pii_end_index": 55,
        "pii_type": "NAME",
        "reason": "Name is a sensitive attribute"
      },
      {
        "id": "pii_002",
        "original_text": "Dallas, Texas",
        "redacted_text": "LOCATION1",
        "pii_start_index": 71,
        "pii_end_index": 84,
        "pii_type": "LOCATION",
        "reason": "Location is a sensitive attribute"
      },
      {
        "id": "pii_003",
        "original_text": "Hawaii",
        "redacted_text": "LOCATION2",
        "pii_start_index": 107,
        "pii_end_index": 113,
        "pii_type": "LOCATION",
        "reason": "Location is a sensitive attribute"
      },
      {
        "id": "pii_004",
        "original_text": "May 10th",
        "redacted_text": "DATE1",
        "pii_start_index": 169,
        "pii_end_index": 177,
        "pii_type": "DATE",
        "reason": "Date is a sensitive attribute"
      },
      {
        "id": "pii_005",
        "original_text": "Dallas/Fort Worth Airport",
        "redacted_text": "LOCATION3",
        "pii_start_index": 209,
        "pii_end_index": 234,
        "pii_type": "LOCATION",
        "reason": "Location is a sensitive attribute"
      },
      {
        "id": "pii_006",
        "original_text": "Honolulu",
        "redacted_text": "LOCATION4",
        "pii_start_index": 238,
        "pii_end_index": 246,
        "pii_type": "LOCATION",
        "reason": "Location is a sensitive attribute"
      }
    ];
    // Simulate a delay.
    setTimeout(() => {
      setPiiData(json_data_response);
      setMode("highlight");
      setIsLoading(false);
    }, 500);
  };

  // handleAcceptAll: Replace highlighted PII with redacted text in the preview.
  const handleAcceptAll = () => {
    setMode("redacted");
  };

  // Render the input or preview area.
  const renderInputArea = () => {
    if (mode === "edit") {
      return (
        <Box
          sx={{
            width: '100%',
            minHeight: '80px',
            borderRadius: 1,
            fontSize: '12px',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            overflowY: 'auto',
          }}
        >
          <TextField
            multiline
            minRows={6}
            fullWidth
            placeholder="Enter the text you wish to Cloak"
            value={text}
            onChange={(e) => setText(e.target.value)}
            InputProps={{
              style: { fontSize: '12px' },
            }}
          />
        </Box>
      );
    } else if (mode === "highlight") {
      return (
        <Box
          sx={{
            width: '100%',
            minHeight: '80px',
            p: 1.5,
            border: '1px solid rgba(0, 0, 0, 0.23)',
            borderRadius: 1,
            fontSize: '12px',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            overflowY: 'auto',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: "12px" }}>
            <ErrorOutlineIcon sx={{ fontSize: '14px', color: "#757575" }}/>
            <Typography sx={{ color: "#757575", fontStyle: "italic", fontSize: "12px" }}>
              Cloak found {piiData ? piiData.length : 0} instances of personal information. Learn more...
            </Typography>
          </Stack>
          {getHighlightedComponents(text, piiData)}
        </Box>
      );
    } else if (mode === "redacted") {
      return (
        <Box
          sx={{
            width: '100%',
            minHeight: '80px',
            p: 1.5,
            border: '1px solid rgba(0, 0, 0, 0.23)',
            borderRadius: 1,
            fontSize: '12px',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            overflowY: 'auto',
          }}
        >
          {getRedactedComponents(text, piiData)}
        </Box>
      );
    }
  };

  const renderSuggestionArea = () => {
    if (mode === "edit") {
      return (
        <>
          <Typography sx={{ fontSize: '14px' }} mt={4} mb={1} fontWeight={700}>
            How to Use Cloak
          </Typography>
          <List sx={{ color: "#757575", fontStyle: "italic", fontSize: "12px" }}>
            <ListItem>1. Enter text into the text box.</ListItem>
            <ListItem>2. Click the “Scan” button.</ListItem>
            <ListItem>3. Cloak will scan your text for sensitive information and suggest changes.</ListItem>
            <ListItem>4. You can accept some or all of the suggested changes.</ListItem>
          </List>
        </>
      );
    } else if (mode === "highlight" || mode === "redacted") {
      return (
        <Stack spacing={1} mt={4} mb={1}>
          <Typography sx={{ fontSize: '14px' }} fontWeight={700}>
            Suggestions
          </Typography>
          <Typography sx={{ color: "#757575", fontStyle: "italic", fontSize: "12px" }}>
            Use the checkboxes to select the suggested changes you wish to make. Then click “Accept”.
          </Typography>
          {
            piiData.map((e, key) => (
              <Accordion key={key} disableGutters elevation={0} square sx={{ mb: 0, '&:before': { display: 'none' }}}>
                <AccordionSummary
                  sx={{ p: 0.5, minHeight: 'unset', '& .MuiAccordionSummary-content': { margin: 0, alignItems: 'center' } }}
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel-content"
                  id="panel-header"
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                    <Checkbox
                      sx={{ p: 0, m: 0 }}
                      checked={checked}
                      onChange={handleCheckboxChange}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                    />
                    <Stack direction="row" alignItems="center">
                      <Typography sx={{ color: '#004D9F', fontWeight: 'bold' }}>{e.original_text}</Typography>
                      <ArrowForwardIcon sx={{ fontSize: '12px', color: "#757575" }}/>
                      <Typography sx={{ fontWeight: 'bold' }}>{e.redacted_text}</Typography>
                    </Stack>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 0, pl: 3 }}>
                  <Typography sx={{ fontStyle: "italic", color: "#757575" }}>
                    High risk: This data can directly compromise your safety if exposed.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))
          }
        </Stack>
      );
    }
  };

  return (
    <Container sx={{ py: 2 }}>
      {/* Header */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box sx={{ width: 49, height: 49, bgcolor: '#004D9F' }} />
        <Box>
          <Typography sx={{ fontSize: '36px', lineHeight: 1 }} fontWeight={700}>
            Cloak
          </Typography>
          <Typography sx={{ fontSize: '13px', color: 'text.secondary', mt: 0.5 }}>
            Know what to share. Protect what you shouldn't.
          </Typography>
        </Box>
      </Stack>

      <Divider sx={{ mx: '-2rem', mt: '1rem' }} />
      
      {/* Two sections: left (67.5%) and right (32.5%) */}
      <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
        {/* Left side - 67.5% */}
        <Box sx={{ width: '67.5%' }}>
          <Typography sx={{ fontSize: '14px' }} mt={4} mb={1} fontWeight={700}>
            Enter text or upload a document to Cloak.
          </Typography>
          {renderInputArea()}
          <Stack direction="row" spacing={2} mt={2} justifyContent="space-between">
            <RoundedOutlinedButton
              icon={<img src={solarCopyBrokenIcon} alt="Copy icon" />}
              label="Copy contents"
              onClick={handleCopy}
            />
            <CTAButton
              label={isLoading ? "SCANNING..." : (mode === "edit" ? "SCAN" : "RESCAN")}
              onClick={handleScan}
              disabled={isLoading || (mode === "edit" && !text.trim())}
              sx={{ height: 40, width: 70 }}
            />
          </Stack>
        </Box>
        {/* Right side - 32.5% */}
        <Box sx={{ width: '32.5%' }}>
          {renderSuggestionArea()}
            {mode === "highlight" && (
                <Stack direction="row" justifyContent={"space-between"}>
                <SecondaryButton label="Select all" sx={{ height: 32, fontStyle: "italic", fontWeight: "normal"}}/>
                <CTAButton label={"ACCEPT"} onClick={handleAcceptAll} sx={{ height: 32}} />
              </Stack>
            )}
        </Box>
      </Stack>
      
    </Container>
  );
}
