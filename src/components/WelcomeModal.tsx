import { useEffect } from 'react';
import { X, MapPin, Navigation, Compass, Route, Music2, Share2, Footprints } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Section component for consistent styling
function Section({
  icon,
  iconBg,
  title,
  description,
  children
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass-light" style={{
      padding: '20px',
      borderRadius: 'var(--radius-xl)',
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            marginBottom: '6px',
            color: 'var(--color-text)'
          }}>
            {title}
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'var(--color-text-muted)',
            lineHeight: 1.5,
            margin: 0
          }}>
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

// Mode card for the Three Ways section
function ModeCard({
  icon,
  color,
  title,
  description
}: {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
}) {
  return (
    <div style={{
      flex: 1,
      minWidth: '140px',
      padding: '14px',
      borderRadius: 'var(--radius-lg)',
      background: `${color}10`,
      border: `1px solid ${color}30`,
      textAlign: 'center'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 10px',
        color: color
      }}>
        {icon}
      </div>
      <h4 style={{
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--color-text)',
        marginBottom: '4px'
      }}>
        {title}
      </h4>
      <p style={{
        fontSize: '11px',
        color: 'var(--color-text-muted)',
        lineHeight: 1.4,
        margin: 0
      }}>
        {description}
      </p>
    </div>
  );
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.9)'
        }}
      />

      {/* Modal Container */}
      <div
        className="animate-scale-in"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          margin: '16px',
          background: 'var(--color-dark-card)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            e.currentTarget.style.color = 'var(--color-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = 'var(--color-text-muted)';
          }}
        >
          <X size={20} />
        </button>

        {/* Scrollable content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 24px'
        }}>
          {/* Hero Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            {/* Logo */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: 'var(--shadow-glow-primary)'
            }}>
              <Music2 size={36} color="white" />
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: '28px',
              fontWeight: 700,
              marginBottom: '8px',
              background: 'linear-gradient(135deg, var(--color-text), var(--color-primary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Welcome to SoundScape
            </h1>

            {/* Tagline */}
            <p style={{
              fontSize: '16px',
              color: 'var(--color-text-muted)',
              maxWidth: '340px',
              margin: '0 auto',
              lineHeight: 1.5
            }}>
              Discover songs connected to real-world locations. Explore the soundtrack of the world around you.
            </p>
          </div>

          {/* Section 1: Music on the Map */}
          <Section
            icon={<MapPin size={24} color="white" />}
            iconBg="var(--gradient-primary)"
            title="Music on the Map"
            description="Every pin on the map represents a song tied to that location. Tap a marker to listen and discover the story behind it."
          >
            {/* Layered screenshot showcase */}
            <div style={{
              marginTop: '20px',
              perspective: '1000px',
              position: 'relative',
              height: '280px',
              overflow: 'visible'
            }}>
              {/* Ambient glow */}
              <div style={{
                position: 'absolute',
                top: '20%',
                left: '10%',
                right: '10%',
                bottom: '10%',
                background: 'radial-gradient(ellipse at 40% 50%, rgba(16, 185, 129, 0.2) 0%, transparent 60%)',
                filter: 'blur(30px)',
                pointerEvents: 'none'
              }} />

              {/* Back card: Map view — tilted left */}
              <div style={{
                position: 'absolute',
                left: '0',
                top: '10px',
                width: '55%',
                transform: 'rotateY(8deg) rotateX(2deg) rotateZ(-1deg)',
                transformOrigin: 'left center',
                zIndex: 1
              }}>
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 16px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.08)'
                }}>
                  <img
                    src="/welcome-map.png"
                    alt="SoundScape map with song markers across London"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              </div>

              {/* Front card: Song detail — tilted right, overlapping */}
              <div style={{
                position: 'absolute',
                right: '0',
                top: '0',
                width: '58%',
                transform: 'rotateY(-6deg) rotateX(3deg) rotateZ(1deg)',
                transformOrigin: 'right center',
                zIndex: 2
              }}>
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(16, 185, 129, 0.1)'
                }}>
                  <img
                    src="/welcome-detail.png"
                    alt="Song detail view showing Come Together by The Beatles"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Section 2: Three Ways to Explore */}
          <Section
            icon={<Compass size={24} color="white" />}
            iconBg="linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)"
            title="Three Ways to Explore"
            description="Choose how you want to discover music based on your mood and location."
          >
            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '16px',
              flexWrap: 'wrap'
            }}>
              <ModeCard
                icon={<Navigation size={18} />}
                color="#10B981"
                title="Nearby"
                description="Songs around your current location"
              />
              <ModeCard
                icon={<Compass size={18} />}
                color="#8B5CF6"
                title="Explore"
                description="Search any place on the map"
              />
              <ModeCard
                icon={<Route size={18} />}
                color="#F59E0B"
                title="Trip"
                description="Songs along your route"
              />
            </div>
          </Section>

          {/* Section 3: Listen on Spotify */}
          <Section
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            }
            iconBg="linear-gradient(135deg, #1DB954 0%, #169c46 100%)"
            title="Play with Spotify"
            description="Tap any song to play it directly through Spotify. Premium users get full tracks; free users can preview."
          />

          {/* Section 4: Share Your Memories */}
          <Section
            icon={<Share2 size={24} color="white" />}
            iconBg="linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)"
            title="Share Your Music Memories"
            description="Got a song that reminds you of a place? Submit it to the map and share the story with others."
          />

          {/* Section 5: Navigate to Songs */}
          <Section
            icon={<Footprints size={24} color="white" />}
            iconBg="linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)"
            title="Navigate to Songs"
            description="Get walking directions to any song location. Experience the music where it belongs."
          />
        </div>

        {/* CTA Footer */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--glass-border)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px 24px',
              background: 'var(--gradient-primary)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 600,
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.4)';
            }}
          >
            <Compass size={20} />
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
}
