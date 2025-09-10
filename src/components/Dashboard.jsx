import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar'

function Dashboard() {
  const { userData, loading } = useAuth()

  // Scheduling moved to dedicated page; no need to load application here

  // const canSchedule = myApplication && myApplication.status === 'reviewed'

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Admin Controls</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Manage Elections
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            View Results
          </button>
          <a href="/admin/manage-candidates" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-center">
            Manage Candidates
          </a>
          <a href="/admin/manage-users" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-center">
            Manage Users
          </a>
          <a href="/admin/manage-news" className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 text-center">
            Manage News
          </a>
          <a href="/admin/manage-announcements" className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 text-center">
            Manage Announcements
          </a>
        </div>
      </div>
    </div>
  )

  const renderVoterDashboard = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Available Elections</h3>
        <div className="space-y-4">
          <div className="border p-4 rounded-lg">
            <h4 className="font-semibold">Student Council Election 2025</h4>
            <p className="text-gray-600 text-sm">Vote for your student council representatives</p>
            <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Vote Now
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3">Candidacy</h3>
        <p className="text-gray-600 text-sm mb-3">Apply to become a candidate by submitting the required documents.</p>
        <div className="flex flex-wrap gap-3">
          <a href="/candidacy-application" className="inline-block bg-red-900 text-white px-4 py-2 rounded hover:bg-red-800">Apply for Candidacy</a>
          <a href="/schedule-appointment" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Go to Schedule</a>
        </div>
      </div>

      {/* Scheduling moved to dedicated page; use Go to Schedule */}
    </div>
  )

  const renderCandidateDashboard = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Available Elections</h3>
        <div className="space-y-4">
          <div className="border p-4 rounded-lg">
            <h4 className="font-semibold">Student Council Election 2025</h4>
            <p className="text-gray-600 text-sm">Vote for your student council representatives</p>
            <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Vote Now
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Your Campaign</h3>
        <div className="space-y-4">
          <div className="border p-4 rounded-lg">
            <h4 className="font-semibold">Student Council Election 2025</h4>
            <p className="text-gray-600 text-sm">Position: President</p>
            <div className="mt-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                Active Campaign
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scheduling moved to dedicated page; use Go to Schedule */}
    </div>
  )

  const renderDashboardContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      )
    }

    if (!userData) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-600">Unable to load user data. Please try refreshing the page.</p>
        </div>
      )
    }

    switch (userData.role) {
      case 'admin':
        return renderAdminDashboard()
      case 'voter':
        return renderVoterDashboard()
      case 'candidate':
        return renderCandidateDashboard()
      default:
        return <div>Unknown role</div>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderDashboardContent()}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
