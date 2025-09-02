import ProgressRouter from '../../modules/progress/ProgressRouter'

export default function ClientProgress({ client, db, onNavigate }) {
  return <ProgressRouter client={client} db={db} onNavigate={onNavigate} />
}
