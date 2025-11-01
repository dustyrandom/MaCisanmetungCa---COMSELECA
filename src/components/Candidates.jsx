import { useEffect, useState } from 'react'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '../firebase'
import NavBar from './NavBar'

function Candidates({ forceVisible = false }) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('positions')
  const sscPositions = [
    'President','Vice President','General Secretary','Internal Secretary','External Secretary',
    'Finance Officer','Audit Officer','Student Welfare and Rights Officer',
    'Multimedia Officers','Editorial Officer','Logistics Officer'
  ]

  const iscPositions = [
    'Governor','Vice Governor','Board Member on Records','Board Member on Finance',
    'Board Member on Audit','Board Member on Publication','Board Member on Public Relation',
    'Board Member on Resources'
  ]

  const institutes = [
    'Institute of Arts and Sciences',
    'Institute of Business and Computing Education',
    'Institute of Teacher Education',
    'Institute of Hospitality and Tourism Management'
  ]

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const candidatesRef = dbRef(db, 'candidates')
        const snapshot = await get(candidatesRef)
        if (snapshot.exists()) {
          const data = snapshot.val()
          const list = Object.keys(data).map(id => ({ id, ...data[id] }))
          setCandidates(list)
        } else {
          setCandidates([])
        }
      } catch (e) {
        console.error('Failed to load election candidates:', e)
      } finally {
        setLoading(false)
      }
    }
    loadCandidates()
  }, [])

  const combinedPositionsOrder = [...sscPositions, ...iscPositions]

  const getPositionCategory = (position) => {
    if (sscPositions.includes(position)) return 'SSC'
    if (iscPositions.includes(position)) return 'ISC'
    return ''
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
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-red-900">MACIPANYULUNGCA PARTIES AND CANDIDATES</h2>
          <p className="text-lg text-gray-700">Student Council Elections 2025</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('positions')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'positions'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Candidate per Position
                </button>
                <button
                  onClick={() => setActiveTab('party')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'party'
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Candidate per Party
                </button>
              </nav>
            </div>
          </div>

          {/* TAB: Candidates per Position */}
          {activeTab === 'positions' && (
            <>
              {/* SSC Candidates */}
              <h2 className="text-xl font-bold text-red-900 mb-6 text-center">
                  SUPREME STUDENT COUNCIL
              </h2>
              <div className="mb-12 border border-gray-300 rounded-xl bg-white shadow-sm p-6">
                {sscPositions.map(position => {
                  const positionCandidates = candidates.filter(c => c.position === position)
                  return (
                    <div key={position} className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">{position}</h3>
                      {positionCandidates.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {positionCandidates.map(candidate => (
                            <div key={candidate.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm flex items-center gap-4">
                              {/* Profile picture */}
                              <div className="flex-shrink-0">
                                <img
                                  src={candidate.profilePicture || '/default-avatar.png'} // fallback image
                                  alt={`${candidate.firstName} ${candidate.lastName}`}
                                  className="w-20 h-20 rounded-full object-cover"
                                />
                              </div>

                              {/* Candidate info */}
                              <div className="flex-1">
                                <h4 className="font-semibold">{candidate.lastName}, {candidate.firstName}</h4>
                                <p className="text-sm text-gray-600">{candidate.email}</p>
                                <p className="text-sm text-gray-600">{candidate.studentId}</p>
                                <p className="text-sm text-gray-600">{candidate.institute}</p>
                                <p className="text-sm text-green-600">Party: {candidate.team ? candidate.team: 'Independent'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-red-800 italic text-sm">No candidates for this position yet.</p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* ISC Candidates grouped by institute */}
              <div>
                <h2 className="text-xl font-bold text-red-900 mb-6 text-center">
                  INSTITUTE STUDENT COUNCIL
                </h2>
                {institutes.map(institute => {
                  const instituteCandidates = candidates.filter(
                    c => getPositionCategory(c.position) === 'ISC' && c.institute === institute
                  )
                  return (
                    <div key={institute} className="mb-12 border border-gray-300 rounded-xl bg-white shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">{institute}</h3>
                      <div className="space-y-6">
                        {iscPositions.map(position => {
                          const positionCandidates = instituteCandidates.filter(c => c.position === position)
                          return (
                            <div key={position}>
                              <h4 className="text-md font-semibold text-gray-700 mb-3">{position}</h4>
                              {positionCandidates.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {positionCandidates.map(candidate => (
                                    <div key={candidate.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm flex items-center gap-4">
                                      {/* Profile picture */}
                                      <div className="flex-shrink-0">
                                        <img
                                          src={candidate.profilePicture || '/default-avatar.png'} // fallback image
                                          alt={`${candidate.firstName} ${candidate.lastName}`}
                                          className="w-20 h-20 rounded-full object-cover"
                                        />
                                      </div>

                                      {/* Candidate info */}
                                      <div className="flex-1">
                                        <h4 className="font-semibold">{candidate.lastName}, {candidate.firstName}</h4>
                                        <p className="text-sm text-gray-600">{candidate.email}</p>
                                        <p className="text-sm text-gray-600">{candidate.studentId}</p>
                                        <p className="text-sm text-gray-600">{candidate.institute}</p>
                                        <p className="text-sm text-green-600">Party: {candidate.team ? candidate.team: 'Independent'}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-red-800 italic text-sm">
                                  No candidates for this position yet.
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* TAB: Candidates per Party */}
          {activeTab === 'party' && (
            <div className="p-5">
              {/* Partylist section */}
              <div>
                <h3 className="text-center text-lg font-semibold text-gray-800 mb-6">Party Lists</h3>
                {loading ? (
                  <div className="text-center text-gray-500">Loading…</div>
                ) : (
                  (() => {
                    const teams = Array.from(new Set(candidates.filter(c => (c.team || '').trim() !== '').map(c => c.team.trim())))
                    if (teams.length === 0) {
                      return <div className="text-center text-gray-500">No party to display.</div>
                    }
                    const groups = []
                    for (let i = 0; i < teams.length; i += 3) {
                      groups.push(teams.slice(i, i + 3))
                    }
                    const colorByIndex = (i) => i % 3 === 0
                      ? { title: 'text-blue-700', badge: 'bg-blue-200 text-blue-800' }
                      : i % 3 === 1
                      ? { title: 'text-amber-600', badge: 'bg-amber-200 text-amber-800' }
                      : { title: 'text-green-700', badge: 'bg-green-200 text-green-800' }

                    return (
                      <div className="space-y-8">
                        {groups.map((group, groupIdx) => (
                          <div key={groupIdx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                              {group.map((teamName, innerIdx) => {
                                const { title, badge } = colorByIndex(innerIdx)
                                const teamCandidates = candidates.filter(c => ((c.team || '').trim().toUpperCase()) === teamName.toUpperCase())
                                const positionToNames = teamCandidates.reduce((acc, c) => {
                                  const position = c.position || ''
                                  if (!acc[position]) acc[position] = []
                                  acc[position].push(c.fullName)
                                  return acc
                                }, {})
                                const positionForTeam = Object.keys(positionToNames).sort((a, b) => {
                                  const ia = combinedPositionsOrder.indexOf(a)
                                  const ib = combinedPositionsOrder.indexOf(b)
                                  if (ia === -1 && ib === -1) return a.localeCompare(b)
                                  if (ia === -1) return 1
                                  if (ib === -1) return -1
                                  return ia - ib
                                })
                                return (
                                  <div key={`${teamName}-${innerIdx}`}>
                                    <h4 className={`text-center font-semibold mb-4 ${title}`}>{teamName}</h4>
                                    {positionForTeam.length > 0 ? (
                                      <div className="space-y-3 text-center text-sm">
                                        {positionForTeam.map((position) => (
                                          <div key={position} className="space-y-1">
                                            <div className={`inline-block text-[11px] px-2 py-0.5 rounded ${badge}`}>{position}</div>
                                            <div className="text-gray-800">
                                              {positionToNames[position].map((fullName, i) => (
                                                <div key={`${position}-${i}`}>{fullName}</div>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center text-gray-500">No candidates for this party.</div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()
                )}
              </div>

              {/* Independent section */}
              <div className="mt-12">
                <h3 className="text-center text-lg font-semibold text-gray-800 mb-6">Independent Candidates</h3>
                {loading ? (
                  <div className="text-center text-gray-500">Loading…</div>
                ) : (
                  (() => {
                    const individuals = candidates.filter(c => !c.team || c.team.trim() === '')
                    if (individuals.length === 0) {
                      return <div className="text-center text-gray-500">No candidates to display.</div>
                    }
                    const positionToNames = individuals.reduce((acc, c) => {
                      const position = c.position || ''
                      if (!acc[position]) acc[position] = []
                      acc[position].push(c.fullName)
                      return acc
                    }, {})
                    const positions = Object.keys(positionToNames).sort((a, b) => {
                      const ia = combinedPositionsOrder.indexOf(a)
                      const ib = combinedPositionsOrder.indexOf(b)
                      if (ia === -1 && ib === -1) return a.localeCompare(b)
                      if (ia === -1) return 1
                      if (ib === -1) return -1
                      return ia - ib
                    })
                    return (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {positions.map(position => (
                            <div key={position}>
                              <h4 className="text-center font-semibold mb-4 text-gray-800">{position}</h4>
                              <div className="space-y-2 text-center text-sm">
                                {positionToNames[position].map((fullName, i) => (
                                  <div key={`${position}-${i}`} className="text-gray-800">{fullName}</div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Candidates
