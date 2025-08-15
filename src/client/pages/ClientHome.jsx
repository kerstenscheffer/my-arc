import { useLanguage, iconUrls } from '../../contexts/LanguageContext'

export default function ClientHome({ client, setCurrentView }) {
  const { t } = useLanguage()

  return (
    <div className="myarc-animate-in">
      {/* Welcome Section */}
      <div className="myarc-card myarc-mb-xl" style={{
        background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
        border: '2px solid #10b981'
      }}>
        <h2 className="myarc-text-white" style={{fontSize: '2.5rem', marginBottom: '1rem'}}>
          {t('common.welcome')}, <span className="myarc-text-green">{client?.first_name}!</span> 💪
        </h2>
        <p className="myarc-text-gray" style={{fontSize: '1.2rem'}}>
          {t('client.welcomeMessage')}
        </p>
      </div>

      {/* Personal Video Section */}
      <div className="myarc-card myarc-mb-xl">
        <h3 className="myarc-card-title">📹 {t('client.personalVideo')}</h3>
        <div style={{
          background: '#222',
          borderRadius: '8px',
          padding: '4rem 2rem',
          textAlign: 'center',
          border: '1px solid #333'
        }}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🎥</div>
          <p className="myarc-text-gray">{t('client.personalVideo')}</p>
          <p className="myarc-text-gray" style={{fontSize: '0.875rem'}}>
            {t('client.videoComingSoon')}
          </p>
        </div>
      </div>

      {/* Navigation Grid with Custom Icons */}
      <div className="myarc-grid myarc-grid-2 myarc-gap-xl">
        <button 
          onClick={() => setCurrentView('mealplan')}
          className="myarc-card myarc-hover-scale"
          style={{
            background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
            border: '2px solid #10b981',
            padding: '3rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            textAlign: 'center'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1rem',
            borderRadius: '50%',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={iconUrls.mealplan}
              alt="Meal Plan"
              style={{width: '50px', height: '50px', filter: 'brightness(0) invert(1)'}}
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
          <h3 style={{fontSize: '1.8rem', color: 'white', marginBottom: '0.5rem'}}>
            {t('nav.mealplan')}
          </h3>
          <p style={{color: '#d1d5db'}}>
            {t('client.viewPlan')}
          </p>
        </button>

        <button 
          onClick={() => setCurrentView('workout')}
          className="myarc-card myarc-hover-scale"
          style={{
            background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
            border: '2px solid #10b981',
            padding: '3rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            textAlign: 'center'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1rem',
            borderRadius: '50%',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={iconUrls.workout}
              alt="Workout"
              style={{width: '50px', height: '50px', filter: 'brightness(0) invert(1)'}}
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
          <h3 style={{fontSize: '1.8rem', color: 'white', marginBottom: '0.5rem'}}>
            {t('nav.workout')}
          </h3>
          <p style={{color: '#d1d5db'}}>
            {t('client.todayTraining')}
          </p>
        </button>

        <button 
          onClick={() => setCurrentView('progress')}
          className="myarc-card myarc-hover-scale"
          style={{
            background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
            border: '2px solid #10b981',
            padding: '3rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            textAlign: 'center'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1rem',
            borderRadius: '50%',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={iconUrls.progress}
              alt="Progress"
              style={{width: '50px', height: '50px', filter: 'brightness(0) invert(1)'}}
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
          <h3 style={{fontSize: '1.8rem', color: 'white', marginBottom: '0.5rem'}}>
            {t('nav.progress')}
          </h3>
          <p style={{color: '#d1d5db'}}>
            {t('client.logProgress')}
          </p>
        </button>

        <button 
          onClick={() => setCurrentView('profile')}
          className="myarc-card myarc-hover-scale"
          style={{
            background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
            border: '2px solid #10b981',
            padding: '3rem',
            cursor: 'pointer',
            transition: 'all 0.3s',
            textAlign: 'center'
          }}
        >
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1rem',
            borderRadius: '50%',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={iconUrls.profile}
              alt="Profile"
              style={{width: '50px', height: '50px', filter: 'brightness(0) invert(1)'}}
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
          <h3 style={{fontSize: '1.8rem', color: 'white', marginBottom: '0.5rem'}}>
            {t('nav.profile')}
          </h3>
          <p style={{color: '#d1d5db'}}>
            {t('client.settings')}
          </p>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="myarc-card myarc-mt-xl">
        <h3 className="myarc-card-title">📊 {t('client.progressOverview')}</h3>
        <div className="myarc-grid myarc-grid-4 myarc-gap-md">
          <div className="myarc-card" style={{textAlign: 'center', padding: '1.5rem'}}>
            <div className="myarc-text-green" style={{fontSize: '2rem', fontWeight: 'bold'}}>12</div>
            <div className="myarc-text-gray">{t('client.workoutsDone')}</div>
          </div>
          <div className="myarc-card" style={{textAlign: 'center', padding: '1.5rem'}}>
            <div className="myarc-text-green" style={{fontSize: '2rem', fontWeight: 'bold'}}>89%</div>
            <div className="myarc-text-gray">{t('client.planAdherence')}</div>
          </div>
          <div className="myarc-card" style={{textAlign: 'center', padding: '1.5rem'}}>
            <div className="myarc-text-green" style={{fontSize: '2rem', fontWeight: 'bold'}}>+5kg</div>
            <div className="myarc-text-gray">{t('client.strengthGain')}</div>
          </div>
          <div className="myarc-card" style={{textAlign: 'center', padding: '1.5rem'}}>
            <div className="myarc-text-green" style={{fontSize: '2rem', fontWeight: 'bold'}}>Week 3</div>
            <div className="myarc-text-gray">{t('client.currentWeek')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
