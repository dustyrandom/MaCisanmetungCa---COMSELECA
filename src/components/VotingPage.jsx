import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar'
import { ref as dbRef, get, set } from 'firebase/database'
import { db } from '../firebase'

function VotingPage() {
  const { user, userData } = useAuth()
  const [currentPage, setCurrentPage] = useState(1) // 1 = SSC, 2 = ISC, 3 = Review
  const [candidates, setCandidates] = useState([])
  const [votes, setVotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [votingStatus, setVotingStatus] = useState({
    isActive: false,
    startDate: '',
    endDate: ''
  })
  const [hasVoted, setHasVoted] = useState(false)

  const sscPositions = [
    { name: 'President', maxVotes: 1 },
    { name: 'Vice President', maxVotes: 1 },
    { name: 'General Secretary', maxVotes: 1 },
    { name: 'Internal Secretary', maxVotes: 1 },
    { name: 'External Secretary', maxVotes: 1 },
    { name: 'Finance Officer', maxVotes: 1 },
    { name: 'Audit Officer', maxVotes: 1 },
    { name: 'Student Welfare and Rights Officer', maxVotes: 1 },
    { name: 'Multimedia Officers', maxVotes: 3 },
    { name: 'Editorial Officer', maxVotes: 1 },
    { name: 'Logistics Officer', maxVotes: 2 }
  ]

  const iscPositions = [
    { name: 'Governor', maxVotes: 1 },
    { name: 'Vice Governor', maxVotes: 1 },
    { name: 'Board Member on Records', maxVotes: 1 },
    { name: 'Board Member on Finance', maxVotes: 1 },
    { name: 'Board Member on Audit', maxVotes: 1 },
    { name: 'Board Member on Publication', maxVotes: 1 },
    { name: 'Board Member on Public Relation', maxVotes: 1 },
    { name: 'Board Member on Resources', maxVotes: 1 }
  ]

  useEffect(() => {
  const loadCandidates = async () => {
    try {
      const candidatesRef = dbRef(db, 'candidates')
      const usersRef = dbRef(db, 'users')

      const [candidatesSnap, usersSnap] = await Promise.allSettled([
        get(candidatesRef),
        get(usersRef)
      ])

      let candidatesData = {}
      let usersData = {}

      if (candidatesSnap.status === 'fulfilled' && candidatesSnap.value.exists()) {
        candidatesData = candidatesSnap.value.val()
      }

      if (usersSnap.status === 'fulfilled' && usersSnap.value.exists()) {
        usersData = usersSnap.value.val()
      }

      const mergedCandidates = Object.keys(candidatesData).map(id => {
        const c = candidatesData[id]
        const matchingUser = Object.values(usersData).find(
          u =>
            (u.email && u.email.toLowerCase() === (c.email || '').toLowerCase()) ||
            (u.studentId && u.studentId === c.studentId)
        )

        const profilePicture =
          (matchingUser && matchingUser.profilePicture) ||
          c.profilePicture ||
          null

        return {
          id,
          ...c,
          profilePicture,
          fullName: c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim(),
        }
      })

      setCandidates(mergedCandidates)
      // ---- Load voting status ----
      const votingStatusRef = dbRef(db, 'votingStatus')
      const votingStatusSnapshot = await get(votingStatusRef)
      if (votingStatusSnapshot.exists()) {
        const status = votingStatusSnapshot.val()
        setVotingStatus(status)
      }

      // ---- Check if user has already voted ----
      if (user) {
        const userVoteRef = dbRef(db, `electionVotes/${user.uid}`)
        const userVoteSnapshot = await get(userVoteRef)
        if (userVoteSnapshot.exists()) {
          setHasVoted(true)
          setSubmitted(true)
        }
      }

    } catch (error) {
      console.error('Failed to load candidates:', error)
    } finally {
      setLoading(false) // ensures spinner stops no matter what
    }
  }
  loadCandidates()
}, [user])


  const getCandidatesForPosition = (positionName, page) => {
    if (page === 1) {
      // SSC roles
      return candidates.filter(c => c.position === positionName && sscPositions.some(position => position.name === c.position))
    } else {
      // ISC roles
      return candidates.filter(c => c.position === position && iscPositions.some(position => position.name === c.position))
    }
  }

  const getCandidatesForInstitute = (institute) => {
    return candidates.filter(c => iscPositions.some(position => position.name === c.position) && c.institute === institute)
  }

  const handleVote = (position, candidateId, maxVotes = 1) => {
    setVotes(prev => {
      const newVotes = { ...prev }
      
      if (maxVotes > 1) {
        // Multi-select roles
        if (!newVotes[position]) newVotes[position] = []
        const currentVotes = newVotes[position] || []
        
        if (currentVotes.includes(candidateId)) {
          newVotes[position] = currentVotes.filter(id => id !== candidateId)
        } else {
          if (currentVotes.length < maxVotes) {
            newVotes[position] = [...currentVotes, candidateId]
          }
        }
      } else {
        if (newVotes[position] === candidateId) {
        // Deselect if clicking the same candidate again
        newVotes[position] = null
      } else {
        newVotes[position] = candidateId
      }
      }
      
      return newVotes
    })
  }

  const submitVotes = async () => {
    try {
      const voteData = {
        voterId: user.uid,
        voterName: userData.fullName,
        voterEmail: user.email,
        voterstudentId: userData.studentId,
        voterInstitute: userData.institute,
        votes: votes,
        submittedAt: new Date().toISOString()
      }
      
      const voteRef = dbRef(db, `electionVotes/${user.uid}`)
      await set(voteRef, voteData)
      setSubmitted(true)
      setHasVoted(true)

      // Send thank-you email with announcement date
      try {
        const emailServerUrl = import.meta.env.VITE_EMAIL_SERVER_URL || 'http://localhost:3000'
        await fetch(`${emailServerUrl}/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            status: 'voteThankYou',
            fullName: userData.fullName,
            details: { announcementDate: votingStatus?.endDate ? new Date(votingStatus.endDate).toLocaleString() : '' }
          })
        })
      } catch (e) {
        // don't block success on email failure
        console.error('Failed to send thank-you email', e)
      }
    } catch (error) {
      console.error('Failed to submit votes:', error)
    }
  }

  const renderSSCPage = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-900 mb-2">Supreme Student Council (SSC)</h2>
        <p className="text-gray-600">Select your candidates for each position</p>
      </div>

      {sscPositions.map(position => {
        const positionCandidates = getCandidatesForPosition(position.name, 1)
        const isMultiSelect = position.maxVotes > 1
        const currentVotes = votes[position.name] || []
        const selectedCount = Array.isArray(currentVotes) ? currentVotes.length : (currentVotes ? 1 : 0)
        
        return (
          <div key={position.name} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{position.name}</h3>
              <span className="text-sm text-gray-600">
                {selectedCount}/{position.maxVotes} selected
              </span>
            </div>
            {isMultiSelect && (
              <p className="text-sm text-gray-600 mb-4">Select up to {position.maxVotes} candidates</p>
            )}
            
            {positionCandidates.length === 0 ? (
              <p className="text-gray-500 italic">No candidates for this position</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {positionCandidates.map(candidate => {
                  const isSelected = isMultiSelect 
                    ? currentVotes.includes(candidate.id)
                    : currentVotes === candidate.id
                  
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => handleVote(position.name, candidate.id, position.maxVotes)}
                      className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >

                      <div className="flex-shrink-0">
                        {candidate.profilePicture ? (
                          <img src={candidate.profilePicture} alt="Profile" className="h-24 w-24 rounded-full object-cover border-4 border-gray-200" />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-red-900 text-white flex items-center justify-center text-2xl font-bold border-4 border-gray-200">
                            {(candidate.fullName || 'U').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="font-medium">{candidate.lastName}, {candidate.firstName}</h4>
                        <p className="text-sm text-gray-600">{candidate.institute}</p>
                        <p className="text-sm text-green-600">Party: {candidate.team ? candidate.team: 'Independent'}</p>
                        {/* {isSelected && (
                          <p className="text-sm text-blue-600 font-medium mt-2">✓ Selected</p>
                        )} */}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  const renderISCPage = () => {
    // Use the actual institute list from register page
    const allInstitutes = [
      'INSTITUTE OF ARTS AND SCIENCES',
      'INSTITUTE OF BUSINESS AND COMPUTING EDUCATION',
      'INSTITUTE OF TEACHER EDUCATION',
      'INSTITUTE OF HOSPITALITY AND TOURISM MANAGEMENT'
    ]
    
    // Filter to show only the user's institute
    const userInstitute = userData?.institute
    const institutesToShow = userInstitute ? [userInstitute] : allInstitutes
    
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-900 mb-2">Institute Student Council (ISC)</h2>
          <p className="text-gray-600">
            {userInstitute ? `Select your candidates for ${userInstitute}` : 'Select your candidates by institute'}
          </p>
        </div>

        {institutesToShow.map(institute => (
          <div key={institute} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-6 text-red-900">{institute}</h3>
            
            {iscPositions.map(position => {
              const positionCandidates = getCandidatesForInstitute(institute).filter(c => c.position === position.name)
              const currentVotes = votes[`${institute}-${position.name}`]
              const selectedCount = currentVotes ? 1 : 0
              
              return (
                <div key={`${institute}-${position.name}`} className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-medium">{position.name}</h4>
                    <span className="text-sm text-gray-600">
                      {selectedCount}/{position.maxVotes} selected
                    </span>
                  </div>
                  
                  {positionCandidates.length === 0 ? (
                    <p className="text-gray-500 italic">No candidates for this position</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {positionCandidates.map(candidate => {
                        const isSelected = currentVotes === candidate.id
                        
                        return (
                          <div
                            key={candidate.id}
                            onClick={() => handleVote(`${institute}-${position.name}`, candidate.id, position.maxVotes)}
                            className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex-shrink-0">
                              {candidate.profilePicture ? (
                                <img src={candidate.profilePicture} alt="Profile" className="h-24 w-24 rounded-full object-cover border-4 border-gray-200" />
                              ) : (
                                <div className="h-24 w-24 rounded-full bg-red-900 text-white flex items-center justify-center text-2xl font-bold border-4 border-gray-200">
                                  {(candidate.fullName || 'U').slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <h5 className="font-medium">{candidate.lastName}, {candidate.firstName}</h5>
                              <p className="text-sm text-green-600">Party: {candidate.team ? candidate.team: 'Independent'}</p>
                              {/* {isSelected && (
                                <p className="text-sm text-blue-600 font-medium mt-2">✓ Selected</p>
                              )} */}
                            </div>
                            
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  const renderReviewPage = () => {
    const allVotes = votes || {}

    const getCandidateById = (id) => candidates.find(c => c.id === id)

    const renderCandidateCard = (candidate) => (
      <div
        key={candidate.id}
        className="flex items-center gap-4 p-4 border-2 rounded-lg bg-blue-50 border-blue-400"
      >
        <div className="flex-shrink-0">
          {candidate.profilePicture ? (
            <img src={candidate.profilePicture} alt="Profile" className="h-24 w-24 rounded-full object-cover border-4 border-gray-200" />
          ) : (
            <div className="h-24 w-24 rounded-full bg-red-900 text-white flex items-center justify-center text-2xl font-bold border-4 border-gray-200">
              {(candidate.fullName || 'U').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h4 className="font-medium">{candidate.lastName}, {candidate.firstName}</h4>
          <p className="text-sm text-gray-600">{candidate.institute}</p>
          <p className="text-sm text-green-600">Party: {candidate.team ? candidate.team : 'Independent'}</p>
        </div>
      </div>
    )

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-900 mb-2">Review Your Votes</h2>
          <p className="text-gray-600">Please review your selections before submitting.</p>
        </div>

        {/* SSC Votes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-red-900 mb-4">Student Supreme Council (SSC)</h3>
          {sscPositions.map(position => {
            const selected = allVotes[position.name]
            if (!selected || (Array.isArray(selected) && selected.length === 0)) return null

            const selectedCandidates = Array.isArray(selected)
              ? selected.map(id => getCandidateById(id)).filter(Boolean)
              : [getCandidateById(selected)].filter(Boolean)

            return (
              <div key={position.name} className="mb-6">
                <h4 className="font-medium mb-2">{position.name}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedCandidates.map(c => renderCandidateCard(c))}
                </div>
              </div>
            )
          })}
        </div>

        {/* ISC Votes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-red-900 mb-4">Institute Student Council (ISC)</h3>
          {Object.keys(allVotes)
            .filter(key => key.includes('-')) // institute-based keys
            .map(key => {
              const selectedId = allVotes[key]
              const candidate = getCandidateById(selectedId)
              if (!candidate) return null

              const [institute, position] = key.split('-')
              return (
                <div key={key} className="mb-6">
                  <h4 className="font-medium mb-2">{position} - <span className="text-gray-600">{institute}</span></h4>
                  {renderCandidateCard(candidate)}
                </div>
              )
            })}
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

  // Show message if user has already voted
  if (hasVoted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-green-900 mb-2">Vote Submitted Successfully</h1>
                <p className="text-gray-600 mb-4">
                  Thank you for participating in the election. Your vote has been recorded.
                </p>
                <p className="text-sm text-gray-500">
                  You can only vote once per election period.
                </p>
              </div>
              <a
                href="/dashboard"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show voting status message if voting is not active
  
    const now = new Date()
    const startDate = votingStatus.startDate ? new Date(votingStatus.startDate) : null
    const endDate = votingStatus.endDate ? new Date(votingStatus.endDate) : null

    let votingState = 'active'
    if (startDate && now < startDate) votingState = 'notStarted'
    else if (endDate && now > endDate) votingState = 'ended'
    
    if (votingState !== 'active') {
      let statusTitle = ''
      let statusMessage = ''
      let iconColor = 'text-red-600'
      let bgColor = 'bg-red-100'

    if (votingState === 'notStarted') {
      statusTitle = 'Voting Has Not Started'
      statusMessage = 'Voting has not started yet. Please check the commission announcements.'
    } else if (votingState === 'ended') {
      statusTitle = 'Voting Is Now Closed'
      statusMessage = endDate
        ? `Voting officially closed on ${endDate.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`
        : 'Voting officially closed.'
      iconColor = 'text-gray-600'
      bgColor = 'bg-gray-100'
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
              <div className="mb-6">
                <div className={`w-16 h-16 ${votingState === 'ended' ? 'bg-red-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {votingState === 'ended' ? (
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-red-900 mb-2">{statusTitle}</h1>
                <p className="text-gray-600">{statusMessage}</p>
              </div>
              <a
                href="/dashboard"
                className="inline-block bg-red-900 text-white px-6 py-3 rounded-lg hover:bg-red-800 transition-colors"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <h1 className="text-2xl font-bold text-green-600 mb-4">Vote Submitted Successfully!</h1>
              <p className="text-gray-600 mb-6">Thank you for participating in the election.</p>
              <a href="/dashboard" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Return to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="pt-24 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div>
          <div className="flex justify-center mb-2">
            <div className="flex items-center space-x-4">
              {/* Step 1 */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentPage === 1 ? 'bg-red-900 text-white' : 'bg-gray-300 text-gray-600'
              }`}>1</div>
              <div className="w-16 h-1 bg-gray-300 rounded"></div>

              {/* Step 2 */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentPage === 2 ? 'bg-red-900 text-white' : 'bg-gray-300 text-gray-600'
              }`}>2</div>
              <div className="w-16 h-1 bg-gray-300 rounded"></div>

              {/* Step 3 */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentPage === 3 ? 'bg-red-900 text-white' : 'bg-gray-300 text-gray-600'
              }`}>3</div>
            </div>
          </div>
          {/* <div className="text-center">
            <p className="text-sm text-gray-600">
              Page {currentPage} of 3 - {
                currentPage === 1 
                  ? 'SSC Elections' 
                  : currentPage === 2 
                  ? 'ISC Elections' 
                  : 'Review & Submit'
              }
            </p>
          </div> */}
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {currentPage === 1 
          ? renderSSCPage() 
          : currentPage === 2 
          ? renderISCPage() 
          : renderReviewPage()
        }

        <div className="mt-12 flex justify-between">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-6 py-2 rounded-lg font-medium ${
              currentPage === 1 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-500 text-white hover:bg-gray-600'
            }`}
          >
            Back
          </button>

          {currentPage < 3 ? (
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={() => {
                setConfirmAction({ type: 'vote', action: 'submit' })
                setShowConfirmModal(true)
              }}
              className="bg-red-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-900"
            >
              Submit
            </button>
          )}
        </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Submission</h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to <strong className="uppercase">submit</strong> your votes?
                <br />
                You will not be able to change your selections after submission.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-white rounded-lg font-medium bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await submitVotes()
                      setShowConfirmModal(false)
                    } catch (error) {
                      console.error('Vote submission failed:', error)
                      setShowConfirmModal(false)
                    }
                  }}
                  className="px-4 py-2 text-white rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VotingPage
