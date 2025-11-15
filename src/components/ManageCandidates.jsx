import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar'
import { ref as dbRef, get, update, set, remove, onValue } from 'firebase/database'
import { logActivity } from '../utils/logActivity'

const normalizeInstitute = (name) => {
    switch (name) {
      case 'Institute of Arts and Sciences': return 'IAS';
      case 'Institute of Business and Computing Education': return 'IBCE';
      case 'Institute of Teacher Education': return 'ITE';
      case 'Institute of Hospitality and Tourism Management': return 'IHTM';
      default: return name;
    }
  };

function ApplicationCard({ app, showActions, savingId, setConfirmAction, setShowConfirmModal }) {
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
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'passed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative bg-white rounded-xl shadow border border-gray-200 p-6 transition-transform hover:scale-[1.01]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {app.applicant?.fullName || 'Unknown'}
          </h3>
          <p className="text-sm text-gray-600 break-all">{app.applicant?.studentId || 'No Student ID'} • {app.applicant?.email}</p>
          <p className="text-sm text-gray-600">{app.applicant?.institute}</p>
        </div>
        <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
          {app.status?.toUpperCase() || 'UNKNOWN'}
        </span>
      </div>

      {/* Documents */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Submitted Documents:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs break-words">
          {app.documents && Object.keys(app.documents).map((docKey) => (
            <a
              key={docKey}
              href={app.documents[docKey]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline truncate"
            >
              {documentLabels[docKey] || docKey}
            </a>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="text-xs text-gray-500 mb-4 flex flex-col sm:flex-row gap-1 sm:gap-4">
        <span>Submitted: {new Date(app.createdAt).toLocaleString()}</span>
        {app.reviewedAt && (
          <span>Reviewed: {new Date(app.reviewedAt).toLocaleString()}</span>
        )}
      </div>

      {/* Action Buttons for Submitted */}
      {showActions && app.status === 'submitted' && (
        <div className="flex flex-wrap justify-end items-center gap-3">
          <button
            onClick={() => {
              setConfirmAction({ type: 'candidacy', action: 'reject', uid: app.uid, appId: app.id });
              setShowConfirmModal(true);
            }}
            disabled={savingId === `${app.uid}-${app.id}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition ${
              savingId === `${app.uid}-${app.id}`
                ? 'bg-red-300 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {savingId === `${app.uid}-${app.id}` ? 'Updating…' : 'Reject'}
          </button>
          <button
            onClick={() => {
              setConfirmAction({ type: 'candidacy', action: 'review', uid: app.uid, appId: app.id });
              setShowConfirmModal(true);
            }}
            disabled={savingId === `${app.uid}-${app.id}`}
            className={`px-4 py-2 rounded-lg font-medium text-sm text-white transition ${
              savingId === `${app.uid}-${app.id}`
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {savingId === `${app.uid}-${app.id}` ? 'Updating…' : 'Reviewed'}
          </button>
        </div>
      )}

      {/* Passed / Failed Buttons */}
      {showActions && app.status === 'reviewed' && (
        <div className="flex flex-wrap justify-end items-center gap-3">
          {(() => {
            const appointmentDate = app.appointment?.dateTime ? new Date(app.appointment.dateTime) : null;
            const now = new Date();
            const isFuture = appointmentDate && appointmentDate > now;
            const disableButtons =
              savingId === `${app.uid}-${app.id}` ||
              !app.appointment ||
              (appointmentDate && appointmentDate > now) ||
              app.appointment.status === 'pending';

            return (
              <>
                <button
                  onClick={() => {
                    setConfirmAction({ type: 'candidacy', action: 'failed', uid: app.uid, appId: app.id });
                    setShowConfirmModal(true);
                  }}
                  disabled={disableButtons}
                  className={`px-4 py-2 rounded-lg font-medium text-sm text-white transition ${
                    disableButtons
                      ? 'bg-rose-300 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {savingId === `${app.uid}-${app.id}`
                    ? 'Updating…'
                    : !app.appointment || app.appointment?.status === 'pending' || isFuture
                    ? 'Awaiting Screening'
                    : 'Failed'}
                </button>
                <button
                  onClick={() => {
                    setConfirmAction({ type: 'candidacy', action: 'passed', uid: app.uid, appId: app.id });
                    setShowConfirmModal(true);
                  }}
                  disabled={disableButtons}
                  className={`px-4 py-2 rounded-lg font-medium text-sm text-white transition ${
                    disableButtons
                      ? 'bg-green-300 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  {savingId === `${app.uid}-${app.id}`
                    ? 'Updating…'
                    : !app.appointment || app.appointment?.status === 'pending' || isFuture
                    ? 'Awaiting Screening'
                    : 'Passed'}
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function ManageCandidates() {
  const { user, userData } = useAuth()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('candidacy') // 'candidacy' | 'appointments' | 'settings'
  const [savingId, setSavingId] = useState('')
  const [appointmentStatus, setAppointmentStatus] = useState({ isActive: false, startDate: '', endDate: '' })
  const [newSlot, setNewSlot] = useState("")
  const [globalVenue, setGlobalVenue] = useState("")
  const [editingVenue, setEditingVenue] = useState(false);
  const [venueError, setVenueError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [slotToDelete, setSlotToDelete] = useState(null)
  const [isError, setIsError] = useState(false)
  const [candidacyStatus, setCandidacyStatus] = useState({ startDate: '', endDate: '' });
  const [savingCandidacyStatus, setSavingCandidacyStatus] = useState(false);
  const [showCandidacyModal, setShowCandidacyModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'candidacy' | 'appointment', action: 'approve' | 'reject' | 'review', uid, appId, appointment }
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [candidacyModalMessage, setCandidacyModalMessage] = useState('');
  const [candidacyModalError, setCandidacyModalError] = useState('');
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterInstitute, setFilterInstitute] = useState('');


  useEffect(() => {
  const fetchApplications = async () => {
    try {
      const appsRef = dbRef(db, 'candidacyApplications')
      const snapshot = await get(appsRef)
      const csSnap = await get(dbRef(db, 'candidacyStatus'))
      if (csSnap.exists()) setCandidacyStatus(csSnap.val())

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
      const statusRef = dbRef(db, 'screeningAppointments')
      const gvSnap = await get(dbRef(db, 'screeningAppointments/globalVenue'))
      if (gvSnap.exists()) setGlobalVenue(gvSnap.val())
      const unsubscribe = onValue(statusRef, async (snapshot) => {
        const now = new Date()
        let updatedStatus = { isActive: false, startDate: '', endDate: '', slots: {} }

        if (snapshot.exists()) {
          updatedStatus = snapshot.val()

          if (updatedStatus.slots) {
            for (const slotKey of Object.keys(updatedStatus.slots)) {
              const slot = updatedStatus.slots[slotKey]
              const slotDate = new Date(slotKey)

              // Skip deletion if slot is booked
              const isBooked = slot?.available === false || slot?.status === 'booked'

              // Delete only unbooked and past slots
              if (slotDate < now && !isBooked) {
                try {
                  await remove(dbRef(db, `screeningAppointments/slots/${slotKey}`))
                  delete updatedStatus.slots[slotKey] // remove from local state immediately
                } catch (err) {
                  console.error('Failed to remove past slot', slotKey, err)
                }
              }
            }
          }
        } else {
          // If no snapshot, create default next-day slot object
          const nextDay = new Date()
          nextDay.setDate(nextDay.getDate() + 1)
          nextDay.setHours(9, 0, 0, 0)

          const end = new Date(nextDay)
          end.setHours(17, 0, 0, 0)

          const toLocalInput = (d) =>
            new Date(d.getTime() - d.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16)

          updatedStatus = {
            isActive: false,
            startDate: toLocalInput(nextDay),
            endDate: toLocalInput(end),
            slots: {}
          }
        }

        // Update the state after processing
        setAppointmentStatus(updatedStatus)
      })

      // Cleanup listener
      return () => unsubscribe()
    } catch (error) {
      console.error('Error fetching applications:', error)
      setMessage('Failed to load applications.')
    } finally {
      setLoading(false)
    }
  }

  if (userData?.role === 'admin' || userData?.role === 'superadmin' ) {
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
      if (status === 'passed') {
        const userRef = dbRef(db, `users/${uid}`)
        await update(userRef, { role: 'candidate' })
      }
      
      const updatedUser = applications.find(app => app.uid === uid)
      if (status === 'passed') {
        logActivity(userData.fullName, `Passed candidate ${updatedUser?.applicant?.fullName || uid}`)
      } else if (status === 'failed') {
        logActivity(userData.fullName, `Failed candidate ${updatedUser?.applicant?.fullName || uid}`)
      } else if (status === 'reviewed') {
        logActivity(userData.fullName, `Reviewed candidacy application of ${updatedUser?.applicant?.fullName || uid}`)
      } else if (status === 'rejected') {
        logActivity(userData.fullName, `Rejected candidacy application of ${updatedUser?.applicant?.fullName || uid}`)
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
      logActivity(userData.fullName, `${decision === 'approved' ? 'Approved' : 'Declined'} screening appointment of ${updatedUser?.applicant?.fullName || uid}`)

      // Send email on decision
      if (decision === 'approved') {
        await sendAppointmentEmail(uid, appointment)
      } else if (decision === 'declined') {
        await sendAppointmentRejectedEmail(uid)
      }

      setApplications(prev => prev.map(app => app.uid === uid && app.id === appId ? {
        ...app,
        appointment: { ...app.appointment, status: decision }
      } : app))

      setMessage(`Appointment ${decision}. Email ${decision === 'approved' || decision === 'declined' ? 'sent' : 'not sent'}.`)
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
          status: 'appointmentDeclined',
          fullName: candidate.fullName
        })
      })
      if (!response.ok) throw new Error('Email server error')
    } catch (e) {
      console.error('Error sending appointment declined email', e)
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
      
      if (status === 'passed') {
        emailStatus = 'passed'
        // You can customize position based on your needs
        position = 'Student Council Representative'
      } else if (status === 'failed') {
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

  const handleSaveCandidacySettings = async () => {
    setSavingCandidacyStatus(true);
    try {
      const now = new Date();
      const start = new Date(candidacyStatus.startDate);
      const end = new Date(candidacyStatus.endDate);

      if (!candidacyStatus.startDate || !candidacyStatus.endDate) {
        throw new Error('Please set both start and end date/time.');
      }
      if (start < now) throw new Error('Start date/time cannot be in the past.');
      if (end <= start) throw new Error('End date/time must be later than start date/time.');

      await set(dbRef(db, 'candidacyStatus'), candidacyStatus);

      logActivity(
        userData.fullName,
        `Updated candidacy period: ${start.toLocaleString()} → ${end.toLocaleString()}`
      );

      setCandidacyModalMessage('Candidacy period saved successfully!');
      setCandidacyModalError('');
      setShowCandidacyModal(true);
    } catch (err) {
      console.error(err);
      setCandidacyModalError(err.message);
      setCandidacyModalMessage('');
      setShowCandidacyModal(true);
    } finally {
      setSavingCandidacyStatus(false);
    }
  };

  const getCandidateName = () => {
    if (!confirmAction) return "";
    const found = applications.find(
      a => a.uid === confirmAction.uid && a.id === confirmAction.appId
    );
    return found?.applicant?.fullName || "this candidate";
  };

  if (userData?.role !== 'admin' && userData?.role !== "superadmin") {
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

  // Filtering logic
  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.applicant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant?.studentId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || app.status === filterStatus;
    const matchesInstitute = !filterInstitute || normalizeInstitute(app.applicant?.institute) === filterInstitute;

    return matchesSearch && matchesStatus && matchesInstitute;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-red-900">Candidacy Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Candidacy and screening appointments</p>
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
              <div className="bg-white mb-8 border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Manage Candidacy Submission</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={candidacyStatus.startDate || ''}
                      onChange={(e) => setCandidacyStatus(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={candidacyStatus.endDate || ''}
                      onChange={(e) => setCandidacyStatus(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSaveCandidacySettings}
                  disabled={savingCandidacyStatus}
                  className="bg-red-800 hover:bg-red-900 text-white font-medium rounded-lg px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {savingCandidacyStatus ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
              <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Screening Appointment</h3>
                <div className="space-y-4">
                  <div>
                  <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Default Venue
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Venue Input */}
                    <input
                      type="text"
                      value={globalVenue}
                      disabled={!editingVenue}
                      onChange={(e) => setGlobalVenue(e.target.value)}
                      className={`
                        border rounded px-3 py-2 flex-1 text-sm transition
                        ${editingVenue 
                          ? "bg-white text-gray-900 border-gray-300" 
                          : "bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed opacity-70"
                        }
                      `}
                      placeholder="Enter venue"
                    />

                    {/* Buttons same width, same height as Add Slot */}
                    {!editingVenue ? (
                      <button
                        onClick={() => setEditingVenue(true)}
                        className="min-w-[90px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                      >
                        Change
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!globalVenue.trim()) {
                            setVenueError("Venue cannot be empty");
                            setTimeout(() => setVenueError(""), 2000);
                            return;
                          }
                          await set(dbRef(db, 'screeningAppointments/globalVenue'), globalVenue)
                          logActivity(userData.fullName, `Updated global venue to: ${globalVenue}`)
                          setEditingVenue(false)
                          setMessage("Venue saved")
                          setTimeout(() => setMessage(""), 2000)
                        }}
                        className="min-w-[90px] px-4 py-2 bg-red-800 hover:bg-red-900 text-white font-medium rounded-lg"
                      >
                        Save
                      </button>
                    )}
                  </div>
                  {venueError && (
                    <p className="text-red-600 text-sm mt-1">{venueError}</p>
                  )}
                </div>
              </div>
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Add Appointment Slot</label>
                    <div className="flex flex-col sm:flex-row gap-2">
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
                            const slotRef = dbRef(db, `screeningAppointments/slots/${newSlot}`)
                            const existing = await get(slotRef)
                            if (existing.exists()) {
                              setMessage("This slot already exists")
                              setIsError(true)
                              setTimeout(() => setMessage(""), 2000)
                              return
                            }
                            const finalVenue = globalVenue
                            if (!finalVenue.trim()) {
                              setMessage("Venue cannot be empty")
                              setIsError(true)
                              setTimeout(() => setMessage(""), 2000)
                              return
                            }
                            await set(slotRef, { 
                              available: true,
                              venue: finalVenue
                            })
                            setNewSlot("")
                            setMessage("Slot added successfully")
                            setIsError(false)
                            logActivity(
                              userData.fullName,
                              `Added screening appointment slot: ` +
                              `${new Date(newSlot).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}, ` +
                              `${new Date(newSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` +
                              ` - ${globalVenue}`
                            )
                            setTimeout(() => setMessage(""), 2000)
                          } catch (err) {
                            console.error("Error adding slot", err)
                            setMessage("Failed to add slot")
                            setIsError(true)
                            setTimeout(() => setMessage(""), 2000)
                          }
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
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
                    <h4 className="text-base font-medium text-gray-700 mb-2">Available Slots</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {appointmentStatus.slots && Object.keys(appointmentStatus.slots).length > 0
                        ? Object.keys(appointmentStatus.slots).map((s) => (
                            <li key={s} className="flex justify-between items-center border rounded px-3 py-1">
                              <span>
                                {new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}, {''}
                                {new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {appointmentStatus.slots[s].venue}
                              </span>
                              <div className="flex items-center gap-3 font-semibold">
                                <span className={appointmentStatus.slots[s].available ? "text-green-700" : "text-red-700"}>
                                  {appointmentStatus.slots[s].available ? "Available" : "Booked"}
                                </span>
                                <button
                                  onClick={() => {
                                    setSlotToDelete(s)
                                    setShowDeleteModal(true)
                                  }}
                                  className="px-2 py-1 text-xs bg-red-600 text-white rounded-md font-medium hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </div>  
                            </li>
                          ))
                        : <p className='text-xs sm:text-sm text-gray-500'>No slots created yet.</p>}
                    </ul>
                  </div>
              </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          {activeTab === 'candidacy' && (
            <div className="bg-white shadow-sm rounded-2xl p-4 mb-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                {/* Search Bar */}
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Search Candidates
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name or student ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border focus:outline-none border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 px-3 py-2 text-sm shadow-sm transition placeholder-gray-500"
                  />
                </div>
                {/* Filter Tab */}
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  
                  {/* Filter by Status */}
                  <div className="flex-1 sm:flex-none">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Filter by Status
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full sm:w-[160px] rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
                    >
                      <option value="">All Status</option>
                      <option value="submitted">Submitted</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="rejected">Rejected</option>
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  {/* Filter by Institute */}
                  <div className="flex-1 sm:flex-none">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Filter by Institute
                    </label>
                    <select
                      value={filterInstitute}
                      onChange={(e) => setFilterInstitute(e.target.value)}
                      className="w-full sm:w-[160px] rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm shadow-sm focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all"
                    >
                      <option value="">All</option>
                      <option value="IAS">IAS</option>
                      <option value="IBCE">IBCE</option>
                      <option value="ITE">ITE</option>
                      <option value="IHTM">IHTM</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'candidacy' && (applications.length === 0 ? (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
              <p className="text-sm sm:text-base text-gray-500">No candidacy applications found.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Pending Applications */}
              {(!filterStatus || filterStatus === 'submitted') && (
                <div>
                  <h2 className="text-lg font-semibold text-yellow-800 mb-4">Submitted Candidacy Applications</h2>
                  {filteredApplications.filter(app => app.status === 'submitted').length > 0 ? (
                    <div className="space-y-4">
                      {filteredApplications.filter(app => app.status === 'submitted').map((app) => (
                        <ApplicationCard 
                          key={`${app.uid}-${app.id}`} 
                          app={app} 
                          onUpdateStatus={updateApplicationStatus}
                          savingId={savingId}
                          showActions={true}
                          setConfirmAction={setConfirmAction}     
                          setShowConfirmModal={setShowConfirmModal} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                      <p className="text-sm sm:text-base text-gray-500">No candidacy awaiting review</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Reviewed Applications (Screening) */}
              {(!filterStatus || filterStatus === 'reviewed') && (
                <div>
                  <div className='mb-4'>
                    <h2 className="text-lg font-semibold text-blue-800">Reviewed Candidacy Applications</h2>
                    <p className="text-gray-600 text-sm italic">Note: Approve after screening appointment</p>
                  </div>
                  {filteredApplications.filter(app => app.status === 'reviewed').length > 0 ? (
                    <div className="space-y-4">
                      {filteredApplications.filter(app => app.status === 'reviewed').map((app) => (
                        <ApplicationCard 
                          key={`${app.uid}-${app.id}`} 
                          app={app} 
                          onUpdateStatus={updateApplicationStatus}
                          onAppointmentDecision={decideAppointment}
                          savingId={savingId}
                          showActions={true}
                          showAppointment={false}
                          setConfirmAction={setConfirmAction}     
                          setShowConfirmModal={setShowConfirmModal} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                      <p className="text-sm sm:text-base text-gray-500">No reviewed candicacy</p>
                    </div>
                  )}
                </div>
              )}
              

              {/* Rejected Applications */}
              {(!filterStatus || filterStatus === 'rejected') && (
                <div>
                  <h2 className="text-lg font-semibold text-red-800 mb-4">Rejected Candidacy Applications</h2>
                  {filteredApplications.filter(app => app.status === 'rejected').length > 0 ? (
                    <div className="space-y-4">
                      {filteredApplications.filter(app => app.status === 'rejected').map((app) => (
                        <ApplicationCard 
                          key={`${app.uid}-${app.id}`} 
                          app={app} 
                          onUpdateStatus={updateApplicationStatus}
                          savingId={savingId}
                          showActions={false}
                          setConfirmAction={setConfirmAction}     
                          setShowConfirmModal={setShowConfirmModal} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                      <p className="text-sm sm:text-base text-gray-500">No rejected candidacy</p>
                    </div>
                  )}
              </div>
              )}
              

              {/* Passed Applications */}
              {(!filterStatus || filterStatus === 'passed') && (
                <div>
                <h2 className="text-lg font-semibold text-green-800 mb-4">Passed Candidates</h2>
                {filteredApplications.filter(app => app.status === 'passed').length > 0 ? (
                  <div className="space-y-4">
                    {filteredApplications.filter(app => app.status === 'passed').map((app) => (
                      <ApplicationCard 
                        key={`${app.uid}-${app.id}`} 
                        app={app} 
                        onUpdateStatus={updateApplicationStatus}
                        savingId={savingId}
                        showActions={false}
                        setConfirmAction={setConfirmAction}     
                        setShowConfirmModal={setShowConfirmModal} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                    <p className="text-sm sm:text-base text-gray-500">No passed candidates</p>
                  </div>
                )}
              </div>
              )}
              
              {/* Failed Applications */}
              {(!filterStatus || filterStatus === 'failed') && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Failed Candidates</h2>
                  {filteredApplications.filter(app => app.status === 'failed').length > 0 ? (
                    <div className="space-y-4">
                      {filteredApplications.filter(app => app.status === 'failed').map((app) => (
                        <ApplicationCard 
                          key={`${app.uid}-${app.id}`} 
                          app={app} 
                          onUpdateStatus={updateApplicationStatus}
                          savingId={savingId}
                          showActions={false}
                          setConfirmAction={setConfirmAction}     
                          setShowConfirmModal={setShowConfirmModal} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                      <p className="text-sm sm:text-base text-gray-500">No failed candidates</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {activeTab === 'appointments' && (() => {
            const withAppointments = applications.filter(app => app.appointment)
            const byStatus = (s) => withAppointments.filter(app => app.appointment.status === s)

            // Group appointments by date
            const groupByDate = (apps) =>
              apps.reduce((acc, app) => {
                const date = new Date(app.appointment.dateTime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                if (!acc[date]) acc[date] = []
                acc[date].push(app)
                return acc
              }, {})

            const renderTable = (apps, showActions = false) => {
              const grouped = groupByDate(apps)
              return Object.keys(grouped)
                .sort((a, b) => new Date(a) - new Date(b))
                .map(date => (
                  <div key={date} className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-6">
                    <div className="bg-gray-100 px-6 py-2 font-semibold text-gray-700">{date}</div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full table-fixed divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 w-1/4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 w-1/4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institute</th>
                            <th className="px-6 py-3 w-1/4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment Time</th>
                            <th className="px-6 py-3 w-1/4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                            {showActions && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {grouped[date]
                            .sort((a, b) => new Date(a.appointment.dateTime) - new Date(b.appointment.dateTime))
                            .map(app => (
                              <tr key={`${app.uid}-${app.id}`} className="hover:bg-gray-50">
                                <td className="px-6 py-4 w-1/4 whitespace-nowrap text-sm text-gray-900">{app.applicant?.fullName || "Unknown"}</td>
                                <td className="px-6 py-4 w-1/4 whitespace-nowrap text-sm text-gray-800">{app.applicant?.institute || "-"}</td>
                                <td className="px-6 py-4 w-1/4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(app.appointment.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-4 w-1/4 whitespace-nowrap text-sm text-gray-500">{appointmentStatus.slots?.[app.appointment.dateTime]?.venue}</td>
                                {showActions && (
                                  <td className="px-6 py-4 w-1/4 whitespace-nowrap flex gap-2">
                                    <button
                                      onClick={() => {
                                        setConfirmAction({ type: 'appointment', action: 'decline', uid: app.uid, appId: app.id, appointment: app.appointment });
                                        setShowConfirmModal(true);
                                      }}
                                      disabled={savingId === `${app.uid}-${app.id}-appt`}
                                      className={`px-3 py-1 rounded-lg font-medium text-white text-sm ${savingId === `${app.uid}-${app.id}-appt` ? 'bg-rose-300 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'}`}
                                    >
                                      {savingId === `${app.uid}-${app.id}-appt` ? 'Updating…' : 'Decline'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setConfirmAction({ type: 'appointment', action: 'approve', uid: app.uid, appId: app.id, appointment: app.appointment });
                                        setShowConfirmModal(true);
                                      }}
                                      disabled={savingId === `${app.uid}-${app.id}-appt`}
                                      className={`px-3 py-1 rounded-lg font-medium text-white text-sm ${savingId === `${app.uid}-${app.id}-appt` ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                                    >
                                      {savingId === `${app.uid}-${app.id}-appt` ? 'Updating…' : 'Approve'}
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
            }

                return (
                  <div className="space-y-8">
                    {/* Pending Appointments */}
                    <div>
                      <h2 className="text-lg font-semibold text-yellow-700 mb-4">Pending Screening Appointments</h2>
                      {byStatus('pending').length > 0 ? renderTable(byStatus('pending'), true) : (
                        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 text-center">
                          <p className="text-sm sm:text-base text-gray-500">No pending screening appointments</p>
                        </div>
                      )}
                    </div>

                    {/* Approved Appointments */}
                    <div>
                      <h2 className="text-lg font-semibold text-green-700 mb-4">Approved Screening Appointments</h2>
                      {byStatus('approved').length > 0 ? renderTable(byStatus('approved')) : (
                        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 text-center">
                          <p className="text-sm sm:text-base text-gray-500">No approved screening appointments</p>
                        </div>
                      )}
                    </div>

                    {/* Rejected Appointments */}
                    <div>
                      <h2 className="text-lg font-semibold text-red-700 mb-4">Declined Screening Appointments</h2>
                      {byStatus('rejected').length > 0 ? renderTable(byStatus('rejected')) : (
                        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 text-center">
                          <p className="text-sm sm:text-base text-gray-500">No rejected screening appointments</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
          })()}
        </div>
      </div>
      

        {showDeleteModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Slot</h3>
              <p className="text-gray-700 mb-6">
                Delete slot on <span className="font-medium text-gray-800">{new Date(slotToDelete).toLocaleString()}</span>?<br/>
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-white bg-gray-500 rounded-lg font-medium hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await remove(dbRef(db, `screeningAppointments/slots/${slotToDelete}`))
                      setAppointmentStatus(prev => {
                        const updated = { ...prev }
                        if (updated.slots) delete updated.slots[slotToDelete]
                        return updated
                      })
                      setMessage("Slot deleted successfully")
                      logActivity(
                        userData.fullName,
                        `Deleted screening appointment slot: ` +
                        `${new Date(slotToDelete).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}, ` +
                        `${new Date(slotToDelete).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` +
                        ` - ${appointmentStatus.slots[slotToDelete].venue}`
                      )
                    } catch (e) {
                      console.error("Failed to delete slot", e)
                      setMessage("Failed to delete slot")
                    } finally {
                      setShowDeleteModal(false)
                      setSlotToDelete(null)
                      setTimeout(() => setMessage(""), 2000)
                    }
                  }}
                  className="px-4 py-2 bg-red-600 font-medium text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Candidacy Modal */}
        {showCandidacyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${candidacyModalError ? 'bg-red-100' : 'bg-green-100'}`}>
                    <svg className={`w-5 h-5 ${candidacyModalError ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={candidacyModalError ? 'M6 18L18 6M6 6l12 12' : 'M5 13l4 4L19 7'} />
                    </svg>
                  </div>
                  <div>
                    {candidacyModalMessage && <h4 className="text-lg font-semibold text-gray-900 mb-1">Success</h4>}
                    {candidacyModalError && <h4 className="text-lg font-semibold text-gray-900 mb-1">Update Failed</h4>}
                    <p className="text-gray-700">{candidacyModalMessage || candidacyModalError}</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button onClick={() => setShowCandidacyModal(false)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Action</h3>
              <p className="text-gray-700 mb-6">
                {confirmAction?.type === 'candidacy' ? (
                  <>
                    Are you sure you want to{' '}
                    <strong className="uppercase">{confirmAction.action}</strong>{' '}
                    <strong className="uppercase">{getCandidateName()}'s</strong>{' '}
                    application? 
                  </>
                ) : (
                  <>
                    Are you sure you want to{' '}
                    <strong className="uppercase">{confirmAction.action}</strong>{' '}
                    this screening appointment?
                  </>
                )}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 text-white rounded-lg font-medium bg-gray-500 hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  disabled={isConfirming}
                  onClick={async () => {
                    if (isConfirming) return;
                    setIsConfirming(true);

                    try {
                      if (confirmAction.type === 'candidacy') {
                        await updateApplicationStatus(
                          confirmAction.uid,
                          confirmAction.appId,
                          confirmAction.action === 'review'
                            ? 'reviewed'
                            : confirmAction.action === 'approve'
                            ? 'approved'
                            : confirmAction.action === 'passed'
                            ? 'passed'
                            : confirmAction.action === 'failed'
                            ? 'failed'
                            : 'rejected'
                        );
                      } else if (confirmAction.type === 'appointment') {
                        await decideAppointment(
                          confirmAction.uid,
                          confirmAction.appId,
                          confirmAction.action === 'approve' ? 'approved' : 'declined',
                          confirmAction.appointment
                        );
                      }

                      setShowConfirmModal(false);
                      setMessage(`${confirmAction.action.charAt(0).toUpperCase() + confirmAction.action.slice(1)} successful.`);
                      setTimeout(() => setMessage(''), 3000);
                    } catch (err) {
                      console.error(err);
                      setMessage('Action failed.');
                      setTimeout(() => setMessage(''), 3000);
                    } finally {
                      setIsConfirming(false);
                    }
                  }}
                  className={`px-4 py-2 text-white rounded-lg font-medium ${
                    confirmAction?.action === 'reject'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  } ${isConfirming ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isConfirming ? 'Processing…' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageCandidates
