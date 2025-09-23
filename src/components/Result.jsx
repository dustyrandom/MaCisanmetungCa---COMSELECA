import NavBar from './NavBar'
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
} from 'recharts'
import { PieChart, Pie, Cell } from 'recharts'

function Result() {
  const [candidates, setCandidates] = useState([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const data = [
    { name: 'SSC', value: 2000, color: '#991b1b' },
    { name: 'IAS', value: 1000, color: '#10b981' },
    { name: 'IBCE', value: 1000, color: '#f59e0b' },
    { name: 'IHTM', value: 1000, color: '#ec4899' },
    { name: 'ITE', value: 1000, color: '#3b82f6' },
  ]

  const pieColors = ['#ef4444', '#fb923c', '#991b1b']
  const sscPresident = [
    { name: 'CANCINO', value: 500 },
    { name: 'DE LEON', value: 200 },
    { name: 'MAKAY', value: 100 },
  ]
  const sscVice = [
    { name: 'LAZUNDIN', value: 500 },
    { name: 'DISCAYA', value: 200 },
    { name: 'KARLTYZY', value: 100 },
  ]
  const sscSecretary = [
    { name: 'ABRIL', value: 500 },
    { name: 'LEBRON', value: 200 },
    { name: 'CURRY', value: 100 },
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
    loadCandidates()
  }, [])

  // Combined role order (SSC + ISC) for consistent display
  const combinedRoleOrder = [
    // SSC
    'President',
    'Vice',
    'General Secretary',
    'Internal Secretary',
    'External Secretary',
    'Finance Officer',
    'Audit Officer',
    'Student Welfare and Rights Officer',
    'Multimedia Officers',
    'Editorial Officer',
    'Logistics Officer',
    // ISC
    'Gov',
    'Vice Gov',
    'BM',
    'Records',
    'Finance',
    'Audit',
    'Publication',
    'Public Relation',
    'Resources'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-wide text-red-900">MACIPANYULUNGCA</h2>
          <p className="text-base sm:text-lg text-gray-800 -mt-1">STUDENT ELECTIONS 2025</p>
        </div>

        {/* shadcn-like card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6">
            {/* Legend inside card */}
            <div className="flex flex-wrap justify-center items-center gap-6 mb-4">
              {data.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm font-medium text-gray-800">{d.name}</span>
                </div>
              ))}
            </div>
            <div className="h-[380px] sm:h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barSize={56} barCategoryGap="24%" barGap={12} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
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
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pie charts row */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[{ title: 'SSC PRESIDENT', data: sscPresident }, { title: 'SSC VICE PRESIDENT', data: sscVice }, { title: 'SSC SECRETARY', data: sscSecretary }].map((chart) => (
            <div key={chart.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-center text-sm font-semibold text-gray-700 mb-2">{chart.title}</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chart.data}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={96}
                      innerRadius={40}
                      label
                    >
                      {chart.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        {/* Partylist section (dynamic, 3 teams per card) */}
        <div className="mt-12">
          <h3 className="text-center text-lg font-semibold text-gray-800 mb-6">Partylist</h3>
          {loadingTeams ? (
            <div className="text-center text-gray-500">Loading…</div>
          ) : (
            (() => {
              // Derive teams dynamically from candidates (non-empty team values)
              const teams = Array.from(new Set(candidates.filter(c => (c.team || '').trim() !== '').map(c => c.team.trim())))
              if (teams.length === 0) {
                return <div className="text-center text-gray-500">No teams to display.</div>
              }
              // Chunk into groups of 3
              const groups = []
              for (let i = 0; i < teams.length; i += 3) {
                groups.push(teams.slice(i, i + 3))
              }
              // Consistent colors per column
              const colorByIndex = (i) => i % 3 === 0 ? { title: 'text-blue-700', badge: 'bg-blue-200 text-blue-800' } : i % 3 === 1 ? { title: 'text-amber-600', badge: 'bg-amber-200 text-amber-800' } : { title: 'text-green-700', badge: 'bg-green-200 text-green-800' }
              return (
                <div className="space-y-8">
                  {groups.map((group, groupIdx) => (
                    <div key={groupIdx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {group.map((teamName, innerIdx) => {
                          const idx = groupIdx * 3 + innerIdx
                          const { title, badge } = colorByIndex(innerIdx)
                          const teamCandidates = candidates.filter(c => ((c.team || '').trim().toUpperCase()) === teamName.toUpperCase())
                          // Group candidates by role; preserve order by combinedRoleOrder
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
                            <div key={`${teamName}-${idx}`}>
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

        {/* Individuals (no team) */}
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
      </div>
    </div>
  )
}

export default Result


