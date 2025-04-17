import React, { useEffect, useState, useMemo } from 'react';
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
import RoundedOutlinedButton from './RoundedOutlinedButton';
import CTAButton from './CTAButton';
import SecondaryButton from './SecondaryButton';
import solarCopyBrokenIcon from '../assets/icons/solar_copy-broken.svg';
import shieldIcon from '../assets/icons/ic_outline-gpp-good.svg';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import piiReasoning from '../data/pii_reasoning.json'

export default function CloakForm() {
  //Can you help me plan a vacation? My name is Emily Davis, and I live in Dallas, Texas. I'm looking to go to Hawaii next month with my family for my birthday, which is on May 10th. I'd like to book flights from Dallas/Fort Worth Airport to Honolulu. What should my itinerary be?"
  // Initially, the user inputs plain text.
  const [text, setText] = useState(
    ""
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

  const storageAPI = React.useMemo(() => {
    if (
      typeof window !== "undefined" &&
      window.chrome &&
      chrome.storage &&
      chrome.storage.local
    ) {
      return chrome.storage.local;
    } else {
      return {
        get: (keys, cb) => {
          try {
            const raw = localStorage.getItem(keys);
            const val = raw ? JSON.parse(raw) : {};
            cb({ [keys]: val });
          } catch {
            cb({ [keys]: undefined });
          }
        },
        set: (obj) => {
          const key = Object.keys(obj)[0];
          const val = obj[key];
          localStorage.setItem(key, JSON.stringify(val));
        },
      };
    }
  }, []);

  // 1. On mount: rehydrate
  useEffect(() => {
    storageAPI.get("cloakState", (res) => {
      const saved = res.cloakState;
      if (saved) {
        setText(saved.text ?? "");
        setMode(saved.mode ?? "edit");
        setPiiData(saved.piiData ?? []);
        setSelectedPiiIds(saved.selectedPiiIds ?? []);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // 2. On every change: persist
  useEffect(() => {
    storageAPI.set({
      cloakState: {
        text,
        mode,
        piiData,
        selectedPiiIds,
      },
    });
  }, [text, mode, piiData, selectedPiiIds, storageAPI]);

   // Reset handler
   const handleReset = () => {
    // 1. Clear React state
    setText("");
    setMode("edit");
    setPiiData([]);
    setSelectedPiiIds([]);

    // 2. Clear persisted state
    if (window.chrome?.storage?.local) {
      chrome.storage.local.remove("cloakState");
    } else {
      localStorage.removeItem("cloakState");
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

  async function callStreamingApi() {
    setIsLoading(true);
    const response = await fetch('http://0.0.0.0:8000/cloak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "message": text,
      }),
    });
  
    if (!response.ok) {
      console.error('Failed to fetch the data');
      return;
    }
  
    // This will handle the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let done = false;
  
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      result += decoder.decode(value, { stream: true });
    }
  
    const jsonResponse = JSON.parse(result);
    // When the entire response is received, you can do something with the result
    console.log('Received full response from server:', jsonResponse);
    const results = jsonResponse["results"]
    const counts = {};
    const sorted = [...results].sort(
          (a, b) => text.indexOf(a.pii_text) - text.indexOf(b.pii_text)
       );
    const computedSuggestions = sorted.map((item, key) => {
      counts[item.pii_type] = (counts[item.pii_type] || 0) + 1;
      return { ...item, id: "pii_" + key, redacted_value: item.pii_type + counts[item.pii_type] };
    });
    setPiiData(computedSuggestions);
    setMode("highlight");
    setIsLoading(false);
    setSelectedPiiIds([]);
  }

  // handleScan: Mock the server response.
  // Now the server returns only id, original_text, and pii_type.
  // We immediately compute a redacted_value field for each suggestion.
  // const handleScan = () => {
  //   setIsLoading(true);
  //   // Server response (mocked):
  //   const json_data_response = [
  //     { id: "pii_001", original_text: "Emily Davis", pii_type: "NAME" },
  //     { id: "pii_002", original_text: "Dallas, Texas", pii_type: "LOCATION" },
  //     { id: "pii_003", original_text: "Hawaii", pii_type: "LOCATION" },
  //     { id: "pii_004", original_text: "May 10th", pii_type: "DATE" },
  //     { id: "pii_005", original_text: "Dallas/Fort Worth Airport", pii_type: "LOCATION" },
  //     { id: "pii_006", original_text: "Honolulu", pii_type: "LOCATION" },
  //   ];
  //   // Compute redacted_value for each suggestion based on order in text:
  //   const counts = {};
  //   // Sort by appearance in text:
  //   const sorted = [...json_data_response].sort(
  //     (a, b) => text.indexOf(a.original_text) - text.indexOf(b.original_text)
  //   );
  //   const computedSuggestions = sorted.map((item) => {
  //     counts[item.pii_type] = (counts[item.pii_type] || 0) + 1;
  //     return { ...item, redacted_value: item.pii_type + counts[item.pii_type] };
  //   });
  //   // Simulate delay.
  //   setTimeout(() => {
  //     setPiiData(computedSuggestions);
  //     setMode("highlight");
  //     setIsLoading(false);
  //     setSelectedPiiIds([]);
  //   }, 500);
  // };

  const handleScan = () => {
    callStreamingApi()
    .then(() => {
      console.log("Streaming API call completed");
    })
    .catch((error) => {
      console.error("Error calling the API:", error);
    });
  }

  // handleAcceptSelected: When the user accepts selected suggestions,
  // replace the first occurrence of each accepted suggestion's original_text with its precomputed redacted_value.
  const handleAcceptSelected = () => {
    let newText = text;
    // We'll process accepted suggestions in order of appearance.
    const accepted = piiData
      .filter(item => selectedPiiIds.includes(item.id))
      .sort((a, b) => newText.indexOf(a.pii_text) - newText.indexOf(b.pii_text));
    accepted.forEach((item) => {
      newText = replaceFirstOccurrence(newText, item.pii_text, item.redacted_value);
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
           border: '1px solid rgba(0, 0, 0, 0.23)',p: "18px 20px",
            minHeight: '160px', maxHeight: '340px', fontSize: '12px', overflowY: "scroll",  borderRadius: "10px",lineHeight: "20px"
        }}
      >
        {plainText}
      </Box>
    );
  };

  const formatPiiType = (str) => {
    return str
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Render the input or preview area.
  const renderInputArea = () => {
    if (mode === "edit") {
      return (
        <Box
          sx={{
            width: '100%',
            minHeight: '160px',
            borderRadius: "10px",
            fontSize: '12px',
            whiteSpace: 'pre-wrap'
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
              style: { minHeight: '160px', maxHeight: '340px', fontSize: '12px', overflowY: "scroll",  borderRadius: "10px",lineHeight: "20px" },
            }}
          />
        </Box>
      );
    } else if (mode === "highlight") {
      return (
        <Box
          sx={{
            border: '1px solid rgba(0, 0, 0, 0.23)',p: "18px 20px",
            minHeight: '160px', maxHeight: '340px', fontSize: '12px', overflowY: "scroll",  borderRadius: "10px",lineHeight: "20px"
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: "12px" }}>
            <img src={shieldIcon} alt="Shield icon" />
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
            <ListItem>5. Enter the AI tool's response into the box and click the “Revert to original” button.</ListItem>
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
                        {e.pii_text}
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
                    {piiReasoning[e.pii_type] ? piiReasoning[e.pii_type] : formatPiiType(e.pii_type) + " is a sensitive attribute." } 
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
      
      {/* Two sections: left (65%) and right (35%) */}
      <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
        {/* Left side - 65% */}
        <Box sx={{ width: '65%' }}>
          <Typography sx={{ fontSize: '14px' }} mt={4} mb={1} fontWeight={700}>
            Enter text or upload a document to Cloak.
          </Typography>
          {renderInputArea()}
          <Stack direction="row" spacing={2} mt={2} justifyContent="space-between">
            <Stack direction={"row"} spacing={2}>
            <RoundedOutlinedButton
              icon={<img src={solarCopyBrokenIcon} alt="Copy icon" />}
              label="Copy contents"
              onClick={handleCopy}
            />
            <RoundedOutlinedButton
            
              label="Clear All"
              onClick={handleReset}
            />
            </Stack>
            <CTAButton
              label={isLoading ? "SCANNING..." : (mode === "edit" ? "SCAN" : "RESCAN")}
              startIcon = {isLoading ?  <CircularProgress size={14} color="inherit" /> : null}
              onClick={handleScan}
              disabled={isLoading || (mode === "edit" && !text.trim())}
              sx={{ height: 40 }}
            />
          </Stack>
        </Box>
        {/* Right side - 35% */}
        <Box sx={{ width: '35%' }}>
          {renderSuggestionArea()}
        </Box>
      </Stack>
      
    </Container>
  );
}
