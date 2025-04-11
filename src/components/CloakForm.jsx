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
  // piiData holds the detected PII objects (each with id, original_text, and pii_type).
  const [piiData, setPiiData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // selectedPiiIds tracks which suggestions the user has selected.
  const [selectedPiiIds, setSelectedPiiIds] = useState([]);
  // finalMapping holds the accepted redaction mapping: array of { redacted: string }
  const [finalMapping, setFinalMapping] = useState([]);

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
            style={{ color: '#004D9F', fontWeight: 'bold', textDecoration: 'underline' }}
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

  // Helper: Replace the first occurrence of searchStr in str with replacement.
  const replaceFirstOccurrence = (str, searchStr, replacement) => {
    const pos = str.indexOf(searchStr);
    if (pos === -1) return str;
    return str.slice(0, pos) + replacement + str.slice(pos + searchStr.length);
  };

  // handleScan: Mock the server response.
  // Now, the server returns only id, original_text, and pii_type.
  const handleScan = () => {
    setIsLoading(true);
    const json_data_response = [
      { id: "pii_001", original_text: "Emily Davis", pii_type: "NAME" },
      { id: "pii_002", original_text: "Dallas, Texas", pii_type: "LOCATION" },
      { id: "pii_003", original_text: "Hawaii", pii_type: "LOCATION" },
      { id: "pii_004", original_text: "May 10th", pii_type: "DATE" },
      { id: "pii_005", original_text: "Dallas/Fort Worth Airport", pii_type: "LOCATION" },
      { id: "pii_006", original_text: "Honolulu", pii_type: "LOCATION" },
    ];
    // Simulate a delay.
    setTimeout(() => {
      setPiiData(json_data_response);
      setMode("highlight");
      setIsLoading(false);
      setSelectedPiiIds([]);
      setFinalMapping([]); // clear any previous accepted mapping.
    }, 500);
  };

  // handleAcceptSelected: Accept only the selected suggestions.
  // For each accepted suggestion, compute a redacted value (based on pii_type and a running count).
  // Then, replace (the first occurrence of) each accepted suggestion's original_text with its redacted value in the text.
  // Also store the mapping so that in redacted mode we can style the replaced text.
  const handleAcceptSelected = () => {
    let newText = text;
    const counts = {};
    const mapping = [];
    // Filter accepted suggestions and sort by appearance.
    const accepted = piiData
      .filter(item => selectedPiiIds.includes(item.id))
      .sort((a, b) => newText.indexOf(a.original_text) - newText.indexOf(b.original_text));
    accepted.forEach((item) => {
      counts[item.pii_type] = (counts[item.pii_type] || 0) + 1;
      const redactedValue = item.pii_type + counts[item.pii_type];
      mapping.push({ id: item.id, redacted: redactedValue });
      newText = replaceFirstOccurrence(newText, item.original_text, redactedValue);
    });
    setText(newText);
    // Remove accepted suggestions from piiData.
    const remaining = piiData.filter(item => !selectedPiiIds.includes(item.id));
    setPiiData(remaining);
    setSelectedPiiIds([]);
    setFinalMapping(prev => [...prev, ...mapping]);
    // If no suggestions remain, switch mode.
    if (remaining.length === 0) {
      setMode("redacted");
    } else {
      setMode("highlight");
    }
  };

  // Helper: Given the final text (already redacted) and the finalMapping,
  // wrap each occurrence of a redacted value (from our mapping) in a span that is bold and underlined.
  // We assume that each redacted value is unique.
  const getFinalRedactedComponents = (plainText, mapping) => {
    if (!mapping || mapping.length === 0) return plainText;
    let finalComponents = [plainText];
    mapping.forEach((item) => {
      finalComponents = finalComponents.flatMap(fragment => {
        if (typeof fragment !== 'string') return [fragment];
        const parts = fragment.split(item.redacted);
        return parts.flatMap((part, index, arr) => {
          if (index < arr.length - 1)
            return [
              part,
              <span 
                key={item.id + '-' + index} 
                style={{ fontWeight: 700, textDecoration: 'underline', color: '#004D9F' }}
              >
                {item.redacted}
              </span>
            ];
          else
            return [part];
        });
      });
    });
    return finalComponents;
  };
  
  // For redacted mode, use getFinalRedactedComponents to render the final text with styling.
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
        {getFinalRedactedComponents(plainText, finalMapping)}
      </Box>
    );
  };

  // Render input area based on mode.
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
            border: '1px solid rgba(0,0,0,0.23)',
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
      // In redacted mode, show the final redacted text with styling.
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
            <Typography sx={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', mt: 4 }}>
                Nice work! There appears to be no personal information to Cloak.
            </Typography>
            </Stack>
        );
      } else {
        // Compute suggestions with computed redacted text.
        const computedSuggestions = (() => {
          const counts = {};
          const sorted = [...piiData].sort((a, b) => text.indexOf(a.original_text) - text.indexOf(b.original_text));
          return sorted.map((item) => {
            counts[item.pii_type] = (counts[item.pii_type] || 0) + 1;
            return { ...item, computedRedacted: item.pii_type + counts[item.pii_type] };
          });
        })();

        return (
          <Stack spacing={1} mt={4} mb={1}>
            <Typography sx={{ fontSize: '14px' }} fontWeight={700}>
              Suggestions
            </Typography>
            <Typography sx={{ color: "#757575", fontStyle: "italic", fontSize: "12px" }}>
                Select the changes you wish to make. Then click “Accept”.
            </Typography>
            
            {computedSuggestions.map((e) => (
              <Accordion key={e.id} disableGutters elevation={0} square sx={{ mb: 0, '&:before': { display: 'none' } }}>
                <AccordionSummary
                  sx={{
                    p: 0.5,
                    minHeight: 'unset',
                    '& .MuiAccordionSummary-content': { margin: 0, alignItems: 'center' },
                  }}
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
                      <Typography sx={{ color: '#004D9F', fontWeight: 'bold' }}>
                        {e.original_text}
                      </Typography>
                      <ArrowForwardIcon sx={{ fontSize: '12px', color: "#757575" }} />
                      <Typography sx={{ fontWeight: 'bold' }}>
                        {e.computedRedacted}
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
