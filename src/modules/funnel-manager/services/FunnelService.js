// src/modules/funnel-manager/services/FunnelService.js
import DatabaseService from '../../../services/DatabaseService';

class FunnelService {
  constructor() {
    this.db = DatabaseService;
    // FIXED: Central URL configuration
    this.baseURL = 'workapp-5w5himg7l-myarc.vercel.app';
  }

  // Create new funnel
  async createFunnel(coachId, funnelData) {
    try {
      const slug = this.generateSlug(funnelData.name);
      
      const { data, error } = await this.db.supabase
        .from('funnels')
        .insert({
          coach_id: coachId,
          name: funnelData.name,
          slug: slug,
          html_content: funnelData.html_content || '',
          template_type: 'custom',
          status: 'draft',
          settings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add computed fields with FIXED URL
      const enrichedFunnel = {
        ...data,
        url: `${this.baseURL}/funnel/${data.slug}`,
        views: 0,
        conversions: 0,
        revenue: 0,
        conversionRate: 0,
        lastUpdated: new Date(data.updated_at).toLocaleString('nl-NL')
      };
      
      console.log('✅ Funnel created:', enrichedFunnel.name);
      return enrichedFunnel;
    } catch (error) {
      console.error('❌ Create funnel failed:', error);
      throw error;
    }
  }

  // Get all funnels for coach
  async getFunnels(coachId) {
    try {
      const { data, error } = await this.db.supabase
        .from('funnels')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add URL and metrics to each funnel with FIXED URL
      const funnelsWithMetrics = (data || []).map(funnel => ({
        ...funnel,
        url: `${this.baseURL}/funnel/${funnel.slug}`, // FIXED: Use new URL
        views: Math.floor(Math.random() * 1000), // Mock data for now
        conversions: Math.floor(Math.random() * 50),
        revenue: Math.floor(Math.random() * 50) * 497,
        conversionRate: (Math.random() * 10).toFixed(1),
        lastUpdated: new Date(funnel.updated_at).toLocaleString('nl-NL')
      }));

      console.log('✅ Funnels loaded:', funnelsWithMetrics.length);
      return funnelsWithMetrics;
    } catch (error) {
      console.error('❌ Get funnels failed:', error);
      return [];
    }
  }

  // Get funnel metrics
  async getFunnelMetrics(funnelId) {
    try {
      // Views
      const { data: viewsData, error: viewsError } = await this.db.supabase
        .from('funnel_analytics')
        .select('id')
        .eq('funnel_id', funnelId)
        .eq('event_type', 'view');

      if (viewsError) throw viewsError;

      // Conversions
      const { data: conversionsData, error: conversionsError } = await this.db.supabase
        .from('funnel_analytics')
        .select('id')
        .eq('funnel_id', funnelId)
        .eq('event_type', 'conversion');

      if (conversionsError) throw conversionsError;

      const views = viewsData?.length || 0;
      const conversions = conversionsData?.length || 0;
      const conversionRate = views > 0 ? ((conversions / views) * 100).toFixed(1) : 0;
      
      // Calculate revenue (€497 per conversion for 8-week challenge)
      const revenue = conversions * 497;

      return {
        views,
        conversions,
        conversionRate: parseFloat(conversionRate),
        revenue,
        lastUpdated: new Date().toLocaleString('nl-NL')
      };
    } catch (error) {
      console.error('❌ Get funnel metrics failed:', error);
      return {
        views: 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0,
        lastUpdated: 'Onbekend'
      };
    }
  }

  // Update funnel
  async updateFunnel(funnelId, updates) {
    try {
      const { data, error } = await this.db.supabase
        .from('funnels')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', funnelId)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Funnel updated:', data.name);
      return data;
    } catch (error) {
      console.error('❌ Update funnel failed:', error);
      throw error;
    }
  }

  // Delete funnel
  async deleteFunnel(funnelId) {
    try {
      // First delete analytics
      await this.db.supabase
        .from('funnel_analytics')
        .delete()
        .eq('funnel_id', funnelId);

      // Then delete funnel
      const { error } = await this.db.supabase
        .from('funnels')
        .delete()
        .eq('id', funnelId);

      if (error) throw error;
      
      console.log('✅ Funnel deleted');
      return true;
    } catch (error) {
      console.error('❌ Delete funnel failed:', error);
      throw error;
    }
  }

  // Track funnel analytics
  async trackEvent(funnelId, eventType, metadata = {}) {
    try {
      const { data, error } = await this.db.supabase
        .from('funnel_analytics')
        .insert({
          funnel_id: funnelId,
          event_type: eventType,
          metadata: metadata,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      console.log('✅ Event tracked:', eventType);
      return data;
    } catch (error) {
      console.error('❌ Track event failed:', error);
      // Don't throw - analytics shouldn't break the app
      return null;
    }
  }

  // Get overall stats for dashboard
  async getOverallStats(coachId) {
    try {
      const funnels = await this.getFunnels(coachId);
      
      const totalViews = funnels.reduce((sum, f) => sum + f.views, 0);
      const totalConversions = funnels.reduce((sum, f) => sum + f.conversions, 0);
      const totalRevenue = funnels.reduce((sum, f) => sum + f.revenue, 0);
      const avgConversionRate = totalViews > 0 ? 
        ((totalConversions / totalViews) * 100).toFixed(1) : 0;

      return {
        totalViews,
        totalConversions,
        totalRevenue,
        avgConversionRate: parseFloat(avgConversionRate),
        activeFunnels: funnels.filter(f => f.status === 'active').length,
        totalFunnels: funnels.length
      };
    } catch (error) {
      console.error('❌ Get overall stats failed:', error);
      return {
        totalViews: 0,
        totalConversions: 0,
        totalRevenue: 0,
        avgConversionRate: 0,
        activeFunnels: 0,
        totalFunnels: 0
      };
    }
  }

  // Utility methods
  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // FIXED: Updated generateURL method
  generateURL(slug) {
    return `${this.baseURL}/funnel/${slug}`;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(number) {
    return new Intl.NumberFormat('nl-NL').format(number);
  }

  getStatusColor(status) {
    switch (status) {
      case 'active': return '#10b981';
      case 'draft': return '#f59e0b';
      case 'paused': return '#ef4444';
      default: return '#6b7280';
    }
  }

  getStatusText(status) {
    switch (status) {
      case 'active': return 'Actief';
      case 'draft': return 'Concept';
      case 'paused': return 'Gepauzeerd';
      default: return 'Onbekend';
    }
  }

  // Generate QR Code with FIXED URL
  generateQRCode(url) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://${url}`)}`;
  }

  // Predefined funnel templates
  getFunnelTemplates() {
    return [
      {
        id: '8week-challenge',
        name: '8-Week Transformatie Challenge',
        description: 'Premium challenge met geld-terug garantie',
        price: 497,
        category: 'transformation'
      },
      {
        id: 'supplement-boost',
        name: 'TEST BOOST MAX Landing',
        description: 'Supplement verkoop funnel',
        price: 89,
        category: 'supplements'
      },
      {
        id: 'muscle-gain',
        name: 'Massa Opbouw Masterclass',
        description: 'Spieropbouw programma',
        price: 297,
        category: 'muscle-building'
      },
      {
        id: 'fat-loss',
        name: 'Vet Verlies Accelerator',
        description: 'Snel vetverlies programma',
        price: 197,
        category: 'fat-loss'
      }
    ];
  }
}

// Extend DatabaseService with funnel methods
DatabaseService.FunnelService = new FunnelService();

// Add convenience methods to DatabaseService
DatabaseService.getFunnels = async function(coachId) {
  return this.FunnelService.getFunnels(coachId);
};

DatabaseService.createFunnel = async function(coachId, funnelData) {
  return this.FunnelService.createFunnel(coachId, funnelData);
};

DatabaseService.updateFunnel = async function(funnelId, updates) {
  return this.FunnelService.updateFunnel(funnelId, updates);
};

DatabaseService.deleteFunnel = async function(funnelId) {
  return this.FunnelService.deleteFunnel(funnelId);
};

DatabaseService.trackFunnelEvent = async function(funnelId, eventType, metadata) {
  return this.FunnelService.trackEvent(funnelId, eventType, metadata);
};

DatabaseService.getFunnelStats = async function(coachId) {
  return this.FunnelService.getOverallStats(coachId);
};

export default FunnelService;
