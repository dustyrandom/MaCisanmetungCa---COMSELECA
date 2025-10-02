import { db } from '../firebase'
import { ref, push } from 'firebase/database'

export const logActivity = async (adminName, action, photoURL = null) => {
  try {
    const logsRef = ref(db, 'activityLogs')
    await push(logsRef, {
      admin: adminName,
      action,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error("Error logging activity:", error)
  }
}
