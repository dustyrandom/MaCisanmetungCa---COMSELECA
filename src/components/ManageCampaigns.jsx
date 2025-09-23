import { useEffect, useMemo, useState } from 'react'
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

  useEffect(() => {
    const load = async () => {
      try {
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
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return submissions
    return submissions.filter(s => (s.status || 'pending') === filter)
  }, [submissions, filter])

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
                        submissions.filter(s => (s.status || 'pending') === 'pending').map(s => (
                          <div key={s.id} className="border rounded-lg p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <div className="font-semibold text-gray-900">{s.candidateName || 'Unknown Candidate'}</div>
                                <div className="text-sm text-gray-600">{s.role ? `${s.role} • ` : ''}{s.institute || ''}</div>
                                <div className="text-xs text-gray-500">Submitted: {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : 'N/A'}</div>
                                {s.caption && <div className="text-sm text-gray-800 mt-2">{s.caption}</div>}
                              </div>
                              <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">pending</span>
                            </div>
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
                        ))
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
                        submissions.filter(s => (s.status || 'pending') === 'approved').map(s => (
                          <div key={s.id} className="border rounded-lg p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <div className="font-semibold text-gray-900">{s.candidateName || 'Unknown Candidate'}</div>
                                <div className="text-sm text-gray-600">{s.role ? `${s.role} • ` : ''}{s.institute || ''}</div>
                                <div className="text-xs text-gray-500">Submitted: {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : 'N/A'}</div>
                                {s.caption && <div className="text-sm text-gray-800 mt-2">{s.caption}</div>}
                              </div>
                              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">approved</span>
                            </div>
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
                        ))
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
                        submissions.filter(s => (s.status || 'pending') === 'rejected').map(s => (
                          <div key={s.id} className="border rounded-lg p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <div className="font-semibold text-gray-900">{s.candidateName || 'Unknown Candidate'}</div>
                                <div className="text-sm text-gray-600">{s.role ? `${s.role} • ` : ''}{s.institute || ''}</div>
                                <div className="text-xs text-gray-500">Submitted: {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : 'N/A'}</div>
                                {s.caption && <div className="text-sm text-gray-800 mt-2">{s.caption}</div>}
                              </div>
                              <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">rejected</span>
                            </div>
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
                        ))
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


