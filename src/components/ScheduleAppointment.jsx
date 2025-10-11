import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ref as dbRef, get, set } from 'firebase/database'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar'

function ScheduleAppointment() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [application, setApplication] = useState(null)
  const [history, setHistory] = useState([])
  const [dateTime, setDateTime] = useState('')
  const VENUE = 'MB201 (MCC Dolores Campus)' //Change venue if necessary
  const [message, setMessage] = useState('')
  const [canReschedule, setCanReschedule] = useState(false)
  const [appointmentStatus, setAppointmentStatus] = useState({ isActive: false, startDate: '', endDate: '' })
  const [slots, setSlots] = useState([])


  useEffect(() => {
    const load = async () => {
      if (!user) return
      try {
        const appsRef = dbRef(db, `candidacyApplications/${user.uid}`)
        const snapshot = await get(appsRef)
        if (snapshot.exists()) {
          const appsObj = snapshot.val()
          const apps = Object.keys(appsObj).map(id => ({ id, ...appsObj[id] }))
          const latest = apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
          setApplication(latest)

          const histRef = dbRef(db, `candidacyApplications/${user.uid}/${latest.id}/appointmentHistory`)
          const histSnap = await get(histRef)
          const decisions = histSnap.exists() ? Object.values(histSnap.val()) : []
          const normalized = decisions.map(d => ({
            kind: d.decision === 'submitted' ? 'submitted' : 'decision',
            decision: d.decision,
            decidedAt: d.decidedAt,
            dateTime: d.dateTime,
            venue: d.venue,
            status: d.decision === 'submitted' ? 'Pending' : undefined
          }))
          const out = normalized.sort((a, b) => new Date(b.decidedAt) - new Date(a.decidedAt))
          setHistory(out)

          // Reschedule allowed if latest decision is rejected
          const lastDecision = normalized.sort((a, b) => new Date(b.decidedAt) - new Date(a.decidedAt))[0]
          setCanReschedule(lastDecision?.decision === 'rejected')

          if (!latest || latest.status !== 'reviewed') {
            navigate('/dashboard', { replace: true })
            return
          }
        }
        // Load appointment status
        const swSnap = await get(dbRef(db, 'screeningAppointments'))
        if (swSnap.exists()) setAppointmentStatus(swSnap.val())
      } catch (e) {
        console.error('Failed to load appointment data', e)
      } finally {
        setLoading(false)
      }

      // Load slots
      const slotsRef = dbRef(db, "screeningAppointments/slots")
      const slotsSnap = await get(slotsRef)
      if (slotsSnap.exists()) {
        const data = slotsSnap.val()
        const available = Object.keys(data).filter(k => data[k].available)
        setSlots(available)
      }
    }
    load()
  }, [user, navigate])

  const existingAppt = application?.appointment

  const formatDateTime = (value) => {
    try {
      return value ? new Date(value).toLocaleString() : ''
    } catch {
      return value || ''
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setMessage('')
    // Block duplicate submit if appointment exists and reschedule is not allowed
    if (existingAppt && !canReschedule) {
      setMessage('You already have a pending appointment. Please wait for admin decision.')
      return
    }
    if (!dateTime) {
      setMessage('Please select date and time')
      return
    }
    // Enforce allowed date
    if (appointmentStatus?.startDate && appointmentStatus?.endDate) {
      try {
        const selected = new Date(dateTime)
        const start = new Date(appointmentStatus.startDate)
        const end = new Date(appointmentStatus.endDate)
        if (selected < start || selected > end) {
          setMessage(`Appointments are only accepted from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}`)
          return
        }
      } catch (e) {
        console.error('Invalid screening window comparison', e)
      }
    }
    
    try {
      const appt = {
        dateTime,
        venue: VENUE,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: user.uid
      }
      const apptRef = dbRef(db, `candidacyApplications/${user.uid}/${application.id}/appointment`)
      await set(apptRef, appt)

      await set(dbRef(db, `screeningAppointments/slots/${dateTime}/available`), false)

      setMessage('Appointment submitted. Awaiting admin approval.')
      setApplication(prev => prev ? { ...prev, appointment: appt } : prev)
      setCanReschedule(false)

      // Add a history record for immediate display and persistence
      const histRef = dbRef(db, `candidacyApplications/${user.uid}/${application.id}/appointmentHistory/${Date.now()}`)
      await set(histRef, {
        decision: 'submitted',
        decidedAt: appt.createdAt,
        dateTime: appt.dateTime,
        venue: appt.venue
      })
      setHistory(prev => [
        { kind: 'submitted', decision: 'submitted', decidedAt: appt.createdAt, dateTime: appt.dateTime, venue: appt.venue, status: 'pending' },
        ...prev
      ])
    } catch (e) {
      console.error('Failed to submit appointment', e)
      setMessage('Failed to submit appointment')
    }
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-red-900">Screening Appointment</h1>
          <p className="text-gray-600 mt-1">Apply for an appointment, view status and history</p>
        </div>

        {!application ? (
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6 text-center">
            <p className="text-gray-600">No candidacy application found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-3">Apply for Appointment</h2>
              {existingAppt && !canReschedule ? (
                <p className="text-sm text-gray-700">Appointment already submitted. See details in history below.</p>
              ) : (
                <form onSubmit={submit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{canReschedule ? 'Reschedule Date & Time' : 'Date & Time'}</label>
                    <select
                      value={dateTime}
                      onChange={(e) => setDateTime(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">-- Select an Available Slot --</option>
                      {slots.map((slot) => (
                        <option key={slot} value={slot}>
                          {new Date(slot).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} –{' '}
                          {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-sm text-gray-600">Venue: <span className="font-medium">{VENUE}</span></p>
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">{canReschedule ? 'Submit New Appointment' : 'Submit Appointment'}</button>
                  {message && <p className="text-sm text-gray-600">{message}</p>}
                </form>
              )}
            </div>

            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-3">Schedule History</h2>
              {history.length === 0 ? (
                <p className="text-sm text-gray-600">No history yet.</p>
              ) : (
                <ul className="text-sm text-gray-700 space-y-3">
                  {history.map((h, idx) => {
                    if (h.kind === 'submitted') {
                      return (
                        <li key={idx} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Submitted</span>
                            <span className="text-gray-500">{new Date(h.decidedAt).toLocaleString()}</span>
                          </div>
                          <p><span className="text-gray-600">Status:</span> {h.status}</p>
                          <p><span className="text-gray-600">Date & Time: </span> 
                          {new Date(h.dateTime).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })} – {new Date(h.dateTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}</p>
                          <p><span className="text-gray-600">Venue:</span> {h.venue}</p>
                        </li>
                      )
                    }
                    return (
                      <li key={idx} className="border rounded p-3">
                        <div className="flex items-center justify-between">
                          <span className="capitalize font-medium">{h.decision}</span>
                          <span className="text-gray-500">{new Date(h.decidedAt).toLocaleString()}</span>
                        </div>
                        {h.dateTime && <p><span className="text-gray-600">Date & Time: </span>
                        {new Date(h.dateTime).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })} – {new Date(h.dateTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}</p>}
                        {h.venue && <p><span className="text-gray-600">Venue:</span> {h.venue}</p>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScheduleAppointment


