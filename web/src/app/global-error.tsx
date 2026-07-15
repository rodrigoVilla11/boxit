'use client';

// Reemplaza el layout raíz ante un error de render global: usa estilos inline
// (Tailwind puede no estar disponible en este contexto).
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: '#0B0F0E',
          color: '#F0F4F2',
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <p style={{ fontWeight: 700, fontSize: '20px' }}>
          BOX <span style={{ color: '#22C55E' }}>iT</span>
        </p>
        <p style={{ color: '#8A938F', fontSize: '14px' }}>Algo se rompió.</p>
        <button
          type="button"
          onClick={reset}
          style={{
            background: '#22C55E',
            color: '#0B0F0E',
            border: 'none',
            borderRadius: '16px',
            padding: '10px 20px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
