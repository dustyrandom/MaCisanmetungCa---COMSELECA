import { useState, useEffect } from 'react'
import { ref as dbRef, get, update } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar'
import { logActivity } from '../utils/logActivity'

function ManageUsers() {
  const { user, userData } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchId, setSearchId] = useState('')

  // Modal
  const [editingUid, setEditingUid] = useState(null)
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    institute: '',
    role: '',
  })

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = dbRef(db, 'users')
        const snapshot = await get(usersRef)

        if (snapshot.exists()) {
          const data = snapshot.val()
          const userList = Object.keys(data).map(uid => ({
            uid,
            ...data[uid],
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

    if (userData?.role === 'superadmin') fetchUsers()
    else setLoading(false)
  }, [userData])

  // Search
  useEffect(() => {
    if (!searchId.trim()) setFilteredUsers(users)
    else {
      const results = users.filter((user) =>
        user.studentId?.toLowerCase().includes(searchId.toLowerCase())
      )
      setFilteredUsers(results)
    }
  }, [searchId, users])

  // Modal handlers
  const openEditModal = (u) => {
    setEditingUid(u.uid)
    setEditData({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      studentId: u.studentId || '',
      institute: u.institute || '',
      role: u.role || 'voter',
    })
  }

  const closeEditModal = () => {
    setEditingUid(null)
    setEditData({
      firstName: '',
      lastName: '',
      email: '',
      studentId: '',
      institute: '',
      role: '',
    })
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target

    if (name === 'studentId') {
      let newValue = value.replace(/[^0-9]/g, '')
      if (newValue.length > 4) newValue = newValue.slice(0, 4) + '-' + newValue.slice(4, 8)
      if (newValue.length > 9) newValue = newValue.slice(0, 9)
      setEditData({ ...editData, [name]: newValue })
    } else {
      setEditData({ ...editData, [name]: value })
    }
  }

  // Save changes
  const handleSave = async () => {
    const { firstName, lastName, email, studentId, institute, role } = editData
    const fullName = `${firstName} ${lastName}`.trim()

    if (!/^\d{4}-\d{4}$/.test(studentId)) {
      setMessage('Invalid Student ID format. Must be ####-####.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    if (!email.endsWith('@mcc.edu.ph')) {
      setMessage('Email must end with @mcc.edu.ph.')
      setTimeout(() => setMessage(''), 3000)
      return
    }

    try {
      const oldUser = users.find((u) => u.uid === editingUid)
      const changes = []
      const fieldsToCheck = ['firstName', 'lastName', 'email', 'studentId', 'institute', 'role']

      fieldsToCheck.forEach((field) => {
        if (oldUser?.[field] !== editData[field]) {
          changes.push(`${field}: "${oldUser?.[field] || 'N/A'}" → "${editData[field]}"`)
        }
      })

      const userRef = dbRef(db, `users/${editingUid}`)
      await update(userRef, {
        firstName,
        lastName,
        fullName,
        email,
        studentId,
        institute,
        role,
        updatedAt: new Date().toISOString(),
      })

      // Related DB updates
      /* const electionRef = dbRef(db, 'Election')
      const electionSnap = await get(electionRef)
      if (electionSnap.exists()) {
        const electionData = electionSnap.val()
        for (const id in electionData) {
          if (electionData[id].candidateUid === editingUid) {
            await update(dbRef(db, `Election/${id}`), {
              firstName,
              lastName,
              fullName,
              email,
              institute,
              studentId,
            })
          }
        }
      }

      const appsRef = dbRef(db, `candidacyApplications/${editingUid}`)
      const appsSnap = await get(appsRef)
      if (appsSnap.exists()) {
        const appsData = appsSnap.val()
        for (const appId in appsData) {
          await update(dbRef(db, `candidacyApplications/${editingUid}/${appId}/applicant`), {
            firstName,
            lastName,
            fullName,
            email,
            institute,
            studentId,
          })
        }
      }

      const votesRef = dbRef(db, `electionVotes/${editingUid}`)
      const votesSnap = await get(votesRef)
      if (votesSnap.exists()) {
        await update(votesRef, {
          voterName: fullName,
          voterEmail: email,
          voterInstitute: institute,
          voterStudentId: studentId,
        })
      } */

      // Log Activity
      if (changes.length > 0) {
        await logActivity(
          userData.fullName,
          `Edited user "${fullName}". Changes: ${changes.join(', ')}`
        )
      } else {
        await logActivity(userData.fullName, `Edited user "${fullName}" (no changes detected).`)
      }

      // Update UI
      setUsers((prev) =>
        prev.map((u) => (u.uid === editingUid ? { ...u, ...editData, fullName } : u))
      )

      setMessage('User information updated successfully!')
      setTimeout(() => setMessage(''), 3000)
      closeEditModal()
    } catch (error) {
      console.error('Error updating user data:', error)
      setMessage('Failed to update user information.')
    }
  }

  if (userData?.role !== 'superadmin') {
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

  const getRoleBadge = (role) => {
    switch (role) {
      case 'superadmin': return 'bg-indigo-100 text-indigo-800'
      case 'admin': return 'bg-rose-100 text-rose-800'
      case 'candidate': return 'bg-amber-100 text-amber-800'
      case 'voter': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-red-900">Manage Users</h1>
            <p className="text-gray-600 mt-1">View and manage user accounts and roles</p>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search users by Student ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="px-3 py-2 w-64  rounded-lg border focus:outline-none border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm shadow-sm transition placeholder-gray-500"
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Institute</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
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
                                  alt={u.fullName || 'User'}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-red-900 text-white flex items-center justify-center text-sm font-bold">
                                  {(u.fullName || 'U').slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {u.fullName || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{u.institute || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{u.studentId || '—'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(u.role)}`}>
                            {u.role?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                        <td className="px-6 py-4 text-sm">
                          {u.uid !== user.uid && (
                            <button
                              onClick={() => openEditModal(u)}
                              className="text-red-800 hover:text-red-700 font-medium"
                            >
                              Edit
                            </button>
                          )}
                          {u.uid === user.uid &&(
                            <p className='text-xs italic text-gray-700 whitespace-nowrap'>Current User</p>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-gray-500 py-4">
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

      {/* Edit Modal */}
      {editingUid && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-red-900 mb-4">Edit User</h2>
            <div className="space-y-3">
              <label className="block text-sm font-medium">First Name</label>
              <input name="firstName" value={editData.firstName} onChange={handleEditChange} className="border w-full p-2 rounded" />
              <label className="block text-sm font-medium">Last Name</label>
              <input name="lastName" value={editData.lastName} onChange={handleEditChange} className="border w-full p-2 rounded" />
              <label className="block text-sm font-medium">Email (@mcc.edu.ph)</label>
              <input name="email" value={editData.email} onChange={handleEditChange} className="border w-full p-2 rounded" disabled/>
              <label className="block text-sm font-medium">Student ID</label>
              <input name="studentId" value={editData.studentId} onChange={handleEditChange} className="border w-full p-2 rounded" />
              <label className="block text-sm font-medium">Institute</label>
              <select name="institute" value={editData.institute} onChange={handleEditChange} className="border w-full p-2 rounded">
                <option value="">Select Institute</option>
                <option value="Institute of Arts and Sciences">Institute of Arts and Sciences</option>
                <option value="Institute of Business and Computing Education">Institute of Business and Computing Education</option>
                <option value="Institute of Teacher Education">Institute of Teacher Education</option>
                <option value="Institute of Hospitality and Tourism Management">Institute of Hospitality and Tourism Management</option>
              </select>
              <label className="block text-sm font-medium">Role</label>
              <select name="role" value={editData.role} onChange={handleEditChange} className="border w-full p-2 rounded">
                <option value="voter">Voter</option>
                <option value="candidate">Candidate</option>
                <option value="admin">Admin</option>
                <option value="suoperadmin">Super Admin</option>
              </select>
            </div>
            <div className="mt-5 flex justify-end space-x-3">
              <button onClick={closeEditModal} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-red-900 text-white rounded hover:bg-red-800">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageUsers
