import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import ResetPassword from "./ResetPassword"
import VerifyEmail from "./VerifyEmail"

function AuthAction() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)

  const mode = searchParams.get("mode")   // resetPassword | verifyEmail | recoverEmail
  const oobCode = searchParams.get("oobCode")

  useEffect(() => {
    if (!mode || !oobCode) {
      navigate("/") // invalid link, send home
    }
  }, [mode, oobCode, navigate])

  if (mode === "resetPassword") {
    return <ResetPassword />
  }

  if (mode === "verifyEmail") {
    return <VerifyEmail />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-red-600">Invalid or unsupported action.</p>
      </div>
    </div>
  )
}

export default AuthAction
