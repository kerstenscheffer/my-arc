// /src/modules/shopping/ShoppingHub.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { 
  ShoppingCart, TrendingDown, Package, MapPin, Clock, 
  Euro, AlertCircle, ChevronRight, Check, X, Plus,
  Sparkles, Receipt, Camera, Trophy, Filter, Calendar,
  BarChart3, PiggyBank, Truck, Store
} from 'lucide-react'

export default function ShoppingHub({ db, currentUser, clients }) {
  // State management
  const [activeView, setActiveView] = useState('generate') // generate, compare, history, insights
  const [selectedClient, setSelectedClient] = useState(null)
  const [selectedWeek, setSelectedWeek] = useState(0)
  const [shoppingList, setShoppingList] = useState(null)
  const [comparisons, setComparisons] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSupermarket, setSelectedSupermarket] = useState(null)
  const [bulkDeals, setBulkDeals] = useState([])
  const [seasonalInsights, setSeasonalInsights] = useState([])
  const [splitRoute, setSplitRoute] = useState(null)
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({
    totalSaved: 0,
    averageSavings: 0,
    favoriteStore: null,
    weeklyAverage: 0
  })

  // Load initial data
  useEffect(() => {
    if (clients?.length > 0 && !selectedClient) {
      setSelectedClient(clients[0])
    }
  }, [clients])

  // Generate shopping list
  const generateList = async () => {
    if (!selectedClient) return
    
    setLoading(true)
    try {
      const weekDate = new Date()
      weekDate.setDate(weekDate.getDate() + (selectedWeek * 7))
      
      const result = await db.shopping.generateShoppingList(
        selectedClient.id,
        weekDate
      )
      
      setShoppingList(result.list)
      setComparisons(result.comparisons)
      
      // Get additional insights
      const deals = await db.shopping.findBulkDeals(result.list.items)
      setBulkDeals(deals)
      
      // Analyze route optimization
      const route = await db.shopping.optimizeShoppingRoute(
        result.list.items,
        currentUser.location
      )
      setSplitRoute(route)
      
      // Get seasonal insights for top products
      const insights = []
      for (const item of result.list.items.slice(0, 5)) {
        const seasonal = await db.shopping.analyzeSeasonalPricing(item.product_id)
        if (seasonal) {
          insights.push({ product: item.product, ...seasonal })
        }
      }
      setSeasonalInsights(insights)
      
    } catch (error) {
      console.error('Failed to generate list:', error)
      alert('Kon boodschappenlijst niet genereren: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Load shopping history
  const loadHistory = async () => {
    if (!selectedClient) return
    
    try {
      const data = await db.shopping.getShoppingHistory(selectedClient.id)
      setHistory(data)
      
      // Calculate stats
      if (data.length > 0) {
        const totalSaved = data.reduce((sum, h) => sum + (h.savings || 0), 0)
        const avgSavings = totalSaved / data.length
        const weeklyTotal = data.reduce((sum, h) => sum + h.total_price, 0)
        const weeklyAvg = weeklyTotal / data.length
        
        // Find favorite store
        const storeCount = {}
        data.forEach(h => {
          storeCount[h.selected_supermarket_id] = (storeCount[h.selected_supermarket_id] || 0) + 1
        })
        const favoriteStore = Object.entries(storeCount)
          .sort(([,a], [,b]) => b - a)[0]?.[0]
        
        setStats({
          totalSaved,
          averageSavings: avgSavings,
          favoriteStore,
          weeklyAverage: weeklyAvg
        })
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    }
  }

  // Finalize shopping list
  const finalizeList = async () => {
    if (!shoppingList || !selectedSupermarket) return
    
    try {
      await db.shopping.updateShoppingList(shoppingList.id, {
        selected_supermarket_id: selectedSupermarket,
        status: 'finalized',
        total_price: comparisons.find(c => c.supermarket_id === selectedSupermarket)?.totalPrice
      })
      
      alert('✅ Boodschappenlijst is klaar!')
      setActiveView('history')
      loadHistory()
    } catch (error) {
      console.error('Failed to finalize:', error)
    }
  }

  // Report a price
  const reportPrice = async (productId, supermarketId, price) => {
    try {
      await db.shopping.reportPrice(
        currentUser.id,
        productId,
        supermarketId,
        price
      )
      alert('✅ Bedankt voor je prijsmelding! Je hebt 10 punten verdiend.')
    } catch (error) {
      console.error('Failed to report price:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ShoppingCart className="w-8 h-8" />
              Smart Shopping System
            </h1>
            <p className="mt-2 opacity-90">
              Automatische boodschappenlijsten met prijsvergelijking
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">€{stats.totalSaved.toFixed(2)}</p>
              <p className="text-sm opacity-75">Totaal bespaard</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">€{stats.weeklyAverage.toFixed(2)}</p>
              <p className="text-sm opacity-75">Gem. per week</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-6">
          {[
            { id: 'generate', label: 'Genereer Lijst', icon: Sparkles },
            { id: 'compare', label: 'Vergelijk Prijzen', icon: BarChart3 },
            { id: 'history', label: 'Geschiedenis', icon: Clock },
            { id: 'insights', label: 'Inzichten', icon: TrendingDown }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                activeView === tab.id
                  ? 'bg-white text-green-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client & Week Selector */}
      <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700">Client</label>
            <select
              value={selectedClient?.id || ''}
              onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value))}
              className="mt-1 w-full p-2 border rounded-lg"
            >
              {clients?.map(client => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700">Week</label>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="mt-1 w-full p-2 border rounded-lg"
            >
              <option value={0}>Deze week</option>
              <option value={1}>Volgende week</option>
              <option value={2}>Over 2 weken</option>
              <option value={3}>Over 3 weken</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateList}
              disabled={loading || !selectedClient}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>Bezig...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Genereer
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeView === 'generate' && shoppingList && (
        <div className="space-y-6">
          {/* Shopping List Items */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Boodschappenlijst ({shoppingList.items?.length || 0} items)
            </h2>
            
            <div className="space-y-3">
              {shoppingList.items?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.totalQuantity} {item.unit} 
                      {item.packages.length > 1 && ` (${item.packages.map(p => `${p.quantity}x ${p.size}${item.unit}`).join(' + ')})`}
                    </p>
                  </div>
                  
                  {item.minimumWaste > 0 && (
                    <div className="text-sm text-orange-600">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      {item.minimumWaste}{item.unit} overschot
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bulk Deals Alert */}
          {bulkDeals.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                <PiggyBank className="w-5 h-5" />
                Bulk Deals Gevonden!
              </h3>
              <div className="space-y-2">
                {bulkDeals.map((deal, idx) => (
                  <div key={idx} className="text-sm">
                    <p className="font-medium">{deal.product.name}</p>
                    <p className="text-yellow-800">{deal.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Route Optimization */}
          {splitRoute && splitRoute.recommendation === 'split' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Route Optimalisatie
              </h3>
              <p className="text-sm text-blue-800 mb-2">{splitRoute.reason}</p>
              <div className="space-y-1">
                {splitRoute.route?.map((stop, idx) => (
                  <div key={idx} className="text-sm flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    <span className="font-medium">{stop.supermarket?.name}:</span>
                    <span>{stop.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Price Comparison View */}
      {activeView === 'compare' && comparisons.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparisons.slice(0, 6).map((comp, idx) => (
              <div
                key={comp.supermarket_id}
                className={`bg-white rounded-xl p-4 border-2 cursor-pointer transition ${
                  selectedSupermarket === comp.supermarket_id
                    ? 'border-green-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                } ${idx === 0 ? 'ring-2 ring-green-400' : ''}`}
                onClick={() => setSelectedSupermarket(comp.supermarket_id)}
              >
                {idx === 0 && (
                  <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full inline-block mb-2">
                    BESTE KEUZE
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <img
                    src={comp.supermarket.logo_url || '/api/placeholder/60/30'}
                    alt={comp.supermarket.name}
                    className="h-8 object-contain"
                  />
                  <div className="text-right">
                    <p className="text-2xl font-bold">€{comp.totalPrice.toFixed(2)}</p>
                    {idx > 0 && (
                      <p className="text-sm text-red-600">+€{comp.savings.toFixed(2)}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Beschikbaar:</span>
                    <span className="font-medium">{comp.availability}%</span>
                  </div>
                  {comp.totalPromotionSavings > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Aanbiedingen:</span>
                      <span className="font-medium">-€{comp.totalPromotionSavings.toFixed(2)}</span>
                    </div>
                  )}
                  {comp.missingItems.length > 0 && (
                    <div className="text-orange-600">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      {comp.missingItems.length} items niet beschikbaar
                    </div>
                  )}
                </div>
                
                {selectedSupermarket === comp.supermarket_id && (
                  <button
                    onClick={finalizeList}
                    className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Kies deze winkel
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Delivery Options */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Bezorgopties
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comparisons.filter(c => c.supermarket.has_delivery).map(comp => (
                <div key={comp.supermarket_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{comp.supermarket.name}</p>
                    <p className="text-sm text-gray-600">
                      Bezorgkosten: €{comp.supermarket.delivery_costs?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">€{(comp.totalPrice + (comp.supermarket.delivery_costs || 0)).toFixed(2)}</p>
                    <p className="text-xs text-gray-600">incl. bezorging</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Shopping History */}
      {activeView === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Boodschappen Geschiedenis
            </h2>
            
            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nog geen geschiedenis beschikbaar
              </p>
            ) : (
              <div className="space-y-3">
                {history.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div>
                      <p className="font-medium">
                        Week van {new Date(item.week_date).toLocaleDateString('nl-NL')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.supermarket?.name} • {item.items?.length || 0} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">€{item.total_price?.toFixed(2)}</p>
                      {item.savings > 0 && (
                        <p className="text-sm text-green-600">
                          Bespaard: €{item.savings.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Savings Summary */}
          {stats.totalSaved > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-bold text-green-900 mb-4">
                💰 Besparingen Overzicht
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">€{stats.totalSaved.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Totaal bespaard</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">€{stats.averageSavings.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Gem. per week</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{history.length}</p>
                  <p className="text-sm text-gray-600">Weken getrackt</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {((stats.averageSavings / stats.weeklyAverage) * 100).toFixed(0)}%
                  </p>
                  <p className="text-sm text-gray-600">Besparingsratio</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights View */}
      {activeView === 'insights' && (
        <div className="space-y-6">
          {/* Seasonal Insights */}
          {seasonalInsights.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Seizoens Prijstrends
              </h2>
              <div className="space-y-4">
                {seasonalInsights.map((insight, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{insight.product.name}</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        insight.currentTrend === 'high'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {insight.currentTrend === 'high' ? 'Duur' : 'Goedkoop'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Prijsvariatie: {insight.priceVariation}% door het jaar
                    </p>
                    <p className="text-sm text-gray-600">
                      Beste maanden: {insight.bestMonths.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Report Tool */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Prijs Melden
            </h2>
            <p className="text-gray-600 mb-4">
              Help anderen door prijzen te melden en verdien punten!
            </p>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                Scan Kassabon
              </button>
              <button className="flex-1 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5" />
                Mijn Punten: 240
              </button>
            </div>
          </div>

          {/* Shopping Tips */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 mb-4">
              💡 Slimme Shopping Tips
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Shop op dinsdag of woensdag voor de beste aanbiedingen</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Koop seizoensgroenten voor 30-50% lagere prijzen</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Combineer Lidl/Aldi met AH voor optimale prijs-kwaliteit</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Bulk aankopen bij houdbare producten bespaart tot 25%</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
