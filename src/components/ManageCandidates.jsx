import { useState, useEffect } from 'react'
import { ref as dbRef, get, update } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar'

function ApplicationCard({ app, onUpdateStatus, showActions }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800'
      case 'reviewed':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{app.applicant?.name || 'Unknown'}</h3>
          <p className="text-sm text-gray-600">{app.applicant?.email}</p>
          <p className="text-sm text-gray-600">{app.applicant?.institute}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
          {app.status?.toUpperCase() || 'UNKNOWN'}
        </span>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Submitted Documents:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {app.documents && Object.keys(app.documents).map((docKey) => (
            <a
              key={docKey}
              href={app.documents[docKey]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {docKey.replace(/([A-Z])/g, ' $1').trim()}
            </a>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-4">
        Submitted: {new Date(app.createdAt).toLocaleString()}
        {app.reviewedAt && (
          <span className="ml-4">
            Reviewed: {new Date(app.reviewedAt).toLocaleString()}
          </span>
        )}
      </div>

      {showActions && app.status === 'submitted' && (
        <div className="flex gap-3">
          <button
            onClick={() => onUpdateStatus(app.uid, app.id, 'reviewed')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            Reviewed
          </button>
          <button
            onClick={() => onUpdateStatus(app.uid, app.id, 'rejected')}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
          >
            Reject
          </button>
        </div>
      )}
      {showActions && app.status === 'reviewed' && (
        <div className="flex gap-3">
          <button
            onClick={() => onUpdateStatus(app.uid, app.id, 'approved')}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
          >
            Approve
          </button>
          <button
            onClick={() => onUpdateStatus(app.uid, app.id, 'rejected')}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

function ManageCandidates() {
  const { user, userData } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const appsRef = dbRef(db, 'candidacyApplications')
        const snapshot = await get(appsRef)
        
        if (snapshot.exists()) {
          const data = snapshot.val()
          const allApps = []
          
          Object.keys(data).forEach(uid => {
            Object.keys(data[uid]).forEach(appId => {
              allApps.push({
                id: appId,
                uid: uid,
                ...data[uid][appId]
              })
            })
          })
          
          setApplications(allApps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        }
      } catch (error) {
        console.error('Error fetching applications:', error)
        setMessage('Failed to load applications.')
      } finally {
        setLoading(false)
      }
    }

    if (userData?.role === 'admin') {
      fetchApplications()
    } else {
      setLoading(false)
    }
  }, [userData])

  const updateApplicationStatus = async (uid, appId, status) => {
    try {
      const appRef = dbRef(db, `candidacyApplications/${uid}/${appId}`)
      const updateData = {
        status: status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.uid
      }
      
      await update(appRef, updateData)
      
      // If approved, change user role to candidate
      if (status === 'approved') {
        const userRef = dbRef(db, `users/${uid}`)
        await update(userRef, { role: 'candidate' })
      }
      
      // Send email notification
      await sendStatusEmail(uid, status)
      
      setApplications(prev => 
        prev.map(app => 
          app.uid === uid && app.id === appId 
            ? { ...app, status, reviewedAt: new Date().toISOString() }
            : app
        )
      )
      
      setMessage(`Application ${status} successfully! Email notification sent.${status === 'approved' ? ' User role updated to candidate.' : ''}`)
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error updating application:', error)
      setMessage('Failed to update application status.')
    }
  }

  const sendStatusEmail = async (uid, status) => {
    try {
      // Get user data
      const userRef = dbRef(db, `users/${uid}`)
      const userSnapshot = await get(userRef)
      
      if (!userSnapshot.exists()) {
        console.error('User not found for email notification')
        return
      }
      
      const userData = userSnapshot.val()
      
      // Map status to email status
      let emailStatus = status
      let position = null
      
      if (status === 'approved') {
        emailStatus = 'passed'
        // You can customize position based on your needs
        position = 'Student Council Representative'
      } else if (status === 'rejected') {
        emailStatus = 'failed'
      }
      
      // Call email server
      const emailServerUrl = import.meta.env.VITE_EMAIL_SERVER_URL || 'http://localhost:3000'
      
      const response = await fetch(`${emailServerUrl}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userData.email,
          status: emailStatus,
          name: userData.name,
          position: position
        })
      })
      
      if (!response.ok) {
        throw new Error(`Email server responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Email sent successfully:', result)
      
    } catch (error) {
      console.error('Error sending email notification:', error)
      // Don't throw error here - we don't want email failures to break the status update
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

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-red-900">Manage Candidacy Applications</h1>
          <p className="text-gray-600 mt-1">Review and approve/reject candidate applications</p>
        </div>

        {message && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">{message}</p>
          </div>
        )}

        {applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No candidacy applications found.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Applications */}
            <div>
              <h2 className="text-lg font-semibold text-red-900 mb-4">Awaiting Your Review</h2>
              {applications.filter(app => app.status === 'submitted').length > 0 ? (
                <div className="space-y-4">
                  {applications.filter(app => app.status === 'submitted').map((app) => (
                    <ApplicationCard 
                      key={`${app.uid}-${app.id}`} 
                      app={app} 
                      onUpdateStatus={updateApplicationStatus}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">No applications awaiting review.</p>
                </div>
              )}
            </div>

            {/* Reviewed Applications (Screening) */}
            <div>
              <h2 className="text-lg font-semibold text-blue-700 mb-4">Reviewed Applications - Screening</h2>
              {applications.filter(app => app.status === 'reviewed').length > 0 ? (
                <div className="space-y-4">
                  {applications.filter(app => app.status === 'reviewed').map((app) => (
                    <ApplicationCard 
                      key={`${app.uid}-${app.id}`} 
                      app={app} 
                      onUpdateStatus={updateApplicationStatus}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">No applications in screening.</p>
                </div>
              )}
            </div>

            {/* Approved Applications */}
            <div>
              <h2 className="text-lg font-semibold text-green-700 mb-4">Approved Applications</h2>
              {applications.filter(app => app.status === 'approved').length > 0 ? (
                <div className="space-y-4">
                  {applications.filter(app => app.status === 'approved').map((app) => (
                    <ApplicationCard 
                      key={`${app.uid}-${app.id}`} 
                      app={app} 
                      onUpdateStatus={updateApplicationStatus}
                      showActions={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">No approved applications.</p>
                </div>
              )}
            </div>

            {/* Rejected Applications */}
            <div>
              <h2 className="text-lg font-semibold text-red-700 mb-4">Rejected Applications</h2>
              {applications.filter(app => app.status === 'rejected').length > 0 ? (
                <div className="space-y-4">
                  {applications.filter(app => app.status === 'rejected').map((app) => (
                    <ApplicationCard 
                      key={`${app.uid}-${app.id}`} 
                      app={app} 
                      onUpdateStatus={updateApplicationStatus}
                      showActions={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">No rejected applications.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageCandidates
