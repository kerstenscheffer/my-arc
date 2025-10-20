export default function TransformationSection({ isMobile }) {
  const transformations = [
    {
      name: "Mark, 34",
      result: "-15kg in 8 weken",
      quote: "Eindelijk het lichaam waar ik altijd van droomde",
      image: "👨‍💼" // Placeholder, later echte foto's
    },
    {
      name: "Lisa, 28", 
      result: "+8kg spieren",
      quote: "Sterker dan ooit, vol vertrouwen",
      image: "👩‍💻"
    },
    {
      name: "Tom, 42",
      result: "-18kg, +energie", 
      quote: "Voel me 20 jaar jonger",
      image: "👨‍🔬"
    }
  ]

  return (
    <section id="section-transformations" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '3rem 1rem' : '4rem 2rem',
      background: '#111'
    }}>
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: isMobile ? '2rem' : '3rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: '1rem'
        }}>
          Echte Transformaties
        </h2>
        
        <p style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: isMobile ? '3rem' : '4rem',
          maxWidth: '600px',
          margin: '0 auto',
          marginBottom: isMobile ? '3rem' : '4rem',
          lineHeight: '1.6'
        }}>
          Honderden mensen gingen je voor. Dit zijn hun resultaten.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1.5rem' : '2rem'
        }}>
          {transformations.map((person, index) => (
            <div key={index} style={{
              background: 'rgba(17, 17, 17, 0.5)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: isMobile ? '1.5rem' : '2rem',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.3)'
              e.currentTarget.style.boxShadow = '0 15px 30px rgba(16, 185, 129, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
            >
              {/* Avatar */}
              <div style={{
                fontSize: isMobile ? '3rem' : '4rem',
                marginBottom: '1rem'
              }}>
                {person.image}
              </div>
              
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: '#10b981',
                marginBottom: '0.5rem'
              }}>
                {person.name}
              </h3>
              
              <p style={{
                fontSize: isMobile ? '1rem' : '1.125rem',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '1rem'
              }}>
                {person.result}
              </p>
              
              <p style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontStyle: 'italic',
                lineHeight: '1.5'
              }}>
                "{person.quote}"
              </p>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div style={{
          marginTop: isMobile ? '3rem' : '4rem',
          padding: isMobile ? '1.5rem' : '2rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(16, 185, 129, 0.1)'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '1rem'
          }}>
            Jouw Transformatie Begint Nu
          </h3>
          
          <p style={{
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '1.5rem',
            lineHeight: '1.5'
          }}>
            Join de honderden mensen die hun leven al veranderden
          </p>

          <button
            onClick={() => window.location.href = '/my-arc'}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: isMobile ? '12px' : '16px',
              padding: isMobile ? '0.875rem 2rem' : '1rem 2.5rem',
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.25)'
            }}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            Start Mijn Transformatie
          </button>
        </div>
      </div>
    </section>
  )
}
