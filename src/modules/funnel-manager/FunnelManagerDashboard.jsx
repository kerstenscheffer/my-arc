import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Eye, 
  Copy, 
  QrCode, 
  Plus, 
  Settings, 
  Users, 
  TrendingUp,
  ExternalLink,
  Share2,
  Edit3,
  MoreVertical,
  Monitor,
  Smartphone,
  RefreshCw
} from 'lucide-react';
import StatsOverview from './components/StatsOverview';
import FunnelCard from './components/FunnelCard';
import QuickActions from './components/QuickActions';
import CreateFunnelModal from './components/CreateFunnelModal';
import EditFunnelModal from './components/EditFunnelModal';

export default function FunnelManagerDashboard({ db }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFunnel, setEditingFunnel] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalConversions: 0,
    totalRevenue: 0,
    avgConversionRate: 0,
    activeFunnels: 0,
    totalFunnels: 0
  });
  const [funnels, setFunnels] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load all dashboard data from database
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user (coach)
      const user = await db.getCurrentUser();
      if (!user) {
        setError('Niet ingelogd');
        return;
      }

      // Load funnels via FunnelService
      const funnelsData = await db.getFunnels(user.id);
      console.log('✅ Funnels loaded:', funnelsData.length);
      setFunnels(funnelsData);

      // Load stats via FunnelService
      const statsData = await db.getFunnelStats(user.id);
      console.log('✅ Stats loaded:', statsData);
      setStats(statsData);

    } catch (err) {
      console.error('❌ Dashboard load failed:', err);
      setError('Fout bij laden van dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
      console.log('✅ Dashboard refreshed');
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePreview = (funnelId) => {
    const funnel = funnels.find(f => f.id === funnelId);
    if (funnel) {
      window.open(`https://${funnel.url}`, '_blank');
    }
  };

  const handleCopy = (funnelId) => {
    const funnel = funnels.find(f => f.id === funnelId);
    if (funnel) {
      navigator.clipboard.writeText(`https://${funnel.url}`);
      alert('URL gekopieerd naar clipboard!');
    }
  };

  const handleQRCode = (funnelId) => {
    const funnel = funnels.find(f => f.id === funnelId);
    if (funnel) {
      alert(`QR code gegenereerd voor: ${funnel.name}`);
    }
  };

  const handleEdit = (funnelId) => {
    const funnel = funnels.find(f => f.id === funnelId);
    if (funnel) {
      setEditingFunnel(funnel);
      setShowEditModal(true);
    }
  };

  const handleSaveFunnel = async (funnelId, updates) => {
    try {
      // Update in database
      await db.updateFunnel(funnelId, updates);
      
      // Update local state
      setFunnels(prev => prev.map(f => 
        f.id === funnelId ? { ...f, ...updates } : f
      ));
      
      console.log('✅ Funnel saved to database:', funnelId);
    } catch (error) {
      console.error('❌ Save funnel failed:', error);
      throw error;
    }
  };

  const handleDelete = async (funnelId) => {
    const confirmed = window.confirm('Weet je zeker dat je deze funnel wilt verwijderen?');
    if (confirmed) {
      try {
        // Delete from database
        await db.deleteFunnel(funnelId);
        
        // Update local state
        setFunnels(prev => prev.filter(f => f.id !== funnelId));
        
        console.log('✅ Funnel deleted from database:', funnelId);
        
        // Refresh stats
        const user = await db.getCurrentUser();
        const newStats = await db.getFunnelStats(user.id);
        setStats(newStats);
        
      } catch (error) {
        console.error('❌ Delete funnel failed:', error);
        alert('Fout bij verwijderen van funnel');
      }
    }
  };

  const handleStatusChange = async (funnelId, newStatus) => {
    try {
      // Update in database
      await db.updateFunnel(funnelId, { status: newStatus });
      
      // Update local state
      setFunnels(prev => prev.map(f => 
        f.id === funnelId ? { ...f, status: newStatus } : f
      ));
      
      console.log('✅ Status changed in database:', funnelId, newStatus);
      
      // Refresh stats
      const user = await db.getCurrentUser();
      const newStats = await db.getFunnelStats(user.id);
      setStats(newStats);
      
    } catch (error) {
      console.error('❌ Status change failed:', error);
      alert('Fout bij wijzigen status');
    }
  };

  const handleCreateFunnel = async (funnelData) => {
    try {
      // Get current user
      const user = await db.getCurrentUser();
      if (!user) {
        alert('Niet ingelogd');
        return;
      }

      // Create in database
      const newFunnel = await db.createFunnel(user.id, funnelData);
      console.log('✅ Funnel created in database:', newFunnel);
      
      // Add to local state
      setFunnels(prev => [...prev, newFunnel]);
      setShowCreateModal(false);
      
      // Refresh stats
      const newStats = await db.getFunnelStats(user.id);
      setStats(newStats);
      
    } catch (error) {
      console.error('❌ Create funnel failed:', error);
      alert('Fout bij aanmaken funnel: ' + error.message);
    }
  };

  // Quick Actions handlers
  const handleAnalyticsDashboard = () => {
    console.log('Opening analytics dashboard...');
  };

  const handleBulkShare = () => {
    console.log('Bulk sharing...');
  };

  const handleMobilePreview = () => {
    console.log('Mobile preview...');
  };

  const handleTemplateEditor = () => {
    console.log('Template editor...');
  };

  const handleExportData = () => {
    console.log('Exporting data...');
  };

  const handlePerformanceCheck = () => {
    console.log('Performance check...');
  };

  if (error) {
    return (
      <div style={{
        background: '#111',
        borderRadius: '20px',
        padding: isMobile ? '1.5rem' : '2rem',
        color: '#fff',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem'
        }}>
          ⚠️
        </div>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          marginBottom: '0.5rem',
          color: '#ef4444'
        }}>
          {error}
        </h2>
        <button
          onClick={loadDashboardData}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '0.75rem 1.5rem',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '1rem',
            touchAction: 'manipulation'
          }}
        >
          Opnieuw Proberen
        </button>
      </div>
    );
  }

  return (
    <div style={{
      background: '#111',
      borderRadius: '20px',
      padding: isMobile ? '1.5rem' : '2rem',
      color: '#fff',
      minHeight: '600px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            Funnel Manager
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: isMobile ? '0.9rem' : '1rem',
            margin: '0.5rem 0 0 0'
          }}>
            Beheer en monitor je verkoop funnels
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              padding: isMobile ? '0.5rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.8)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '44px',
              minWidth: '44px',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!refreshing) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onTouchStart={(e) => {
              if (isMobile && !refreshing) {
                e.currentTarget.style.transform = 'scale(0.98)';
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <RefreshCw 
              size={isMobile ? 16 : 18} 
              style={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none'
              }}
            />
          </button>

          <button 
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: isMobile ? '0.9rem' : '1rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.3s ease',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.98)';
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <Plus size={isMobile ? 16 : 18} />
            {isMobile ? 'Nieuw' : 'Nieuwe Funnel'}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview 
        stats={stats} 
        loading={loading} 
        isMobile={isMobile} 
      />

      {/* Funnels Grid */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: isMobile ? '1rem' : '1.5rem',
          marginBottom: '2rem'
        }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(17, 17, 17, 0.5)',
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                height: '300px',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{
                width: '70%',
                height: '20px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              <div style={{
                width: '100%',
                height: '40px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              <div style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
            </div>
          ))}
        </div>
      ) : funnels.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '3rem 1rem' : '4rem 2rem',
          background: 'rgba(17, 17, 17, 0.3)',
          borderRadius: '16px',
          border: '2px dashed rgba(255, 255, 255, 0.2)',
          marginBottom: '2rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <Plus size={32} color="#10b981" />
          </div>
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '1rem'
          }}>
            Geen funnels gevonden
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '2rem',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            Maak je eerste funnel om te beginnen met verkopen
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem 2rem',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              margin: '0 auto',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            <Plus size={18} />
            Maak Je Eerste Funnel
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: isMobile ? '1rem' : '1.5rem',
          marginBottom: '2rem'
        }}>
          {funnels.map((funnel) => (
            <FunnelCard
              key={funnel.id}
              funnel={funnel}
              isMobile={isMobile}
              onPreview={handlePreview}
              onCopy={handleCopy}
              onQRCode={handleQRCode}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions
        isMobile={isMobile}
        onAnalyticsDashboard={handleAnalyticsDashboard}
        onBulkShare={handleBulkShare}
        onMobilePreview={handleMobilePreview}
        onTemplateEditor={handleTemplateEditor}
        onExportData={handleExportData}
        onPerformanceCheck={handlePerformanceCheck}
      />

      {/* Create Funnel Modal */}
      <CreateFunnelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateFunnel}
        isMobile={isMobile}
      />

      {/* Edit Funnel Modal */}
      <EditFunnelModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingFunnel(null);
        }}
        onSave={handleSaveFunnel}
        funnel={editingFunnel}
        isMobile={isMobile}
      />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
