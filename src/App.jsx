// src/App.jsx

import AppRoutes from '@components/AppRoutes'
import '@shared/styles/tailwind.css'
import { ToastContainer } from 'react-toastify'
// 👈 1. IMPORT AuthProvider TỪ FILE CONTEXT CỦA BẠN
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer />
    </AuthProvider>
  )
}

export default App
