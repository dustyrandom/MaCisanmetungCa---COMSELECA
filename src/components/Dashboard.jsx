import { useAuth } from '../contexts/AuthContext'

function Dashboard() {
  const { user, userData, logout } = useAuth()

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
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Manage Users
          </button>
          <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
            System Settings
          </button>
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
            <h4 className="font-semibold">Student Council Election 2024</h4>
            <p className="text-gray-600 text-sm">Vote for your student council representatives</p>
            <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Vote Now
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCandidateDashboard = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Your Campaign</h3>
        <div className="space-y-4">
          <div className="border p-4 rounded-lg">
            <h4 className="font-semibold">Student Council Election 2024</h4>
            <p className="text-gray-600 text-sm">Position: President</p>
            <div className="mt-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                Active Campaign
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDashboardContent = () => {
    if (!userData) return null

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
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                MCC Voting System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                Welcome, {userData?.name || user.email}
              </div>
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {userData?.role?.toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {renderDashboardContent()}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
