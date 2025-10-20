import React, { useState } from 'react';
import { 
  Check,
  Utensils,
  Dumbbell,
  Smartphone,
  MessageCircle,
  Calendar,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function InstagramCarouselPost() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scale = 0.5;
  const totalSlides = 3;
  
  const nextSlide = () => setCurrentSlide((currentSlide + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((currentSlide - 1 + totalSlides) % totalSlides);
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#1a1a1a',
      padding: '20px'
    }}>
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center',
        boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 100,
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
        >
          <ChevronLeft size={30} color="white" />
        </button>
        
        <button
          onClick={nextSlide}
          style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 100,
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
        >
          <ChevronRight size={30} color="white" />
        </button>

        {/* Slide Indicator Dots */}
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          gap: '10px'
        }}>
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              onClick={() => setCurrentSlide(index)}
              style={{
                width: currentSlide === index ? '30px' : '10px',
                height: '10px',
                borderRadius: '5px',
                background: currentSlide === index ? '#10b981' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        <div style={{
          width: '1080px',
          height: '1350px',
          position: 'relative',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          overflow: 'hidden'
        }}>
          {/* SLIDE 1: Review */}
          {currentSlide === 0 && (
            <>
              {/* Background for slide 1 */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'url(https://cdn.shopify.com/s/files/1/0862/1237/8954/files/MIND_512_x_512_px_3.png?v=1758299988)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.85
              }} />

              {/* Dark overlay gradient */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.75) 100%)'
              }} />

              <div style={{
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '65px 55px',
                animation: 'slideIn 0.3s ease'
              }}>
                {/* Title */}
                <h1 style={{
                  fontSize: '70px',
                  fontWeight: '900',
                  lineHeight: '1',
                  color: '#fff',
                  marginBottom: '35px',
                  letterSpacing: '-2px',
                  textAlign: 'center'
                }}>
                  Een MY ARC
                  <span style={{
                    display: 'block',
                    fontSize: '66px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginTop: '10px'
                  }}>
                    Succesverhaal
                  </span>
                  <span style={{
                    display: 'block',
                    fontSize: '54px',
                    color: 'rgba(255,255,255,0.9)',
                    marginTop: '10px'
                  }}>
                    5kg eraf in 5 weken + Spier opgebouwd ( Slide 3 )
                  </span>
                </h1>

                {/* Premium Review Section */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '24px',
                  padding: '28px 32px',
                  marginBottom: '35px',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={28} 
                        fill="#10b981" 
                        color="#10b981"
                      />
                    ))}
                  </div>
                  <p style={{
                    fontSize: '28px',
                    color: '#fff',
                    fontStyle: 'italic',
                    lineHeight: '1.4',
                    margin: 0,
                    fontWeight: '400',
                    flex: 1
                  }}>
                    "Na 100 mislukte pogingen van crash diëten, wilde ik mijzelf nog 1 kans geven. Dit keer met hulp van iemand die er verstand van heeft en mij kan blijven motiveren.
                    <br/><br/>
                    Met de energie die ik krijg van Kersten zijn enthousiasme, is het mij gelukt om een routine te creëren waarbij ik goed kan trainen en eten.
                    <br/><br/>
                    Iedere week zie ik de progressie in de MY ARC app, waarvan ik weer meer energie krijg. Niet alleen fysiek maar ook mentaal heeft Kersten mij geholpen.
                    <br/><br/>
                    Wil jij nou ook fitter worden? Je zult verbaasd zijn over wat je in je mars hebt met een beetje hulp van een gespecialiseerde coach."
                  </p>
                  <p style={{
                    fontSize: '24px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginTop: '12px',
                    fontWeight: '600'
                  }}>
                    - Anoniem, 50 jaar, Drenthe
                  </p>
                </div>

                {/* Swipe indicator */}
                <p style={{
                  textAlign: 'center',
                  fontSize: '24px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '600',
                  marginBottom: '20px'
                }}>
                  Swipe voor wat Anoniem kreeg →
                </p>

                {/* Bottom signature */}
                <p style={{
                  textAlign: 'center',
                  fontSize: '24px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '600'
                }}>
                  Kersten • MY ARC Personal Training
                </p>
              </div>
            </>
          )}

          {/* SLIDE 2: What She Got */}
          {currentSlide === 1 && (
            <>
              {/* Background for slide 2 */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'url(https://cdn.shopify.com/s/files/1/0862/1237/8954/files/MIND_512_x_512_px_3.png?v=1758299988)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.85
              }} />

              {/* Dark overlay gradient */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.75) 100%)'
              }} />

              <div style={{
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '65px 55px',
                animation: 'slideIn 0.3s ease'
              }}>
                {/* Title */}
                <h1 style={{
                  fontSize: '70px',
                  fontWeight: '900',
                  lineHeight: '1',
                  color: '#fff',
                  marginBottom: '35px',
                  letterSpacing: '-2px',
                  textAlign: 'center'
                }}>
                  Dit kreeg anoniem om
                  <span style={{
                    display: 'block',
                    fontSize: '66px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginTop: '10px'
                  }}>
                    5kg af te vallen
                  </span>
                  <span style={{
                    display: 'block',
                    fontSize: '54px',
                    color: 'rgba(255,255,255,0.9)',
                    marginTop: '10px'
                  }}>
                    + spieren op te bouwen
                  </span>
                </h1>

                {/* Features Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '22px',
                  marginTop: 'auto'
                }}>
                  {[
                    { icon: Utensils, title: 'Persoonlijk Voedingsadvies', desc: 'Levenslange kennis gepersonaliseerd op anoniem' },
                    { icon: Dumbbell, title: 'Doel Gedreven Workouts', desc: '4x per week, past in haar werkweek' },
                    { icon: Smartphone, title: 'MY ARC App', desc: 'Overzicht, structuur, getracked en gemeten' },
                    { icon: MessageCircle, title: 'Dagelijkse Check-ins', desc: 'Goeiemorgen, hoe ging je workout?' },
                    { icon: Calendar, title: '24/7 WhatsApp Support', desc: 'Ik snap dit niet? Direct antwoord' },
                    { icon: Heart, title: 'Mindset Coaching', desc: 'Mentale support & motivatie' }
                  ].map((item, index) => (
                    <div key={index} style={{
                      background: 'rgba(0, 0, 0, 0.75)',
                      border: '2px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: '18px',
                      padding: '24px',
                      backdropFilter: 'blur(15px)',
                      boxShadow: '0 5px 20px rgba(0, 0, 0, 0.4)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        marginBottom: '10px'
                      }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <item.icon size={24} color="white" strokeWidth={2.5} />
                        </div>
                        <h3 style={{
                          fontSize: '28px',
                          fontWeight: '700',
                          color: '#fff',
                          margin: 0,
                          lineHeight: '1'
                        }}>
                          {item.title}
                        </h3>
                      </div>
                      <p style={{
                        fontSize: '22px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        margin: '0 0 0 56px',
                        lineHeight: '1.3'
                      }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Bottom signature */}
                <p style={{
                  textAlign: 'center',
                  marginTop: '30px',
                  fontSize: '24px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: '600'
                }}>
                  Kersten • MY ARC Personal Training
                </p>
              </div>
            </>
          )}

          {/* SLIDE 3: Results */}
          {currentSlide === 2 && (
            <>
              {/* Background for slide 3 - Different URL, no opacity */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'url(https://cdn.shopify.com/s/files/1/0862/1237/8954/files/Scherm_afbeelding_2025-09-20_om_17.22.10.png?v=1758381754)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }} />

              <div style={{
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '65px 55px',
                animation: 'slideIn 0.3s ease'
              }}>
                {/* Title Only */}
                <h1 style={{
                  fontSize: '70px',
                  fontWeight: '900',
                  lineHeight: '1',
                  color: '#fff',
                  letterSpacing: '-2px',
                  textAlign: 'center',
                  textShadow: '0 4px 12px rgba(0, 0, 0, 0.8)'
                }}>
                  Echte Resultaten
                  <span style={{
                    display: 'block',
                    fontSize: '66px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginTop: '10px'
                  }}>
                    5.1kg in 5 weken
                  </span>
                  <span style={{
                    display: 'block',
                    fontSize: '54px',
                    color: 'rgba(255,255,255,0.9)',
                    marginTop: '10px'
                  }}>
                    + meer spieren
                  </span>
                </h1>

                {/* Bottom signature */}
                <div style={{
                  marginTop: 'auto',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '24px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: '600',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
                  }}>
                    Kersten • MY ARC Personal Training
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <style>{`
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(50px); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
