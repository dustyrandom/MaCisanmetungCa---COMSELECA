import NavBar from './NavBar'

function Vote() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-center text-2xl sm:text-3xl font-extrabold tracking-wide text-red-900 mb-10">
          MACIPANYULUNGCA: STUDENT ELECTIONS 2025 – VOTING GUIDELINES
        </h1>

        <p className="text-lg text-gray-800 mb-8">
          To ensure a secure, fair, and transparent election process, kindly follow these
          instructions when casting your vote through MaCisanmetungCa.
        </p>

        <div className="space-y-8 text-gray-800">
          <div>
            <h2 className="font-semibold text-red-900 mb-3">📍 How to Vote</h2>
            <div className="space-y-1">
              <p>Click the "VOTE NOW" button below to open the digital ballot.</p>
              <p>Log in using your MCC email account. Only verified voters are allowed access.</p>
              <p>The system will automatically verify your eligibility before proceeding.</p>
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-red-900 mb-3">📝 Voting Instructions…</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Read each position carefully before selecting your candidate(s).</li>
              <li>Some positions may allow multiple selections; others allow only one.</li>
              <li>Use the navigation to move between positions before final submission.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-red-900 mb-3">📄 Final Review & Submission</h2>
            <ul className="space-y-1">
              <li>✅ Double‑check all your selections.</li>
              <li>✅ Once you click "Submit Vote", your ballot is locked and cannot be changed.</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-red-900 mb-3">📍 After Voting</h2>
            <ul className="space-y-1">
              <li>✔ You will receive a digital confirmation receipt (via email and dashboard).</li>
              <li>✔ Your vote will be recorded in the Election Tracker for transparency.</li>
              <li>✔ You may now log out and exit the system.</li>
            </ul>
          </div>

          <div className="pt-4 text-center">
            <a
              href="/voting"
              className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-blue-600 text-white font-extrabold shadow-lg hover:bg-blue-700"
            >
              VOTE NOW
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Vote


