import { useState, useEffect } from 'react'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '../firebase'
import NavBar from './NavBar'

function ViewResults() {
  const [votes, setVotes] = useState([])
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('voters')

  const sscRoles = [
    'President', 'Vice', 'General Secretary', 'Internal Secretary', 'External Secretary',
    'Finance Officer', 'Audit Officer', 'Student Welfare and Rights Officer',
    'Multimedia Officers', 'Editorial Officer', 'Logistics Officer'
  ]

  const iscRoles = [
    'Gov', 'Vice Gov', 'BM', 'Records', 'Finance', 'Audit',
    'Publication', 'Public Relation', 'Resources'
  ]

  const institutes = [
    'INSTITUTE OF ARTS AND SCIENCES',
    'INSTITUTE OF BUSINESS AND COMPUTING EDUCATION',
    'INSTITUTE OF TEACHER EDUCATION',
    'INSTITUTE OF HOSPITALITY AND TOURISM MANAGEMENT'
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all votes
        const votesRef = dbRef(db, 'electionVotes')
        const votesSnapshot = await get(votesRef)
        if (votesSnapshot.exists()) {
          const votesData = votesSnapshot.val()
          const votesList = Object.keys(votesData).map(uid => ({
            uid,
            ...votesData[uid]
          }))
          setVotes(votesList)
        }

        // Load all candidates
        const candidatesRef = dbRef(db, 'Election')
        const candidatesSnapshot = await get(candidatesRef)
        if (candidatesSnapshot.exists()) {
          const candidatesData = candidatesSnapshot.val()
          const candidatesList = Object.keys(candidatesData).map(id => ({
            id,
            ...candidatesData[id]
          }))
          setCandidates(candidatesList)
        }
      } catch (error) {
        console.error('Failed to load results:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getCandidateName = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId)
    return candidate ? candidate.name : `Unknown Candidate (ID: ${candidateId})`
  }

  const getCandidateRole = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId)
    return candidate ? candidate.role : 'Unknown Role'
  }

  const getCandidateInstitute = (candidateId) => {
    const candidate = candidates.find(c => c.id === candidateId)
    return candidate ? candidate.institute : 'Unknown Institute'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getRoleCategory = (role) => {
    if (sscRoles.includes(role)) return 'SSC'
    if (iscRoles.includes(role)) return 'ISC'
    return ''
  }

  const getFilteredVotes = () => {
    return votes
  }

  const getFilteredCandidates = () => {
    return candidates
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Election Results</h1>
            <p className="text-gray-600 mt-2">View detailed voting results and voter information</p>
          </div>


          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('voters')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'voters'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Voter Details ({getFilteredVotes().length})
                </button>
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'summary'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Vote Summary
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'voters' && (
            <div className="space-y-6">
              {getFilteredVotes().length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No votes recorded yet</h3>
                  <p className="text-gray-500">Voting results will appear here once users start voting.</p>
                </div>
              ) : (
                getFilteredVotes().map((vote, index) => (
                  <div key={vote.uid} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{vote.voterName}</h3>
                        <p className="text-gray-600">{vote.voterEmail}</p>
                        <p className="text-sm text-gray-500">Voted on: {formatDate(vote.submittedAt)}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        Vote #{index + 1}
                      </span>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-3">Votes Cast:</h4>
                      <div className="space-y-6">
                        {/* SSC Votes */}
                        <div>
                          <h5 className="text-lg font-semibold text-red-900 mb-3">SSC Votes</h5>
                          <div className="space-y-3">
                            {sscRoles.map(role => {
                              const selectedCandidates = vote.votes[role]
                              const candidatesArray = Array.isArray(selectedCandidates) ? selectedCandidates : [selectedCandidates]
                              const validCandidates = candidatesArray.filter(Boolean)
                              
                              return (
                                <div key={role} className="bg-gray-50 rounded-lg p-3">
                                  <h6 className="font-medium text-gray-800 mb-2">{role}</h6>
                                  {validCandidates.length > 0 ? (
                                    <div className="space-y-2">
                                      {validCandidates.map((candidateId, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200">
                                          <div className="flex items-center">
                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                              </svg>
                                            </div>
                                            <div>
                                              <span className="font-semibold text-gray-900">{getCandidateName(candidateId)}</span>
                                              <span className="text-gray-500 ml-2">({getCandidateRole(candidateId)})</span>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-sm text-gray-500">{getCandidateInstitute(candidateId)}</span>
                                            <div className="text-xs text-green-600 font-medium">VOTED FOR</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                      <div className="flex items-center">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </div>
                                        <span className="text-gray-500 italic">No candidate selected</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* ISC Votes */}
                        <div>
                          <h5 className="text-lg font-semibold text-red-900 mb-3">ISC Votes</h5>
                          <div className="space-y-3">
                            {(() => {
                              // Find the voter's institute by looking for ISC votes
                              const voterInstitute = institutes.find(institute => 
                                iscRoles.some(role => {
                                  const voteKey = `${institute}-${role}`
                                  const selectedCandidates = vote.votes[voteKey]
                                  return selectedCandidates && (Array.isArray(selectedCandidates) ? selectedCandidates.length > 0 : selectedCandidates)
                                })
                              )
                              
                              // If no votes found, try to determine from candidate data
                              if (!voterInstitute) {
                                // Look for any ISC vote and get the institute from the candidate
                                for (const [voteKey, candidateId] of Object.entries(vote.votes)) {
                                  if (voteKey.includes('-') && iscRoles.some(role => voteKey.endsWith(`-${role}`))) {
                                    const candidate = candidates.find(c => c.id === candidateId)
                                    if (candidate) {
                                      return [candidate.institute]
                                    }
                                  }
                                }
                                return []
                              }
                              
                              return [voterInstitute]
                            })().map(institute => (
                              <div key={institute} className="mb-4">
                                <h6 className="font-semibold text-gray-700 mb-2">{institute}</h6>
                                <div className="space-y-2">
                                  {iscRoles.map(role => {
                                    const voteKey = `${institute}-${role}`
                                    const selectedCandidates = vote.votes[voteKey]
                                    const candidatesArray = Array.isArray(selectedCandidates) ? selectedCandidates : [selectedCandidates]
                                    const validCandidates = candidatesArray.filter(Boolean)
                                    
                                    return (
                                <div key={role} className="bg-gray-50 rounded-lg p-3">
                                  <h6 className="font-medium text-gray-800 mb-2">{role}</h6>
                                  {validCandidates.length > 0 ? (
                                    <div className="space-y-2">
                                      {validCandidates.map((candidateId, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200">
                                          <div className="flex items-center">
                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                              </svg>
                                            </div>
                                            <div>
                                              <span className="font-semibold text-gray-900">{getCandidateName(candidateId)}</span>
                                              <span className="text-gray-500 ml-2">({getCandidateRole(candidateId)})</span>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-sm text-gray-500">{getCandidateInstitute(candidateId)}</span>
                                            <div className="text-xs text-green-600 font-medium">VOTED FOR</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                      <div className="flex items-center">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </div>
                                        <span className="text-gray-500 italic">No candidate selected</span>
                                      </div>
                                    </div>
                                  )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Voting Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Voters</p>
                        <p className="text-2xl font-bold text-gray-900">{getFilteredVotes().length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Candidate Vote Counts */}
              <>
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-red-900 mb-6">SSC Candidates</h2>
                      {sscRoles.map(role => {
                      const roleCandidates = candidates.filter(c => c.role === role)
                      return (
                        <div key={role} className="mb-8">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">{role}</h3>
                          {roleCandidates.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {roleCandidates.map(candidate => {
                                let voteCount = 0
                                votes.forEach(vote => {
                                  Object.values(vote.votes).forEach(selectedCandidates => {
                                    const candidatesArray = Array.isArray(selectedCandidates) ? selectedCandidates : [selectedCandidates]
                                    if (candidatesArray.includes(candidate.id)) {
                                      voteCount++
                                    }
                                  })
                                })

                                return (
                                  <div key={candidate.id} className="bg-white rounded-lg shadow-md p-4">
                                    <h4 className="font-semibold">{candidate.name}</h4>
                                    <p className="text-sm text-gray-600">{candidate.email}</p>
                                    <p className="text-sm text-gray-600">{candidate.studentId}</p>
                                    <p className="text-sm text-gray-600">{candidate.institute}</p>
                                    {candidate.team && (
                                      <p className="text-sm text-purple-600">Team: {candidate.team}</p>
                                    )}
                                    <div className="mt-3">
                                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                        {voteCount} votes
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">No candidates for this position yet.</p>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-red-900 mb-6">ISC Candidates by Institute</h2>
                      {institutes.map(institute => {
                      const instituteCandidates = candidates.filter(c => iscRoles.includes(c.role) && c.institute === institute)
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
                                        {roleCandidates.map(candidate => {
                                          let voteCount = 0
                                          votes.forEach(vote => {
                                            Object.values(vote.votes).forEach(selectedCandidates => {
                                              const candidatesArray = Array.isArray(selectedCandidates) ? selectedCandidates : [selectedCandidates]
                                              if (candidatesArray.includes(candidate.id)) {
                                                voteCount++
                                              }
                                            })
                                          })

                                          return (
                                            <div key={candidate.id} className="bg-white rounded-lg shadow-md p-4">
                                              <h5 className="font-semibold">{candidate.name}</h5>
                                              <p className="text-sm text-gray-600">{candidate.email}</p>
                                              <p className="text-sm text-gray-600">{candidate.studentId}</p>
                                              {candidate.team && (
                                                <p className="text-sm text-purple-600">Team: {candidate.team}</p>
                                              )}
                                              <div className="mt-3">
                                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                                  {voteCount} votes
                                                </span>
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-gray-500 italic text-sm">No candidates for this position yet.</p>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">No candidates for this institute yet.</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewResults
