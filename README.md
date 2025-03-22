# cloak-ui
This repository contains the front-end for Cloak, a product that redacts unnecessary data from users’ LLM chatbot queries.
Cloak is React-based Chrome Extension built with [Vite](https://vitejs.dev/), [MUI (Material UI)](https://mui.com/), and [CRXJS](https://crxjs.dev/). 

## Getting Started 
### 1. Clone the repository
```bash
git clone https://github.com/aishwarya1712/cloak-ui.git
cd cloak-ui
```

### 2. Install dependencies
```bash
npm install
```
Make sure you're using Node.js v18 or v20 (LTS)

### 3. Build the extension
```bash
npm run build
```

### 4. Load in chrome
1. Go to chrome://extensions/

2. Enable Developer Mode

3. Click Load unpacked

4. Select the dist/ folder

5. Click the extension icon to test the popup


### 5. Updating the extension
After making changes:
```bash
npm run build
```
Then return to chrome://extensions/ and click Reload on the extension.


### 6. [Optional] Run as react app
Run Vite in development mode:
```bash
npm run dev
```
You can view the popup locally, but note: Chrome Extension behavior (e.g. chrome.* APIs) only works in the real extension context.

## Contributing Guidelines

### Commit Messages

We use **[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)** to keep our commit history clean and meaningful.

The commit message should be structured as follows:
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```
**Allowed types:**

| Type      | Description                                   |
|-----------|-----------------------------------------------|
| `feat`    | New feature                                   |
| `fix`     | Bug fix                                       |
| `chore`   | Non-code changes (e.g., config, tooling)      |
| `refactor`| Code restructure without changing behavior    |
| `docs`    | Documentation updates                         |
| `style`   | Code style changes (whitespace, formatting)   |
| `test`    | Adding or updating tests                      |