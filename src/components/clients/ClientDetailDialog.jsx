import { useEffect, useState } from 'react'
import { parseMealPreferences } from '../../lib/intakeParsers'
import {
  getClientProfile, upsertClientProfile,
  getClientMealPrefs, saveMealPrefs,
  listBonuses, addBonus, removeBonus,
  listClientVideos, addClientVideo, deleteClientVideo
} from '../../lib/clients'
import { getClientMealPlans } from '../../lib/mealplanDatabase'

export default function ClientDetailDialog({ client, onClose }) {
  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [profile, setProfile] = useState({})
  const [rawPrefs, setRawPrefs] = useState('')
  const [normPrefs, setNormPrefs] = useState({})
  const [plans, setPlans] = useState([])
  const [bonuses, setBonuses] = useState([])
  const [videos, setVideos] = useState([])

  useEffect(() => {
    if (!client?.id) return
    ;(async () => {
      try {
        setLoading(true); setError(''); setSuccess('')
        const p = await getClientProfile(client.id); if (p) setProfile(p)
        const prefs = await getClientMealPrefs(client.id)
        if (prefs?.raw_text) { setRawPrefs(prefs.raw_text); setNormPrefs(prefs.normalized || {}) }
        setPlans(await getClientMealPlans(client.id))
        setBonuses(await listBonuses(client.id))
        setVideos(await listClientVideos(client.id))
      } catch (e) { setError(e.message || 'Laden mislukt') }
      finally { setLoading(false) }
    })()
  }, [client?.id])

  if (!client) return null

  async function saveProfile(){
    try { setLoading(true); setError(''); setSuccess('')
      await upsertClientProfile(client.id, profile)
      setSuccess('Profiel opgeslagen ✅')
    } catch(e){ setError(e.message || 'Opslaan mislukt') } finally { setLoading(false) }
  }

  function doParse(){ try { setNormPrefs(parseMealPreferences(rawPrefs||'')); setSuccess('Parsed ✅') } catch(e){ setError('Parser error') } }
  async function savePrefs(){
    try { setLoading(true); setError(''); setSuccess('')
      await saveMealPrefs(client.id, rawPrefs)
      setSuccess('Meal preferences opgeslagen ✅')
    } catch(e){ setError(e.message||'Opslaan mislukt') } finally { setLoading(false) }
  }

  return (
    <div className="myarc-modal">
      <div className="myarc-modal-backdrop" onClick={onClose}/>
      <div className="myarc-modal-card" style={{width:'min(980px,96vw)'}}>
        <div className="myarc-modal-header" style={{background:'linear-gradient(135deg,#064e3b,#0a5c42)'}}>
          <h3 className="myarc-card-title" style={{color:'#fff'}}>
            {client.first_name} {client.last_name} — Client Details
          </h3>
          <button className="myarc-btn myarc-btn-outline" onClick={onClose}>✕</button>
        </div>

        <div className="myarc-tabs">
          {['profile','preferences','plans','progress','videos'].map(k=>(
            <button key={k} className={`myarc-tab ${tab===k?'active':''}`} onClick={()=>setTab(k)}>
              {k==='profile'?'Profiel':k==='preferences'?'Preferences':k==='plans'?'Plans/Bonussen':k==='progress'?'Progress':"Video's"}
            </button>
          ))}
        </div>

        {error && <div className="myarc-alert myarc-alert-error">{error}</div>}
        {success && <div className="myarc-alert myarc-alert-success">{success}</div>}

        {tab==='profile' && (
          <div className="myarc-grid">
            {[
              ['height_cm','Lengte (cm)','number'],['weight_kg','Gewicht (kg)','number'],
              ['sex','Geslacht','text'],['experience','Ervaring','text'],
              ['training_days_per_week','Dagen/week','number'],['time_per_session_min','Min/sessie','number'],
              ['fixed_training_days','Vaste dagen','text'],['fixed_training_time','Vaste tijd','text'],
              ['equipment','Equipment','text'],['sports_other','Andere sporten','text'],
              ['work_type','Werk type','text'],['injuries_current','Blessures (huidig)','text'],
              ['injuries_history','Blessures (historie)','text'],['doctor_limits','Dokter restricties','text'],
              ['medication','Medicatie','text']
            ].map(([key,label,type])=>(
              <label key={key}>{label}
                <input type={type} value={profile[key]??''}
                  onChange={e=>setProfile(p=>({...p,[key]:type==='number'? (e.target.value?Number(e.target.value):null):e.target.value}))}/>
              </label>
            ))}
            <label>Prioriteiten (JSON)
              <input value={JSON.stringify(profile.priorities||{})}
                onChange={e=>{ try{ setProfile(p=>({...p,priorities:JSON.parse(e.target.value||'{}')})) }catch{}}}/>
            </label>
            <label>Frustraties<textarea value={profile.frustrations||''} onChange={e=>setProfile(p=>({...p,frustrations:e.target.value}))}/></label>
            <label>Motivators<textarea value={profile.motivators||''} onChange={e=>setProfile(p=>({...p,motivators:e.target.value}))}/></label>
            <label>Wensen<textarea value={profile.wishes||''} onChange={e=>setProfile(p=>({...p,wishes:e.target.value}))}/></label>
            <label>Notities<textarea value={profile.notes||''} onChange={e=>setProfile(p=>({...p,notes:e.target.value}))}/></label>
            <div><button className="myarc-btn" onClick={saveProfile} disabled={loading}>💾 Opslaan</button></div>
          </div>
        )}

        {tab==='preferences' && (
          <div className="myarc-grid">
            <label>Plak hier Meal Preferences (raw)
              <textarea rows={10} value={rawPrefs} onChange={e=>setRawPrefs(e.target.value)}
                placeholder={'ALLERGIES: ...\nDISLIKES: ...\nLIKES: ...\nCALORIES: ...\nMEAL_COUNT: ...'}/>
            </label>
            <div>
              <button className="myarc-btn" onClick={doParse}>🔎 Parse</button>
              <pre className="myarc-pre" style={{maxHeight:220,overflow:'auto'}}>{JSON.stringify(normPrefs,null,2)}</pre>
              <button className="myarc-btn myarc-btn-outline" onClick={savePrefs} disabled={loading || !rawPrefs}>💾 Save</button>
            </div>
          </div>
        )}

        {tab==='plans' && (
          <div className="myarc-grid">
            <h4>📋 Meal Plans (snapshots)</h4>
            {!plans?.length && <p className="myarc-text-gray">Geen meal plan snapshots gevonden.</p>}
            <ul>{plans.map(p=>(
              <li key={p.id} className="myarc-flex myarc-justify-between myarc-items-center">
                <span>{p.title || 'Plan'} — start: {p.start_date}</span>
              </li>
            ))}</ul>

            <h4>🎁 Bonussen</h4>
            <ul>
              {bonuses?.length ? bonuses.map(b=>(
                <li key={b.id} className="myarc-flex myarc-justify-between myarc-items-center">
                  <span>{b.label}{b.description?` — ${b.description}`:''}</span>
                  <button className="myarc-btn myarc-btn-outline" onClick={async()=>{await removeBonus(b.id); setBonuses(await listBonuses(client.id))}}>Verwijder</button>
                </li>
              )) : <p className="myarc-text-gray">Nog geen bonussen.</p>}
            </ul>
            <AddBonus onAdd={async payload=>{ await addBonus(client.id,payload); setBonuses(await listBonuses(client.id)) }}/>
          </div>
        )}

        {tab==='progress' && (
          <div className="myarc-grid">
            <p className="myarc-text-gray">Open de Progress pagina voor deze client om logs/grafieken te beheren.</p>
            <button className="myarc-btn" onClick={onClose}>📈 Sluiten</button>
          </div>
        )}

        {tab==='videos' && (
          <div className="myarc-grid">
            {videos?.length ? (
              <ul>{videos.map(v=>(
                <li key={v.id} className="myarc-flex myarc-justify-between myarc-items-center">
                  <span>{v.title}</span>
                  <a href={v.url} target="_blank" rel="noreferrer">Open</a>
                  <button className="myarc-btn myarc-btn-outline" onClick={async()=>{await deleteClientVideo(v.id); setVideos(await listClientVideos(client.id))}}>Verwijder</button>
                </li>
              ))}</ul>
            ) : <p className="myarc-text-gray">Nog geen video’s.</p>}
            <AddVideo onAdd={async v=>{ await addClientVideo(client.id, v); setVideos(await listClientVideos(client.id)) }}/>
          </div>
        )}
      </div>
    </div>
  )
}

function AddBonus({ onAdd }){
  const [label,setLabel]=useState(''); const [description,setDescription]=useState('')
  return (
    <div className="myarc-flex myarc-gap-sm myarc-items-end">
      <label>Label<input value={label} onChange={e=>setLabel(e.target.value)}/></label>
      <label>Omschrijving<input value={description} onChange={e=>setDescription(e.target.value)}/></label>
      <button className="myarc-btn" onClick={()=>{ if(!label) return; onAdd({label,description}); setLabel(''); setDescription('') }}>➕ Add</button>
    </div>
  )
}
function AddVideo({ onAdd }){
  const [title,setTitle]=useState(''); const [url,setUrl]=useState(''); const [tags,setTags]=useState('')
  return (
    <div className="myarc-flex myarc-gap-sm myarc-items-end">
      <label>Titel<input value={title} onChange={e=>setTitle(e.target.value)}/></label>
      <label>URL<input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..."/></label>
      <label>Tags (comma sep)<input value={tags} onChange={e=>setTags(e.target.value)}/></label>
      <button className="myarc-btn" onClick={()=>{ if(!title||!url) return; onAdd({ title, url, tags: tags.split(',').map(s=>s.trim()).filter(Boolean) }); setTitle(''); setUrl(''); setTags('') }}>➕ Add</button>
    </div>
  )
}
