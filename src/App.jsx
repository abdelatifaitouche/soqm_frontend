import { useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  console.log('API URL:', import.meta.env.VITE_API_BASE_URL)
  return (
    <>
     <Button>Hello shadcn</Button>
    </>
  )
}

export default App
