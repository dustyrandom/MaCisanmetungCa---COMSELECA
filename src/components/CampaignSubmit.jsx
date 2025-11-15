import { useEffect, useMemo, useState } from 'react'
import { ref as dbRef, get, push, set } from 'firebase/database'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar'
import ImageModal from './ImageModal'

function CampaignSubmit() {
  const { user, userData } = useAuth()
  const [candidateRecord, setCandidateRecord] = useState(null)
  const [loading, setLoading] = useState(true)
  const [caption, setCaption] = useState('')
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState(null)
  const [campaignStatus, setCampaignStatus] = useState({ isActive: false, startDate: '', endDate: '' })
  const hasPending = useMemo(() => history.some(h => (h.status || 'pending') === 'pending'), [history])

  useEffect(() => {
    const loadCandidate = async () => {
      try {
        if (!user) return
        const snap = await get(dbRef(db, 'candidates'))
        if (snap.exists()) {
          const list = Object.entries(snap.val()).map(([id, v]) => ({ id, ...v }))
          // Try to match by email first, fallback to name
          const found = list.find(c => (c.email || '').toLowerCase() === (user.email || '').toLowerCase()) ||
                        list.find(c => (c.fullName || '').toLowerCase() === (userData?.fullName || '').toLowerCase())
          setCandidateRecord(found || null)
        } else {
          setCandidateRecord(null)
        }
      } catch (e) {
        console.error('Failed to resolve candidate record', e)
      } finally {
        setLoading(false)
      }
    }
    loadCandidate()
  }, [user, userData])

  // Load campaign status
  useEffect(() => {
    const loadWindow = async () => {
      try {
        const snap = await get(dbRef(db, 'campaignStatus'))
        if (snap.exists()) setCampaignStatus(snap.val())
      } catch (e) {
        console.error('Failed to load campaign status', e)
      }
    }
    loadWindow()
  }, [])

  // Load submission history when candidate resolved
  useEffect(() => {
    const loadHistory = async () => {
      if (!candidateRecord?.id) return
      setLoadingHistory(true)
      try {
        const snap = await get(dbRef(db, `campaignSubmissions/${candidateRecord.id}`))
        if (snap.exists()) {
          const val = snap.val()
          const list = Object.entries(val).map(([id, v]) => ({ id, ...v }))
          list.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
          setHistory(list)
        } else {
          setHistory([])
        }
      } catch (e) {
        console.error('Failed to load campaign history', e)
        setHistory([])
      } finally {
        setLoadingHistory(false)
      }
    }
    loadHistory()
  }, [candidateRecord?.id])

  const handleFileChange = (e) => {
    const list = Array.from(e.target.files || [])
    setFiles(list)
  }

  const hasProfilePic = !!(userData && userData.profilePicture)
  const canSubmit = useMemo(() => !!candidateRecord && hasProfilePic && files.length > 0 && !submitting && !hasPending, [candidateRecord, hasProfilePic, files, submitting, hasPending])
  const nowInWindow = (() => {
    if (!campaignStatus?.startDate || !campaignStatus?.endDate) return campaignStatus?.isActive || false
    try {
      const now = new Date()
      const start = new Date(campaignStatus.startDate)
      const end = new Date(campaignStatus.endDate)
      return now >= start && now <= end
    } catch { return true }
  })()
  const uploadDisabled = hasPending || !hasProfilePic || !candidateRecord || !nowInWindow

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!candidateRecord) {
      setError('Please contact admin to link your candidacy.')
      return
    }
    if (!hasProfilePic) {
      setError('Please upload a profile picture in your Profile page before submitting campaign materials.')
      return
    }
    if (!nowInWindow) {
      setError('Campaign submissions are currently closed. Please check the schedule.')
      return
    }
    if (files.length === 0) {
      setError('Please select at least one image or video.')
      return
    }
    try {
      setSubmitting(true)
      // Create submission entry
      const submissionsListRef = dbRef(db, `campaignSubmissions/${candidateRecord.id}`)
      const submissionRef = push(submissionsListRef)
      const submissionId = submissionRef.key
      const uploaded = []
      for (const file of files) {
        const path = `campaignMedia/${candidateRecord.id}/${submissionId}/${file.name}`
        const sRef = storageRef(storage, path)
        await uploadBytes(sRef, file)
        const url = await getDownloadURL(sRef)
        const type = file.type.startsWith('video') ? 'video' : 'image'
        uploaded.push({ url, type, name: file.name, path })
      }
      const payload = {
        candidateId: candidateRecord.id,
        candidateName: (candidateRecord.fullName || userData?.fullName || ''),
        position: candidateRecord.position || '',
        institute: (candidateRecord.institute || userData?.institute || ''),
        team: candidateRecord.team || '',
        submittedBy: user?.uid || '',
        submittedByEmail: user?.email || '',
        caption: caption || '',
        media: uploaded,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      }
      await set(submissionRef, payload)
      setMessage('Submitted for approval. You will see it publicly once approved by admin.')
      setFiles([])
      setCaption('')
      // Refresh history
      const snap = await get(dbRef(db, `campaignSubmissions/${candidateRecord.id}`))
      if (snap.exists()) {
        const val = snap.val()
        const list = Object.entries(val).map(([id, v]) => ({ id, ...v }))
        list.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0))
        setHistory(list)
      }
    } catch (e) {
      console.error('Failed to submit campaign', e)
      setError('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (userData?.role !== 'candidate') {
      return (
        <div className="min-h-screen bg-gray-50">
          <NavBar />
          <div className="pt-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
                <h1 className="text-xl font-bold text-red-900 mb-4">Access Denied</h1>
                <p className="text-gray-600">You don't have permission to access this page.</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Campaign Materials</h1>
            <p className="text-gray-600">Upload your campaign images or videos for admin approval</p>
          </div>

          {hasPending && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Submission Pending Review</h3>
                  <p className="text-sm text-yellow-700">You can submit new materials once your current submission is approved or rejected.</p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-gray-500">Loading candidate profile…</div>
          ) : candidateRecord ? null : (
            <div className="mb-4 text-sm text-red-600">Candidate profile not found for this account.</div>
          )}
          {!nowInWindow && (
            <div className="mb-4 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-3">
              Campaign submission is closed. Please check back later.
            </div>
          )}
          {!loading && candidateRecord && !hasProfilePic && (
            <div className="mb-4 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-3">
              A profile picture is required for campaign submissions. Go to <a href="/profile" className="underline font-medium">Profile</a> to upload one.
            </div>
          )}

          {message && <div className="mb-4 text-green-700 bg-green-50 border border-green-200 rounded p-3 text-sm">{message}</div>}
          {error && <div className="mb-4 text-red-700 bg-red-50 border border-red-200 rounded p-3 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Caption (optional)</label>
              <textarea 
                value={caption} 
                onChange={e => setCaption(e.target.value)} 
                disabled={hasPending} 
                className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 ${hasPending ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed' : 'border-gray-300 hover:border-gray-400'}`} 
                rows={4} 
                placeholder="Write a compelling caption for your campaign materials..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Media</label>
              <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${uploadDisabled ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-red-400 hover:bg-red-50'}`}>
                <div className="space-y-2">
                  <svg className={`w-12 h-12 mx-auto ${uploadDisabled ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <div>
                    <label className={`cursor-pointer ${uploadDisabled ? 'cursor-not-allowed' : ''}`}>
                      <span className={`text-sm font-medium ${uploadDisabled ? 'text-gray-400' : 'text-red-600 hover:text-red-500'}`}>
                        {uploadDisabled ? 'Upload disabled' : 'Click to upload'}
                      </span>
                      <input 
                        type="file" 
                        accept="image/*,video/*" 
                        multiple 
                        onChange={handleFileChange} 
                        disabled={uploadDisabled}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF, MP4 up to 10MB each</p>
                </div>
              </div>
              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {files.map((f, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs text-gray-700 truncate">{f.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="pt-4">
              <button 
                disabled={!canSubmit} 
                className={`w-full py-3 px-6 rounded-lg font-medium text-sm transition-all duration-200 ${
                  canSubmit 
                    ? 'bg-red-800 text-white hover:bg-red-900 hover:shadow-lg transform hover:-translate-y-0.5' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {submitting ? 'Submitting…' : 'Submit for Approval'}
              </button>
            </div>
          </form>
        </div>

        {/* History */}
        <div className="mt-8 bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Submission History</h2>
            {loadingHistory && <span className="text-sm text-gray-500">Loading…</span>}
          </div>
          {history.length === 0 ? (
            <div className="text-sm text-gray-500">No submissions yet.</div>
          ) : (
            <div className="space-y-4">
              {history.map(h => (
                <div key={h.id} className="border rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-gray-600">Submitted: {h.submittedAt ? new Date(h.submittedAt).toLocaleString() : 'N/A'}</div>
                      {h.reviewedAt && <div className="text-xs text-gray-500">Reviewed: {new Date(h.reviewedAt).toLocaleString()}</div>}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium uppercase
                        ${
                          h.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : h.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {h.status || 'pending'}
                    </span>
                  </div>
                  {h.caption && <div className="mt-2 text-sm text-gray-800">{h.caption}</div>}
                  {Array.isArray(h.media) && h.media.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {h.media.map((m, i) => (
                        <div key={i} className="border rounded overflow-hidden bg-gray-50">
                          {m.type === 'video' ? (
                            <video src={m.url} controls className="w-full h-36 object-cover" />
                            ) : (
                              <img 
                                src={m.url} 
                                alt={m.name || ''} 
                                className="w-full h-36 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
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
        </div>

        <ImageModal 
          src={fullscreenImage} 
          isOpen={!!fullscreenImage} 
          onClose={() => setFullscreenImage(null)} 
        />
      </div>
    </div>
  )
}

export default CampaignSubmit



