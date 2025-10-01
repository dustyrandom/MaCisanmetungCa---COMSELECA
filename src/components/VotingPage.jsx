import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar'
import { ref as dbRef, get, set } from 'firebase/database'
import { db } from '../firebase'

function VotingPage() {
  const { user, userData } = useAuth()
  const [currentPage, setCurrentPage] = useState(1) // 1 = SSC, 2 = ISC
  const [candidates, setCandidates] = useState([])
  const [votes, setVotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [votingStatus, setVotingStatus] = useState({
    isActive: false,
    startDate: '',
    endDate: ''
  })
  const [hasVoted, setHasVoted] = useState(false)

  const sscRoles = [
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

  const iscRoles = [
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
        const candidatesRef = dbRef(db, 'Election')
        const candidatesSnapshot = await get(candidatesRef)
        if (candidatesSnapshot.exists()) {
          const data = candidatesSnapshot.val()
          const candidatesList = Object.keys(data).map(id => ({ id, ...data[id] }))
          setCandidates(candidatesList)
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

        // Check if user has already voted
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
        setLoading(false)
      }
    }
    loadCandidates()
  }, [user])

  const getCandidatesForRole = (roleName, page) => {
    if (page === 1) {
      // SSC roles
      return candidates.filter(c => c.role === roleName && sscRoles.some(role => role.name === c.role))
    } else {
      // ISC roles
      return candidates.filter(c => c.role === roleName && iscRoles.some(role => role.name === c.role))
    }
  }

  const getCandidatesForInstitute = (institute) => {
    return candidates.filter(c => iscRoles.some(role => role.name === c.role) && c.institute === institute)
  }

  const handleVote = (role, candidateId, maxVotes = 1) => {
    setVotes(prev => {
      const newVotes = { ...prev }
      
      if (maxVotes > 1) {
        // Multi-select roles
        if (!newVotes[role]) newVotes[role] = []
        const currentVotes = newVotes[role] || []
        
        if (currentVotes.includes(candidateId)) {
          newVotes[role] = currentVotes.filter(id => id !== candidateId)
        } else {
          if (currentVotes.length < maxVotes) {
            newVotes[role] = [...currentVotes, candidateId]
          }
        }
      } else {
        // Single select
        newVotes[role] = candidateId
      }
      
      return newVotes
    })
  }

  const submitVotes = async () => {
    try {
      const voteData = {
        voterId: user.uid,
        voterName: userData.name,
        voterEmail: user.email,
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
            name: userData.name,
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
        <h2 className="text-2xl font-bold text-red-900 mb-2">Student Supreme Council (SSC)</h2>
        <p className="text-gray-600">Select your candidates for each position</p>
      </div>

      {sscRoles.map(role => {
        const roleCandidates = getCandidatesForRole(role.name, 1)
        const isMultiSelect = role.maxVotes > 1
        const currentVotes = votes[role.name] || []
        const selectedCount = Array.isArray(currentVotes) ? currentVotes.length : (currentVotes ? 1 : 0)
        
        return (
          <div key={role.name} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{role.name}</h3>
              <span className="text-sm text-gray-600">
                {selectedCount}/{role.maxVotes} selected
              </span>
            </div>
            {isMultiSelect && (
              <p className="text-sm text-gray-600 mb-4">Select up to {role.maxVotes} candidates</p>
            )}
            
            {roleCandidates.length === 0 ? (
              <p className="text-gray-500 italic">No candidates for this position</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roleCandidates.map(candidate => {
                  const isSelected = isMultiSelect 
                    ? currentVotes.includes(candidate.id)
                    : currentVotes === candidate.id
                  
                  return (
                    <div
                      key={candidate.id}
                      onClick={() => handleVote(role.name, candidate.id, role.maxVotes)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-medium">{candidate.name}</h4>
                      <p className="text-sm text-gray-600">{candidate.institute}</p>
                      {isSelected && (
                        <p className="text-sm text-blue-600 font-medium mt-2">✓ Selected</p>
                      )}
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
            
            {iscRoles.map(role => {
              const roleCandidates = getCandidatesForInstitute(institute).filter(c => c.role === role.name)
              const currentVotes = votes[`${institute}-${role.name}`]
              const selectedCount = currentVotes ? 1 : 0
              
              return (
                <div key={`${institute}-${role.name}`} className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-lg font-medium">{role.name}</h4>
                    <span className="text-sm text-gray-600">
                      {selectedCount}/{role.maxVotes} selected
                    </span>
                  </div>
                  
                  {roleCandidates.length === 0 ? (
                    <p className="text-gray-500 italic">No candidates for this position</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {roleCandidates.map(candidate => {
                        const isSelected = currentVotes === candidate.id
                        
                        return (
                          <div
                            key={candidate.id}
                            onClick={() => handleVote(`${institute}-${role.name}`, candidate.id, role.maxVotes)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <h5 className="font-medium">{candidate.name}</h5>
                            {isSelected && (
                              <p className="text-sm text-blue-600 font-medium mt-2">✓ Selected</p>
                            )}
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
    )
  }

  // Show voting status message if voting is not active
  if (!votingStatus.isActive) {
    const now = new Date()
    const startDate = votingStatus.startDate ? new Date(votingStatus.startDate) : null
    const endDate = votingStatus.endDate ? new Date(votingStatus.endDate) : null
    
    let statusMessage = 'Voting has not started yet. Please check back later.'
    let statusTitle = 'Voting is Currently Inactive'
    let iconColor = 'text-red-600'
    let bgColor = 'bg-red-100'
    
    {/*
      if (startDate && endDate) {
      if (now < startDate) {
        statusMessage = `Voting will begin on ${new Date(votingStatus.startDate).toLocaleString()}`
        statusTitle = 'Voting Has Not Started'
      } else if (now > endDate) {
        statusMessage = `Voting ended on ${new Date(votingStatus.endDate).toLocaleString()}`
        statusTitle = 'Voting Has Ended'
        iconColor = 'text-gray-600'
        bgColor = 'bg-gray-100'
      }
    } else if (startDate && now < startDate) {
      statusMessage = `Voting will begin on ${new Date(votingStatus.startDate).toLocaleString()}`
      statusTitle = 'Voting Has Not Started'
    } else if (endDate && now > endDate) {
      statusMessage = `Voting ended on ${new Date(votingStatus.endDate).toLocaleString()}`
      statusTitle = 'Voting Has Ended'
      iconColor = 'text-gray-600'
      bgColor = 'bg-gray-100'
    }
    */}

    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
            <div className="mb-6">
              <div className={`w-16 h-16 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <svg className={`w-8 h-8 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-red-900 mb-2">{statusTitle}</h1>
              <p className="text-gray-600 mb-4">{statusMessage}</p>

              {/*
              {votingStatus.startDate && votingStatus.endDate && (
                <p className="text-sm text-gray-500">
                  Voting period: {new Date(votingStatus.startDate).toLocaleString()} - {new Date(votingStatus.endDate).toLocaleString()}
                </p>
              )}
              */}
              
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
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
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
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentPage === 1 ? 'bg-red-900 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className="w-16 h-1 bg-gray-300 rounded"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentPage === 2 ? 'bg-red-900 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Page {currentPage} of 2 - {currentPage === 1 ? 'SSC Elections' : 'ISC Elections'}
            </p>
          </div>
        </div>

        {currentPage === 1 ? renderSSCPage() : renderISCPage()}

        <div className="mt-12 flex justify-between">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={`px-6 py-2 rounded-lg font-medium ${
              currentPage === 1 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            Previous
          </button>
          
          {currentPage === 1 ? (
            <button
              onClick={() => setCurrentPage(2)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={submitVotes}
              className="bg-green-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-green-700"
            >
              Submit Votes
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default VotingPage
