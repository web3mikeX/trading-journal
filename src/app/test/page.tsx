export default function TestPage() {
  return (
    <div style={{ 
      background: 'red', 
      color: 'white', 
      padding: '50px', 
      fontSize: '24px',
      textAlign: 'center'
    }}>
      <h1>TEST PAGE WORKS!</h1>
      <p>If you can see this, the server is running!</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  )
}