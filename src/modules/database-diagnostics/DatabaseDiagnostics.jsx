import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Database, Shield, Table, Wrench } from 'lucide-react';

export default function DatabaseDiagnostics({ db, clients, currentUser }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [fixing, setFixing] = useState(false);
  const [isMobile] = useState(window.innerWidth <= 768);
  
  // Diagnostic checks configuration
  const diagnosticChecks = [
    {
      id: 'auth',
      name: 'Authentication Status',
      description: 'Check if user is properly authenticated',
      test: async () => {
        try {
          const user = await db.getCurrentUser();
          return {
            success: !!user,
            message: user ? `Authenticated as: ${user.email}` : 'Not authenticated',
            data: user
          };
        } catch (error) {
          return { success: false, message: error.message };
        }
      }
    },
    {
      id: 'client_data',
      name: 'Client Data Access',
      description: 'Verify client record exists and is accessible',
      test: async () => {
        try {
          const user = await db.getCurrentUser();
          if (!user) return { success: false, message: 'Not authenticated' };
          
          const client = await db.getClientByEmail(user.email);
          return {
            success: !!client,
            message: client ? `Client found: ${client.first_name} ${client.last_name}` : 'No client record found',
            data: client
          };
        } catch (error) {
          return { success: false, message: error.message };
        }
      }
    },
    {
      id: 'workout_completions',
      name: 'Workout Completions Table',
      description: 'Check workout_completions table access (406 error source)',
      test: async () => {
        try {
          const user = await db.getCurrentUser();
          const client = await db.getClientByEmail(user.email);
          if (!client) return { success: false, message: 'Client not found' };
          
          // Test direct query
          const { data, error } = await db.supabase
            .from('workout_completions')
            .select('*')
            .eq('client_id', client.id)
            .limit(1);
          
          if (error) {
            return { 
              success: false, 
              message: `Table error: ${error.message}`,
              fix: 'rls_workout_completions'
            };
          }
          
          return {
            success: true,
            message: 'Table accessible',
            data: data
          };
        } catch (error) {
          return { 
            success: false, 
            message: error.message,
            fix: 'rls_workout_completions'
          };
        }
      }
    },
    {
      id: 'meal_progress',
      name: 'Meal Progress Table',
      description: 'Check meal_progress table access (406 error source)',
      test: async () => {
        try {
          const user = await db.getCurrentUser();
          const client = await db.getClientByEmail(user.email);
          if (!client) return { success: false, message: 'Client not found' };
          
          const { data, error } = await db.supabase
            .from('meal_progress')
            .select('*')
            .eq('client_id', client.id)
            .limit(1);
          
          if (error) {
            return { 
              success: false, 
              message: `Table error: ${error.message}`,
              fix: 'rls_meal_progress'
            };
          }
          
          return {
            success: true,
            message: 'Table accessible',
            data: data
          };
        } catch (error) {
          return { 
            success: false, 
            message: error.message,
            fix: 'rls_meal_progress'
          };
        }
      }
    },
    {
      id: 'water_tracking',
      name: 'Water Tracking Tables',
      description: 'Check both water tracking table versions',
      test: async () => {
        try {
          const user = await db.getCurrentUser();
          const client = await db.getClientByEmail(user.email);
          if (!client) return { success: false, message: 'Client not found' };
          
          // Test water_tracking table
          const { data: data1, error: error1 } = await db.supabase
            .from('water_tracking')
            .select('*')
            .eq('client_id', client.id)
            .limit(1);
          
          // Test water_intake table
          const { data: data2, error: error2 } = await db.supabase
            .from('water_intake')
            .select('*')
            .eq('client_id', client.id)
            .limit(1);
          
          const issues = [];
          if (error1) issues.push(`water_tracking: ${error1.message}`);
          if (error2) issues.push(`water_intake: ${error2.message}`);
          
          return {
            success: issues.length === 0,
            message: issues.length > 0 ? issues.join(', ') : 'Both tables accessible',
            fix: issues.length > 0 ? 'rls_water_tables' : null
          };
        } catch (error) {
          return { 
            success: false, 
            message: error.message,
            fix: 'rls_water_tables'
          };
        }
      }
    },
    {
      id: 'rls_policies',
      name: 'RLS Policy Check',
      description: 'Verify Row Level Security policies are correctly configured',
      test: async () => {
        try {
          const user = await db.getCurrentUser();
          if (!user) return { success: false, message: 'Not authenticated' };
          
          // Check if user has any RLS issues
          const tables = ['clients', 'workout_completions', 'meal_progress', 'water_tracking'];
          const issues = [];
          
          for (const table of tables) {
            try {
              const { error } = await db.supabase
                .from(table)
                .select('count')
                .limit(1)
                .single();
              
              if (error && error.code === 'PGRST116') {
                issues.push(`${table}: RLS policy missing or incorrect`);
              }
            } catch (e) {
              // Expected for some tables
            }
          }
          
          return {
            success: issues.length === 0,
            message: issues.length > 0 ? issues.join(', ') : 'All RLS policies OK',
            fix: issues.length > 0 ? 'fix_rls_all' : null
          };
        } catch (error) {
          return { success: false, message: error.message };
        }
      }
    }
  ];
  
  // Run all diagnostics
  const runDiagnostics = async () => {
    setLoading(true);
    setResults([]);
    
    const newResults = [];
    for (const check of diagnosticChecks) {
      const result = await check.test();
      newResults.push({
        ...check,
        ...result
      });
    }
    
    setResults(newResults);
    setLoading(false);
  };
  
  // Fix functions for common issues
  const fixes = {
    rls_workout_completions: async () => {
      // This would normally run SQL to fix RLS, but we'll provide instructions
      return {
        success: false,
        message: 'Manual fix required in Supabase dashboard',
        sql: `
-- Run this in Supabase SQL editor:
CREATE POLICY "Clients can view own workout completions" 
ON workout_completions FOR SELECT 
USING (auth.uid()::text = client_id::text OR auth.uid() IN (
  SELECT trainer_id FROM clients WHERE id = workout_completions.client_id
));
        `
      };
    },
    rls_meal_progress: async () => {
      return {
        success: false,
        message: 'Manual fix required in Supabase dashboard',
        sql: `
-- Run this in Supabase SQL editor:
CREATE POLICY "Clients can view own meal progress" 
ON meal_progress FOR SELECT 
USING (auth.uid()::text = client_id::text OR auth.uid() IN (
  SELECT trainer_id FROM clients WHERE id = meal_progress.client_id
));
        `
      };
    },
    rls_water_tables: async () => {
      return {
        success: false,
        message: 'Manual fix required in Supabase dashboard',
        sql: `
-- Run this in Supabase SQL editor:
-- For water_tracking table
CREATE POLICY "Clients can view own water tracking" 
ON water_tracking FOR ALL 
USING (auth.uid()::text = client_id::text);

-- For water_intake table  
CREATE POLICY "Clients can view own water intake" 
ON water_intake FOR ALL 
USING (auth.uid()::text = client_id::text);
        `
      };
    },
    fix_rls_all: async () => {
      return {
        success: false,
        message: 'Multiple RLS policies need fixing',
        sql: `
-- Check and enable RLS on all tables:
ALTER TABLE workout_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_intake ENABLE ROW LEVEL SECURITY;
        `
      };
    }
  };
  
  // Apply fix
  const applyFix = async (fixId) => {
    setFixing(true);
    try {
      const fix = fixes[fixId];
      if (fix) {
        const result = await fix();
        alert(result.sql ? `SQL to run:\n${result.sql}` : result.message);
      }
    } catch (error) {
      alert(`Fix failed: ${error.message}`);
    } finally {
      setFixing(false);
      // Re-run diagnostics after fix attempt
      runDiagnostics();
    }
  };
  
  // Run diagnostics on mount
  useEffect(() => {
    runDiagnostics();
  }, []);
  
  return (
    <div style={{
      padding: isMobile ? '1rem' : '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '16px',
        padding: isMobile ? '1.5rem' : '2rem',
        marginBottom: '2rem',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <Database size={isMobile ? 24 : 32} color="#10b981" />
          <h1 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0
          }}>
            Database Diagnostics
          </h1>
        </div>
        
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: isMobile ? '0.9rem' : '1rem',
          marginBottom: '1.5rem'
        }}>
          Identifying and fixing 406 errors and permission issues
        </p>
        
        <button
          onClick={runDiagnostics}
          disabled={loading}
          style={{
            padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
            background: loading 
              ? 'rgba(16, 185, 129, 0.3)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
        >
          <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </button>
      </div>
      
      {/* Results */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {results.map((result, index) => (
          <div
            key={result.id}
            style={{
              background: 'rgba(17, 17, 17, 0.8)',
              borderRadius: '12px',
              padding: isMobile ? '1rem' : '1.5rem',
              border: `1px solid ${
                result.success 
                  ? 'rgba(16, 185, 129, 0.3)' 
                  : 'rgba(239, 68, 68, 0.3)'
              }`,
              animation: `slideIn 0.3s ease ${index * 0.1}s both`
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              {/* Status Icon */}
              <div style={{
                marginTop: '0.25rem',
                flexShrink: 0
              }}>
                {loading ? (
                  <RefreshCw size={20} color="#fbbf24" className="spinning" />
                ) : result.success ? (
                  <CheckCircle size={20} color="#10b981" />
                ) : (
                  <XCircle size={20} color="#ef4444" />
                )}
              </div>
              
              {/* Content */}
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: '600',
                  color: '#fff',
                  margin: '0 0 0.25rem 0'
                }}>
                  {result.name}
                </h3>
                
                <p style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: '0 0 0.5rem 0'
                }}>
                  {result.description}
                </p>
                
                <div style={{
                  padding: '0.75rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  color: result.success ? '#10b981' : '#ef4444',
                  fontFamily: 'monospace',
                  wordBreak: 'break-word'
                }}>
                  {result.message}
                </div>
                
                {/* Fix Button */}
                {result.fix && !result.success && (
                  <button
                    onClick={() => applyFix(result.fix)}
                    disabled={fixing}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      fontWeight: '600',
                      cursor: fixing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s ease',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '36px'
                    }}
                  >
                    <Wrench size={16} />
                    {fixing ? 'Applying Fix...' : 'Show Fix Instructions'}
                  </button>
                )}
                
                {/* Data Preview */}
                {result.data && result.success && (
                  <details style={{ marginTop: '0.75rem' }}>
                    <summary style={{
                      cursor: 'pointer',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      userSelect: 'none'
                    }}>
                      View Data
                    </summary>
                    <pre style={{
                      marginTop: '0.5rem',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.5)',
                      borderRadius: '8px',
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      color: 'rgba(255, 255, 255, 0.8)',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Summary */}
      {results.length > 0 && (
        <div style={{
          marginTop: '2rem',
          padding: isMobile ? '1rem' : '1.5rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          borderRadius: '12px',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '600',
            color: '#10b981',
            marginBottom: '0.5rem'
          }}>
            Diagnostic Summary
          </h3>
          <div style={{
            display: 'flex',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            <div>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Total Checks: </span>
              <span style={{ color: '#fff', fontWeight: '600' }}>{results.length}</span>
            </div>
            <div>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Passed: </span>
              <span style={{ color: '#10b981', fontWeight: '600' }}>
                {results.filter(r => r.success).length}
              </span>
            </div>
            <div>
              <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Failed: </span>
              <span style={{ color: '#ef4444', fontWeight: '600' }}>
                {results.filter(r => !r.success).length}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* CSS for animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .spinning {
          animation: spin 1s linear infinite;
        }
        
        details summary::-webkit-details-marker {
          display: none;
        }
        
        details summary::before {
          content: '▶';
          display: inline-block;
          margin-right: 0.5rem;
          transition: transform 0.2s;
        }
        
        details[open] summary::before {
          transform: rotate(90deg);
        }
      `}</style>
    </div>
  );
}
