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


function PublicResultsContent({ forceVisible = false }) {
  const [candidates, setCandidates] = useState([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [barData, setBarData] = useState([
    { name: 'IAS', value: 0, color: '#10b981' },
    { name: 'IBCE', value: 0, color: '#f59e0b' },
    { name: 'ITE', value: 0, color: '#3b82f6' },
    { name: 'IHTM', value: 0, color: '#ec4899' },
  ])

  const institutePopulation = {
    IAS: 10,
    IBCE: 15,
    IHTM: 20,
    ITE: 25
  }
  const totalPopulation = Object.values(institutePopulation).reduce((a, b) => a + b, 0);

  const [publicVisible, setPublicVisible] = useState(true)
  const [votes, setVotes] = useState([])

  const pieColors = ['#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#f43f5e', '#22c55e', '#eab308']
  const sscPositions = [
    'President','Vice President','General Secretary','Internal Secretary','External Secretary','Finance Officer','Audit Officer','Student Welfare and Rights Officer','Multimedia Officers','Editorial Officer','Logistics Officer'
  ]
  const iscPositions = ['Governor','Vice Governor','Board Member on Records','Board Member on Finance','Board Member on Audit','Board Member on Publication','Board Member on Public Relation','Board Member on Resources']
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
          const users = usersSnap.exists() ? usersSnap.val() : {}

          // Merge institute info into votes
          const mergedVotes = Object.keys(votesVal).map(uid => ({
            ...votesVal[uid],
            institute: (users[uid]?.institute || "").toUpperCase()
          }))

          setVotes(mergedVotes)

          // Count participation per institute for bar chart
          mergedVotes.forEach(v => {
            const inst = v.institute
            if (inst === "INSTITUTE OF ARTS AND SCIENCES") counts.IAS += 1
            else if (inst === "INSTITUTE OF BUSINESS AND COMPUTING EDUCATION") counts.IBCE += 1
            else if (inst === "INSTITUTE OF HOSPITALITY AND TOURISM MANAGEMENT") counts.IHTM += 1
            else if (inst === "INSTITUTE OF TEACHER EDUCATION") counts.ITE += 1
          })
        }

        setBarData([
          { 
            name: 'IAS', 
            value: counts.IAS > 0 ? ((counts.IAS / institutePopulation.IAS) * 100).toFixed(2) : 0, 
            raw: counts.IAS,
            total: institutePopulation.IAS,
            color: '#10b981' 
          },
          { 
            name: 'IBCE', 
            value: counts.IBCE > 0 ? ((counts.IBCE / institutePopulation.IBCE) * 100).toFixed(2) : 0, 
            raw: counts.IBCE,
            total: institutePopulation.IBCE,
            color: '#f59e0b' 
          },
          { 
            name: 'IHTM', 
            value: counts.IHTM > 0 ? ((counts.IHTM / institutePopulation.IHTM) * 100).toFixed(2) : 0, 
            raw: counts.IHTM,
            total: institutePopulation.IHTM,
            color: '#ec4899' 
          },
          { 
            name: 'ITE', 
            value: counts.ITE > 0 ? ((counts.ITE / institutePopulation.ITE) * 100).toFixed(2) : 0, 
            raw: counts.ITE,
            total: institutePopulation.ITE,
            color: '#3b82f6' 
          },
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
                <YAxis domain={[0, 100]} tick={{ fill: '#374151', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={{ stroke: '#e5e7eb' }} label={{ value: 'PERCENTAGE', angle: -90, position: 'insideLeft', offset: 10, fill: '#374151', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0].payload
                    return (
                      <div className="bg-white border border-gray-200 rounded-md px-3 py-2 text-sm shadow">
                        <div className="font-medium text-gray-800">{p.name}</div>
                        <div className="text-gray-600">Responses: {p.raw} / {p.total}</div>
                        <div className="text-gray-600">Percentage: {p.value}%</div>
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
      {/* <div className="mt-12">
        <h3 className="text-center text-2xl font-bold text-gray-800 mb-6">Supreme Student Council</h3>
        {candidates.filter(c => sscRoles.includes(c.role)).length === 0 ? (
        <div className="text-center text-red-800 italic text-sm"> No candidates for Supreme Student Council. </div>
        ) : (
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

            const data = roleCandidates.map(c => ({ name: `${c.lastName}, ${c.firstName}`, value: counts[c.id] || 0 }))
            
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
        )}
      </div> */}

      {/* SSC Position Results */}
      <div className="mt-12">
        <h3 className="text-center text-2xl font-bold text-gray-800 mb-6">
          Supreme Student Council
        </h3>

        {sscPositions.map(position => {
          const positionCandidates = candidates.filter(c => c.position === position)

          // Count votes
          const counts = {}
          votes.forEach(v => {
            const selected = v.votes?.[position]
            const arr = Array.isArray(selected)
              ? selected
              : selected
              ? [selected]
              : []
            arr.forEach(id => {
              counts[id] = (counts[id] || 0) + 1
            })
          })

          const totalVotes = Object.values(counts).reduce((a, b) => a + b, 0)

          const data = positionCandidates
            .map(c => ({
              id: c.id,
              name: `${c.lastName?.toUpperCase()}, ${c.firstName?.toUpperCase()}`,
              profile: c.profilePicture || '/default-avatar.png',
              votes: counts[c.id] || 0,
              percentage:
              counts[c.id] && totalPopulation > 0
                ? ((counts[c.id] / totalPopulation) * 100).toFixed(2)
                : '0.00',
              party: c.team || 'Independent',
            }))
            .sort((a, b) => b.votes - a.votes);


          // Function for proper ordinal suffix (1st, 2nd, 3rd, etc.)
          const getOrdinal = n => {
            const s = ['th', 'st', 'nd', 'rd'];
            const v = n % 100;
            return n + (s[(v - 20) % 10] || s[v] || s[0]);
          };


          return (
            <div
              key={position}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8"
            >
              <h3 className="text-center text-lg font-semibold text-gray-700 mb-4">
                {position}
              </h3>

              {data.length === 0 ? (
                <p className="text-center text-red-800 italic text-sm">
                  No candidate/s for this position yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {data.map((c, idx) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200">
                        <img
                          src={c.profile}
                          alt={c.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-gray-800">
                            {getOrdinal(idx + 1)} • {c.name}
                          </h4>
                          <span className="text-sm text-gray-600">{c.party}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${
                            c.votes > 0 ? 'bg-red-600' : 'bg-gray-300'
                          }`}
                          style={{
                            width: `${c.votes > 0 ? c.percentage : 0}%`,
                          }}
                        />
                      </div>

                      <div className="flex justify-between text-xs text-gray-600 mt-1">
                        <span>{c.votes} Votes</span>
                        <span>{c.percentage}%</span>
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ISC Position Results by Institute */}
      {/* <div className="mt-12">
        <h3 className="text-center text-2xl font-bold text-gray-800 mb-6">
          Institute Student Council
        </h3>
        <div className="space-y-10">
          {institutes.map(institute => {
            const instituteCandidates = candidates.filter(
              c => c.institute === institute && iscRoles.includes(c.role)
            )

            return (
              <div key={institute}>
                // Always show the institute 
                <h4 className="text-center text-lg font-semibold mb-4 text-gray-800">
                  {institute}
                </h4>

                {instituteCandidates.length === 0 ? (
                  <p className="text-center text-red-800 italic text-sm">
                    No candidates for this institute yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {iscRoles.map(role => {
                      const roleCandidates = instituteCandidates.filter(
                        c => c.role === role
                      )
                      if (roleCandidates.length === 0) return null

                      // Count votes
                      const counts = {}
                      votes.forEach(v => {
                        const key = `${institute}-${role}`
                        const selected = v.votes?.[key]
                        const arr = Array.isArray(selected)
                          ? selected
                          : selected
                          ? [selected]
                          : []
                        arr.forEach(
                          id => (counts[id] = (counts[id] || 0) + 1)
                        )
                      })

                      const data = roleCandidates.map(c => ({
                        name: `${c.lastName}, ${c.firstName}`,
                        value: counts[c.id] || 0,
                      }))

                      return (
                        <div
                          key={`${institute}-${role}`}
                          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
                        >
                          <h3 className="text-center text-sm font-semibold text-gray-700 mb-2">
                            {role}
                          </h3>
                          <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={data}
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={96}
                                  innerRadius={40}
                                  label
                                >
                                  {data.map((entry, index) => (
                                    <PieCell
                                      key={`isc-${institute}-${role}-${index}`}
                                      fill={
                                        pieColors[index % pieColors.length]
                                      }
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  formatter={(value, name) => [value, name]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
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
      </div> */}

      {/* ISC Position Results */}
      <div className="mt-12">
        <h3 className="text-center text-2xl font-bold text-gray-800 mb-6">
          Institute Student Council
        </h3>

        {["Institute of Arts and Sciences", "Institute of Business and Computing Education", "Institute of Hospitality and Tourism Management", "Institute of Teacher Education"].map(instituteFull => {
          const shortNameMap = {
            "Institute of Arts and Sciences": "IAS",
            "Institute of Business and Computing Education": "IBCE",
            "Institute of Hospitality and Tourism Management": "IHTM",
            "Institute of Teacher Education": "ITE"
          }

          const colorMap = {
            IAS: '#10b981',   
            IBCE: '#f59e0b',  
            IHTM: '#ec4899',  
            ITE: '#3b82f6'    
          }


          const shortName = shortNameMap[instituteFull]
          const population = institutePopulation[shortName] || 0
          const barColor = colorMap[shortName] || '#6b7280' 


          const instituteCandidates = candidates.filter(
            c => c.institute?.toUpperCase() === instituteFull.toUpperCase() && iscPositions.includes(c.position)
          )


          return (
            <div key={instituteFull} className="mb-12">
              <h4 className="text-xl font-bold text-center text-gray-700 mb-4">
                {instituteFull}
              </h4>

              {iscPositions.map(position => {
                const positionCandidates = instituteCandidates.filter(c => c.position === position)
                

                // Count votes for this institute + role
                const counts = {}
                votes.forEach(v => {
                  const voterInstitute = v.institute?.toUpperCase()
                  if (voterInstitute !== instituteFull.toUpperCase()) return

                  Object.entries(v.votes || {}).forEach(([key, value]) => {
                  // key is like "INSTITUTE OF ARTS AND SCIENCES-Governor"
                  const [instKey, positionKey] = key.split("-")

                  if (instKey?.toUpperCase() === instituteFull.toUpperCase() && positionKey === position) {
                    const arr = Array.isArray(value) ? value : value ? [value] : []
                    arr.forEach(id => {
                      counts[id] = (counts[id] || 0) + 1
                    })
                  }
                })
                })

                const data = positionCandidates
                  .map(c => {
                    const voteCount = counts[c.id] || 0
                    const percentage =
                      population > 0 ? ((voteCount / population) * 100).toFixed(2) : "0.00"

                    return {
                      id: c.id,
                      name: `${c.lastName?.toUpperCase()}, ${c.firstName?.toUpperCase()}`,
                      profile: c.profilePicture || "/default-avatar.png",
                      votes: voteCount,
                      percentage,
                      party: c.team || "Independent"
                    }
                  })
                  .sort((a, b) => b.votes - a.votes)

                const getOrdinal = (n) => {
                  const s = ["th", "st", "nd", "rd"]
                  const v = n % 100
                  return n + (s[(v - 20) % 10] || s[v] || s[0])
                }

                return (
                  <div
                    key={`${instituteFull}-${position}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6"
                  >
                    <h3 className="text-center text-lg font-semibold text-gray-700 mb-4">
                      {position}
                    </h3>

                    {data.length === 0 ? (
                      <p className="text-center text-red-800 italic text-sm">
                        No candidate/s for this position yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {data.map((c, idx) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border"
                          >
                            <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200">
                              <img
                                src={c.profile}
                                alt={c.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <h4 className="font-semibold text-gray-800">
                                  {getOrdinal(idx + 1)} • {c.name}
                                </h4>
                                <span className="text-sm text-gray-600">{c.party}</span>
                              </div>

                              {/* Progress Bar */}
                              <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                                <div
                                  className={`h-3 rounded-full transition-all duration-500 ${
                                    c.votes > 0 ? "bg-green-600" : "bg-gray-300"
                                  }`}
                                  style={{ width: `${c.votes > 0 ? c.percentage : 0}%`, backgroundColor: barColor }}
                                />
                              </div>

                              {/* Vote Count & Percentage */}
                              <div className="flex justify-between text-xs text-gray-600 mt-1">
                                <span>{c.votes} Votes</span>
                                <span>{c.percentage}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

    </>
  )
}

export default PublicResultsContent


