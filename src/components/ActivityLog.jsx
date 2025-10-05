import { useEffect, useState } from "react"
import { getDatabase, ref, onValue, remove, push, set } from "firebase/database"
import NavBar from "./NavBar"
import { useAuth } from "../contexts/AuthContext"
import Papa from "papaparse"

function ActivityLog() {
  const { user, userData } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userData?.role === "admin") {
      const db = getDatabase()
      const logsRef = ref(db, "activityLogs")
      const unsubscribe = onValue(logsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val()
          const logList = Object.entries(data)
            .map(([id, log]) => ({ id, ...log }))
            .sort((a, b) => b.timestamp - a.timestamp) // newest first
          setLogs(logList)
        } else {
          setLogs([])
        }
        setLoading(false)
      })

      return () => unsubscribe()
    } else {
      setLoading(false)
    }
  }, [userData])

  if (userData?.role !== "admin") {
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

  // Group logs by date
  const groupedLogs = logs.reduce((acc, log) => {
    const dateObj = new Date(log.timestamp)
    const date = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    if (!acc[date]) acc[date] = []
    acc[date].push(log)
    return acc
  }, {})


  //Export admin activity
  const handleExport = async () => {
  const exportLog = {
    id: "export-" + Date.now(),
    admin: userData.name || user.email || "Unknown",
    action: "Exported activity logs",
    timestamp: Date.now(),
  }

  const allLogs = [...logs, exportLog].sort((a, b) => b.timestamp - a.timestamp)

  const csvData = allLogs.map(log => ({
    admin: log.admin,
    action: log.action,
    timestamp: new Date(log.timestamp).toISOString()
  }))

  const csv = Papa.unparse(csvData)

  try {
    // Open folder picker
    const handle = await window.showSaveFilePicker({
      suggestedName: "admin_activity_logs.csv",
      types: [
        {
          description: "CSV Files",
          accept: { "text/csv": [".csv"] },
        },
      ],
    })

    // Write the CSV
    const writable = await handle.createWritable()
    await writable.write(csv)
    await writable.close()

    // Log in Firebase
    logActivity("Exported activity logs")
  } catch (err) {
    console.error("Admin activity log save cancelled or failed:", err)
  }
}

  // Import activity logs
  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const db = getDatabase()
        results.data.forEach(row => {
          const ts = new Date(row.timestamp).getTime()
          if (row.admin && row.action && !isNaN(ts)) {
            const newLogRef = push(ref(db, "activityLogs"))
            set(newLogRef, {
              admin: row.admin,
              action: row.action,
              timestamp: ts
            })
          }
        })
        logActivity(`Imported activity logs`)
        e.target.value = "" // Reset file input
      },
      error: (error) => {
        console.error("CSV import error:", error)
      }
    })
  }

  // Log admin activity to Firebase
  const logActivity = (action) => {
    const db = getDatabase()
    const newLogRef = push(ref(db, "activityLogs"))
    set(newLogRef, {
      admin: userData.name || user.email || "Unknown",
      action,
      timestamp: Date.now()
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Activity Log</h1>
            <p className="text-gray-600 mt-1">View recent admin actions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-600 transition"
            >
              Export CSV
            </button>
            <label className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600 transition cursor-pointer">
              Import CSV
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </label>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No activity logs yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedLogs).map(date => (
              <div key={date} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                <div className="bg-gray-100 px-6 py-2 font-semibold text-gray-700">{date}</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Admin
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {groupedLogs[date].map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-medium text-gray-900">{log.admin || "Unknown"}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{log.action}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityLog
