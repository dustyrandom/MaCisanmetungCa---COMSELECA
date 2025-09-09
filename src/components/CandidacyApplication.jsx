import { useState, useEffect } from 'react'
import { ref as dbRef, push, set, get } from 'firebase/database'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useNavigate, Link } from 'react-router-dom'
import { db, storage } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from './NavBar'

function CandidacyApplication() {
  const { user, userData } = useAuth()
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [hasExistingApplication, setHasExistingApplication] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [checkingExisting, setCheckingExisting] = useState(true)
  const [files, setFiles] = useState({
    coc: null,
    cor: null,
    cog: null,
    letterOfMotivation: null,
    goodMoral: null,
    psychologicalEvaluation: null,
    letterOfIntent: null,
    loa: null,
    resignationLetter: null,
  })

  const requiredKeys = ['coc', 'cor', 'cog', 'letterOfMotivation', 'goodMoral', 'psychologicalEvaluation', 'letterOfIntent', 'resignationLetter']

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!user) return
      
      try {
        const appRef = dbRef(db, `candidacyApplications/${user.uid}`)
        const snapshot = await get(appRef)
        
        if (snapshot.exists()) {
          const applications = snapshot.val()
          const existingApp = Object.values(applications).find(app => 
            app.status === 'submitted' || app.status === 'reviewed' || app.status === 'rejected'
          )
          
          if (existingApp) {
            setHasExistingApplication(true)
            setApplicationStatus(existingApp.status)
          }
        }
      } catch (error) {
        console.error('Error checking existing application:', error)
      } finally {
        setCheckingExisting(false)
      }
    }

    checkExistingApplication()
  }, [user])

  const uploadAndGetUrl = async (file, path) => {
    const sref = storageRef(storage, path)
    await uploadBytes(sref, file)
    return await getDownloadURL(sref)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    setMessage('')

    for (const key of requiredKeys) {
      if (!files[key]) {
        setMessage('Please upload all required documents.')
        return
      }
    }

    setLoading(true)
    try {
      const appCollectionRef = dbRef(db, `candidacyApplications/${user.uid}`)
      const newAppRef = push(appCollectionRef)
      const applicationId = newAppRef.key
      const basePath = `candidacy/${user.uid}/${applicationId}`

      const uploads = {}
      // required files
      for (const key of requiredKeys) {
        const file = files[key]
        uploads[key] = await uploadAndGetUrl(file, `${basePath}/${key}_${file.name}`)
      }
      // optional file
      if (files.loa) uploads.loa = await uploadAndGetUrl(files.loa, `${basePath}/loa_${files.loa.name}`)

      const record = {
        applicant: {
          uid: user.uid,
          name: userData?.name || '',
          email: user.email,
          institute: userData?.institute || '',
        },
        documents: uploads,
        status: 'submitted',
        createdAt: new Date().toISOString(),
      }

      await set(newAppRef, record)

      setMessage('Application submitted successfully. We will review your documents.')
      navigate('/candidacy-application/thank-you', { replace: true })
    } catch (error) {
      console.error('Candidacy application error:', error)
      setMessage('Failed to submit. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-900"></div>
      </div>
    )
  }

  if (hasExistingApplication) {
    const getStatusDisplay = () => {
      if (applicationStatus === 'submitted') {
        return {
          title: 'Application Under Review',
          message: 'Your candidacy application has been submitted and is currently being reviewed by COMSELECA.',
          iconColor: 'text-yellow-600',
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          )
        }
      } else if (applicationStatus === 'reviewed') {
        return {
          title: 'Application in Screening',
          message: 'Your candidacy application has been reviewed and is now in the screening process. Please wait for the final decision.',
          iconColor: 'text-blue-600',
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          )
        }
      } else if (applicationStatus === 'rejected') {
        return {
          title: 'Application Rejected',
          message: 'Your candidacy application has been reviewed and was not approved. You cannot submit another application.',
          iconColor: 'text-red-600',
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          )
        }
      }
      return {
        title: 'Application Status Unknown',
        message: 'There was an issue checking your application status. Please contact COMSELECA.',
        iconColor: 'text-gray-600',
        icon: (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        )
      }
    }

    const statusDisplay = getStatusDisplay()

    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
            <div className={`mx-auto h-16 w-16 ${statusDisplay.iconColor} mb-6`}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {statusDisplay.icon}
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{statusDisplay.title}</h1>
            <p className="text-gray-600 mb-6">
              {statusDisplay.message}
            </p>
            <Link 
              to="/dashboard" 
              className="inline-block bg-red-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-800"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-5">
          <h1 className="text-xl font-bold text-red-900">Candidacy Application</h1>
          <p className="text-sm text-gray-600 mt-1">Upload all required documents (PDF or image files):</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow border border-gray-200">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="coc" className="block text-sm font-medium text-gray-700 mb-1">Certificate of Candidacy *</label>
              <input
                id="coc"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setFiles(prev => ({ ...prev, coc: file }))
                }}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {submitted && !files.coc && (
                <p className="mt-1 text-xs text-red-600">This document is required.</p>
              )}
            </div>

            <div>
              <label htmlFor="cor" className="block text-sm font-medium text-gray-700 mb-1">Certificate of Registration *</label>
              <input
                id="cor"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setFiles(prev => ({ ...prev, cor: file }))
                }}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {submitted && !files.cor && (
                <p className="mt-1 text-xs text-red-600">This document is required.</p>
              )}
            </div>

            <div>
              <label htmlFor="cog" className="block text-sm font-medium text-gray-700 mb-1">Copy of Grades *</label>
              <input
                id="cog"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setFiles(prev => ({ ...prev, cog: file }))
                }}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {submitted && !files.cog && (
                <p className="mt-1 text-xs text-red-600">This document is required.</p>
              )}
            </div>

            <div>
              <label htmlFor="letterOfMotivation" className="block text-sm font-medium text-gray-700 mb-1">Motivational Letter *</label>
              <input
                id="letterOfMotivation"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setFiles(prev => ({ ...prev, letterOfMotivation: file }))
                }}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {submitted && !files.letterOfMotivation && (
                <p className="mt-1 text-xs text-red-600">This document is required.</p>
              )}
            </div>

            <div>
              <label htmlFor="goodMoral" className="block text-sm font-medium text-gray-700 mb-1">Certificate of Good Moral (CCDU) *</label>
              <input
                id="goodMoral"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setFiles(prev => ({ ...prev, goodMoral: file }))
                }}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {submitted && !files.goodMoral && (
                <p className="mt-1 text-xs text-red-600">This document is required.</p>
              )}
            </div>

            <div>
              <label htmlFor="psychologicalEvaluation" className="block text-sm font-medium text-gray-700 mb-1">Psychological Evaluation (Guidance) *</label>
              <input
                id="psychologicalEvaluation"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setFiles(prev => ({ ...prev, psychologicalEvaluation: file }))
                }}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {submitted && !files.psychologicalEvaluation && (
                <p className="mt-1 text-xs text-red-600">This document is required.</p>
              )}
            </div>

            <div>
              <label htmlFor="letterOfIntent" className="block text-sm font-medium text-gray-700 mb-1">Letter of Intent *</label>
              <input
                id="letterOfIntent"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setFiles(prev => ({ ...prev, letterOfIntent: file }))
                }}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {submitted && !files.letterOfIntent && (
                <p className="mt-1 text-xs text-red-600">This document is required.</p>
              )}
            </div>

            <div>
              <label htmlFor="loa" className="block text-sm font-medium text-gray-700 mb-1">Leave of Absence (optional)</label>
              <input
                id="loa"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setFiles(prev => ({ ...prev, loa: file }))
                }}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="resignationLetter" className="block text-sm font-medium text-gray-700 mb-1">Resignation Letter *</label>
              <input
                id="resignationLetter"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setFiles(prev => ({ ...prev, resignationLetter: file }))
                }}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {submitted && !files.resignationLetter && (
                <p className="mt-1 text-xs text-red-600">This document is required.</p>
              )}
            </div>
          </div>

          {message && (
            <div className={`text-sm text-center p-3 rounded-md ${message.includes('submitted') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="submit" disabled={loading} className="px-5 py-2 rounded-lg bg-gray-900 text-white font-semibold hover:bg-gray-800 disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CandidacyApplication
