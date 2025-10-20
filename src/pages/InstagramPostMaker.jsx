import React from 'react';

export default function InstagramPostMaker() {
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
          {/* Background Photo - Black & White */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://cdn.shopify.com/s/files/1/0862/1237/8954/files/3_principes_1.png?v=1758729595)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'grayscale(100%) contrast(1.2)'
          }} />

          {/* Dark overlay for text readability */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.85) 100%)'
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
              marginBottom: '50px'
            }}>
              <h1 style={{
                fontSize: '90px',
                fontWeight: '900',
                lineHeight: '0.9',
                color: '#fff',
                letterSpacing: '-3px',
                marginBottom: '20px'
              }}>
                NEUS-
                <span style={{
                  display: 'block'
                }}>
                  BLOEDER
                </span>
              </h1>
              <p style={{
                fontSize: '28px',
                color: 'rgba(255,255,255,0.6)',
                fontWeight: '300',
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}>
                Professional in doen alsof
              </p>
            </div>

            {/* Main content blocks */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '35px'
            }}>
              {/* Block 1 */}
              <div style={{
                borderLeft: '3px solid rgba(255,255,255,0.2)',
                paddingLeft: '30px'
              }}>
                <p style={{
                  fontSize: '32px',
                  color: '#fff',
                  fontWeight: '600',
                  lineHeight: '1.3',
                  marginBottom: '15px'
                }}>
                  Je weet dat je je problemen verdooft
                </p>
                <p style={{
                  fontSize: '24px',
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: '1.3'
                }}>
                  Scrollen. Drinken. Netflix. Wegkijken.
                </p>
              </div>

              {/* Block 2 */}
              <div style={{
                borderLeft: '3px solid rgba(255,255,255,0.2)',
                paddingLeft: '30px'
              }}>
                <p style={{
                  fontSize: '32px',
                  color: '#fff',
                  fontWeight: '600',
                  lineHeight: '1.3',
                  marginBottom: '15px'
                }}>
                  Je voelt dat je tekort schiet
                </p>
                <p style={{
                  fontSize: '24px',
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: '1.3'
                }}>
                  Tegen jezelf. Familie. Vrienden. Potentieel.
                </p>
              </div>

              {/* Block 3 */}
              <div style={{
                borderLeft: '3px solid rgba(255,255,255,0.2)',
                paddingLeft: '30px'
              }}>
                <p style={{
                  fontSize: '32px',
                  color: '#fff',
                  fontWeight: '600',
                  lineHeight: '1.3',
                  marginBottom: '15px'
                }}>
                  Je merkt dat het leven voorbij vliegt
                </p>
                <p style={{
                  fontSize: '24px',
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: '1.3'
                }}>
                  Zonder iets merkwaardigs gedaan te hebben.
                </p>
              </div>

              {/* Central message */}
              <div style={{
                textAlign: 'center',
                margin: '40px 0',
                padding: '40px 30px',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(10px)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <p style={{
                  fontSize: '42px',
                  fontWeight: '700',
                  color: '#fff',
                  lineHeight: '1.2',
                  marginBottom: '20px'
                }}>
                  Maar je doet alsof je neus bloedt
                </p>
                <p style={{
                  fontSize: '26px',
                  color: 'rgba(255,255,255,0.4)',
                  fontStyle: 'italic'
                }}>
                  Alsof er geen vuiltje aan de lucht is
                </p>
              </div>

              {/* Truth bomb */}
              <div style={{
                textAlign: 'center',
                marginTop: 'auto'
              }}>
                <p style={{
                  fontSize: '30px',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '15px'
                }}>
                  Er is één iemand die je niet voor de gek houdt
                </p>
                <p style={{
                  fontSize: '54px',
                  fontWeight: '800',
                  color: '#fff',
                  letterSpacing: '-1px',
                  marginBottom: '30px'
                }}>
                  JEZELF
                </p>
                
                <div style={{
                  width: '60px',
                  height: '2px',
                  background: 'rgba(255,255,255,0.3)',
                  margin: '30px auto'
                }} />

                <p style={{
                  fontSize: '28px',
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: '500'
                }}>
                  Hoeveel tijd laat jij voorbij glippen?
                </p>
              </div>
            </div>

            {/* Bottom signature */}
            <p style={{
              textAlign: 'center',
              marginTop: '40px',
              fontSize: '22px',
              color: 'rgba(255, 255, 255, 0.4)',
              fontWeight: '500',
              letterSpacing: '1px'
            }}>
              KERSTEN • MY ARC
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
