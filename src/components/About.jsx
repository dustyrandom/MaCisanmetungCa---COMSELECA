import NavBar from './NavBar'
import fingerprint from '../assets/about/fingerprint.png'
import statue from '../assets/about/statue.png'

function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Left: 60% heading + text */}
            <div className="lg:col-span-3 text-gray-800 space-y-6">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wide text-red-900 mb-10">
                PEACE. HONESTY. ORDERLY.
              </h1>
              <h2 className="text-xl font-semibold text-red-900 mb-2">About</h2>
              <p>
                MaCisanmetungCa is a Centralized Student Election Management System designed to
                streamline, secure, and modernize the election process at Mabalacat City College.
                Built with transparency, efficiency, and accessibility in mind, the system provides
                a reliable digital platform where students can register, vote, and view results in
                real time.
              </p>
              <p>
                Through its user-friendly interface and robust security features, MaCisanmetungCa
                ensures fairness and integrity in every election. It eliminates common issues in
                manual voting such as delays, errors, and lack of transparency, while offering
                administrators powerful tools for candidate management, ballot creation, result
                generation, and audit reporting.
              </p>
              <p>
                Developed as a capstone project, MaCisanmetungCa was created for the Commission on
                Student Elections and Appointments (COMSELECA) of Mabalacat City College, the
                official body tasked to uphold student democracy. By embracing this system,
                COMSELECA can conduct elections that are not only more efficient and secure but also
                more inclusive, empowering every MCC student to make their voice count.
              </p>
            </div>

            {/* Right: 40% visuals (statue on top, fingerprint beneath) */}
            <div className="lg:col-span-2 relative min-h-[680px] -mt-20 hidden lg:block">
              {/* Statue */}
              <img
                src={statue}
                alt="Lady Justice statue"
                className="absolute top-0 right-0 w-full max-w-none object-contain z-10"
              />
              {/* Fingerprint */}
              <img
                src={fingerprint}
                alt="Fingerprint background"
                className="absolute top-0 right-0 w-full max-w-none object-contain z-0"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About


