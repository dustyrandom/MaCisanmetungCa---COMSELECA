import NavBar from './NavBar'

function Vote() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-center text-2xl sm:text-3xl font-extrabold tracking-wide text-red-900 mb-8">
            MACIPANYULUNGCA 2025 - STUDENT COUNCIL ELECTIONS
          </h1>
          <h1 className="text-center text-2xl sm:text-2xl font-extrabold tracking-wide text-gray-800 mb-4">
            VOTING GUIDELINES
          </h1>

          <p className="text-lg text-gray-800 mb-8">
            Now is the day to decide and use your rights to vote for the leaders that you deserve. 
            As part of our commitment to a fair and transparent electoral process, we would like to 
            remind you of the following terms and conditions: 
          </p>

          <div className="space-y-8 text-gray-800">

            <div>
              <h2 className="font-semibold text-red-900 mb-3">1. Non-Disclosure Agreement:</h2>
              <div className="space-y-1">
                <p>The Commission on Student Elections and Appointments will adhere to the Non-Disclosure Agreement 
                  to protect everyone's confidentiality and privacy. This agreement ensures that your votes and other 
                  personal information are secured and will only be used during the election process. 
                </p>
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-red-900 mb-3">2. Voting Instructions:</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Read each position carefully before selecting your candidate(s).</li>
                <li>Some positions may allow multiple selections; others allow only one.</li>
                <li>Use the navigation to move between positions before final submission.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-red-900 mb-3">3. Double-check your votes:</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Before submitting your final votes, make sure to review them.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-red-900 mb-3">4. Maintain Integrity, Respect Privacy, and Confidentiality:</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Do not share any screenshots or details of your votes.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-semibold text-red-900 mb-3">5. Your Voice, Your Choice- Including not to vote</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>You have the right not to vote a certain candidate.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-bold text-red-900 mb-3">📍 How to Vote</h2>
              <ul className="space-y-1">
                <li>✔ Click the "VOTE NOW" button below to open the digital ballot.</li>
                <li>✔ Log in using your MCC email account. Only verified voters are allowed access</li>
                <li>✔ The system will automatically verify your eligibility before proceeding.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-bold text-red-900 mb-3">📍 After Voting</h2>
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
    </div>
  )
}

export default Vote


