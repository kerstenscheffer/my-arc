import { useState, useEffect, useMemo } from 'react';
import { openUitMelding } from '../video-feedback/feedbackOpenen'
import zichtbaarPollen from '../../utils/zichtbaarPollen';
import FeedbackBlad from '../workout/bouwfase/FeedbackBlad'
import { zoekNavraag, navraagWeg } from '../workout/bouwfase/trainingNavraag'
import CheckinService from '../client-checkin/CheckinService'
import { trajectLoopt } from '../client-checkin/trajectStatus'
import { checkinWeek } from '../client-checkin/checkinWeek'
import { vraagFotosOpen } from '../progress/fotosOpenen'

// Meldingen die al eens vanzelf openklapten (deze sessie).
const autoGeopend = new Set();

// Klantpagina's waar een melding naartoe kan (page_context = view-id in ClientDashboard).
const PAGINAS = { workout: 'Naar training', meal: 'Naar voeding', boodschappen: 'Naar boodschappen', tracking: 'Naar voortgang', calls: 'Naar calls', profile: 'Naar profiel' }
function paginaVan(n) {
  if (n?.trigger_data?.check_type === 'photo_not_uploaded') return { view: 'tracking', knop: 'Foto toevoegen', fotos: true }
  const view = n?.page_context
  return PAGINAS[view] ? { view, knop: PAGINAS[view] } : null
}
import { Bell, X, CheckCircle } from 'lucide-react';

export default function NotificationWidget({ db, clientId, currentPage = 'all', open: openProp, onOpenChange, onCountChange, client = null, onCheckin = null, checkinVersie = 0, onNavigate = null }) {
  const isMobile = window.innerWidth <= 768;
  const controlled = typeof openProp === 'boolean' && typeof onOpenChange === 'function'
  const [dbMeldingen, setNotifications] = useState([]);
  // "Hoe was je training van gisteren?": geen rij in de database maar een
  // melding die de app zelf bovenaan zet zolang het cijfer ontbreekt.
  const [navraag, setNavraag] = useState(null);
  const [navraagOpen, setNavraagOpen] = useState(false);
  // De wekelijkse check-in: open op zaterdag en zondag, daarna te laat tot en met donderdag. Stond als balk
  // onderin (CheckinReminderPopup); nu een melding zoals de rest (18 nov 2026).
  const [checkin, setCheckin] = useState(null); // { dagenLaat }
  // Betaling open (24 nov 2026): doorgezet maar nog niet betaald. Bron is de RPC
  // mijn_open_betaling. Zichtbaar vanaf het boeken tot de betaling binnen is
  // (Stripe vinkt hem af, of de coach). Slot = einde traject + 3 dagen.
  const [betaling, setBetaling] = useState(null);
  const notifications = useMemo(() => {
    const eigen = []
    if (betaling) {
      const d = betaling.dagen
      const wanneer = d <= 0 ? 'vanavond' : d === 1 ? 'morgen' : `over ${d} dagen`
      eigen.push({
        id: `betaling-${betaling.id}`, _betaling: betaling, _knop: 'Nu betalen', _vast: true,
        type: 'betaling', priority: d <= 3 ? 'urgent' : 'high', status: 'active',
        title: 'Je betaling staat nog open',
        message: `Heyy ${(betaling.voornaam || '').trim() || 'daar'}, je betaling voor ${betaling.aanbod} staat nog open.${betaling.te_laat ? ' Eigenlijk zit je al over je termijn heen.' : ''} Rond hem af zodat je account niet ${wanneer} op slot gaat.`,
      })
    }
    if (checkin) {
      const d = checkin.dagenLaat
      eigen.push({
        id: 'checkin-week', _checkin: true, _knop: 'Vul in', type: 'checkin', priority: d >= 2 ? 'urgent' : 'high', status: 'active',
        title: d === 0 ? 'Je wekelijkse check-in staat klaar' : 'Je check-in staat nog open',
        message: d === 0 ? 'Dit weekend invullen: hoe ging je week en wat pak je komende week aan.' : `Die was van afgelopen weekend, nu ${d} ${d === 1 ? 'dag' : 'dagen'} te laat. Een paar minuten werk.`,
      })
    }
    if (navraag) eigen.push({
      id: `navraag-${navraag.sessie.id}`, _navraag: true, _knop: 'Vul in', type: 'workout', priority: 'high', status: 'active',
      title: `Hoe was je training van ${navraag.dag}?`,
      message: 'Twee tikken: een cijfer en of de lengte goed was. Dan weet je coach het.',
    })
    // Meldingen met een pagina krijgen een knop erheen (23 nov 2026, Kersten).
    // De push-rijen van de betaalherinnering niet dubbel tonen: de eigen melding hierboven is de bron.
    const dbZicht = dbMeldingen.filter(n => n.source !== 'betaling')
    const metKnop = onNavigate ? dbZicht.map(n => {
      const doel = paginaVan(n)
      return doel ? { ...n, _knop: doel.knop, _doel: doel } : n
    }) : dbZicht
    return eigen.length ? [...eigen, ...metKnop] : metKnop
  }, [navraag, checkin, betaling, dbMeldingen, onNavigate]);
  const [isExpandedInternal, setIsExpandedInternal] = useState(false);
  const isExpanded = controlled ? openProp : isExpandedInternal;
  const setIsExpanded = (val) => {
    const next = typeof val === 'function' ? val(isExpanded) : val
    if (controlled) onOpenChange(next); else setIsExpandedInternal(next)
  };
  const [hasUnreadDb, setHasUnread] = useState(false);
  const hasUnread = hasUnreadDb || !!navraag || !!checkin || !!betaling;
  const [isLoading, setIsLoading] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState(null);

  // Coach info
  const coachName = 'Coach Kersten';

  useEffect(() => {
    if (clientId && db?.notifications) {
      loadNotifications();
      // Elke 2 min, en alleen terwijl de app in beeld is (was elke 30 s,
      // ook op de achtergrond).
      return zichtbaarPollen(loadNotifications, 120000);
    }
  }, [clientId, currentPage, db]);

  useEffect(() => {
    if (!clientId || !db?.supabase) return
    let leeft = true
    const kijk = () => zoekNavraag(db.supabase, clientId).then(n => {
      if (!leeft) return
      // Opnieuw gekeken (feedback opgeslagen, app weer in beeld): niets meer te vragen = melding weg.
      setNavraag(n || null)
      if (!n) { setNavraagOpen(false); return }
      const id = `navraag-${n.sessie.id}`
      if (!autoGeopend.has(id)) { autoGeopend.add(id); setTimeout(() => setIsExpanded(true), 800) }
    }, () => null)
    kijk()
    // Ingevuld via de workoutpagina of een ander blad: dan hoort deze melding ook weg.
    const opZicht = () => { if (document.visibilityState === 'visible') kijk() }
    window.addEventListener('myarc:training-feedback', kijk)
    document.addEventListener('visibilitychange', opZicht)
    return () => {
      leeft = false
      window.removeEventListener('myarc:training-feedback', kijk)
      document.removeEventListener('visibilitychange', opZicht)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    if (!clientId || !db?.supabase) return
    let leeft = true
    const kijk = () => db.supabase.rpc('mijn_open_betaling').then(({ data, error }) => {
      if (!leeft) return
      const b = !error && data && typeof data === 'object' ? data : null
      setBetaling(b)
      if (b && !autoGeopend.has(`betaling-${b.id}`)) { autoGeopend.add(`betaling-${b.id}`); setTimeout(() => setIsExpanded(true), 800) }
    }, () => null)
    kijk()
    const opZicht = () => { if (document.visibilityState === 'visible') kijk() }
    document.addEventListener('visibilitychange', opZicht)
    return () => { leeft = false; document.removeEventListener('visibilitychange', opZicht) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    // checkinVersie > 0 = er is zojuist een check-in opgeslagen: melding weg.
    if (checkinVersie > 0) { setCheckin(null); return }
    if (!client?.id || !db?.supabase || !onCheckin || !trajectLoopt(client)) { setCheckin(null); return }
    let leeft = true
    new CheckinService(db).hasCheckinSinceLastFriday(client.id).then(al => {
      if (!leeft || al) return
      // Open op zaterdag en zondag; maandag t/m donderdag te laat; vrijdag stil.
      const week = checkinWeek()
      if (!week.open && week.dagenLaat === 0) return
      setCheckin({ dagenLaat: week.dagenLaat })
      if (!autoGeopend.has('checkin-week')) { autoGeopend.add('checkin-week'); setTimeout(() => setIsExpanded(true), 800) }
    }, () => null)
    return () => { leeft = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client?.id, checkinVersie]);

  // Auto-hide effect
  useEffect(() => {
    if (isExpanded) {
      // Clear existing timer
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
      
      // Set new timer for auto-hide (10 seconds)
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 10000);
      
      setAutoHideTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [isExpanded]);

  const loadNotifications = async () => {
    if (!db?.notifications) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await db.notifications.getActiveNotifications(clientId, currentPage);
      
      if (data) {
        setNotifications(data);
        const unreadCount = data.filter(n => n.status === 'active').length;
        setHasUnread(unreadCount > 0);
        
        // Belangrijke melding klapt het paneel open, maar elke melding maar
        // één keer. Voorheen bij elke poll opnieuw: elke 30 s de hele app
        // opnieuw opgebouwd.
        const nieuw = data.filter(n => (n.priority === 'high' || n.priority === 'urgent') && n.status === 'active' && !autoGeopend.has(n.id));
        if (nieuw.length) {
          nieuw.forEach(n => autoGeopend.add(n.id));
          setTimeout(() => setIsExpanded(true), 500);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async (e, notificationId) => {
    e.stopPropagation();
    // Wegtikken verbergt de check-in tot je de app opnieuw opent; hij is pas echt weg na invullen.
    if (notificationId === 'checkin-week') { setCheckin(null); return }
    // Betaling is niet weg te klikken (24 nov 2026, Kersten): pas weg na betalen.
    if (String(notificationId).startsWith('betaling-')) return
    if (String(notificationId).startsWith('navraag-')) {
      if (navraag) navraagWeg(navraag.sessie.id)
      setNavraag(null)
      return
    }
    
    // Fade out animation
    const element = document.getElementById(`notification-${notificationId}`);
    if (element) {
      element.style.animation = 'fadeOutRight 0.3s ease';
      setTimeout(async () => {
        await db.notifications.dismissNotification(notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }, 300);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    await db.notifications.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? {...n, status: 'read'} : n)
    );
    loadNotifications();
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return '#ef4444';
      case 'high':   return '#f59e0b';
      case 'normal': return '#FFD700';
      default:       return 'rgba(255,255,255,0.45)';
    }
  };

  const handleBellClick = () => {
    setIsExpanded(!isExpanded);
    
    // Reset auto-hide timer
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }
  };

  // Live count voor sidebar-badge — hook moet vóór de early return staan.
  useEffect(() => {
    if (typeof onCountChange === 'function') {
      const active = notifications.filter(n => n.status === 'active').length
      onCountChange(active)
    }
  }, [notifications, onCountChange])

  if (!db?.notifications || !clientId) return null;

  // Get highest priority for bell color
  const highestPriority = notifications.reduce((highest, n) => {
    if (n.status !== 'active') return highest;
    const priorities = { 'urgent': 4, 'high': 3, 'normal': 2, 'low': 1 };
    return priorities[n.priority] > priorities[highest] ? n.priority : highest;
  }, 'normal');

  return (
    <>
      {/* Cleaner Floating Bell Button — alleen tonen in uncontrolled mode */}
      {!controlled && <button
        onClick={handleBellClick}
        style={{ 
          position: 'fixed',
          bottom: '100px',
          right: '0',
          zIndex: 997,
          width: isMobile ? '44px' : '48px',
          height: isMobile ? '44px' : '48px',
          background: hasUnread && isExpanded
            ? `linear-gradient(135deg, ${getPriorityColor(highestPriority)}20 0%, ${getPriorityColor(highestPriority)}10 100%)`
            : 'rgba(17, 17, 17, 0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: hasUnread && isExpanded
            ? `0.5px solid ${getPriorityColor(highestPriority)}40`
            : '0.5px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: hasUnread && isExpanded
            ? `0 4px 12px ${getPriorityColor(highestPriority)}20`
            : '0 2px 8px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: `translateX(${isMobile ? '8px' : '10px'})`,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          if (!isMobile && !isExpanded) {
            e.currentTarget.style.transform = 'translateX(6px)';
            e.currentTarget.style.background = 'rgba(17, 17, 17, 0.85)';
            e.currentTarget.style.borderColor = hasUnread ? `${getPriorityColor(highestPriority)}30` : 'rgba(255, 255, 255, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile && !isExpanded) {
            e.currentTarget.style.transform = 'translateX(10px)';
            e.currentTarget.style.background = 'rgba(17, 17, 17, 0.7)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          }
        }}
        onTouchStart={(e) => {
          if (isMobile && !isExpanded) {
            e.currentTarget.style.transform = 'translateX(4px) scale(0.95)';
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'translateX(8px) scale(1)';
          }
        }}
        aria-label="Toggle notifications"
      >
        <Bell size={isMobile ? 18 : 20} color={hasUnread && isExpanded ? getPriorityColor(highestPriority) : 'rgba(255, 255, 255, 0.6)'} strokeWidth={2} />
        {hasUnread && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: '700',
            borderRadius: '50%',
            width: '14px',
            height: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid rgba(0, 0, 0, 0.3)',
            boxShadow: '0 1px 4px rgba(239, 68, 68, 0.5)'
          }}>
            {notifications.filter(n => n.status === 'active').length < 10
              ? notifications.filter(n => n.status === 'active').length
              : '•'}
          </span>
        )}
      </button>}

      {/* Notification Panel — zelfde taal als de check-in-melding: foto,
          zwarte fade, bold witte tekst. Was een gouden kader met gouden
          strepen en gekleurde kaarten. */}
      {/* De rest van de pagina dimt zolang het paneel open is; tik ernaast = dicht. */}
      {isExpanded && (
        <div onClick={() => setIsExpanded(false)} aria-hidden style={{
          position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.6)',
          animation: 'meldingDim 0.25s ease both',
        }} />
      )}
      {isExpanded && (
        <div style={{
          position: 'fixed',
          // Op de hoogte van de bel (WidgetSidebar, plek 'rechtsboven') en tegen
          // de rechterrand: het paneel schuift uit de bel naar links open.
          ...(controlled
            ? { top: `calc(env(safe-area-inset-top, 0px) + ${isMobile ? 64 : 76}px)`, right: 0, borderRadius: '18px 0 0 18px', borderRight: 'none' }
            : { bottom: '160px', right: 0, borderRadius: '18px 0 0 18px', borderRight: 'none' }),
          width: '92%',
          maxWidth: '400px',
          maxHeight: '70vh',
          background: '#0a0a0a',
          boxShadow: '-18px 18px 50px rgba(0, 0, 0, 0.75)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
          animation: 'meldingSchuif 0.32s cubic-bezier(0.22, 1, 0.36, 1) both'
        }}>
          {/* Kop: coachfoto rechts, fade naar links, tekst eroverheen. */}
          <div style={{
            position: 'relative',
            minHeight: isMobile ? 84 : 94,
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: '34%',
              backgroundImage: 'url(/coach-compliment.jpg)',
              backgroundSize: 'cover', backgroundPosition: 'center 30%',
            }} />
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(90deg, #0a0a0a 0%, #0a0a0a 52%, rgba(10,10,10,0.85) 68%, rgba(10,10,10,0.4) 86%, rgba(10,10,10,0) 100%)',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              gap: 3,
              padding: isMobile ? '0 0.9rem' : '0 1.1rem',
            }}>
              <div style={{
                fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 900,
                color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.1,
                display: 'flex', alignItems: 'center', gap: 6,
                textShadow: '0 2px 10px rgba(0,0,0,0.85)',
              }}>
                <Bell size={isMobile ? 15 : 17} strokeWidth={2.6} style={{ flexShrink: 0 }} />
                {coachName}
              </div>
              <div style={{
                fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: 800,
                color: 'rgba(255,255,255,0.6)', lineHeight: 1.3,
                textShadow: '0 2px 8px rgba(0,0,0,0.85)',
              }}>
                {notifications.filter(n => n.status === 'active').length} actie{notifications.filter(n => n.status === 'active').length === 1 ? '' : 'f'}
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              aria-label="Sluiten"
              style={{
                position: 'absolute', top: 6, right: 7,
                width: 26, height: 26, padding: 0,
                borderRadius: 8, border: 'none',
                background: 'rgba(0,0,0,0.45)',
                color: '#fff', opacity: 0.85,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={14} strokeWidth={2.8} />
            </button>
          </div>

          {/* Auto-hide timer indicator */}
          <div style={{
            height: 2,
            background: 'rgba(255,255,255,0.04)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.2) 100%)',
              animation: 'timerShrink 10s linear',
              transformOrigin: 'left'
            }} />
          </div>

          {/* Meldingen: geen kaart in een kaart. Elke melding begint met een dunne
              lijn; het label 'Belangrijk' zit rechtsboven half over die lijn. */}
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 12 }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                <div style={{
                  width: '32px', height: '32px', border: '2px solid rgba(255, 255, 255, 0.1)',
                  borderTopColor: 'rgba(255,255,255,0.6)', borderRadius: '50%', margin: '0 auto',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            ) : notifications.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '1.75rem 1rem 2rem', color: 'rgba(255, 255, 255, 0.45)', margin: 0, fontSize: isMobile ? '0.82rem' : '0.86rem', fontWeight: 700 }}>
                Geen nieuwe berichten
              </p>
            ) : (
              <div>
                {notifications.map((notification, index) => {
                  const pc = getPriorityColor(notification.priority);
                  const isActive = notification.status === 'active';
                  const belangrijk = notification.priority === 'urgent' || notification.priority === 'high';
                  const open = () => {
                    if (notification._checkin) { setIsExpanded(false); onCheckin?.(); return }
                    if (notification._betaling) {
                      if (notification._betaling.betaal_link) window.open(notification._betaling.betaal_link, '_blank', 'noopener')
                      return
                    }
                    if (notification._navraag) { setNavraagOpen(true); setIsExpanded(false); return }
                    if (notification._doel) {
                      setIsExpanded(false)
                      if (isActive) handleMarkAsRead(notification.id)
                      if (notification._doel.fotos) vraagFotosOpen()
                      onNavigate(notification._doel.view)
                      return
                    }
                    // Feedback op een techniekvideo: meteen de modal open.
                    if (openUitMelding(notification.trigger_data)) setIsExpanded(false)
                    if (isActive) handleMarkAsRead(notification.id)
                  };
                  return (
                  <div
                    key={notification.id}
                    id={`notification-${notification.id}`}
                    onClick={open}
                    style={{
                      position: 'relative',
                      padding: isMobile ? '1rem 0.95rem 0.95rem' : '1.05rem 1.1rem 1rem',
                      borderTop: '1px solid rgba(255,255,255,0.12)',
                      cursor: isActive ? 'pointer' : 'default',
                      opacity: notification.status === 'read' ? 0.55 : 1,
                      animation: `slideInRight 0.3s ease ${0.12 + index * 0.05}s both`,
                    }}
                  >
                    {belangrijk && (
                      <span style={{
                        position: 'absolute', top: -9, right: isMobile ? 12 : 14,
                        height: 17, padding: '0 0.5rem', display: 'inline-flex', alignItems: 'center',
                        borderRadius: 6, background: '#0a0a0a', border: 'none', color: pc,
                        fontSize: '0.56rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em',
                      }}>
                        {notification.priority === 'urgent' ? 'Urgent' : 'Belangrijk'}
                      </span>
                    )}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ margin: '0 0 0.3rem 0', fontSize: isMobile ? '0.98rem' : '1.02rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                          {notification.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: isMobile ? '0.82rem' : '0.88rem', color: 'rgba(255, 255, 255, 0.75)', fontWeight: 500, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {notification.message}
                        </p>
                        {(notification._knop || notification.source === 'smart' || notification.status === 'read') && (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.7rem' }}>
                            {notification._knop && (
                              <button onClick={(e) => { e.stopPropagation(); open() }} style={{
                                height: 38, padding: '0 1.1rem', borderRadius: 10, background: '#fff', color: '#0a0a0a', border: 'none',
                                fontFamily: 'inherit', fontSize: '0.84rem', fontWeight: 900, letterSpacing: '-0.01em', cursor: 'pointer',
                                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                              }}>
                                {notification._knop}
                              </button>
                            )}
                            {notification.source === 'smart' && (
                              <span style={{ padding: '0.15rem 0.55rem', borderRadius: 6, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', fontSize: '0.62rem', fontWeight: 800, border: '1px solid rgba(255,255,255,0.16)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                AI Insight
                              </span>
                            )}
                            {notification.status === 'read' && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 700 }}>
                                <CheckCircle size={11} strokeWidth={2.4} />
                                Gelezen
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {!notification._vast && (
                      <button
                        onClick={(e) => handleDismiss(e, notification.id)}
                        aria-label="Wegklikken"
                        style={{
                          width: 30, height: 30, marginTop: -2, marginRight: -6, padding: 0, border: 'none', background: 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                          color: 'rgba(255, 255, 255, 0.45)', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <X size={15} strokeWidth={2.4} />
                      </button>)}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes slideInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes meldingSchuif {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @keyframes meldingDim {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(20px);
            opacity: 0;
          }
        }

        @keyframes spin {
          to { 
            transform: rotate(360deg);
          }
        }

        @keyframes timerShrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
      {navraag && (
        <FeedbackBlad open={navraagOpen} soort="workout" client={{ id: clientId }} db={db} fase={navraag.fase}
          datum={navraag.sessie.workout_date} dagTekst={navraag.dag}
          onOpgeslagen={() => { navraagWeg(navraag.sessie.id); setNavraagOpen(false); setNavraag(null) }}
          onClose={() => setNavraagOpen(false)} />
      )}
    </>
  );
}
