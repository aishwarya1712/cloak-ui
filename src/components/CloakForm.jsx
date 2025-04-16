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
  CircularProgress,
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
  // Mode: "edit" = TextField, "highlight" = preview with PII highlighted, "redacted" = final state.
  const [mode, setMode] = useState("edit");
  // piiData holds the detected PII objects, now with id, original_text, pii_type, and computed redacted_value.
  const [piiData, setPiiData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // selectedPiiIds tracks which suggestions the user has selected.
  const [selectedPiiIds, setSelectedPiiIds] = useState([]);

  const handleCheckboxChange = (event, id) => {
    if (event.target.checked) {
      setSelectedPiiIds((prev) => [...prev, id]);
    } else {
      setSelectedPiiIds((prev) => prev.filter((pid) => pid !== id));
    }
  };

  const handleUpload = () => {
    // TODO: integrate file picker and extract content
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  // Helper: Return an array of React nodes with detected PII highlighted.
  // For each suggestion, we wrap the first occurrence of suggestion.original_text in a styled span.
  const getHighlightedComponents = (plainText, suggestions) => {
    if (!suggestions || suggestions.length === 0) return plainText;
    let remainingText = plainText;
    const components = [];
    suggestions.forEach((sugg) => {
      const pos = remainingText.indexOf(sugg.original_text);
      if (pos === -1) {
        components.push(remainingText);
        remainingText = "";
      } else {
        components.push(remainingText.slice(0, pos));
        components.push(
          <span
            key={sugg.id}
            style={{ color: '#004D9F', fontWeight: 700, textDecoration: 'underline' }}
          >
            {sugg.original_text}
          </span>
        );
        remainingText = remainingText.slice(pos + sugg.original_text.length);
      }
    });
    components.push(remainingText);
    return components;
  };

  // Helper: Replace only the first occurrence of searchStr in str with replacement.
  const replaceFirstOccurrence = (str, searchStr, replacement) => {
    const pos = str.indexOf(searchStr);
    if (pos === -1) return str;
    return str.slice(0, pos) + replacement + str.slice(pos + searchStr.length);
  };

  // handleScan: Mock the server response.
  // Now the server returns only id, original_text, and pii_type.
  // We immediately compute a redacted_value field for each suggestion.
  const handleScan = () => {
    setIsLoading(true);
    // Server response (mocked):
    const json_data_response = [
      { id: "pii_001", original_text: "Emily Davis", pii_type: "NAME" },
      { id: "pii_002", original_text: "Dallas, Texas", pii_type: "LOCATION" },
      { id: "pii_003", original_text: "Hawaii", pii_type: "LOCATION" },
      { id: "pii_004", original_text: "May 10th", pii_type: "DATE" },
      { id: "pii_005", original_text: "Dallas/Fort Worth Airport", pii_type: "LOCATION" },
      { id: "pii_006", original_text: "Honolulu", pii_type: "LOCATION" },
    ];
    // Compute redacted_value for each suggestion based on order in text:
    const counts = {};
    // Sort by appearance in text:
    const sorted = [...json_data_response].sort(
      (a, b) => text.indexOf(a.original_text) - text.indexOf(b.original_text)
    );
    const computedSuggestions = sorted.map((item) => {
      counts[item.pii_type] = (counts[item.pii_type] || 0) + 1;
      return { ...item, redacted_value: item.pii_type + counts[item.pii_type] };
    });
    // Simulate delay.
    setTimeout(() => {
      setPiiData(computedSuggestions);
      setMode("highlight");
      setIsLoading(false);
      setSelectedPiiIds([]);
    }, 500);
  };

  // handleAcceptSelected: When the user accepts selected suggestions,
  // replace the first occurrence of each accepted suggestion's original_text with its precomputed redacted_value.
  const handleAcceptSelected = () => {
    let newText = text;
    // We'll process accepted suggestions in order of appearance.
    const accepted = piiData
      .filter(item => selectedPiiIds.includes(item.id))
      .sort((a, b) => newText.indexOf(a.original_text) - newText.indexOf(b.original_text));
    accepted.forEach((item) => {
      newText = replaceFirstOccurrence(newText, item.original_text, item.redacted_value);
    });
    setText(newText);
    // Remove accepted suggestions from piiData.
    const remaining = piiData.filter(item => !selectedPiiIds.includes(item.id));
    setPiiData(remaining);
    setSelectedPiiIds([]);
    if (remaining.length === 0) {
      setMode("redacted");
    } else {
      setMode("highlight");
    }
  };

  // For redacted mode, we simply show the final text with the redacted values. 
  // However, we want to make the redacted text bold and underlined.
  // Since we've already replaced the text, we can post-process the final text by wrapping each redacted substring (from our computed mapping) in a styled span.
  // For simplicity, here we simply render the final text as plain text.
  // If you need it to be styled, you could compute an array of nodes similarly to getFinalRedactedComponents.
  const renderFinalText = (plainText) => {
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
        {plainText}
      </Box>
    );
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
            <ErrorOutlineIcon sx={{ fontSize: '14px', color: "#757575" }} />
            <Typography sx={{ color: "#757575", fontStyle: "italic", fontSize: "12px" }}>
              Cloak found {piiData ? piiData.length : 0} instances of personal information. Learn more...
            </Typography>
          </Stack>
          {getHighlightedComponents(text, piiData)}
        </Box>
      );
    } else if (mode === "redacted") {
      return renderFinalText(text);
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
            <ListItem>1. Enter your text into the box.</ListItem>
            <ListItem>2. Click the “Scan” button.</ListItem>
            <ListItem>3. Cloak will scan for sensitive information and suggest changes.</ListItem>
            <ListItem>4. You can accept some or all of the suggested changes.</ListItem>
          </List>
        </>
      );
    } else if (mode === "highlight" || mode === "redacted") {
      if (piiData.length === 0) {
        return (
            <Stack spacing={1} mt={4} mb={1}>
                <Typography sx={{ fontSize: '14px' }} fontWeight={700}>
                Suggestions
                </Typography>
                <Typography sx={{ color: "#757575", fontStyle: "italic", fontSize: "12px" }}>
                    Nice work! There appears to be no personal information to Cloak.
                </Typography>
            </Stack>
        );
      } else {
        return (
          <Stack spacing={1} mt={4} mb={1}>
            <Typography sx={{ fontSize: '14px' }} fontWeight={700}>
              Suggestions
            </Typography>
            <Typography sx={{ color: "#757575", fontStyle: "italic", fontSize: "12px" }}>
              Use the checkboxes to select the changes you wish to accept. Then click “ACCEPT”.
            </Typography>
            {piiData.map((e) => (
              <Accordion key={e.id} disableGutters elevation={0} square sx={{ mb: 0, '&:before': { display: 'none' } }}>
                <AccordionSummary
                  sx={{ p: 0.5, minHeight: 'unset', '& .MuiAccordionSummary-content': { margin: 0, alignItems: 'center' } }}
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel-content"
                  id="panel-header"
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                    <Checkbox
                      sx={{ p: 0, m: 0 }}
                      checked={selectedPiiIds.includes(e.id)}
                      onChange={(event) => handleCheckboxChange(event, e.id)}
                      onClick={(ev) => ev.stopPropagation()}
                      onFocus={(ev) => ev.stopPropagation()}
                    />
                    <Stack direction="row" alignItems="center">
                      <Typography sx={{ color: '#004D9F', fontWeight: 700 }}>
                        {e.original_text}
                      </Typography>
                      <ArrowForwardIcon sx={{ fontSize: '12px', color: "#757575" }} />
                      <Typography sx={{ fontWeight: 700 }}>
                        {e.redacted_value || e.computedRedacted || e.pii_type} {/* redacted_value has been computed on scan */}
                      </Typography>
                    </Stack>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 0, pl: 3 }}>
                  <Typography sx={{ fontStyle: "italic", color: "#757575" }}>
                    High risk: This data can directly compromise your safety if exposed.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
            <Stack direction="row" spacing={1} alignItems="center">
              <SecondaryButton
                label="Select all"
                onClick={() => setSelectedPiiIds(piiData.map(item => item.id))}
                sx={{ height: 32, fontStyle: "italic", fontWeight: "normal" }}
              />
              <CTAButton
                label="ACCEPT"
                onClick={handleAcceptSelected}
                sx={{ height: 32 }}
              />
            </Stack>
          </Stack>
        );
      }
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
              startIcon = {isLoading ?  <CircularProgress size={14} color="inherit" /> : null}
              onClick={handleScan}
              disabled={isLoading || (mode === "edit" && !text.trim())}
              sx={{ height: 40 }}
            />
          </Stack>
        </Box>
        {/* Right side - 32.5% */}
        <Box sx={{ width: '32.5%' }}>
          {renderSuggestionArea()}
        </Box>
      </Stack>
      
    </Container>
  );
}
