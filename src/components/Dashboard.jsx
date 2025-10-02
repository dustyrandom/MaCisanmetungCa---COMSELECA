import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '../firebase'
import NavBar from './NavBar'

function Dashboard() {
  const { user, userData, loading } = useAuth()
  const [canSeeSchedule, setCanSeeSchedule] = useState(false)

  useEffect(() => {
    const fetchLatestStatus = async () => {
      if (!user) return
      try {
        const appsRef = dbRef(db, `candidacyApplications/${user.uid}`)
        const snapshot = await get(appsRef)
        if (!snapshot.exists()) {
          setCanSeeSchedule(false)
          return
        }
        const appsObj = snapshot.val()
        const apps = Object.keys(appsObj).map(id => ({ id, ...appsObj[id] }))
        const latest = apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        setCanSeeSchedule(latest?.status === 'reviewed')
      } catch {
        setCanSeeSchedule(false)
      }
    }
    fetchLatestStatus()
  }, [user])

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Admin Controls</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <a href="/admin/manage-news" className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 text-center">Manage News</a>
          <a href="/admin/manage-announcements" className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 text-center">Manage Announcements</a>
          <a href="/admin/manage-candidates" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-center">Manage Applications</a>
          <a href="/admin/manage-campaigns" className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700 text-center">Manage Campaign Materials</a>
          <a href="/admin/manage-elections" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center">Manage Elections</a>
          <a href="/admin/view-results" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center">Election Results</a>
          <a href="/admin/manage-users" className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 text-center">Manage Users</a>
          <a href="/admin/activity-log" className="bg-red-900 text-white px-4 py-2 rounded hover:bg-gray-800 text-center">Admin Activity Log</a>
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
            <h4 className="font-semibold">Student Council Elections 2025</h4>
            <p className="text-gray-600 text-sm">Vote for your student council representatives</p>
            <a href="/vote" className="mt-2 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Vote Now</a>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3">Candidacy</h3>
        <p className="text-gray-600 text-sm mb-3">Apply to become a candidate by submitting the required documents.</p>
        <div className="flex flex-wrap gap-3">
          <a href="/candidacy-application" className="inline-block bg-red-900 text-white px-4 py-2 rounded hover:bg-red-800">Apply for Candidacy</a>
          {canSeeSchedule && (
            <a href="/schedule-appointment" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Go to Screening Appointment</a>
          )}
        </div>
      </div>
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
            <a href="/vote" className="mt-2 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Vote Now</a>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Your Campaign</h3>
        <div className="space-y-4">
          <div className="border p-4 rounded-lg">
            <h4 className="font-semibold">Student Council Election 2025</h4>
            <div className="mt-4">
              <a href="/campaign" className="inline-block bg-red-900 text-white px-4 py-2 rounded hover:bg-red-800">Submit Campaign Materials</a>
            </div>
          </div>
        </div>
      </div>
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

