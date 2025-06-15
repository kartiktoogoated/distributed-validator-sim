import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SolanaWalletProvider } from './providers/SolanaWalletProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <SolanaWalletProvider>
    <StrictMode>
      <App />
    </StrictMode>
  </SolanaWalletProvider>
);

