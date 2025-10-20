// src/coach/tabs/client-info/components/Field.jsx
export default function Field({ 
  label, 
  value, 
  onChange, 
  isEditing, 
  type = 'text', 
  options, 
  required = false,
  placeholder = '',
  isMobile,
  ...props 
}) {
  return (
    <div>
      <label style={{
        display: 'block',
        marginBottom: '0.25rem',
        fontSize: isMobile ? '0.75rem' : '0.8rem',
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '500'
      }}>
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      
      {isEditing ? (
        type === 'select' ? (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '0.5rem' : '0.6rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              outline: 'none',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)'
              e.target.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.target.style.boxShadow = 'none'
            }}
            {...props}
          >
            {options?.map(opt => (
              <option key={opt.value} value={opt.value} style={{ background: '#111' }}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: isMobile ? '0.5rem' : '0.6rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              outline: 'none',
              minHeight: '80px',
              resize: 'vertical',
              fontFamily: 'inherit',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)'
              e.target.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.target.style.boxShadow = 'none'
            }}
            {...props}
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            style={{
              width: '100%',
              padding: isMobile ? '0.5rem' : '0.6rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              outline: 'none',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)'
              e.target.style.boxShadow = '0 0 0 2px rgba(16, 185, 129, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.target.style.boxShadow = 'none'
            }}
            {...props}
          />
        )
      ) : (
        <div style={{
          padding: isMobile ? '0.5rem' : '0.6rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '6px',
          color: value ? '#fff' : 'rgba(255, 255, 255, 0.3)',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          minHeight: '44px',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: type === 'textarea' ? 'pre-wrap' : 'normal',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {value || '-'}
        </div>
      )}
    </div>
  )
}
