import { useEffect, useState } from 'react'
import { ref as dbRef, get, set, remove } from 'firebase/database'
import { db } from '../firebase'
import NavBar from './NavBar'
import ImageModal from './ImageModal'
import { useAuth } from '../contexts/AuthContext'
import { logActivity } from '../utils/logActivity'

function ManageCampaigns() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [filter, setFilter] = useState('all')
  const [fullscreenImage, setFullscreenImage] = useState(null)
  const [userProfiles, setUserProfiles] = useState({})
  const [campaignStatus, setCampaignStatus] = useState({ startDate: '', endDate: '' })
  const [savingStatus, setSavingStatus] = useState(false)
  const { userData } = useAuth()

  // Modal state
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [voteModalMessage, setVoteModalMessage] = useState('')
  const [voteModalError, setVoteModalError] = useState('')

  

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
          list.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
          setSubmissions(list)
        } else {
          setSubmissions([])
        }

        // Load user profiles
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
      </div>
    )
  }

  if (userData?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
            <h1 className="text-xl font-bold text-red-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    )
  }
  const updateStatus = async (s, status) => {
    try {
      setSavingId(s.id)
      const ref = dbRef(db, `campaignSubmissions/${s.candidateId}/${s.id}`)
      await set(ref, { ...s, status, reviewedAt: new Date().toISOString() })
      setSubmissions(prev => prev.map(x => x.id === s.id ? { ...x, status, reviewedAt: new Date().toISOString() } : x))
      try {
        await logActivity(
          userData.name,
          `${status === 'approved' ? 'Approved' : 'Rejected'} campaign submission of ${s.candidateName || 'Unknown'}`
        )
      } catch (logError) {
        console.error('Logging failed:', logError)
      }
    } finally {
      setSavingId('')
    }
  }

  const deleteSubmission = async (s) => {
    try {
      setSavingId(s.id)
      await remove(dbRef(db, `campaignSubmissions/${s.candidateId}/${s.id}`))
      setSubmissions(prev => prev.filter(x => x.id !== s.id))
      try {
      await logActivity(
        userData.name,
        `Deleted campaign submission of ${s.candidateName || 'Unknown'}`
      )
      } catch (logError) {
        console.error('Logging failed:', logError)
      }
    } finally {
      setSavingId('')
    }
  }

  const handleSaveCampaignSettings = async () => {
    setSavingStatus(true)
    try {
      const now = new Date()
      const start = new Date(campaignStatus.startDate)
      const end = new Date(campaignStatus.endDate)

      // Validation rules
      if (!campaignStatus.startDate || !campaignStatus.endDate) {
        throw new Error('Please set both start and end date/time.')
      }
      if (start < now) {
        throw new Error('Start date/time cannot be in the past.')
      }
      if (end <= start) {
        throw new Error('End date/time must be later than start date/time.')
      }

      // Save campaign status if validation passes
      await set(dbRef(db, 'campaignStatus'), campaignStatus)

      try {
        const formatDate = (dateStr) => {
          const d = new Date(dateStr)
          return d.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long', // full month name
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        }

        await logActivity(
          userData.name,
          `Updated campaign period: ${formatDate(campaignStatus.startDate)} → ${formatDate(campaignStatus.endDate)}`
        )
      } catch (logError) {
        console.error('Logging failed:', logError)
      }


      setVoteModalError('')
      setVoteModalMessage('Campaign settings saved successfully!')
      setShowVoteModal(true)
    } catch (error) {
      console.error('Failed to save campaign status:', error.message)
      // Show the actual validation or Firebase error
      setVoteModalMessage('')
      setVoteModalError(error.message)
      setShowVoteModal(true)
    } finally {
      setSavingStatus(false)
    }
  }


  const renderSubmissionCard = (s) => {
    const userProfile = Object.values(userProfiles).find(user =>
      (user.email && s.submittedByEmail && user.email.toLowerCase() === s.submittedByEmail.toLowerCase()) ||
      (user.name && s.candidateName && user.name.toLowerCase() === s.candidateName.toLowerCase())
    )

    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }



    return (
      <div key={s.id} className="border rounded-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {userProfile?.profilePicture ? (
                <img className="h-12 w-12 rounded-full object-cover" src={userProfile.profilePicture} alt={s.candidateName || 'Candidate'} />
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
          <span className={`px-2 py-1 rounded text-xs ${statusColors[s.status || 'pending']}`}>{s.status || 'Pending'}</span>
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
          {s.status !== 'approved' && <button disabled={savingId === s.id} onClick={() => updateStatus(s, 'approved')} className={`px-3 py-1 rounded text-sm ${savingId === s.id ? 'bg-green-300 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}>Approve</button>}
          {s.status !== 'rejected' && <button disabled={savingId === s.id} onClick={() => updateStatus(s, 'rejected')} className={`px-3 py-1 rounded text-sm ${savingId === s.id ? 'bg-yellow-300 text-white' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}>Reject</button>}
          <button disabled={savingId === s.id} onClick={() => deleteSubmission(s)} className={`px-3 py-1 rounded text-sm ${savingId === s.id ? 'bg-red-300 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}>Delete</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-red-900">Manage Campaign</h1>
          <p className="text-gray-600 mt-1">Manage candidates campaign materials and campaign period</p>
        </div>
  
        <div className="px-4 py-6 sm:px-0">
            {/* Campaign Settings */}
            <div className="mb-8 border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Settings</h2>
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
                <button onClick={handleSaveCampaignSettings} disabled={savingStatus} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {savingStatus ? 'Saving…' : 'Save Settings'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
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

            {/* Submissions */}
            {loading ? (
              <div className="text-gray-500">Loading…</div>
            ) : (
              <div className="space-y-8">
                {(filter === 'all' || filter === 'pending') && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Pending</h2>
                    <div className="space-y-4">
                      {submissions.filter(s => (s.status || 'pending') === 'pending').length === 0 ? (
                        <div className="text-sm text-gray-500">No pending campaign materials.</div>
                      ) : (
                        submissions.filter(s => (s.status || 'pending') === 'pending').map(renderSubmissionCard)
                      )}
                    </div>
                  </div>
                )}

                {(filter === 'all' || filter === 'approved') && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Approved</h2>
                    <div className="space-y-4">
                      {submissions.filter(s => (s.status || 'pending') === 'approved').length === 0 ? (
                        <div className="text-sm text-gray-500">No approved campaign materials.</div>
                      ) : (
                        submissions.filter(s => (s.status || 'pending') === 'approved').map(renderSubmissionCard)
                      )}
                    </div>
                  </div>
                )}

                {(filter === 'all' || filter === 'rejected') && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Rejected</h2>
                    <div className="space-y-4">
                      {submissions.filter(s => (s.status || 'pending') === 'rejected').length === 0 ? (
                        <div className="text-sm text-gray-500">No rejected campaign materials.</div>
                      ) : (
                        submissions.filter(s => (s.status || 'pending') === 'rejected').map(renderSubmissionCard)
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          

          <ImageModal src={fullscreenImage} isOpen={!!fullscreenImage} onClose={() => setFullscreenImage(null)} />

          {/* Campaign / Vote Modal */}
          {showVoteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${voteModalError ? 'bg-red-100' : 'bg-green-100'}`}>
                      <svg className={`w-5 h-5 ${voteModalError ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={voteModalError ? 'M6 18L18 6M6 6l12 12' : 'M5 13l4 4L19 7'} />
                      </svg>
                    </div>
                    <div>
                      {voteModalMessage && <h4 className="text-lg font-semibold text-gray-900 mb-1">Success</h4>}
                      {voteModalError && <h4 className="text-lg font-semibold text-gray-900 mb-1">Update Failed</h4>}
                      <p className="text-gray-700">{voteModalMessage || voteModalError}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button onClick={() => setShowVoteModal(false)} className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ManageCampaigns
