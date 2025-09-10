import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { get, ref, set } from 'firebase/database'
import { auth, db } from '../firebase'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [verificationCheckInterval, setVerificationCheckInterval] = useState(null)

  // Check if user is email verified (both Firebase Auth and database)
  const isEmailVerified = () => {
    return user && (user.emailVerified || (userData && userData.emailVerified))
  }

  // Fetch user data from database
  const fetchUserData = async (user) => {
    if (!user) return null
    
    try {
      const userRef = ref(db, `users/${user.uid}`)
      const snapshot = await get(userRef)
      if (snapshot.exists()) {
        return snapshot.val()
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
    return null
  }

  // Update email verification status in database
  const updateEmailVerificationStatus = async (verified) => {
    if (!user) return
    
    try {
      await set(ref(db, `users/${user.uid}/emailVerified`), verified)
      setUserData(prev => prev ? { ...prev, emailVerified: verified } : null)
    } catch (error) {
      console.error('Error updating email verification status:', error)
    }
  }

  // Check verification status
  const checkVerificationStatus = async () => {
    if (!user) return false
    
    try {
      await user.reload()
      const data = await fetchUserData(user)
      
      if (data) {
        // Update database if Firebase shows verified but database doesn't
        if (user.emailVerified && !data.emailVerified) {
          await updateEmailVerificationStatus(true)
          return true
        }
        return user.emailVerified || data.emailVerified
      }
      
      return user.emailVerified
    } catch (error) {
      console.error('Error checking verification status:', error)
      return false
    }
  }

  // Start polling for verification status
  const startVerificationPolling = () => {
    if (verificationCheckInterval) {
      clearInterval(verificationCheckInterval)
    }
    
    const interval = setInterval(async () => {
      if (user) {
        try {
          await user.reload()
          if (user.emailVerified) {
            clearInterval(interval)
            setVerificationCheckInterval(null)
            // Update user data to reflect verification
            const data = await fetchUserData(user)
            setUserData(data)
          }
        } catch (error) {
          console.error('Error during verification polling:', error)
        }
      }
    }, 3000) // Check every 3 seconds
    
    setVerificationCheckInterval(interval)
  }

  // Stop polling for verification status
  const stopVerificationPolling = () => {
    if (verificationCheckInterval) {
      clearInterval(verificationCheckInterval)
      setVerificationCheckInterval(null)
    }
  }

  // Logout function with better error handling and cleanup
  const logout = async () => {
    try {
      // Stop any ongoing verification polling
      stopVerificationPolling()
      
      // Clear user data immediately for better UX
      setUser(null)
      setUserData(null)
      
      // Sign out from Firebase
      await signOut(auth)
      
      // Clear any cached data
      localStorage.removeItem('authToken')
      sessionStorage.clear()
      
      return true
    } catch (error) {
      console.error('Error signing out:', error)
      
      // Even if signOut fails, clear local state
      setUser(null)
      setUserData(null)
      stopVerificationPolling()
      
      // Force clear storage
      localStorage.clear()
      sessionStorage.clear()
      
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      if (user) {
        let data = await fetchUserData(user)
        
        // If no user data exists, create basic user data
        if (!data) {
          try {
            const basicUserData = {
              name: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email,
              role: 'voter',
              emailVerified: user.emailVerified,
              createdAt: new Date().toISOString()
            }
            
            await set(ref(db, `users/${user.uid}`), basicUserData)
            data = basicUserData
          } catch (error) {
            console.error('Error creating user data:', error)
          }
        }
        
        setUserData(data)
      } else {
        setUserData(null)
        stopVerificationPolling()
      }
      
      setLoading(false)
    })

    return () => {
      unsubscribe()
      stopVerificationPolling()
    }
  }, [])

  const value = {
    user,
    userData,
    loading,
    isEmailVerified,
    checkVerificationStatus,
    startVerificationPolling,
    stopVerificationPolling,
    logout,
    updateEmailVerificationStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
