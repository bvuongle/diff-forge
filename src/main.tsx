import React from 'react'
import ReactDOM from 'react-dom/client'

import { App } from './App'
import { setupStateSubscriptions } from './state/stateSubscriptions'

import './styles/globals.css'
import './styles/canvas-nodes.css'
import './styles/canvas-edges.css'

setupStateSubscriptions()

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find root element')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
