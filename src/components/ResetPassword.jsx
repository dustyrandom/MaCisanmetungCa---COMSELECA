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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.")
      return
    }

    try {
      setLoading(true)
      const auth = getAuth()
      await confirmPasswordReset(auth, oobCode, newPassword)
      setMessage("✅ Password has been reset successfully. Redirecting to login...")

      // ⏳ redirect after 2 seconds
      setTimeout(() => {
        navigate("/login")
      }, 2000)
    } catch (error) {
      console.error(error)
      setMessage("❌ Error resetting password. The link may have expired.")
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
        <h2 className="text-xl font-bold text-center text-red-900 mb-4">
          Reset Your Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-700">{message}</p>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
