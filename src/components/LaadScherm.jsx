// src/components/LaadScherm.jsx
// Het scherm terwijl een lazy geladen stuk (pagina, tabblad) binnenkomt.
export default function LaadScherm() {
  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#fff', borderRadius: '50%', animation: 'laadspin 0.9s linear infinite' }} />
      <style>{'@keyframes laadspin { to { transform: rotate(360deg); } }'}</style>
    </div>
  )
}
