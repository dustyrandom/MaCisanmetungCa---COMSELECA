import { useEffect, useState } from 'react'
import { ref as dbRef, get, set, remove } from 'firebase/database'
import { db } from '../firebase'
import NavBar from './NavBar'
import ImageModal from './ImageModal'

function ManageCampaigns() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [filter, setFilter] = useState('all')
  const [fullscreenImage, setFullscreenImage] = useState(null)
  const [userProfiles, setUserProfiles] = useState({})
  const [campaignStatus, setCampaignStatus] = useState({ isActive: false, startDate: '', endDate: '' })
  const [savingStatus, setSavingStatus] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        // Load campaign submissions
        const snap = await get(dbRef(db, 'campaignSubmissions'))
        if (snap.exists()) {
          const val = snap.val()
          const list = []
          Object.entries(val).forEach(([candidateId, byCandidate]) => {
            Object.entries(byCandidate).forEach(([submissionId, s]) => {
              list.push({ id: submissionId, candidateId, ...s })
            })
          })
          // Sort newest first
          list.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
          setSubmissions(list)
        } else {
          setSubmissions([])
        }

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

        // Load campaign status
        const csSnap = await get(dbRef(db, 'campaignStatus'))
        if (csSnap.exists()) setCampaignStatus(csSnap.val())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // keep local filtering inline in render to avoid unused var warnings

  const updateStatus = async (s, status) => {
    try {
      setSavingId(s.id)
      const ref = dbRef(db, `campaignSubmissions/${s.candidateId}/${s.id}`)
      await set(ref, { ...s, status, reviewedAt: new Date().toISOString() })
      setSubmissions(prev => prev.map(x => x.id === s.id ? { ...x, status, reviewedAt: new Date().toISOString() } : x))
    } finally {
      setSavingId('')
    }
  }

  const deleteSubmission = async (s) => {
    try {
      setSavingId(s.id)
      await remove(dbRef(db, `campaignSubmissions/${s.candidateId}/${s.id}`))
      setSubmissions(prev => prev.filter(x => x.id !== s.id))
    } finally {
      setSavingId('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Manage Campaigns</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Filter:</span>
                <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded px-3 py-1 text-sm">
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Settings - Campaign Status */}
            <div className="mb-8 border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Settings</h2>
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={async () => {
                    try {
                      setSavingStatus(true)
                      const newStatus = { ...campaignStatus, isActive: !campaignStatus.isActive }
                      await set(dbRef(db, 'campaignStatus'), newStatus)
                      setCampaignStatus(newStatus)
                    } finally { setSavingStatus(false) }
                  }}
                  disabled={savingStatus}
                  className={`px-4 py-2 rounded text-white ${savingStatus ? 'bg-gray-400 cursor-not-allowed' : (campaignStatus.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700')}`}
                >
                  {savingStatus ? 'Updating…' : (campaignStatus.isActive ? 'Close Campaign' : 'Open Campaign')}
                </button>
                <span className="text-sm text-gray-600">{campaignStatus.isActive ? 'Campaign submissions are open' : 'Campaign submissions are closed'}</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                  <input type="datetime-local" value={campaignStatus.startDate || ''} onChange={(e) => setCampaignStatus(prev => ({ ...prev, startDate: e.target.value }))} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                  <input type="datetime-local" value={campaignStatus.endDate || ''} onChange={(e) => setCampaignStatus(prev => ({ ...prev, endDate: e.target.value }))} className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={async () => {
                    try {
                      setSavingStatus(true)
                      await set(dbRef(db, 'campaignStatus'), campaignStatus)
                    } finally { setSavingStatus(false) }
                  }}
                  disabled={savingStatus}
                  className="px-4 py-2 rounded text-white bg-gray-800 hover:bg-gray-900"
                >
                  {savingStatus ? 'Saving…' : 'Save Settings'}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-gray-500">Loading…</div>
            ) : (
              <div className="space-y-8">
                {(filter === 'all' || filter === 'pending') && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Pending</h2>
                    <div className="space-y-4">
                      {submissions.filter(s => (s.status || 'pending') === 'pending').length === 0 ? (
                        <div className="text-sm text-gray-500">No pending submissions.</div>
                      ) : (
                        submissions.filter(s => (s.status || 'pending') === 'pending').map(s => {
                          // Find user profile by matching email or name
                          const userProfile = Object.values(userProfiles).find(user => 
                            (user.email && s.submittedByEmail && user.email.toLowerCase() === s.submittedByEmail.toLowerCase()) ||
                            (user.name && s.candidateName && user.name.toLowerCase() === s.candidateName.toLowerCase())
                          )
                          
                          return (
                            <div key={s.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between gap-3">
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
                                    <div className="text-xs text-gray-500">Submitted: {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : 'N/A'}</div>
                                  </div>
                                </div>
                                <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">pending</span>
                              </div>
                              {s.caption && <div className="text-sm text-gray-800 mt-3">{s.caption}</div>}
                            {Array.isArray(s.media) && s.media.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                                {s.media.map((m, i) => (
                                  <div key={i} className="border rounded overflow-hidden bg-gray-50">
                                    {m.type === 'video' ? (
                                      <video src={m.url} controls className="w-full h-40 object-cover" />
                                    ) : (
                                      <img src={m.url} alt={m.name || ''} className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setFullscreenImage(m.url)} />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-4 flex flex-wrap gap-3">
                              <button disabled={savingId === s.id} onClick={() => updateStatus(s, 'approved')} className={`px-3 py-1 rounded text-sm ${savingId === s.id ? 'bg-green-300 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}>Approve</button>
                              <button disabled={savingId === s.id} onClick={() => updateStatus(s, 'rejected')} className={`px-3 py-1 rounded text-sm ${savingId === s.id ? 'bg-yellow-300 text-white' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}>Reject</button>
                              <button disabled={savingId === s.id} onClick={() => deleteSubmission(s)} className={`px-3 py-1 rounded text-sm ${savingId === s.id ? 'bg-red-300 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}>Delete</button>
                            </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}

                {(filter === 'all' || filter === 'approved') && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Approved</h2>
                    <div className="space-y-4">
                      {submissions.filter(s => (s.status || 'pending') === 'approved').length === 0 ? (
                        <div className="text-sm text-gray-500">No approved submissions.</div>
                      ) : (
                        submissions.filter(s => (s.status || 'pending') === 'approved').map(s => {
                          // Find user profile by matching email or name
                          const userProfile = Object.values(userProfiles).find(user => 
                            (user.email && s.submittedByEmail && user.email.toLowerCase() === s.submittedByEmail.toLowerCase()) ||
                            (user.name && s.candidateName && user.name.toLowerCase() === s.candidateName.toLowerCase())
                          )
                          
                          return (
                            <div key={s.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between gap-3">
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
                                    <div className="text-xs text-gray-500">Submitted: {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : 'N/A'}</div>
                                  </div>
                                </div>
                                <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">approved</span>
                              </div>
                              {s.caption && <div className="text-sm text-gray-800 mt-3">{s.caption}</div>}
                            {Array.isArray(s.media) && s.media.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                                {s.media.map((m, i) => (
                                  <div key={i} className="border rounded overflow-hidden bg-gray-50">
                                    {m.type === 'video' ? (
                                      <video src={m.url} controls className="w-full h-40 object-cover" />
                                    ) : (
                                      <img src={m.url} alt={m.name || ''} className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setFullscreenImage(m.url)} />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-4 flex flex-wrap gap-3">
                              <button disabled={savingId === s.id} onClick={() => updateStatus(s, 'rejected')} className={`px-3 py-1 rounded text-sm ${savingId === s.id ? 'bg-yellow-300 text-white' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}>Reject</button>
                              <button disabled={savingId === s.id} onClick={() => deleteSubmission(s)} className={`px-3 py-1 rounded text-sm ${savingId === s.id ? 'bg-red-300 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}>Delete</button>
                            </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}

                {(filter === 'all' || filter === 'rejected') && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Rejected</h2>
                    <div className="space-y-4">
                      {submissions.filter(s => (s.status || 'pending') === 'rejected').length === 0 ? (
                        <div className="text-sm text-gray-500">No rejected submissions.</div>
                      ) : (
                        submissions.filter(s => (s.status || 'pending') === 'rejected').map(s => {
                          // Find user profile by matching email or name
                          const userProfile = Object.values(userProfiles).find(user => 
                            (user.email && s.submittedByEmail && user.email.toLowerCase() === s.submittedByEmail.toLowerCase()) ||
                            (user.name && s.candidateName && user.name.toLowerCase() === s.candidateName.toLowerCase())
                          )
                          
                          return (
                            <div key={s.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between gap-3">
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
                                    <div className="text-xs text-gray-500">Submitted: {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : 'N/A'}</div>
                                  </div>
                                </div>
                                <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">rejected</span>
                              </div>
                              {s.caption && <div className="text-sm text-gray-800 mt-3">{s.caption}</div>}
                            {Array.isArray(s.media) && s.media.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                                {s.media.map((m, i) => (
                                  <div key={i} className="border rounded overflow-hidden bg-gray-50">
                                    {m.type === 'video' ? (
                                      <video src={m.url} controls className="w-full h-40 object-cover" />
                                    ) : (
                                      <img src={m.url} alt={m.name || ''} className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setFullscreenImage(m.url)} />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="mt-4 flex flex-wrap gap-3">
                              <button disabled={savingId === s.id} onClick={() => updateStatus(s, 'approved')} className={`px-3 py-1 rounded text-sm ${savingId === s.id ? 'bg-green-300 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}>Approve</button>
                              <button disabled={savingId === s.id} onClick={() => deleteSubmission(s)} className={`px-3 py-1 rounded text-sm ${savingId === s.id ? 'bg-red-300 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}>Delete</button>
                            </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <ImageModal 
            src={fullscreenImage} 
            isOpen={!!fullscreenImage} 
            onClose={() => setFullscreenImage(null)} 
          />
        </div>
      </div>
    </div>
  )
}

export default ManageCampaigns


