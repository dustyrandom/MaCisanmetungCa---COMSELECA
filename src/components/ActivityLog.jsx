import { useEffect, useState } from "react"
import { getDatabase, ref, onValue, push, set } from "firebase/database"
import NavBar from "./NavBar"
import { useAuth } from "../contexts/AuthContext"
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { getAuth, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth"

function ActivityLog() {
  const { user, userData } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isExporting, setIsExporting] = useState(false)


  useEffect(() => {
    if (userData?.role === "admin" || userData?.role === "superadmin") {
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

  if (userData?.role !== "superadmin" ) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
              <h1 className="text-xl font-bold text-red-900 mb-4">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to access this page.</p>
            </div>
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
  };

  const allLogs = [...logs, exportLog].sort((a, b) => b.timestamp - a.timestamp);

  // Build rows for Excel
  const rows = allLogs.map(log => ({
    Admin: log.admin,
    Action: log.action,
    Timestamp: new Date(log.timestamp).toLocaleString(),
  }));

  // Create workbook + sheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-fit column widths
  if (rows.length === 0) return;
  const columnWidths = Object.keys(rows[0]).map(key => {
    const maxLength = Math.max(
      ...rows.map(row => String(row[key]).length),
      key.length
    );
    return { wch: maxLength + 2 }; // +2 padding
  });

  ws['!cols'] = columnWidths;

  // Make sheet read-only
  ws["!protect"] = {
    password: "readonly",
    selectLockedCells: true,
    selectUnlockedCells: true
  };

  XLSX.utils.book_append_sheet(wb, ws, "Activity Logs");

  // Write Excel file
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });

  // Download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "admin_activity_logs.xlsx";
  link.click();
  URL.revokeObjectURL(url);

  // Log in Firebase
  logActivity("Exported activity logs");
};

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
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-red-900">Admin Activity Log</h1>
              <p className="text-gray-600 mt-1">View recent admin actions</p>
            </div>
            <div className="flex gap-2">
              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer">
                Import
                <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
              </label>
              <button
                onClick={() => setShowPasswordConfirm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
              >
                Export
              </button>
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
                              {log.timestamp
                              ? new Date(log.timestamp).toLocaleString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : "N/A"}
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

      {showPasswordConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Export</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Please enter your admin password to confirm exporting the activity logs.
            </p>

            <div className="mb-5">
              <label className="block text-sm text-gray-700 mb-1">Password:</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    )}
                  </svg>
                </button>
              </div>
              {passwordError && (
                <p className="text-red-600 text-sm mt-2">{passwordError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg font-medium border bg-gray-500 hover:bg-gray-600 text-white"
                onClick={() => {
                  setShowPasswordConfirm(false)
                  setAdminPassword("")
                  setPasswordError("")
                }}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg text-white font-medium ${
                  adminPassword ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-400 cursor-not-allowed"
                }`}
                onClick={async () => {
                  if (!adminPassword) return
                  try {
                    setIsExporting(true)
                    setPasswordError("")
                    const auth = getAuth()
                    await reauthenticateWithCredential(
                      auth.currentUser,
                      EmailAuthProvider.credential(auth.currentUser.email, adminPassword)
                    )
                    setShowPasswordConfirm(false)
                    await handleExport()
                    setAdminPassword("");
                    setShowPassword(false);
                    setPasswordError("");
                  } catch (error) {
                    console.error(error)
                    setPasswordError("Incorrect password. Please try again.")
                  } finally {
                    setIsExporting(false)
                  }
                }}
                disabled={!adminPassword || isExporting}
              >
                {isExporting ? "Verifying…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ActivityLog
