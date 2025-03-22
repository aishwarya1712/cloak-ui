import { useState } from 'react'
import './App.css'
import { Button, Typography, Container } from '@mui/material'
import CloakForm from './components/CloakForm'

function App() {
  const [count, setCount] = useState(0)

  return (
    <CloakForm/>
    // <Container sx={{ padding: 2 }}>
    //   <Typography variant="h4" gutterBottom>
    //     Cloak UI
    //   </Typography>
    //   <Button variant="contained" color="primary" onClick={() => setCount((count) => count + 1)}>
    //     Click Me {count}
    //   </Button>
    // </Container>
  )
}

export default App
