import { useEffect, useState } from 'react'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '../firebase'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { PieChart, Pie, Cell as PieCell } from 'recharts'

function PublicResultsContent({ forceVisible = false }) {
  const [candidates, setCandidates] = useState([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [barData, setBarData] = useState([
    { name: 'IAS', value: 0, color: '#10b981' },
    { name: 'IBCE', value: 0, color: '#f59e0b' },
    { name: 'IHTM', value: 0, color: '#ec4899' },
    { name: 'ITE', value: 0, color: '#3b82f6' },
  ])
  const [publicVisible, setPublicVisible] = useState(true)
  const [votes, setVotes] = useState([])

  const pieColors = ['#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#f43f5e', '#22c55e', '#eab308']
  const sscRoles = [
    'President','Vice','General Secretary','Internal Secretary','External Secretary','Finance Officer','Audit Officer','Student Welfare and Rights Officer','Multimedia Officers','Editorial Officer','Logistics Officer'
  ]
  const iscRoles = ['Gov','Vice Gov','BM','Records','Finance','Audit','Publication','Public Relation','Resources']
  const institutes = [
    'INSTITUTE OF ARTS AND SCIENCES',
    'INSTITUTE OF BUSINESS AND COMPUTING EDUCATION',
    'INSTITUTE OF HOSPITALITY AND TOURISM MANAGEMENT',
    'INSTITUTE OF TEACHER EDUCATION'
  ]

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
        console.error('Failed to load Election candidates:', e)
      } finally {
        setLoadingTeams(false)
      }
    }
    const loadVoterCountsForBar = async () => {
      try {
        const [votesSnap, usersSnap] = await Promise.all([
          get(dbRef(db, 'electionVotes')),
          get(dbRef(db, 'users'))
        ])

        const counts = { IAS: 0, IBCE: 0, IHTM: 0, ITE: 0 }

        if (votesSnap.exists()) {
          const votesVal = votesSnap.val()
          const votedUids = Object.keys(votesVal)
          // Store votes array for pie charts
          setVotes(Object.values(votesVal))
          const users = usersSnap.exists() ? usersSnap.val() : {}

          votedUids.forEach((uid) => {
            const u = users[uid] || {}
            const institute = (u.institute || '').toUpperCase()
            if (institute === 'INSTITUTE OF ARTS AND SCIENCES') counts.IAS += 1
            else if (institute === 'INSTITUTE OF BUSINESS AND COMPUTING EDUCATION') counts.IBCE += 1
            else if (institute === 'INSTITUTE OF HOSPITALITY AND TOURISM MANAGEMENT') counts.IHTM += 1
            else if (institute === 'INSTITUTE OF TEACHER EDUCATION') counts.ITE += 1
          })
        }

        setBarData([
          { name: 'IAS', value: counts.IAS, color: '#10b981' },
          { name: 'IBCE', value: counts.IBCE, color: '#f59e0b' },
          { name: 'IHTM', value: counts.IHTM, color: '#ec4899' },
          { name: 'ITE', value: counts.ITE, color: '#3b82f6' },
        ])
      } catch (e) {
        console.error('Failed to load voter counts for bar chart:', e)
      }
    }
    const loadPublicFlag = async () => {
      try {
        const pubSnap = await get(dbRef(db, 'publicResultsVisible'))
        setPublicVisible(pubSnap.exists() ? !!pubSnap.val() : false)
      } catch {
        setPublicVisible(false)
      }
    }
    loadCandidates()
    loadVoterCountsForBar()
    loadPublicFlag()
  }, [])

  const combinedRoleOrder = [
    'President','Vice','General Secretary','Internal Secretary','External Secretary','Finance Officer','Audit Officer','Student Welfare and Rights Officer','Multimedia Officers','Editorial Officer','Logistics Officer','Gov','Vice Gov','BM','Records','Finance','Audit','Publication','Public Relation','Resources'
  ]

  if (!forceVisible && !publicVisible) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-yellow-200">
        <div className="p-6">
          <div className="bg-yellow-50 text-yellow-900 border border-yellow-200 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-2">Results not yet published</h3>
            <p className="text-sm">The official election results will be announced soon through our public channels. Please check back later.</p>
          </div>
          <div className="mt-6 text-center">
            <a href="/" className="inline-block px-5 py-2 rounded-md bg-red-900 text-white hover:bg-red-800">Return to Home</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap justify-center items-center gap-6 mb-4">
            {barData.map((d) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-sm font-medium text-gray-800">{d.name}</span>
              </div>
            ))}
          </div>
          <div className="h-[380px] sm:h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={56} barCategoryGap="24%" barGap={12} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: '#374151', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={{ stroke: '#e5e7eb' }} />
                <YAxis tick={{ fill: '#374151', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={{ stroke: '#e5e7eb' }} label={{ value: 'RESPONSES', angle: -90, position: 'insideLeft', offset: 10, fill: '#374151', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0].payload
                    return (
                      <div className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm shadow">
                        <div className="font-medium text-gray-800">{p.name}</div>
                        <div className="text-gray-600">Responses: {p.value}</div>
                      </div>
                    )
                  }
                  return null
                }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SSC Position Results */}
      <div className="mt-12">
        <h3 className="text-center text-lg font-semibold text-gray-800 mb-6">SSC Positions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sscRoles.map(role => {
            const roleCandidates = candidates.filter(c => c.role === role)
            if (roleCandidates.length === 0) return null
            const counts = {}
            votes.forEach(v => {
              const selected = v.votes?.[role]
              const arr = Array.isArray(selected) ? selected : (selected ? [selected] : [])
              arr.forEach(id => { counts[id] = (counts[id] || 0) + 1 })
            })
            const data = roleCandidates.map(c => ({ name: c.name, value: counts[c.id] || 0 }))
            if (data.every(d => d.value === 0)) return null
            return (
              <div key={role} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-center text-sm font-semibold text-gray-700 mb-2">{role}</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={96} innerRadius={40} label>
                        {data.map((entry, index) => (
                          <PieCell key={`ssc-${role}-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ISC Position Results by Institute */}
      <div className="mt-12">
        <h3 className="text-center text-lg font-semibold text-gray-800 mb-6">ISC Positions</h3>
        <div className="space-y-10">
          {institutes.map(institute => {
            const instituteCandidates = candidates.filter(c => c.institute === institute && iscRoles.includes(c.role))
            if (instituteCandidates.length === 0) return (
              <div key={institute} className="text-center text-gray-500">No candidates for {institute}.</div>
            )
            return (
              <div key={institute}>
                <h4 className="text-center font-semibold mb-4 text-gray-800">{institute}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {iscRoles.map(role => {
                    const roleCandidates = instituteCandidates.filter(c => c.role === role)
                    if (roleCandidates.length === 0) return null
                    const counts = {}
                    votes.forEach(v => {
                      const key = `${institute}-${role}`
                      const selected = v.votes?.[key]
                      const arr = Array.isArray(selected) ? selected : (selected ? [selected] : [])
                      arr.forEach(id => { counts[id] = (counts[id] || 0) + 1 })
                    })
                    const data = roleCandidates.map(c => ({ name: c.name, value: counts[c.id] || 0 }))
                    return (
                      <div key={`${institute}-${role}`} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <h3 className="text-center text-sm font-semibold text-gray-700 mb-2">{role}</h3>
                        <div className="h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={96} innerRadius={40} label>
                                {data.map((entry, index) => (
                                  <PieCell key={`isc-${institute}-${role}-${index}`} fill={pieColors[index % pieColors.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value, name) => [value, name]} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Partylist section remains */}
      <div className="mt-12">
        <h3 className="text-center text-lg font-semibold text-gray-800 mb-6">Partylist</h3>
        {loadingTeams ? (
          <div className="text-center text-gray-500">Loading…</div>
        ) : (
          (() => {
            const teams = Array.from(new Set(candidates.filter(c => (c.team || '').trim() !== '').map(c => c.team.trim())))
            if (teams.length === 0) {
              return <div className="text-center text-gray-500">No teams to display.</div>
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
                              <div className="text-center text-gray-500">No roles for this team.</div>
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

      <div className="mt-12">
        <h3 className="text-center text-lg font-semibold text-gray-800 mb-6">Individual</h3>
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

      
    </>
  )
}

export default PublicResultsContent


