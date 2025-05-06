"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { auth } from "./firebase"
import { useRouter } from "next/navigation"

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signup = async (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password)
  }

  const login = async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    provider.addScope("https://www.googleapis.com/auth/drive.readonly")
    return signInWithPopup(auth, provider)
  }

  const logout = async () => {
    setUser(null)
    await signOut(auth)
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
