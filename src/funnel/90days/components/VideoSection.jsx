// src/funnel/90days/components/VideoSection.jsx

import React, { useState } from 'react'

export default function VideoSection() {
  const isMobile = window.innerWidth <= 768
  const [activeVideo, setActiveVideo] = useState('testimonial')

  const VideoCard = ({ type, title, videoId, thumbnail }) => (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        borderRadius: isMobile ? '12px' : '16px',
        overflow: 'hidden',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        background: '#111',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.2)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {/* IFRAME or THUMBNAIL */}
      {activeVideo === type ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          <img
            src={thumbnail}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {/* PLAY BUTTON OVERLAY */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              cursor: 'pointer',
            }}
            onClick={() => setActiveVideo(type)}
          >
            <div
              style={{
                width: isMobile ? '50px' : '70px',
                height: isMobile ? '50px' : '70px',
                background: '#10b981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: isMobile ? '12px solid white' : '18px solid white',
                  borderTop: isMobile ? '8px solid transparent' : '12px solid transparent',
                  borderBottom: isMobile ? '8px solid transparent' : '12px solid transparent',
                  marginLeft: isMobile ? '4px' : '6px',
                }}
              />
            </div>
          </div>

          {/* TITLE OVERLAY */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent)',
              padding: isMobile ? '1rem 0.75rem' : '1.5rem 1rem',
            }}
          >
            <h3
              style={{
                fontSize: isMobile ? '0.9rem' : '1.1rem',
                fontWeight: 'bold',
                color: '#fff',
                margin: 0,
              }}
            >
              {title}
            </h3>
          </div>
        </>
      )}
    </div>
  )

  return (
    <section
      style={{
        marginBottom: isMobile ? '2rem' : '3rem',
      }}
    >
      <h2
        style={{
          fontSize: isMobile ? '1.5rem' : '2rem',
          fontWeight: 'bold',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          textAlign: 'center',
        }}
      >
        Proof & Training
      </h2>

      {/* VIDEO GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '1rem' : '1.5rem',
          marginBottom: isMobile ? '1.5rem' : '2rem',
        }}
      >
        <VideoCard
          type="testimonial"
          title="Client Testimonial - 12kg Lost"
          videoId="dQw4w9WgXcQ"
          thumbnail="https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
        />
        <VideoCard
          type="training"
          title="Free Training: 30-Min Workout"
          videoId="dQw4w9WgXcQ"
          thumbnail="https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
        />
      </div>

      {/* VIDEO TABS */}
      <div
        style={{
          display: 'flex',
          gap: isMobile ? '0.75rem' : '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {['testimonial', 'training'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveVideo(tab)}
            style={{
              padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.5rem',
              background:
                activeVideo === tab
                  ? '#10b981'
                  : 'rgba(16, 185, 129, 0.1)',
              color: activeVideo === tab ? '#000' : '#10b981',
              border: `1px solid rgba(16, 185, 129, ${activeVideo === tab ? '0.5' : '0.3'})`,
              borderRadius: isMobile ? '8px' : '10px',
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textTransform: 'capitalize',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
            }}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.95)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            {tab === 'testimonial' ? 'Testimonial' : 'Free Training'}
          </button>
        ))}
      </div>
    </section>
  )
}
