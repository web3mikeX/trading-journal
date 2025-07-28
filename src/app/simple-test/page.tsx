export default function SimpleTestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Simple Test Page</h1>
      <p>If you can see this, the Next.js server is working.</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  )
}