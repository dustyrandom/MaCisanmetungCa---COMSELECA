import { useEffect, useState } from 'react'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '../firebase'
import NavBar from './NavBar'
import ImageModal from './ImageModal'

function Campaigns() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [fullscreenImage, setFullscreenImage] = useState(null)
  const [userProfiles, setUserProfiles] = useState({})

  useEffect(() => {
    const load = async () => {
      try {
        // Load campaign submissions
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

        // Load user profiles for profile pictures
        const usersSnap = await get(dbRef(db, 'users'))
        const profiles = {}
        if (usersSnap.exists()) {
          const usersData = usersSnap.val()
          Object.entries(usersData).forEach(([uid, userData]) => {
            profiles[uid] = userData
          })
        }
        setUserProfiles(profiles)
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Campaign</h1>
        <p className="text-gray-600 mb-8">Campaign materials from candidates.</p>

        {loading ? (
          <div className="text-gray-500">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-gray-500">No approved campaign materials yet.</div>
        ) : (
          <div className="space-y-6">
            {items.map(s => {
              // Find user profile by matching email or name
              const userProfile = Object.values(userProfiles).find(user => 
                (user.email && s.submittedByEmail && user.email.toLowerCase() === s.submittedByEmail.toLowerCase()) ||
                (user.name && s.candidateName && user.name.toLowerCase() === s.candidateName.toLowerCase())
              )
              
              return (
                <div key={s.id} className="bg-white rounded-lg shadow border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {userProfile?.profilePicture ? (
                          <img
                            className="h-12 w-12 rounded-full object-cover"
                            src={userProfile.profilePicture}
                            alt={s.candidateName || 'Candidate'}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-red-900 text-white flex items-center justify-center text-sm font-bold">
                            {(s.candidateName || 'U').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{s.candidateName || 'Unknown Candidate'}</div>
                        <div className="text-sm text-gray-600">{s.institute || ''}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{s.reviewedAt ? new Date(s.reviewedAt).toLocaleString() : (s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '—')}</div>
                  </div>
                  {s.caption && <div className="text-sm text-gray-800 mb-3">{s.caption}</div>}
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
              )
            })}
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


