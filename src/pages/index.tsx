// src/pages/index.tsx
import type { NextPage } from 'next'

const HomePage: NextPage = () => {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>Sedifex Stores Directory</h1>
      <p style={{ fontSize: 16, color: '#4b5563', marginBottom: 24 }}>
        Browse Sedifex-powered shops and branches.
      </p>
      <a
        href="https://www.sedifex.com"
        style={{
          padding: '10px 18px',
          borderRadius: 999,
          background: '#4f46e5',
          color: '#ffffff',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Go to main Sedifex site
      </a>
    </main>
  )
}

export default HomePage
