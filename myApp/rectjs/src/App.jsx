import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
  const apiEndpoint = apiBaseUrl ? `${apiBaseUrl}/api/health` : '/api/health'
  const [status, setStatus] = useState('Loading...')
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchApiStatus = async () => {
      try {
        const response = await fetch(apiEndpoint, {
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const payload = await response.json()
        setStatus(`${payload.message} (${payload.timestamp})`)
      } catch (requestError) {
        setError(requestError.message)
      }
    }

    fetchApiStatus()
  }, [apiEndpoint])

  return (
    <main className="app">
      <div className="card">
        <h1>Laravel + React API Connection</h1>
        <p className="label">Endpoint:</p>
        <code>{apiEndpoint}</code>
        {error ? (
          <p className="error">Connection failed: {error}</p>
        ) : (
          <p className="success">{status}</p>
        )}
      </div>
    </main>
  )
}

export default App
