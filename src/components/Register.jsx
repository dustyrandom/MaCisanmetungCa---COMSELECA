import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavBar from './NavBar'
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth'
import { set, ref } from 'firebase/database'
import { auth, db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import iconCard from '../assets/icon2.png'
import fingerprintImage from '../assets/fingerprint.png'
import mccLogo from '../assets/mcclogo.png'
import comselecaLogo from '../assets/comselecalogo.png'

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institute: '',
    studentId: '',
    password: '',
    confirmPassword: '',
    role: 'voter'
  })
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    symbol: false,
  });
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()
  const { startVerificationPolling } = useAuth()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateEmail = (email) => {
    return email.endsWith('@mcc.edu.ph')
  }

  const validatePassword = (password) => {
  // At least 8 chars, one number, one special character
  const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  return regex.test(password);
  };

  const validateStudentId = (id) => {
    // Format: 1234-5678
    const regex = /^\d{4}-\d{4}$/;
    return regex.test(id);
  };

  const checkPasswordRules = (password) => {
    setPasswordRules({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[!@#$%^&*]/.test(password),
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateEmail(formData.email)) {
      setError('Only Mabalacat City College emails are allowed')
      return
    }

    if (!validateStudentId(formData.studentId)) {
      setError('Student ID must be in the format 1234-5678 and contain only numbers');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!passwordRules.length || !passwordRules.lowercase || !passwordRules.uppercase || !passwordRules.number || !passwordRules.symbol) {
      setError('Password does not meet all requirements');
      return;
    }

    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      )

      // Ensure Firebase Auth profile has the full name immediately
      try {
        await updateProfile(userCredential.user, { displayName: formData.name })
      } catch (e) {
        console.warn('Unable to set displayName:', e)
      }

      const actionCodeSettings = {
  url:
    import.meta.env.MODE === "development"
      ? "http://localhost:5173/verify-email"
      : "https://macisanmetungca.vercel.app/verify-email",
  handleCodeInApp: true,
};

await sendEmailVerification(userCredential.user, actionCodeSettings);

      await set(ref(db, `users/${userCredential.user.uid}`), {
        name: formData.name,
        email: formData.email,
        institute: formData.institute,
        studentId: formData.studentId,
        role: formData.role,
        emailVerified: false,
        createdAt: new Date().toISOString()
      })

      // Start polling for verification and redirect to verification page
      startVerificationPolling()
      navigate('/verify-email', { replace: true })
    } catch (error) {
      console.error('Registration error:', error)
      if (error.code === 'auth/email-already-in-use') {
        setError('Email already registered. Try logging in instead.')
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.')
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address format')
      } else if (error.code === 'auth/operation-not-allowed') {
        setError('Email/password accounts are not enabled. Contact support.')
      } else {
        setError('Failed to create account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <NavBar />

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2 min-h-[700px]">
              {/* Left Panel - Dark Red */}
              <div className="bg-red-900 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute left-0 top-0 h-full w-auto">
                  <img 
                    src={fingerprintImage} 
                    alt="Fingerprint Pattern" 
                    className="h-full w-auto object-cover"
                  />
                </div>
                
                <div className="relative h-full flex flex-col justify-between p-8">
                  {/* Top Logo */}
                  <div className="flex items-center space-x-3">
                    <img src={iconCard} alt="MaCisanmetungCa Icon" className="h-8 w-8" />
                    <span className="text-white text-lg font-bold">MaCisanmetungCa</span>
                  </div>
                  
                  {/* Center Content */}
                  <div className="text-center text-white">
                    <h2 className="text-lg font-medium mb-2">Student Election Management System</h2>
                    <h1 className="text-3xl font-bold">Mabalacat City College - COMSELECA</h1>
                  </div>
                  
                  {/* Bottom Text */}
                  <div className="text-white text-sm">
                    <p>PEACE. HONESTY. ORDERLY.</p>
                  </div>
                </div>
              </div>

              {/* Right Panel - White Form */}
              <div className="p-8 flex flex-col justify-center">
                {/* College Logos */}
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <img 
                    src={mccLogo} 
                    alt="Mabalacat City College Logo" 
                    className="w-16 h-16 object-contain"
                  />
                  <img 
                    src={comselecaLogo} 
                    alt="COMSELECA Logo" 
                    className="w-16 h-16 object-contain"
                  />
                </div>
                
                <div className="text-center mb-8">
                  <h3 className="text-red-800 text-lg font-medium">MABALACAT CITY COLLEGE</h3>
                  <h4 className="text-red-800 text-lg font-bold">COMMISSION ON STUDENT ELECTIONS AND APPOINTMENTS</h4>
                </div>

                {/* Register Form */}
                <div className="max-w-md mx-auto w-full">
                  <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Create Account</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Full Name Field */}
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <input
                          type="text"
                          name="name"
                          placeholder="Full Name"
                          value={formData.name}
                          onChange={handleChange}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                          required
                        />
                      </div>
                    </div>

                    {/* Student ID Field */}
                    <div>
                      <input
                        type="text"
                        name="studentId"
                        placeholder="Student ID (e.g. 1234-5678)"
                        value={formData.studentId}
                        onChange={(e) => {
                          let value = e.target.value.replace(/[^0-9]/g, ""); // remove all non-numeric chars
                          if (value.length > 4) {
                            value = value.slice(0, 4) + "-" + value.slice(4, 8); // insert dash
                          }
                          if (value.length > 9) value = value.slice(0, 9); // limit length
                          setFormData({ ...formData, studentId: value });
                        }}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">Format: 1234-5678</p>
                    </div>


                    {/* Institute Field (Dropdown) */}
                    <div>
                      <select
                        name="institute"
                        value={formData.institute}
                        onChange={handleChange}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                        required
                      >
                        <option value="" disabled>Select Institute</option>
                        <option value="Institute of Arts and Sciences">Institute of Arts and Sciences</option>
                        <option value="Institute of Business and Computing Education">Institute of Business and Computing Education</option>
                        <option value="Institute of Teacher Education">Institute of Teacher Education</option>
                        <option value="Institute of Hospitality and Tourism Management">Institute of Hospitality and Tourism Management</option>
                      </select>
                    </div>

                    

                    {/* Email Field */}
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input
                          type="email"
                          name="email"
                          placeholder="your.email@mcc.edu.ph"
                          value={formData.email}
                          onChange={handleChange}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                          required
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Only @mcc.edu.ph emails are allowed</p>
                    </div>

                    {/* Password Field */}
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Password"
                          value={formData.password}
                          onChange={(e) => {
                          handleChange(e);
                          checkPasswordRules(e.target.value);
                        }}
                          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {showPassword ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            )}
                          </svg>
                        </button>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              Object.values(passwordRules).filter(Boolean).length === 4
                                ? "bg-green-600"
                                : "bg-red-600"
                            }`}
                            style={{ width: `${(Object.values(passwordRules).filter(Boolean).length / 4) * 100}%` }}
                          ></div>
                        </div>

                        <div className="mt-2 text-sm">
                          <p className="font-medium">Password must contain:</p>
                          <ul className="space-y-1 mt-1">
                            <li className={passwordRules.length ? "text-green-600" : "text-red-600"}>
                              {passwordRules.length ? "✔" : "✖"} At least 8 characters
                            </li>
                            <li className={passwordRules.lowercase ? "text-green-600" : "text-red-600"}>
                              {passwordRules.lowercase ? "✔" : "✖"} At least one lowercase letter
                            </li>
                            <li className={passwordRules.uppercase ? "text-green-600" : "text-red-600"}>
                              {passwordRules.uppercase ? "✔" : "✖"} At least one uppercase letter
                            </li>
                            <li className={passwordRules.number ? "text-green-600" : "text-red-600"}>
                              {passwordRules.number ? "✔" : "✖"} At least one number
                            </li>
                            <li className={passwordRules.symbol ? "text-green-600" : "text-red-600"}>
                              {passwordRules.symbol ? "✔" : "✖"} At least one special symbol (!@#$%^&*)
                            </li>
                          </ul>
                        </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          placeholder="Confirm Password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {showConfirmPassword ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</div>
                    )}

                    {/* Register Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                    </button>


                    {/* Login Link */}
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-red-600 hover:text-red-500">
                          Sign in
                        </Link>
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
