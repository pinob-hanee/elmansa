import './index.css'
import './i18n/config'
import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import i18n from './i18n/config'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </I18nextProvider>
  </React.StrictMode>,
)
