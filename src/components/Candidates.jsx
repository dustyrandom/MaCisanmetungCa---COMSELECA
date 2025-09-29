import { useEffect, useState } from 'react'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '../firebase'
import NavBar from './NavBar'

function Candidates({ forceVisible = false }) {
  const [candidates, setCandidates] = useState([])
  const [loadingTeams, setLoadingTeams] = useState(true)

  const sscRoles = [
    'President','Vice President','General Secretary','Internal Secretary','External Secretary','Finance Officer','Audit Officer','Student Welfare and Rights Officer','Multimedia Officers','Editorial Officer','Logistics Officer'
  ]
  const iscRoles = ['Governor','Vice Governor','Records','Finance','Audit','Publication','Public Relation','Resources']

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const candidatesRef = dbRef(db, 'Election')
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
        setLoadingTeams(false)
      }
    }
    
    loadCandidates()
  }, [])

  const combinedRoleOrder = [
    'President','Vice President','General Secretary','Internal Secretary','External Secretary','Finance Officer','Audit Officer','Student Welfare and Rights Officer','Multimedia Officers','Editorial Officer','Logistics Officer','Governor','Vice Governor','Records','Finance','Audit','Publication','Public Relation','Resources'
  ]

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-wide text-red-900">MACIPANYULUNGCA CANDIDATES</h2>
          <p className="text-base sm:text-lg text-gray-800 -mt-1">STUDENT COUNCIL ELECTIONS 2025</p>
        </div>

        {/* Partylist section remains */}
        <div className="mt-12">
          <h3 className="text-center text-lg font-semibold text-gray-800 mb-6">Party Lists</h3>
          {loadingTeams ? (
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
              const colorByIndex = (i) => i % 3 === 0 ? { title: 'text-blue-700', badge: 'bg-blue-200 text-blue-800' } : i % 3 === 1 ? { title: 'text-amber-600', badge: 'bg-amber-200 text-amber-800' } : { title: 'text-green-700', badge: 'bg-green-200 text-green-800' }
              return (
                <div className="space-y-8">
                  {groups.map((group, groupIdx) => (
                    <div key={groupIdx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {group.map((teamName, innerIdx) => {
                          const { title, badge } = colorByIndex(innerIdx)
                          const teamCandidates = candidates.filter(c => ((c.team || '').trim().toUpperCase()) === teamName.toUpperCase())
                          const roleToNames = teamCandidates.reduce((acc, c) => {
                            const role = c.role || ''
                            if (!acc[role]) acc[role] = []
                            acc[role].push(c.name)
                            return acc
                          }, {})
                          const rolesForTeam = Object.keys(roleToNames).sort((a, b) => {
                            const ia = combinedRoleOrder.indexOf(a)
                            const ib = combinedRoleOrder.indexOf(b)
                            if (ia === -1 && ib === -1) return a.localeCompare(b)
                            if (ia === -1) return 1
                            if (ib === -1) return -1
                            return ia - ib
                          })
                          return (
                            <div key={`${teamName}-${innerIdx}`}>
                              <h4 className={`text-center font-semibold mb-4 ${title}`}>{teamName}</h4>
                              {rolesForTeam.length > 0 ? (
                                <div className="space-y-3 text-center text-sm">
                                  {rolesForTeam.map((role) => (
                                    <div key={role} className="space-y-1">
                                      <div className={`inline-block text-[11px] px-2 py-0.5 rounded ${badge}`}>{role}</div>
                                      <div className="text-gray-800">
                                        {roleToNames[role].map((name, i) => (
                                          <div key={`${role}-${i}`}>{name}</div>
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
        
        {/*Independent section remains */}
        <div className="mt-12">
          <h3 className="text-center text-lg font-semibold text-gray-800 mb-6">Indipendent</h3>
          {loadingTeams ? (
            <div className="text-center text-gray-500">Loading…</div>
          ) : (
            (() => {
              const individuals = candidates.filter(c => !c.team || c.team.trim() === '')
              if (individuals.length === 0) {
                return <div className="text-center text-gray-500">No individuals to display.</div>
              }
              const roleToNames = individuals.reduce((acc, c) => {
                const role = c.role || ''
                if (!acc[role]) acc[role] = []
                acc[role].push(c.name)
                return acc
              }, {})
              const roles = Object.keys(roleToNames).sort((a, b) => {
                const ia = combinedRoleOrder.indexOf(a)
                const ib = combinedRoleOrder.indexOf(b)
                if (ia === -1 && ib === -1) return a.localeCompare(b)
                if (ia === -1) return 1
                if (ib === -1) return -1
                return ia - ib
              })
              return (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {roles.map(role => (
                      <div key={role}>
                        <h4 className="text-center font-semibold mb-4 text-gray-800">{role}</h4>
                        <div className="space-y-2 text-center text-sm">
                          {roleToNames[role].map((name, i) => (
                            <div key={`${role}-${i}`} className="text-gray-800">{name}</div>
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

      
    </div>
    </>
  )
}

export default Candidates


