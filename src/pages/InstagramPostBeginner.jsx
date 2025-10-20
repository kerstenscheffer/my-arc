import React from 'react';
import { 
  Target,
  TrendingUp,
  Dumbbell,
  Calendar,
  Users
} from 'lucide-react';

export default function InstagramPostBeginner() {
  const scale = 0.5;
  
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
        overflow: 'hidden'
      }}>
        <div style={{
          width: '1080px',
          height: '1350px',
          position: 'relative',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          overflow: 'hidden'
        }}>
          {/* Background Photo */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1080)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.85
          }} />

          {/* Dark overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.75) 100%)'
          }} />

          {/* Content */}
          <div style={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '60px 50px'
          }}>
            {/* Title */}
            <div style={{
              textAlign: 'center',
              marginBottom: '45px'
            }}>
              <h1 style={{
                fontSize: '68px',
                fontWeight: '900',
                lineHeight: '1',
                color: '#fff',
                marginBottom: '20px',
                letterSpacing: '-2px'
              }}>
                Als ik overnieuw
                <span style={{
                  display: 'block',
                  fontSize: '56px',
                  color: 'rgba(255,255,255,0.85)',
                  marginTop: '15px'
                }}>
                  moest beginnen
                </span>
                <span style={{
                  display: 'block',
                  fontSize: '62px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginTop: '10px'
                }}>
                  ZOU IK DIT DOEN
                </span>
              </h1>
              <p style={{
                fontSize: '26px',
                color: 'rgba(255,255,255,0.7)',
                marginTop: '20px'
              }}>
                5 dingen die jaren schelen
              </p>
            </div>

            {/* Tip 1 */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '24px',
              padding: '25px',
              marginBottom: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '20px'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '15px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Target size={28} color="white" strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '30px',
                    fontWeight: '700',
                    color: '#fff',
                    margin: '0 0 8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ 
                      fontSize: '34px',
                      color: '#10b981',
                      fontWeight: '800'
                    }}>1.</span>
                    Track alles 30 dagen
                  </h3>
                  <p style={{
                    fontSize: '22px',
                    color: 'rgba(255,255,255,0.8)',
                    lineHeight: '1.3',
                    margin: 0
                  }}>
                    Data > gevoel. Je schrikt ervan.
                  </p>
                </div>
              </div>
            </div>

            {/* Tip 2 */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '24px',
              padding: '25px',
              marginBottom: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '20px'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '15px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Dumbbell size={28} color="white" strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '30px',
                    fontWeight: '700',
                    color: '#fff',
                    margin: '0 0 8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ 
                      fontSize: '34px',
                      color: '#10b981',
                      fontWeight: '800'
                    }}>2.</span>
                    3x kracht, skip cardio
                  </h3>
                  <p style={{
                    fontSize: '22px',
                    color: 'rgba(255,255,255,0.8)',
                    lineHeight: '1.3',
                    margin: 0
                  }}>
                    Spieren = 24/7 vetverbranding.
                  </p>
                </div>
              </div>
            </div>

            {/* Tip 3 */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '24px',
              padding: '25px',
              marginBottom: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '20px'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '15px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <TrendingUp size={28} color="white" strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '30px',
                    fontWeight: '700',
                    color: '#fff',
                    margin: '0 0 8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ 
                      fontSize: '34px',
                      color: '#10b981',
                      fontWeight: '800'
                    }}>3.</span>
                    30g eiwit per maaltijd
                  </h3>
                  <p style={{
                    fontSize: '22px',
                    color: 'rgba(255,255,255,0.8)',
                    lineHeight: '1.3',
                    margin: 0
                  }}>
                    Elke keer. Niet inhalen.
                  </p>
                </div>
              </div>
            </div>

            {/* Tip 4 */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '24px',
              padding: '25px',
              marginBottom: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '20px'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '15px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Calendar size={28} color="white" strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '30px',
                    fontWeight: '700',
                    color: '#fff',
                    margin: '0 0 8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ 
                      fontSize: '34px',
                      color: '#10b981',
                      fontWeight: '800'
                    }}>4.</span>
                    Weekend = doorpakken
                  </h3>
                  <p style={{
                    fontSize: '22px',
                    color: 'rgba(255,255,255,0.8)',
                    lineHeight: '1.3',
                    margin: 0
                  }}>
                    80/20 regel. Heel de week.
                  </p>
                </div>
              </div>
            </div>

            {/* Tip 5 */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '24px',
              padding: '25px',
              marginBottom: '30px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '20px'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '15px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Users size={28} color="white" strokeWidth={2.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '30px',
                    fontWeight: '700',
                    color: '#fff',
                    margin: '0 0 8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ 
                      fontSize: '34px',
                      color: '#10b981',
                      fontWeight: '800'
                    }}>5.</span>
                    Coach vanaf dag 1
                  </h3>
                  <p style={{
                    fontSize: '22px',
                    color: 'rgba(255,255,255,0.8)',
                    lineHeight: '1.3',
                    margin: 0
                  }}>
                    3 jaar zelf = 1 jaar met hulp.
                  </p>
                </div>
              </div>
            </div>

            {/* Result Promise */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              borderRadius: '24px',
              padding: '30px',
              marginTop: 'auto',
              backdropFilter: 'blur(10px)',
              textAlign: 'center',
              border: '2px solid rgba(16, 185, 129, 0.2)'
            }}>
              <p style={{
                fontSize: '28px',
                color: '#fff',
                fontWeight: '600',
                margin: '0 0 10px 0'
              }}>
                Mijn grootste fout?
              </p>
              <p style={{
                fontSize: '36px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0
              }}>
                €1000+ aan nutteloze supps
              </p>
              <p style={{
                fontSize: '22px',
                color: 'rgba(255,255,255,0.7)',
                marginTop: '12px'
              }}>
                Had ik maar direct deze basics gedaan.
              </p>
            </div>

            {/* CTA */}
            <p style={{
              textAlign: 'center',
              marginTop: '25px',
              fontSize: '24px',
              color: 'rgba(255,255,255,0.7)',
              fontWeight: '500'
            }}>
              Save dit & begin met punt 1
            </p>
            
            {/* Signature */}
            <p style={{
              textAlign: 'center',
              marginTop: '15px',
              fontSize: '22px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '500'
            }}>
              Kersten • MY ARC Personal Training
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
