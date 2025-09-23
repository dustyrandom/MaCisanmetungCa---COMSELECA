import { useEffect, useState } from 'react'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '../firebase'
import NavBar from './NavBar'
import ImageModal from './ImageModal'

function Campaigns() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [fullscreenImage, setFullscreenImage] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await get(dbRef(db, 'campaignSubmissions'))
        const list = []
        if (snap.exists()) {
          const val = snap.val()
          Object.entries(val).forEach(([candidateId, byCandidate]) => {
            Object.entries(byCandidate).forEach(([submissionId, s]) => {
              if ((s.status || 'pending') === 'approved') {
                list.push({ id: submissionId, candidateId, ...s })
              }
            })
          })
          list.sort((a, b) => new Date(b.reviewedAt || b.submittedAt || 0) - new Date(a.reviewedAt || a.submittedAt || 0))
        }
        setItems(list)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaigns</h1>
        <p className="text-gray-600 mb-8">Campaign materials from candidates.</p>

        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-gray-500">No approved campaigns yet.</div>
        ) : (
          <div className="space-y-6">
            {items.map(s => (
              <div key={s.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="font-semibold text-gray-900">{s.candidateName || 'Unknown Candidate'}</div>
                    <div className="text-sm text-gray-600">{s.institute || ''}</div>
                    {s.caption && <div className="text-sm text-gray-800 mt-1">{s.caption}</div>}
                  </div>
                  <div className="text-xs text-gray-500">{s.reviewedAt ? new Date(s.reviewedAt).toLocaleString() : (s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '—')}</div>
                </div>
                {Array.isArray(s.media) && s.media.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {s.media.map((m, i) => (
                      <div key={i} className="border rounded overflow-hidden bg-gray-50">
                        {m.type === 'video' ? (
                          <video src={m.url} controls className="w-full h-44 object-cover" />
                        ) : (
                          <img 
                            src={m.url} 
                            alt={m.name || ''} 
                            className="w-full h-44 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                            onClick={() => setFullscreenImage(m.url)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <ImageModal 
          src={fullscreenImage} 
          isOpen={!!fullscreenImage} 
          onClose={() => setFullscreenImage(null)} 
        />
      </div>
    </div>
  )
}

export default Campaigns


