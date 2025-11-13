// src/App.jsx

import AppRoutes from '@components/AppRoutes'
import '@shared/styles/tailwind.css'
import { ToastContainer } from 'react-toastify'

import { AuthProvider } from './contexts/AuthContext'
import { MessageProvider } from './contexts/MessageProvider'

function App() {
  return (
    <AuthProvider>
      <MessageProvider>
        <AppRoutes />
        <ToastContainer />
      </MessageProvider>
    </AuthProvider>
  )
}

export default App
