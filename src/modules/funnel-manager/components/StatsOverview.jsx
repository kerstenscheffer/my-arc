import React from 'react';
import { Eye, Users, TrendingUp, BarChart3 } from 'lucide-react';

export default function StatsOverview({ stats, loading, isMobile }) {
  const statCards = [
    {
      icon: Eye,
      label: 'Total Views',
      value: stats?.totalViews || 0,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.2)',
      formatter: (val) => val.toLocaleString('nl-NL')
    },
    {
      icon: Users,
      label: 'Conversies',
      value: stats?.totalConversions || 0,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.2)',
      formatter: (val) => val.toString()
    },
    {
      icon: TrendingUp,
      label: 'Conversie %',
      value: stats?.avgConversionRate || 0,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: 'rgba(245, 158, 11, 0.2)',
      formatter: (val) => `${val}%`
    },
    {
      icon: BarChart3,
      label: 'Revenue',
      value: stats?.totalRevenue || 0,
      color: '#a855f7',
      bgColor: 'rgba(168, 85, 247, 0.1)',
      borderColor: 'rgba(168, 85, 247, 0.2)',
      formatter: (val) => `€${(val / 1000).toFixed(1)}K`
    }
  ];

  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '1rem' : '1.5rem',
        marginBottom: '2rem'
      }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            style={{
              background: 'rgba(17, 17, 17, 0.5)',
              borderRadius: '12px',
              padding: isMobile ? '1rem' : '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{
              width: '100%',
              height: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
            <div style={{
              width: '60%',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: isMobile ? '1rem' : '1.5rem',
      marginBottom: '2rem'
    }}>
      {statCards.map((stat, index) => (
        <div
          key={index}
          style={{
            background: `linear-gradient(135deg, ${stat.bgColor} 0%, transparent 100%)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${stat.borderColor}`,
            borderRadius: '12px',
            padding: isMobile ? '1rem' : '1.5rem',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 10px 25px ${stat.color}20`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          {/* Animated background gradient */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: `linear-gradient(45deg, transparent, ${stat.color}15, transparent)`,
            animation: 'shimmer 3s infinite linear',
            pointerEvents: 'none'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            position: 'relative',
            zIndex: 1
          }}>
            <stat.icon size={isMobile ? 16 : 18} color={stat.color} />
            <span style={{ 
              fontSize: isMobile ? '0.8rem' : '0.85rem', 
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '500'
            }}>
              {stat.label}
            </span>
          </div>
          
          <div style={{ 
            fontSize: isMobile ? '1.5rem' : '2rem', 
            fontWeight: '800', 
            color: stat.color,
            position: 'relative',
            zIndex: 1,
            letterSpacing: '-0.02em'
          }}>
            {stat.formatter(stat.value)}
          </div>

          {/* Growth indicator (placeholder for future enhancement) */}
          {index === 0 && stats?.totalViews > 0 && (
            <div style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              padding: '0.25rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.7rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <TrendingUp size={10} />
              +12%
            </div>
          )}
        </div>
      ))}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
      `}</style>
    </div>
  );
}
