import './App.css'
import { config, passport } from '@imtbl/sdk'
import { useAccount, WagmiProvider, createConfig, http, useConnect, useDisconnect } from 'wagmi'
import { immutableZkEvmTestnet } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export const passportInstance = new passport.Passport({
  baseConfig: {
    environment: config.Environment.SANDBOX,
    publishableKey: process.env.REACT_APP_IMMUTABLE_PUBLISHABLE_KEY || '',
  },
  clientId: process.env.REACT_APP_IMMUTABLE_CLIENT_ID || 'CLIENT_ID',
  redirectUri: 'http://localhost:3000/redirect',
  logoutRedirectUri: 'http://localhost:3000/logout',
  audience: 'platform_api',
  scope: 'openid offline_access email transact',
  popupOverlayOptions: {
    disableGenericPopupOverlay: false,
    disableBlockedPopupOverlay: false,
  },
  logoutMode: 'silent',
})

const queryClient = new QueryClient()

const wagmiConfig = createConfig({
  chains: [immutableZkEvmTestnet],
  connectors: [injected()],
  transports: {
    [immutableZkEvmTestnet.id]: http(),
  },
})

//==========================================================

function Content() {
  passportInstance.connectEvm()

  const { address } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [state, setState] = useState('disconnected')

  async function login() {
    setState('logging in...')
    for (const connector of connectors) {
      if (connector.name.includes('Immutable Passport')) {
        connect({ connector })
      }
    }
  }

  async function logout() {
    setState('logging out...')
    disconnect()
    await passportInstance.logout()
    setState('disconnected')
  }

  return (
  <div>
    <button onClick={login}>Login</button><br/>
    <button onClick={logout}>Logout</button><br/>
    <p>{address ? `Connected as ${address}` : state}</p>
  </div>)
}

//==========================================================

function App() {
  if (window.location.pathname === '/redirect') {
    passportInstance.loginCallback()
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
      <div className="App">
        {!process.env.REACT_APP_IMMUTABLE_PUBLISHABLE_KEY && <p>Please set REACT_APP_IMMUTABLE_PUBLISHABLE_KEY in your .env file</p>}
        {!process.env.REACT_APP_IMMUTABLE_CLIENT_ID && <p>Please set REACT_APP_IMMUTABLE_CLIENT_ID in your .env file</p>}
        <header className="App-header">
          <Content />
        </header>
      </div>
      </QueryClientProvider>      
    </WagmiProvider>
    
  )
}

export default App;
