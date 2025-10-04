import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar'
import { ref as dbRef, get, update, set, remove, onValue } from 'firebase/database'
import { logActivity } from '../utils/logActivity'

function ApplicationCard({ app, onUpdateStatus, onAppointmentDecision, showActions, showAppointment, savingId }) {
  const formatDateTime = (value) => {
    try {
      return value ? new Date(value).toLocaleString() : ''
    } catch {
      return value || ''
    }
  }

  const documentLabels = {
  coc: "Certificate of Candidacy",
  cog: "Certificate of Good Moral",
  cor: "Certificate of Registration",
  loa: "Leave of Absence",
  goodMoral: "Good Moral Certificate",
  psychologicalEvaluation: "Psychological Evaluation",
  letterOfIntent: "Letter of Intent",
  letterOfMotivation: "Letter of Motivation",
  resignationLetter: "Resignation Letter",
  };

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
          <h3 className="text-lg font-semibold text-gray-900">{app.applicant?.fullName || 'Unknown'}</h3>
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
              {documentLabels[docKey] || docKey} {/* NEW DOCUMENT LABELS */}
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
            disabled={savingId === `${app.uid}-${app.id}`}
            className={`px-4 py-2 rounded text-sm text-white ${savingId === `${app.uid}-${app.id}` ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {savingId === `${app.uid}-${app.id}` ? 'Updating…' : 'Reviewed'}
          </button>
          <button
            onClick={() => onUpdateStatus(app.uid, app.id, 'rejected')}
            disabled={savingId === `${app.uid}-${app.id}`}
            className={`px-4 py-2 rounded text-sm text-white ${savingId === `${app.uid}-${app.id}` ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {savingId === `${app.uid}-${app.id}` ? 'Updating…' : 'Reject'}
          </button>
        </div>
      )}
      {showAppointment && app.status === 'reviewed' && (
        <div className="space-y-3">
          {app.appointment ? (
            <div className="border rounded p-3 text-sm">
              <p className="font-medium mb-1">Appointment</p>
              <p><span className="text-gray-600">Status:</span> {app.appointment.status}</p>
              <p><span className="text-gray-600">Date & Time:</span> {formatDateTime(app.appointment.dateTime)}</p>
              <p><span className="text-gray-600">Venue:</span> {app.appointment.venue}</p>
              {app.appointment.status === 'pending' && (
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => onAppointmentDecision(app.uid, app.id, 'approved', app.appointment)}
                    disabled={savingId === `${app.uid}-${app.id}-appt`}
                    className={`px-4 py-2 rounded text-sm text-white ${savingId === `${app.uid}-${app.id}-appt` ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    {savingId === `${app.uid}-${app.id}-appt` ? 'Updating…' : 'Approve Appointment'}
                  </button>
                  <button
                    onClick={() => onAppointmentDecision(app.uid, app.id, 'rejected', app.appointment)}
                    disabled={savingId === `${app.uid}-${app.id}-appt`}
                    className={`px-4 py-2 rounded text-sm text-white ${savingId === `${app.uid}-${app.id}-appt` ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {savingId === `${app.uid}-${app.id}-appt` ? 'Updating…' : 'Reject Appointment'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No appointment submitted yet.</p>
          )}
        </div>
      )}

      {showActions && app.status === 'reviewed' && (
        <div className="flex gap-3 mt-3">
          <button
            onClick={() => onUpdateStatus(app.uid, app.id, 'approved')}
            disabled={savingId === `${app.uid}-${app.id}`}
            className={`px-4 py-2 rounded text-sm text-white ${savingId === `${app.uid}-${app.id}` ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {savingId === `${app.uid}-${app.id}` ? 'Updating…' : 'Approve'}
          </button>
          <button
            onClick={() => onUpdateStatus(app.uid, app.id, 'rejected')}
            disabled={savingId === `${app.uid}-${app.id}`}
            className={`px-4 py-2 rounded text-sm text-white ${savingId === `${app.uid}-${app.id}` ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {savingId === `${app.uid}-${app.id}` ? 'Updating…' : 'Reject'}
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
  const [activeTab, setActiveTab] = useState('candidacy') // 'candidacy' | 'appointments' | 'settings'
  const [savingId, setSavingId] = useState('')
  const [savingScreening, setSavingScreening] = useState(false)
  const [appointmentStatus, setAppointmentStatus] = useState({ isActive: false, startDate: '', endDate: '' })
  const [newSlot, setNewSlot] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [slotToDelete, setSlotToDelete] = useState(null)
  const [isError, setIsError] = useState(false)

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

        // Realtime appointmentStatus listener
        const statusRef = dbRef(db, 'appointmentStatus')
        const unsubscribe = onValue(statusRef, (snapshot) => {
          if (snapshot.exists()) {
            setAppointmentStatus(snapshot.val())
          } else {
            const nextDay = new Date()
            nextDay.setDate(nextDay.getDate() + 1)
            nextDay.setHours(9, 0, 0, 0)
            const end = new Date(nextDay)
            end.setHours(17, 0, 0, 0)
            const toLocalInput = (d) =>
              new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
            setAppointmentStatus({
              isActive: false,
              startDate: toLocalInput(nextDay),
              endDate: toLocalInput(end),
              slots: {}
            })
          }
        })

        // Cleanup when component unmounts
        return () => unsubscribe()

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
      setSavingId(`${uid}-${appId}`)
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
      
      const updatedUser = applications.find(app => app.uid === uid)
      logActivity(userData.fullName, `Updated candidacy status of ${updatedUser?.applicant?.fullName || uid} to ${status}`)

      // Send email notification
      await sendStatusEmail(uid, status)
      
      setApplications(prev => 
        prev.map(app => 
          app.uid === uid && app.id === appId 
            ? { ...app, status, reviewedAt: new Date().toISOString() }
            : app
        )
      )
      

      const updatedApp = applications.find(app => app.uid === uid && app.id === appId)
      logActivity(
        userData.fullName,
        status === 'reviewed'
          ? `Reviewed candidacy application of ${updatedApp?.applicant?.fullName || uid}`
          : status === 'approved'
            ? `Approved candidacy application of ${updatedApp?.applicant?.fullName || uid}`
            : `Rejected candidacy application of ${updatedApp?.applicant?.fullName || uid}`
      )

      setMessage(`Application ${status} successfully! Email notification sent.${status === 'approved' ? ' User role updated to candidate.' : ''}`)
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error updating application:', error)
      setMessage('Failed to update application status.')
    } finally {
      setSavingId('')
    }
  }

  const decideAppointment = async (uid, appId, decision, appointment) => {
    try {
      setSavingId(`${uid}-${appId}-appt`)
      const apptRef = dbRef(db, `candidacyApplications/${uid}/${appId}/appointment`)
      const historyItem = {
        decision,
        decidedAt: new Date().toISOString(),
        decidedBy: user.uid,
        dateTime: appointment?.dateTime,
        venue: appointment?.venue
      }
      await update(apptRef, { status: decision })
      const historyRef = dbRef(db, `candidacyApplications/${uid}/${appId}/appointmentHistory/${Date.now()}`)
      await set(historyRef, historyItem)

      const updatedUser = applications.find(app => app.uid === uid)
      logActivity(userData.fullName, `${decision === 'approved' ? 'Approved' : 'Rejected'} screening appointment of ${updatedUser?.applicant?.fullName || uid}`)

      // Send email on decision
      if (decision === 'approved') {
        await sendAppointmentEmail(uid, appointment)
      } else if (decision === 'rejected') {
        await sendAppointmentRejectedEmail(uid)
      }

      setApplications(prev => prev.map(app => app.uid === uid && app.id === appId ? {
        ...app,
        appointment: { ...app.appointment, status: decision }
      } : app))

      setMessage(`Appointment ${decision}. Email ${decision === 'approved' || decision === 'rejected' ? 'sent' : 'not sent'}.`)
      setTimeout(() => setMessage(''), 3000)
    } catch (e) {
      console.error('Failed to decide appointment', e)
      setMessage('Failed to update appointment')
    } finally {
      setSavingId('')
    }
  }

  const sendAppointmentEmail = async (uid, appointment) => {
    try {
      const userRef = dbRef(db, `users/${uid}`)
      const userSnapshot = await get(userRef)
      if (!userSnapshot.exists()) return
      const candidate = userSnapshot.val()

      const emailServerUrl = import.meta.env.VITE_EMAIL_SERVER_URL || 'http://localhost:3000'
      const response = await fetch(`${emailServerUrl}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: candidate.email,
          status: 'appointment',
          fullName: candidate.fullName,
          details: { dateTime: appointment?.dateTime, venue: appointment?.venue }
        })
      })
      if (!response.ok) throw new Error('Email server error')
    } catch (e) {
      console.error('Error sending appointment email', e)
    }
  }

  const sendAppointmentRejectedEmail = async (uid) => {
    try {
      const userRef = dbRef(db, `users/${uid}`)
      const userSnapshot = await get(userRef)
      if (!userSnapshot.exists()) return
      const candidate = userSnapshot.val()

      const emailServerUrl = import.meta.env.VITE_EMAIL_SERVER_URL || 'http://localhost:3000'
      const response = await fetch(`${emailServerUrl}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: candidate.email,
          status: 'appointmentRejected',
          fullName: candidate.fullName
        })
      })
      if (!response.ok) throw new Error('Email server error')
    } catch (e) {
      console.error('Error sending appointment rejected email', e)
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
          fullName: userData.fullName,
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
          <h1 className="text-2xl font-bold text-red-900">Candidacy Management</h1>
          <p className="text-gray-600 mt-1">Candidacy and screening appointments</p>
        </div>

        {/* Settings Tab Nav */}

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6" aria-label="Tabs">
            <button
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'candidacy' ? 'border-red-900 text-red-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('candidacy')}
            >
              Applications
            </button>
            <button
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'appointments' ? 'border-red-900 text-red-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('appointments')}
            >
              Screening Appointments
            </button>
            <button
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings' ? 'border-red-900 text-red-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </nav>
        </div>

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Screening Appointment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Add Appointment Slot</label>
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={newSlot}
                      onChange={(e) => setNewSlot(e.target.value)}
                      className="border rounded px-3 py-2 flex-1"
                    />
                    <button
                      onClick={async () => {
                        if (!newSlot) {
                          setMessage("Please select a date and time")
                          setIsError(true)
                          setTimeout(() => setMessage(""), 2000)
                          return
                        }

                        const selectedDate = new Date(newSlot)
                        const now = new Date()

                        if (selectedDate < now) {
                          setMessage("Cannot add a past date/time slot")
                          setIsError(true)
                          setTimeout(() => setMessage(""), 2000)
                          return
                        }

                        try {
                          const slotRef = dbRef(db, `appointmentStatus/slots/${newSlot}`)
                          const existing = await get(slotRef)

                          if (existing.exists()) {
                            setMessage("This slot already exists")
                            setIsError(true)
                            setTimeout(() => setMessage(""), 2000)
                            return
                          }

                          await set(slotRef, { available: true })
                          setNewSlot("")
                          setMessage("Slot added successfully")
                          setIsError(false)
                          logActivity(userData.fullName, `Added new screening appointment slot on ${selectedDate.toLocaleString()}`)
                          setTimeout(() => setMessage(""), 2000)
                        } catch (err) {
                          console.error("Error adding slot", err)
                          setMessage("Failed to add slot")
                          setIsError(true)
                          setTimeout(() => setMessage(""), 2000)
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded"
                    >
                      Add Slot
                    </button>
                    
                  </div>
                  {message && (
                    <p className={`mt-2 mb-4 text-sm ${isError ? "text-red-600" : "text-green-600"}`}>
                      {message}
                    </p>
                  )}
                </div>

                {/* Display slots */}
                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Available Slots</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {appointmentStatus.slots
                      ? Object.keys(appointmentStatus.slots).map((s) => (
                          <li key={s} className="flex justify-between items-center border rounded px-3 py-1">
                            <span>{new Date(s).toLocaleString()}</span>
                            <div className="flex items-center gap-3">
                              <span className={appointmentStatus.slots[s].available ? "text-green-600" : "text-red-600"}>
                                {appointmentStatus.slots[s].available ? "Available" : "Booked"}
                              </span>
                              <button
                                onClick={() => {
                                  setSlotToDelete(s)
                                  setShowDeleteModal(true)
                                }}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>  
                          </li>
                        ))
                      : <p>No slots created yet.</p>}
                  </ul>

                </div>
            </div>
            
            </div>
          </div>
        )}

        {activeTab === 'candidacy' && (applications.length === 0 ? (
          <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No candidacy applications found.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Applications */}
            <div>
              <h2 className="text-lg font-semibold text-red-900 mb-4">Submitted Candidacy Applications</h2>
              {applications.filter(app => app.status === 'submitted').length > 0 ? (
                <div className="space-y-4">
                  {applications.filter(app => app.status === 'submitted').map((app) => (
                    <ApplicationCard 
                      key={`${app.uid}-${app.id}`} 
                      app={app} 
                      onUpdateStatus={updateApplicationStatus}
                      savingId={savingId}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">No candidacy awaiting review.</p>
                </div>
              )}
            </div>

            {/* Reviewed Applications (Screening) */}
            <div>
              <h2 className="text-lg font-semibold text-blue-700 mb-4">Reviewed Candidacy Applications (After Screening)</h2>
              {applications.filter(app => app.status === 'reviewed').length > 0 ? (
                <div className="space-y-4">
                  {applications.filter(app => app.status === 'reviewed').map((app) => (
                    <ApplicationCard 
                      key={`${app.uid}-${app.id}`} 
                      app={app} 
                      onUpdateStatus={updateApplicationStatus}
                      onAppointmentDecision={decideAppointment}
                      savingId={savingId}
                      showActions={true}
                      showAppointment={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">No reviewed candicacy.</p>
                </div>
              )}
            </div>

            {/* Approved Applications */}
            <div>
              <h2 className="text-lg font-semibold text-green-700 mb-4">Approved Candidacy Applications</h2>
              {applications.filter(app => app.status === 'approved').length > 0 ? (
                <div className="space-y-4">
                  {applications.filter(app => app.status === 'approved').map((app) => (
                    <ApplicationCard 
                      key={`${app.uid}-${app.id}`} 
                      app={app} 
                      onUpdateStatus={updateApplicationStatus}
                      savingId={savingId}
                      showActions={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">No approved candicacy.</p>
                </div>
              )}
            </div>

            {/* Rejected Applications */}
            <div>
              <h2 className="text-lg font-semibold text-red-700 mb-4">Rejected Candidacy Applications</h2>
              {applications.filter(app => app.status === 'rejected').length > 0 ? (
                <div className="space-y-4">
                  {applications.filter(app => app.status === 'rejected').map((app) => (
                    <ApplicationCard 
                      key={`${app.uid}-${app.id}`} 
                      app={app} 
                      onUpdateStatus={updateApplicationStatus}
                      savingId={savingId}
                      showActions={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                  <p className="text-gray-500">No rejected candidacy.</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {activeTab === 'appointments' && (() => {
          const withAppointments = applications.filter(app => app.appointment)
          const byStatus = (s) => withAppointments.filter(app => app.appointment.status === s)
          return (
            <div className="space-y-8">
              {/* Pending Screening Appointments */}
              <div>
                <h2 className="text-lg font-semibold text-yellow-700 mb-4">Pending Screening Appointments</h2>
                {byStatus('pending').length > 0 ? (
                  <div className="space-y-4">
                    {byStatus('pending').map(app => (
                      <ApplicationCard
                        key={`${app.uid}-${app.id}`}
                        app={app}
                        onUpdateStatus={updateApplicationStatus}
                        onAppointmentDecision={decideAppointment}
                        savingId={savingId}
                        showActions={false}
                        showAppointment={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                    <p className="text-gray-500">No pending screening appointments.</p>
                  </div>
                )}
              </div>

              {/* Approved Screening Appointments */}
              <div>
                <h2 className="text-lg font-semibold text-green-700 mb-4">Approved Screening Appointments</h2>
                {byStatus('approved').length > 0 ? (
                  <div className="space-y-4">
                    {byStatus('approved').map(app => (
                      <ApplicationCard
                        key={`${app.uid}-${app.id}`}
                        app={app}
                        onUpdateStatus={updateApplicationStatus}
                        onAppointmentDecision={decideAppointment}
                        savingId={savingId}
                        showActions={false}
                        showAppointment={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                    <p className="text-gray-500">No approved screening appointments.</p>
                  </div>
                )}
              </div>

              {/* Rejected Appointments */}
              <div>
                <h2 className="text-lg font-semibold text-red-700 mb-4">Rejected Screening Appointments</h2>
                {byStatus('rejected').length > 0 ? (
                  <div className="space-y-4">
                    {byStatus('rejected').map(app => (
                      <ApplicationCard
                        key={`${app.uid}-${app.id}`}
                        app={app}
                        onUpdateStatus={updateApplicationStatus}
                        onAppointmentDecision={decideAppointment}
                        savingId={savingId}
                        showActions={false}
                        showAppointment={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                    <p className="text-gray-500">No rejected screening appointments.</p>
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>

        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Slot</h3>
              <p className="text-gray-700 mb-6">
                Delete slot on <span className="font-medium">{new Date(slotToDelete).toLocaleString()}</span>?<br/>
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await remove(dbRef(db, `appointmentStatus/slots/${slotToDelete}`))
                      setAppointmentStatus(prev => {
                        const updated = { ...prev }
                        if (updated.slots) delete updated.slots[slotToDelete]
                        return updated
                      })
                      setMessage("Slot deleted successfully")
                      logActivity(userData.fullName, `Deleted screening appointment slot on ${new Date(slotToDelete).toLocaleString()}`)
                    } catch (e) {
                      console.error("Failed to delete slot", e)
                      setMessage("Failed to delete slot")
                    } finally {
                      setShowDeleteModal(false)
                      setSlotToDelete(null)
                      setTimeout(() => setMessage(""), 2000)
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

    </div>
  )
}

export default ManageCandidates
