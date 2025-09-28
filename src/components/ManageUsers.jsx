import { useState, useEffect } from 'react'
import { ref as dbRef, get, update } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar'

function ManageUsers() {
  const { user, userData } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const [filteredUsers, setFilteredUsers] = useState([]); // search results
  const [searchId, setSearchId] = useState("");      // input value

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = dbRef(db, 'users')
        const snapshot = await get(usersRef)
        
        if (snapshot.exists()) {
          const data = snapshot.val()
          const userList = Object.keys(data).map(uid => ({
            uid,
            ...data[uid]
          }))
          
          setUsers(userList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)))
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        setMessage('Failed to load users.')
      } finally {
        setLoading(false)
      }
    }

    if (userData?.role === 'admin') {
      fetchUsers()
    } else {
      setLoading(false)
    }
  }, [userData])

    {/* SEARCH NEW */}
    useEffect(() => {
    if (!searchId.trim()) {
      setFilteredUsers(users); // show all if empty
    } else {
      const results = users.filter((user) =>
        user.studentId?.toLowerCase().includes(searchId.toLowerCase())
      );
      setFilteredUsers(results);
    }
  }, [searchId, users]);



  const updateUserRole = async (uid, newRole) => {
    try {
      const userRef = dbRef(db, `users/${uid}`)
      await update(userRef, { role: newRole })
      
      setUsers(prev => 
        prev.map(u => 
          u.uid === uid ? { ...u, role: newRole } : u
        )
      )
      
      setMessage(`User role updated to ${newRole} successfully.`)
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error updating user role:', error)
      setMessage('Failed to update user role.')
    }
  }


  if (userData?.role !== 'admin') {
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

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'candidate':
        return 'bg-purple-100 text-purple-800'
      case 'voter':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-red-900">Manage Users</h1>
          <p className="text-gray-600 mt-1">View and manage user accounts and roles</p>
        </div>

        {/* LIVE SEARCH BAR NEW */}
        <div className="mb-4">
        <input
          type="text"
          placeholder="Search users by Student ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="border px-3 py-2 rounded w-64"
        />
        </div>

        {message && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">{message}</p>
          </div>
        )}

        {users.length === 0 ? (
          <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No users found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institute</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                {/*SEARCH BAR RESULTS NEW */}
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.uid}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {u.profilePicture ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={u.profilePicture}
                                  alt={u.name || "User"}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-red-900 text-white flex items-center justify-center text-sm font-bold">
                                  {(u.name || "U").slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {u.name || "Unknown"}
                              </div>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {u.institute || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {u.studentId || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(
                              u.role
                            )}`}
                          >
                            {u.role?.toUpperCase() || "UNKNOWN"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              u.emailVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {u.emailVerified ? "VERIFIED" : "UNVERIFIED"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {u.uid !== user.uid ? (
                            <select
                              value={u.role || "voter"}
                              onChange={(e) => updateUserRole(u.uid, e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="voter">Voter</option>
                              <option value="candidate">Candidate</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className="text-xs text-gray-500">
                              Current User
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center text-gray-500 py-4"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageUsers
