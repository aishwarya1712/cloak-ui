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
  CircularProgress,
} from '@mui/material';
import RoundedOutlinedButton from './RoundedOutlinedButton';
import CTAButton from './CTAButton';
import SecondaryButton from './SecondaryButton';
import copyIcon from '../assets/icons/si_copy-line.svg';
import shieldInfoIcon from '../assets/icons/shield_info_button.svg'
import CheckIcon from '@mui/icons-material/Check';
import shieldIcon from '../assets/icons/ic_outline-gpp-good.svg';
import resetIcon from '../assets/icons/octicon_trash-24.svg';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import questionIcon from "../assets/icons/stash_question-light.svg"
import exclamationIcon from "../assets/icons/ep_warning.svg"
import piiReasoning from '../data/pii_reasoning.json'
import ConfirmModal from './ConfirmModal';
import cloakIcon from "../assets/icons/CloakIcon.png"
import LoadingModal from './LoadingModal';

export default function CloakForm() {
  //Can you help me plan a vacation? My name is Emily Davis, and I live in Dallas, Texas. I'm looking to go to Hawaii next month with my family for my birthday, which is on May 10th. I'd like to book flights from Dallas/Fort Worth Airport to Honolulu. What should my itinerary be?"
  // Initially, the user inputs plain text.
  const [text, setText] = useState("");
  const [textToUncloak, setTextToUncloak] = useState("")
  // Mode: "edit", "highlight", "redacted", "no_pii", "uncloak", "final".
  const [mode, setMode] = useState("edit");
  const [copyState, setCopyState] = useState("not_copied")
  const [hasCopied, setHasCopied] = useState(false);
  // piiData holds the detected PII objects, now with id, original_text, pii_type, and computed redacted_value.
  const [piiData, setPiiData] = useState([]);
  const [originalPiiData, setOriginalPiiData] = useState([])
  const [isLoading, setIsLoading] = useState(false);
  // selectedPiiIds tracks which suggestions the user has selected.
  const [selectedPiiIds, setSelectedPiiIds] = useState([]);
  const [uncloakModalOpen, setUncloakModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [loadingModalOpen, setLoadingModalOpen] = useState(false)
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const redactedTextRef = React.useRef(null);

  const handleCheckboxChange = (event, id) => {
    if (event.target.checked) {
      setSelectedPiiIds((prev) => [...prev, id]);
    } else {
      setSelectedPiiIds((prev) => prev.filter((pid) => pid !== id));
    }
  };

  const storageAPI = useMemo(() => {
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
        setOriginalPiiData(saved.originalPiiData ?? [])
        setSelectedPiiIds(saved.selectedPiiIds ?? []);
        setUncloakModalOpen(saved.uncloakModalOpen ?? false)
        setResetModalOpen(saved.resetModalOpen ?? false)
        setTextToUncloak(saved.textToUncloak ?? "")
        setHasCopied(saved.hasCopied ?? false)
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
        originalPiiData,
        selectedPiiIds,
        uncloakModalOpen,
        resetModalOpen,
        textToUncloak,
        hasCopied
      },
    });
  }, [text, mode, originalPiiData, piiData, selectedPiiIds, storageAPI, hasCopied, uncloakModalOpen, resetModalOpen, textToUncloak]);

   // Reset handler
   const handleReset = () => {
    // 1. Clear React state
    setText("");
    setMode("edit");
    setPiiData([]);
    setSelectedPiiIds([]);
    setUncloakModalOpen(false)
    setResetModalOpen(false)
    setTextToUncloak("")
    setHasCopied(false);

    // 2. Clear persisted state
    if (window.chrome?.storage?.local) {
      chrome.storage.local.remove("cloakState");
    } else {
      localStorage.removeItem("cloakState");
    }
  };

  useEffect(() => {
    const handleManualCopy = (e) => {
      // Check if the selection is within our redacted text container
      const selection = window.getSelection();
      if (selection && redactedTextRef.current && redactedTextRef.current.contains(selection.anchorNode)) {
        setHasCopied(true);
      }
    };
  
    document.addEventListener("copy", handleManualCopy);
    return () => document.removeEventListener("copy", handleManualCopy);
  }, []);
  
  const handleCopy = () => {
    if(mode ==="edit" || mode === "highlight" || mode === "redacted"){
      navigator.clipboard.writeText(text);
    } else if(mode === "uncloak" || mode === "final"){
      navigator.clipboard.writeText(textToUncloak);
    }
    
    setCopyState("copied")
    setHasCopied(true); 
  };

  useEffect(() => {
    if (copyState === "copied") {
      const timer = setTimeout(() => {
        setCopyState("not_copied");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [copyState]);

  // Helper: Return an array of React nodes with detected PII highlighted.
  // For each suggestion, we wrap the first occurrence of suggestion.original_text in a styled span.
  const getHighlightedComponents = (plainText, suggestions) => {
    if (!suggestions || suggestions.length === 0) return plainText;
    let remaining = plainText;
    const nodes = [];
    suggestions.forEach((sugg) => {
      const target = sugg.pii_text;
      const lowerRem = remaining.toLowerCase();
      const lowerTar = target.toLowerCase();
      const idx = lowerRem.indexOf(lowerTar);
      // const pos = remainingText.indexOf(sugg.original_text);
      if (idx === -1) {
        nodes.push(remaining);
        remaining = "";
      } else {
        nodes.push(remaining.slice(0, idx));
        nodes.push(
          <span
            key={sugg.id}
            style={{ color: '#004D9F', fontWeight: 700 }}
          >
            {remaining.slice(idx, idx + target.length)}
          </span>
        );
        remaining = remaining.slice(idx + target.length);
      }
    });
    nodes.push(remaining);
    return nodes;
  };

  // Helper: Replace only the first occurrence of searchStr in str with replacement.
  const replaceFirstOccurrence = (str, searchStr, replacement) => {
   // escape any regex-special chars in searchStr
   const escaped = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   // new RegExp(..., 'i') will match case-insensitively
   const re = new RegExp(escaped, 'i');
   return str.replace(re, replacement);
  };

  async function callStreamingApi() {
    setIsLoading(true);
    const response = await fetch('https://eafd-73-151-92-222.ngrok-free.app/cloak', {
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
    setOriginalPiiData(computedSuggestions);
    if(results.length === 0){
      setMode("no_pii");
    } else {
      setMode("highlight");
    }
    setIsLoading(false);
    setSelectedPiiIds([]);
  }


  
  const handleScan = () => {
    callStreamingApi()
    .then(() => {
      console.log("Streaming API call completed");
    })
    .catch((error) => {
      console.error("Error calling the API:", error);
      setIsLoading(false);
    });
  }

  const handleModalAccept = () => {
    setMode("uncloak")
    setUncloakModalOpen(false)
  }

  const handleUncloak = () => {
    console.log("in handle uncloak")
    // Helper to escape special regex chars
    const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
    // Start from the user’s input
    let result = textToUncloak;
    
    console.log("original pii data is: ", originalPiiData)
    // For each mapping, replace **all** occurrences of redacted_value with the original pii_text
    originalPiiData.forEach(({ redacted_value, pii_text }) => {
      console.log("redacted_value is: ", redacted_value)
      const re = new RegExp(`\\b${escapeRe(redacted_value)}\\b`, 'g');
      result = result.replace(re, pii_text);
    });
  
    // Put the un‑cloaked text back into the textarea
    setTextToUncloak(result);
    setMode("final")
  };

  // handleAcceptSelected: When the user accepts selected suggestions,
  // replace the first occurrence of each accepted suggestion's original_text with its precomputed redacted_value.
  const handleAcceptSelected = () => {
    let newText = text;
    const lowerNewText = newText.toLowerCase();
    // We'll process accepted suggestions in order of appearance.
    const accepted = piiData
      .filter(item => selectedPiiIds.includes(item.id))
      .sort((a, b) => {
        const idxA = lowerNewText.indexOf(a.pii_text.toLowerCase());
        const idxB = lowerNewText.indexOf(b.pii_text.toLowerCase());
        return idxA - idxB;
      });
    
    // do the replacements (case-insensitive)
    accepted.forEach(item => {
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
  // const renderFinalText = (plainText) => {
  //   return (
  //     <Box
  //       ref={redactedTextRef}
  //       sx={{
  //         border: '1px solid rgba(0, 0, 0, 0.23)', p: "18px 20px", color: "#757575",
  //         minHeight: '160px', maxHeight: '340px', fontSize: '12px', overflowY: "scroll", borderRadius: "10px", lineHeight: "20px"
  //       }}
  //     >
  //       {plainText}
  //     </Box>
  //   );
  // };

  // Wrap each redacted_value in a bold span
const getRedactedComponents = (plainText, suggestions) => {
  if (!suggestions || suggestions.length === 0) return plainText;
  let remaining = plainText;
  const nodes = [];

  suggestions.forEach((sugg) => {
    const target = sugg.redacted_value;
    const idx = remaining.indexOf(target);

    if (idx === -1) {
      nodes.push(remaining);
      remaining = "";
    } else {
      // push everything before the placeholder
      nodes.push(remaining.slice(0, idx));
      // push the placeholder itself, bolded
      nodes.push(
        <Typography
          component="span"
          key={sugg.id}
          fontWeight="bold"
          color="#757575"
        >
          {target}
        </Typography>
      );
      // cut past the placeholder
      remaining = remaining.slice(idx + target.length);
    }
  });

  nodes.push(remaining);
  return nodes;
};

   const renderFinalText = (plainText) => {
       // bold-wrap each NAME1, NAME2, etc.
       const components = getRedactedComponents(plainText, originalPiiData);
    
       return (
         <Box
           ref={redactedTextRef}
           sx={{
             border: '1px solid rgba(0, 0, 0, 0.23)',
             p: "18px 20px",
             color: "#757575",
             minHeight: '160px',
           maxHeight: '340px',
             fontSize: '12px',
            overflowY: "scroll",
             borderRadius: "10px",
             lineHeight: "20px"
           }}
         >
           {components}
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
        <Box>
          <TextField
            multiline
            minRows={6}
            fullWidth
            placeholder="Enter the text you wish to Cloak."
            value={text}
            onChange={(e) => setText(e.target.value)}
            sx={{ minHeight: '160px', maxHeight: '340px', overflowY: "scroll" }}
            InputProps={{
              style: {fontSize: '12px', borderRadius: "10px", lineHeight: "20px"},
            }}
            disabled={isLoading}
          />
        </Box>
      );
    } else if (mode === "highlight") {
      return (
        <Box
          ref={redactedTextRef}
          sx={{
            border: '1px solid rgba(0, 0, 0, 0.23)', p: "18px 20px", color: "#757575",
            minHeight: '160px', maxHeight: '340px', fontSize: '12px', overflowY: "scroll",  borderRadius: "10px",lineHeight: "20px"
          }}
        >
          {getHighlightedComponents(text, piiData)}
        </Box>
      );
    } else if (mode === "redacted" || mode === "no_pii") {
      return (
        <Box ref={redactedTextRef}>
          {renderFinalText(text)}
        </Box>
      );
    } else if(mode === "uncloak" || mode === "final"){
      return (
        <Box
                sx={{
                  width: '100%',
                  minHeight: '160px',
                  borderRadius: "10px",
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  color: "#757575"
                }}
              >
          <TextField
            multiline
            minRows={6}
            fullWidth
            placeholder="Enter the response from your AI tool."
            value={textToUncloak}
            onChange={(e) => setTextToUncloak(e.target.value)}
            sx={{ minHeight: '160px', maxHeight: '340px', overflowY: "scroll" }}
            InputProps={{
              style: {fontSize: '12px', borderRadius: "10px", lineHeight: "20px" },
            }}
          />
          </Box>
      )
    }
  };

  // "edit", "highlight", "redacted", "no_pii", "uncloak", "final"
  const labelInstructions = {
    edit: "Enter text into the box and click ”Cloak”.",
    highlight: `Cloak found ${piiData ? piiData.length : 0} instances of personal information.`,
    redacted: "You're all set. Now copy the redacted text and paste it into your preferred AI tool.\nAfter you've finished this, click “Phase 2” to see what comes next.",
    no_pii: "Click “Clear” to Cloak a new piece of text.",
    uncloak: "Enter the response from your AI tool into the box and click “Uncloak”.",
    final: "Your text is now Uncloaked! When you're finished, click “Done”."
  }

  const subtext = {
    highlight: <Typography sx={{ color: "#757575", fontStyle: "italic", fontSize: "12px" }}>
    Select the changes you wish to make and click “Accept”.
  </Typography>,
    no_pii: <Typography sx={{ color: "#757575", fontStyle: "italic", fontSize: "12px" }}>Nice work! There appears to be no personal information to Cloak.</Typography>
  }

  const renderLabelArea = () => {
    if(labelInstructions[mode]){
      return labelInstructions[mode]
    }
  }
  
  const renderSuggestionArea = () => {
    // Complex PII highlight/redacted mode
    if (mode === "highlight" || mode === "no_pii") {
      return (
        <Stack spacing={1} mt={4} mb={1}>
          <Typography sx={{ fontSize: '14px'}}fontWeight={700}>
          Select the changes you wish to make and click “Accept”.
          </Typography>
          {/* {subtext[mode]} */}
  
        <Box sx={{pt: 1}}>
          {piiData.map(e => (
            <Accordion
              key={e.id}
              disableGutters
              elevation={0}
              square
              sx={{ mb: 0, '&:before': { display: 'none' } }}
            >
              <AccordionSummary
                sx={{
                  p: 0.5,
                  minHeight: 'unset',
                  '& .MuiAccordionSummary-content': { margin: 0, alignItems: 'center' }
                }}
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel-content-${e.id}`}
                id={`panel-header-${e.id}`}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" gap={1}>
                  <Checkbox
                    sx={{ p: 0, m: 0 }}
                    checked={selectedPiiIds.includes(e.id)}
                    onChange={ev => handleCheckboxChange(ev, e.id)}
                    onClick={ev => ev.stopPropagation()}
                    onFocus={ev => ev.stopPropagation()}
                  />
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography sx={{ color: '#004D9F', fontWeight: 700 }}>
                      {e.pii_text}
                    </Typography>
                    <ArrowForwardIcon sx={{ fontSize: '12px', color: "#757575" }} />
                    <Typography fontWeight={700}>
                      {e.redacted_value || e.computedRedacted || e.pii_type}
                    </Typography>
                  </Stack>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 0, pl: 3 }}>
                <Typography sx={{ fontStyle: "italic", color: "#757575" }}>
                  {piiReasoning[e.pii_type]
                    ? piiReasoning[e.pii_type]
                    : `${formatPiiType(e.pii_type)} is a sensitive attribute.`}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
          </Box>
  
          {piiData.length > 0 && <Stack direction="row" spacing={1} alignItems="center" sx={{pt: "15px"}}>
            <SecondaryButton
              label="SELECT ALL"
              onClick={() => setSelectedPiiIds(piiData.map(item => item.id))}
              sx={{ fontWeight: "bold", height: 40 }}
            />
            <CTAButton
              label="ACCEPT"
              onClick={handleAcceptSelected}
              sx={{ height: 40 }}
            />
          </Stack>}
        </Stack>
      );
    }
  
    return null;
  };

  return (
    <Container sx={{ py: 2 }}>
      {/* Header */}
      <Stack direction="row" spacing={1.5} alignItems="center">
        {/* <Box sx={{ width: 49, height: 49, bgcolor: '#004D9F' }} /> */}
        <img src={cloakIcon} alt="Cloak Icon" style={{ width: "49px", height: "50px"}} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography sx={{ fontSize: '36px', lineHeight: 1, color: "#004D9F" }}>
            Cloak
          </Typography>
          <Stack direction="row" justifyContent={"space-between"}>
            <Typography sx={{ fontSize: '13px', mt: 0.5 }}>
              The smartest thing you'll never send.
            </Typography>
            <Stack direction={"row"} alignItems={"center"} spacing={0.5} sx={{cursor: "pointer"}} onClick={() => setPrivacyModalOpen(true)}>
              <img src={shieldInfoIcon} alt="shield info icon" style={{cursor: "pointer", height: "16px"}} />
              <Typography sx={{width: "100px", fontSize: "12px", color: "#757575"}}>Privacy Policy</Typography>
            </Stack>
          </Stack>
        </Box>
      </Stack>

      <Divider sx={{ mx: '-2rem', mt: '1rem' }} />
      
      {/* Two sections: left (65%) and right (35%) */}
      <Stack direction="row" spacing={2} divider={<Divider orientation="vertical" flexItem />}>
        {/* Left side - 65% */}
        <Box sx={{ width: mode === 'highlight' ? '65%': '100%' }}>
          <Typography sx={{ whiteSpace: 'pre-line', fontSize: '14px' }} mt={4} mb={1} fontWeight={700}>
            {renderLabelArea()}
          </Typography>
          {renderInputArea()}
          <Stack direction="row" spacing={2} mt={2} justifyContent="space-between">
            <Stack direction={"row"} spacing={2}>
            <RoundedOutlinedButton
              icon={<img src={resetIcon} alt="Reset icon" />}
              label="Restart"
              onClick={() => setResetModalOpen(true)}
              sx = {{ fontStyle: "normal"}}
            />
            <RoundedOutlinedButton
              icon={copyState === "not_copied" ? <img src={copyIcon} alt="Copy icon" /> : <CheckIcon sx={{fontSize: "12px"}}/> }
              label={copyState === "not_copied" ? "Copy" : "Copied!"}
              disabled={copyState === "copied"}
              onClick={handleCopy}
            />

            </Stack>
            
            {mode === "edit" ? 
              <CTAButton
                label={isLoading ? "CLOAKING..." : "CLOAK"}
                startIcon = {isLoading ?  <CircularProgress size={14} color="inherit" /> : null}
                onClick={handleScan}
                disabled={isLoading || (mode === "edit" && !text.trim())}
                sx={{ height: 40, minWidth: 100 }}
              /> : 
              (mode === "highlight" || mode === "redacted" ? 
              <CTAButton
                label={ "Phase 2: Uncloaking"}
                onClick={() => setUncloakModalOpen(true) }
                sx={{ height: 40 }}
                disabled={!hasCopied}
              /> :
              <CTAButton
                label={mode === "uncloak" ? "UNCLOAK" : "DONE"}
                onClick={mode === "uncloak" ? handleUncloak : () => handleReset()}
                sx={{ height: 40 }}
              />)
            }
            
            <ConfirmModal
              open={uncloakModalOpen}
              onClose={() => setUncloakModalOpen(false)}
              titleIcon={<img src={questionIcon} alt="Question icon" />}
              title="Optional: Do you want to Uncloak the response from your AI tool?"
              description="You're viewing the AI's response with your personal details still cloaked. Would you like to Uncloak the response to see the original terms that were hidden?"
              secondaryButton={
                <SecondaryButton
                  label="NO, RESTART"
                  onClick={handleReset}
                  sx={{ fontWeight: 'bold', height: 40 }}
                />
              }
              ctaButton={
                <CTAButton
                  label="YES, UNCLOAK"
                  onClick={handleModalAccept}
                  sx={{ height: 40, fontWeight: "bold" }}
                />
              }
            />
            <ConfirmModal 
               open={resetModalOpen}
               onClose={() => setResetModalOpen(false)}
               titleIcon={<img src={exclamationIcon} alt="Warning icon" />}
               title="Warning!"
               description="This will clear all data related to your query. You will not be able to Uncloak responses related to this query. Are you sure you want to reset?"
               secondaryButton={
                 <SecondaryButton
                   label="NO, CANCEL"
                   onClick={() => setResetModalOpen(false)}
                   sx={{ fontWeight: 'bold', height: 40 }}
                 />
               }
               ctaButton={
                 <CTAButton
                   label="YES, CLEAR ALL"
                   onClick={handleReset}
                   sx={{ height: 40 }}
                 />
               }
            />
            <ConfirmModal 
               open={privacyModalOpen}
               onClose={() => setPrivacyModalOpen(false)}
               titleIcon={<img src={shieldIcon} alt="Shield info icon" />}
               title="Your Privacy, Fully Protected"
               description={
                <Stack spacing={1} mb={1}>
                  <Typography>All data you enter is stored locally on your device for the duration of your session.</Typography>
                  <Typography>Redactions are powered by a local LLM running on your computer, so your personal information is never sent to third-party servers or major tech companies.</Typography>
                  <Typography>Our code is fully open source, and we never access or collect user data. You're in full control, always.</Typography>
                </Stack>
               }
               ctaButton={
                 <CTAButton
                   label="GOT IT!"
                   onClick={() => setPrivacyModalOpen(false)}
                   sx={{ height: 40 }}
                 />
               }
            />
            <LoadingModal open={isLoading}/>
          </Stack>
          
        </Box>
        {/* Right side - 35% */}
       {(mode === 'highlight' || mode === "no_pii" )&& <Box sx={{ width: '35%' }}>
          {renderSuggestionArea()}
        </Box>}
      </Stack>
    </Container>
  );
}
