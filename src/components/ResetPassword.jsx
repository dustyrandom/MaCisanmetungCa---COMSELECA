import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { getAuth, confirmPasswordReset } from "firebase/auth"

function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const oobCode = searchParams.get("oobCode")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password rules state
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    symbol: false,
  })

  const checkPasswordRules = (password) => {
    setPasswordRules({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[!@#$%^&*]/.test(password),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage("")

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.")
      return
    }

    if (!passwordRules.length || !passwordRules.lowercase || !passwordRules.uppercase || !passwordRules.number || !passwordRules.symbol) {
      setMessage("Password does not meet all requirements.")
      return
    }

    try {
      setLoading(true)
      const auth = getAuth()
      await confirmPasswordReset(auth, oobCode, newPassword)
      setMessage("Password has been reset successfully. Redirecting to login...")

      setTimeout(() => {
        navigate("/login")
      }, 2000)
    } catch (error) {
      console.error(error)
      setMessage("Error resetting password. The link may have expired.")
    } finally {
      setLoading(false)
    }
  }

  if (!oobCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-red-600">Invalid password reset link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold text-center text-red-900 mb-6">
          Reset Your Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  checkPasswordRules(e.target.value)
                }}
                required
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {showPassword ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  Object.values(passwordRules).filter(Boolean).length === 5
                    ? "bg-green-600"
                    : "bg-red-600"
                }`}
                style={{
                  width: `${
                    (Object.values(passwordRules).filter(Boolean).length / 5) *
                    100
                  }%`,
                }}
              ></div>
            </div>

            {/* Requirements list */}
            <div className="mt-2 text-sm">
              <p className="font-medium">Password must contain:</p>
              <ul className="space-y-1 mt-1">
                <li
                  className={passwordRules.length ? "text-green-600" : "text-red-600"}
                >
                  {passwordRules.length ? "✔" : "✖"} At least 8 characters
                </li>
                <li
                  className={passwordRules.lowercase ? "text-green-600" : "text-red-600"}
                >
                  {passwordRules.lowercase ? "✔" : "✖"} At least one lowercase letter
                </li>
                <li
                  className={passwordRules.uppercase ? "text-green-600" : "text-red-600"}
                >
                  {passwordRules.uppercase ? "✔" : "✖"} At least one uppercase letter
                </li>
                <li
                  className={passwordRules.number ? "text-green-600" : "text-red-600"}
                >
                  {passwordRules.number ? "✔" : "✖"} At least one number
                </li>
                <li
                  className={passwordRules.symbol ? "text-green-600" : "text-red-600"}
                >
                  {passwordRules.symbol ? "✔" : "✖"} At least one special symbol (!@#$%^&*)
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:border-gray-700"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {showConfirmPassword ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          {message && (
            <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
          )}
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
