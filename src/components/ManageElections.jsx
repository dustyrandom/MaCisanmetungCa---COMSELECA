import { useState, useEffect } from 'react'
import { ref as dbRef, get, set, push, update, remove } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar'
import { logActivity } from '../utils/logActivity'

function ManageElections() {
  const { userData } = useAuth()
  const [candidates, setCandidates] = useState([])
  const [approvedCandidates, setApprovedCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState(null)
  const [deletingCandidate, setDeletingCandidate] = useState(null)
  const [formData, setFormData] = useState({
    candidateId: '',
    team: '',
    role: ''
  })
  const [votingStatus, setVotingStatus] = useState({
    isActive: false,
    startDate: '',
    endDate: ''
  })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('candidates')
  const [showVoteModal, setShowVoteModal] = useState(false)
  const [voteModalMessage, setVoteModalMessage] = useState('')
  const [voteModalError, setVoteModalError] = useState('')
  const [dateError, setDateError] = useState("")
  // Voting page handles only voting

  const sscRoles = [
    'President','Vice President','General Secretary','Internal Secretary','External Secretary','Finance Officer','Audit Officer','Student Welfare and Rights Officer','Multimedia Officers','Editorial Officer','Logistics Officer'
  ]
  const iscRoles = ['Governor','Vice Governor','Board Member on Records','Board Member on Finance','Board Member on Audit','Board Member on Publication','Board Member on Public Relation','Board Member on Resources']

  const institutes = [
    'Institute of Arts and Sciences',
    'Institute of Business and Computing Education',
    'Institute of Teacher Education',
    'Institute of Hospitality and Tourism Management'
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load election candidates
        const candidatesRef = dbRef(db, 'Election')
        const candidatesSnapshot = await get(candidatesRef)
        if (candidatesSnapshot.exists()) {
          const data = candidatesSnapshot.val()
          const candidatesList = Object.keys(data).map(id => ({ id, ...data[id] }))
          setCandidates(candidatesList)
        }

        // Load approved candidates from candidacy applications
        const applicationsRef = dbRef(db, 'candidacyApplications')
        const applicationsSnapshot = await get(applicationsRef)
        if (applicationsSnapshot.exists()) {
          const applicationsData = applicationsSnapshot.val()
          const approvedList = []
          
          Object.keys(applicationsData).forEach(uid => {
            Object.keys(applicationsData[uid]).forEach(appId => {
              const app = applicationsData[uid][appId]
              if (app.status === 'approved') {
                approvedList.push({
                  id: `${uid}-${appId}`,
                  uid: uid,
                  appId: appId,
                  name: app.applicant?.name || 'Unknown',
                  email: app.applicant?.email || '',
                  institute: app.applicant?.institute || '',
                  studentId: app.applicant?.studentId || ''
                })
              }
            })
          })
          
          setApprovedCandidates(approvedList)
        }

        // Load voting status
        const votingStatusRef = dbRef(db, 'votingStatus')
        const votingStatusSnapshot = await get(votingStatusRef)
        if (votingStatusSnapshot.exists()) {
          const status = votingStatusSnapshot.val()
          setVotingStatus(status)
          
          // Check if voting should be active based on current time
          const now = new Date()
          const startDate = status.startDate ? new Date(status.startDate) : null
          const endDate = status.endDate ? new Date(status.endDate) : null
          
          let shouldBeActive = false
          if (startDate && endDate) {
            shouldBeActive = now >= startDate && now <= endDate
          } else if (startDate) {
            shouldBeActive = now >= startDate
          } else if (endDate) {
            shouldBeActive = now <= endDate
          }
          
          // Update status if it doesn't match
          if (shouldBeActive !== status.isActive) {
            const updatedStatus = { ...status, isActive: shouldBeActive }
            setVotingStatus(updatedStatus)
            await set(votingStatusRef, updatedStatus)
          }
        }

        // No other statuses here
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    
    if (!formData.candidateId) {
      alert('Please select a candidate')
      return
    }

    if (!formData.role) {
      alert('Please select a role')
      return
    }

    try {
      const selectedCandidate = approvedCandidates.find(c => c.id === formData.candidateId)
      if (!selectedCandidate) {
        alert('Selected candidate not found')
        return
      }

      const candidateData = {
        name: selectedCandidate.name,
        email: selectedCandidate.email,
        institute: selectedCandidate.institute,
        studentId: selectedCandidate.studentId,
        team: formData.team,
        role: formData.role,
        candidateUid: selectedCandidate.uid,
        candidateAppId: selectedCandidate.appId,
        createdAt: new Date().toISOString()
      }

      if (editingCandidate) {
        // Update existing candidate
        const candidateRef = dbRef(db, `Election/${editingCandidate.id}`)
        await update(candidateRef, candidateData)
        setCandidates(prev => prev.map(c => c.id === editingCandidate.id ? { ...c, ...candidateData } : c))
        try {
        await logActivity(userData.name, `Edited candidate: ${candidateData.name} (${candidateData.role} - ${candidateData.team})`)
        } catch (logError) {
        console.error('Logging failed:', logError)
        }
      } else {
        // Add new candidate
        const newCandidateRef = dbRef(db, 'Election')
        const newRef = await push(newCandidateRef, candidateData)
        const newId = newRef.key
        setCandidates(prev => [...prev, { id: newId, ...candidateData }])
        try {
        await logActivity(userData.name, `Added new candidate: ${candidateData.name} (${candidateData.role} - ${candidateData.team})`)
        } catch (logError) {
        console.error('Logging failed:', logError)
        }
      }

      setFormData({
        candidateId: '',
        team: '',
        role: ''
      })
      setShowAddModal(false)
      setEditingCandidate(null)
    } catch (error) {
      console.error('Failed to save candidate:', error)
      alert('Failed to save candidate. Please try again.')
    }
  }

  const handleEdit = (candidate) => {
    setFormData({
      candidateId: candidate.candidateUid ? `${candidate.candidateUid}-${candidate.candidateAppId}` : '',
      team: candidate.team,
      role: candidate.role
    })
    setEditingCandidate(candidate)
    setShowAddModal(true)
  }

  const handleDelete = (candidate) => {
    setDeletingCandidate(candidate)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingCandidate) return
    
    try {
      const candidateRef = dbRef(db, `Election/${deletingCandidate.id}`)
      await remove(candidateRef)
      setCandidates(prev => prev.filter(c => c.id !== deletingCandidate.id))

      try {
      await logActivity(userData.name, `Deleted candidate: ${deletingCandidate.name} (${deletingCandidate.role} - ${deletingCandidate.team}) `)
      } catch (logError) {
      console.error('Failed to log activity:', logError)
      }

      setShowDeleteModal(false)
      setDeletingCandidate(null)
    } catch (error) {
      console.error('Failed to delete candidate:', error)
      alert('Failed to delete candidate. Please try again.')
    }
  }

  const getRoleCategory = (role) => {
    if (sscRoles.includes(role)) return 'SSC'
    if (iscRoles.includes(role)) return 'ISC'
    return ''
  }

  const checkVotingStatus = () => {
    const now = new Date()
    const startDate = votingStatus.startDate ? new Date(votingStatus.startDate) : null
    const endDate = votingStatus.endDate ? new Date(votingStatus.endDate) : null
    
    let shouldBeActive = false
    
    if (startDate && endDate) {
      shouldBeActive = now >= startDate && now <= endDate
    } else if (startDate) {
      shouldBeActive = now >= startDate
    } else if (endDate) {
      shouldBeActive = now <= endDate
    }
    
    if (shouldBeActive !== votingStatus.isActive) {
      const newStatus = { ...votingStatus, isActive: shouldBeActive }
      setVotingStatus(newStatus)
      
      // Update in database
      const statusRef = dbRef(db, 'votingStatus')
      set(statusRef, newStatus)
    }
  }

  {/*
    const handleToggleVoting = async () => {
    setSaving(true)
    try {
      const newStatus = { ...votingStatus, isActive: !votingStatus.isActive }
      const statusRef = dbRef(db, 'votingStatus')
      await set(statusRef, newStatus)
      setVotingStatus(newStatus)
      setVoteModalError('')
      setVoteModalMessage(`Voting ${newStatus.isActive ? 'started' : 'stopped'} successfully!`)
      setShowVoteModal(true)
    } catch (error) {
      console.error('Failed to toggle voting:', error)
      setVoteModalMessage('')
      setVoteModalError('Failed to update voting status. Please try again.')
      setShowVoteModal(true)
    } finally {
      setSaving(false)
    }
  }  
  */}
  

  const handleSaveVotingSettings = async () => {
    setSaving(true)
    try {
      const now = new Date()
      const start = votingStatus.startDate ? new Date(votingStatus.startDate) : null
      const end = votingStatus.endDate ? new Date(votingStatus.endDate) : null

      // Validate start date
      if (start && start < now) {
        setVoteModalMessage("")
        setVoteModalError("Start date/time cannot be in the past.")
        setShowVoteModal(true)
        setSaving(false)
        return
      }

      // Validate end date
      if (end && end < now) {
        setVoteModalMessage("")
        setVoteModalError("End date/time cannot be in the past.")
        setShowVoteModal(true)
        setSaving(false)
        return
      }

      // Validate start = end
      if (start && end && start.getTime() === end.getTime()) {
        setVoteModalMessage("")
        setVoteModalError("Start and end date/time cannot be the same.")
        setShowVoteModal(true)
        setSaving(false)
        return
      }

      // Validate start > end
      if (start && end && start > end) {
        setVoteModalMessage("")
        setVoteModalError("Start date/time cannot be later than end date/time.")
        setShowVoteModal(true)
        setSaving(false)
        return
      }

      await set(dbRef(db, 'votingStatus'), votingStatus)

      try {
        const formatDate = (dateStr) => {
          const d = new Date(dateStr)
          return d.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
        }

        await logActivity(
          userData.name,
          `Updated voting period: ${formatDate(votingStatus.startDate)} → ${formatDate(votingStatus.endDate)}`
        )
      } catch (logError) {
        console.error('Logging failed:', logError)
      }

      setVoteModalError("")
      setVoteModalMessage("Voting settings saved successfully!")
      setShowVoteModal(true)
    } catch (error) {
      console.error("Failed to save voting status:", error)
      setVoteModalMessage("")
      setVoteModalError("Failed to save voting settings. Please try again.")
      setShowVoteModal(true)
    } finally {
      setSaving(false)
    }
  }


  if (userData?.role !== 'admin') {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-red-900">Manage Elections</h1>
          <p className="text-gray-600 mt-1">Manage candidates and voting period</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('candidates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'candidates'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Manage Candidates
              </button>
              <button
                onClick={() => setActiveTab('voting')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'voting'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Manage Voting
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'candidates' && (
          <>
            <div className="mb-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Candidate
              </button>
            </div>

          </>
        )}

        {activeTab === 'voting' && (
          <div className="space-y-6">
            {/* Voting Controls */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Voting Controls</h3>
              
              {/*<div className="flex items-center gap-4 mb-6">
                <button
                  onClick={handleToggleVoting}
                  disabled={saving}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    votingStatus.isActive 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {saving ? 'Updating...' : (votingStatus.isActive ? 'Stop Voting' : 'Start Voting')}
                </button>
                <span className="text-sm text-gray-600">
                  {votingStatus.isActive ? 'Voting is currently active' : 'Voting is currently inactive'}
                </span>
              </div>*/}

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={votingStatus.startDate}
                      onChange={(e) => setVotingStatus(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={votingStatus.endDate}
                      onChange={(e) => setVotingStatus(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveVotingSettings}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
            

            {/* Appointment/Campaign controls moved to their own pages */}
          </div>
        )}

        {/* Candidates List - Only show in candidates tab */}
        {activeTab === 'candidates' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-red-900 mb-6">SUPREME STUDENT COUNCIL CANDIDATES</h2>
              {sscRoles.map(role => {
                const roleCandidates = candidates.filter(c => c.role === role)
                return (
                  <div key={role} className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{role}</h3>
                    {roleCandidates.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roleCandidates.map(candidate => (
                          <div key={candidate.id} className="bg-white rounded-lg shadow-md p-4">
                            <h4 className="font-semibold">{candidate.name}</h4>
                            <p className="text-sm text-gray-600">{candidate.email}</p>
                            <p className="text-sm text-gray-600">{candidate.studentId}</p>
                            <p className="text-sm text-gray-600">{candidate.institute}</p>
                            {candidate.team && (
                              <p className="text-sm text-purple-600">Party: {candidate.team}</p>
                            )}
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => handleEdit(candidate)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(candidate)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className=" text-red-800 italic text-sm">No candidates for this position yet.</p>
                    )}
                  </div>
                )
              })}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-red-900 mb-6">INSTITUTE STUDENT COUNCIL CANDIDATES</h2>
              {institutes.map(institute => {
                const instituteCandidates = candidates.filter(c => getRoleCategory(c.role) === 'ISC' && c.institute === institute)
                return (
                  <div key={institute} className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">{institute}</h3>
                    {instituteCandidates.length > 0 ? (
                      <div className="space-y-6">
                        {iscRoles.map(role => {
                          const roleCandidates = instituteCandidates.filter(c => c.role === role)
                          return (
                            <div key={role}>
                              <h4 className="text-md font-semibold text-gray-700 mb-3">{role}</h4>
                              {roleCandidates.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {roleCandidates.map(candidate => (
                                    <div key={candidate.id} className="bg-white rounded-lg shadow-md p-4">
                                      <h5 className="font-semibold">{candidate.name}</h5>
                                      <p className="text-sm text-gray-600">{candidate.email}</p>
                                      <p className="text-sm text-gray-600">{candidate.studentId}</p>
                                      {candidate.team && (
                                        <p className="text-sm text-purple-600">Party: {candidate.team}</p>
                                      )}
                                      <div className="mt-3 flex gap-2">
                                        <button
                                          onClick={() => handleEdit(candidate)}
                                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDelete(candidate)}
                                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className=" text-red-800 italic text-sm">No candidates for this position yet.</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className=" text-red-800 italic text-sm">No candidates for this institute yet.</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Voting Status Modal */}
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
                <button
                  onClick={() => setShowVoteModal(false)}
                  className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingCandidate(null)
                    setFormData({
                      candidateId: '',
                      team: '',
                      role: ''
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Approved Candidate</label>
                    <select
                      value={formData.candidateId}
                      onChange={(e) => setFormData(prev => ({ ...prev, candidateId: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                      required
                    >
                      <option value="">Select Candidate</option>
                      {approvedCandidates.map(candidate => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.name} - {candidate.institute}{candidate.studentId ? ` (${candidate.studentId})` : ''}
                        </option>
                      ))}
                    </select>
                    {approvedCandidates.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">No approved candidates available. Approve candidacy applications first.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
                    <input
                      type="text"
                      value={formData.team}
                      onChange={(e) => setFormData(prev => ({ ...prev, team: e.target.value }))}
                      placeholder="e.g., Team Alpha, Blue Party, etc."
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                      required
                    >
                      <option value="">Select position</option>
                      <optgroup label="SSC">
                        {sscRoles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </optgroup>
                      <optgroup label="ISC">
                        {iscRoles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    {editingCandidate ? 'Update' : 'Add'} Candidate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setEditingCandidate(null)
                      setFormData({
                        candidateId: '',
                        team: '',
                        role: ''
                      })
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Delete Candidate</h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeletingCandidate(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Are you sure you want to delete this candidate?</p>
                    <p className="text-sm text-gray-500">This action cannot be undone.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Delete Candidate
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeletingCandidate(null)
                  }}
                  className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageElections
