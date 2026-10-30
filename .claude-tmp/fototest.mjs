const yt = u => { const m = String(u || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/); return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : null }
const kapot = u => /(^|[/.])(ibb\.co|imgbb\.com)([/:?]|$)/i.test(String(u || ''))
const kand = r => [...new Set([r.image_url, r.thumbnail_url, yt(r.video_url), yt(r.fallback_video_url)].filter(u => u && !kapot(u)))]
const rijen = [
  { n: 'Hack Squat', image_url: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hack_Squat/0.jpg', thumbnail_url: 'https://i.ibb.co/5h1F1dSm/20.png', video_url: 'https://youtube.com/shorts/W6sj17fK0FQ' },
  { n: 'Romanian Deadlift', image_url: 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/0.jpg', thumbnail_url: 'https://i.ibb.co/Zpqjrf5P/14.png', video_url: 'https://youtube.com/shorts/JamKMM2h9mY' },
  { n: 'Chest Supported Machine Row', image_url: null, thumbnail_url: 'https://i.ibb.co/Fb6SDkX4/6.png', video_url: 'https://youtube.com/shorts/NbU0LMXOHrM?feature=share' },
]
for (const r of rijen) {
  const k = kand(r)
  const res = await fetch(k[0])
  console.log(r.n, '->', k[0], res.status, res.headers.get('content-type'))
}
