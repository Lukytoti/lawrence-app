export default function Custom500() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#09090B',
      color: '#fff',
      fontFamily: 'Inter, sans-serif',
    }}>
      <h1 style={{ fontSize: '3rem', margin: 0 }}>500 – Internal Server Error</h1>
      <p style={{ marginTop: '1rem' }}>Something went wrong. Please try again later.</p>
    </div>
  );
}
