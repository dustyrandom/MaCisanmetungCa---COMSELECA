import { Link } from 'react-router-dom'
import NavBar from './NavBar'

function CandidacyThankYou() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
              className="inline-block bg-red-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-800"
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
