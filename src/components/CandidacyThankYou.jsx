import { Link } from 'react-router-dom'
import NavBar from './NavBar'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '../firebase'

function CandidacyThankYou() {
  const { user } = useAuth()
  const [hasApplication, setHasApplication] = useState(null)

  useEffect(() => {
    const checkApp = async () => {
      if (!user) return setHasApplication(false)

      const appsRef = dbRef(db, `candidacyApplications/${user.uid}`)
      const snapshot = await get(appsRef)

      setHasApplication(snapshot.exists())
    }

    checkApp()
  }, [user])

  // While loading
  if (hasApplication === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
      </div>
    )
  }

  // No application → Show Access Denied (SAME UI as your ScheduleAppointment)
  if (!hasApplication) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="pt-24 px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-10 text-center">
              <h1 className="text-2xl font-bold text-red-700 mb-3">Access Denied</h1>
              <p className="text-gray-600">No candidacy application found in this account.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 mt-10">
        <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
          <div className="mx-auto h-16 w-16 text-green-600 mb-6">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Application Submitted Successfully!</h1>
          
          <p className="text-gray-600 mb-6">
            Thank you for submitting your candidacy application. Your documents have been received and will be reviewed by the Commission on Student Elections and Appointments (COMSELECA).
          </p>
          
          
          <div className="space-y-3">
            <Link 
              to="/dashboard" 
              className="inline-block bg-red-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-900"
            >
              Go to Dashboard
            </Link>
            <div>
              <Link 
                to="/" 
                className="text-gray-600 hover:text-gray-800 underline"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CandidacyThankYou
