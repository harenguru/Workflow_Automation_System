import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import { pingBackend } from './api/client'

// Wake up Render backend immediately on app load
pingBackend()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Wait up to 60s before considering a request failed (covers Render cold start)
      retry: 2,
      retryDelay: 3000,
      staleTime: 30_000,
    },
  },
})

const rootElement = document.getElementById('root')!

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
