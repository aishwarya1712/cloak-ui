import './index.css'
import ReactDOM from 'react-dom'
import App from './App'
import '@fontsource/dm-sans'
import theme from './theme'
import { ThemeProvider, CssBaseline } from '@mui/material'

ReactDOM.render(
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Applies global styles like font and background */}
      <App />
    </ThemeProvider>,
  document.getElementById('root')
)
