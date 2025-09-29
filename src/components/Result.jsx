import NavBar from './NavBar'
import PublicResultsContent from './PublicResultsContent'

function Result() {

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-wide text-red-900">MACIPANYULUNGCA ELECTION RESULTS</h2>
          <p className="text-base sm:text-lg text-gray-800 -mt-1">STUDENT COUNCIL ELECTIONS 2025</p>
        </div>

        <PublicResultsContent />
      </div>
    </div>
  )
}

export default Result


