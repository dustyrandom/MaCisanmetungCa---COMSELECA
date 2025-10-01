import { getDatabase, ref, push, set, serverTimestamp } from "firebase/database"

export const logActivity = async (adminName, action) => {
  try {
    const db = getDatabase()
    const logRef = ref(db, "activityLogs")
    const newLogRef = push(logRef)
    await set(newLogRef, {
      admin: adminName,
      action,
      timestamp: Date.now()
    })
  } catch (err) {
    console.error("Error logging activity:", err)
  }
}
