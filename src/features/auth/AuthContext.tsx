import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { isSupabaseConfigured } from '@/lib/utils'
import { createLocalRepository, createSupabaseRepository, migrateLocalToAccount } from '@/repositories'
import type { TroveRepository } from '@/repositories/types'

interface AuthContextValue {
  isConfigured: boolean
  isSignedIn: boolean
  isLoading: boolean
  userEmail?: string
  repo: TroveRepository
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  migrateLocalData: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isConfigured = isSupabaseConfigured()
  const localRepo = useMemo(() => createLocalRepository(), [])
  const supabaseRepo = useMemo(() => (isConfigured ? createSupabaseRepository() : null), [isConfigured])
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(isConfigured)
  const [userEmail, setUserEmail] = useState<string>()

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) {
      setIsLoading(false)
      return
    }

    void client.auth.getSession().then(({ data }) => {
      setIsSignedIn(Boolean(data.session))
      setUserEmail(data.session?.user.email ?? undefined)
      setIsLoading(false)
    })

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session))
      setUserEmail(session?.user.email ?? undefined)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  const repo = isSignedIn && supabaseRepo ? supabaseRepo : localRepo

  const signUp = async (email: string, password: string) => {
    const client = getSupabaseClient()
    if (!client) throw new Error("Accounts aren't available right now")
    const { data, error } = await client.auth.signUp({ email, password })
    if (error) throw error
    if (!data.session) return { needsConfirmation: true }
    setIsSignedIn(true)
    setUserEmail(data.session.user.email ?? email)
    await migrateLocalToAccount(localRepo, supabaseRepo!)
    return { needsConfirmation: false }
  }

  const signIn = async (email: string, password: string) => {
    const client = getSupabaseClient()
    if (!client) throw new Error("Accounts aren't available right now")
    const { error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw error
    setIsSignedIn(true)
    await migrateLocalToAccount(localRepo, supabaseRepo!)
  }

  const signOut = async () => {
    const client = getSupabaseClient()
    if (client) await client.auth.signOut()
    setIsSignedIn(false)
    setUserEmail(undefined)
  }

  const migrateLocalData = async () => {
    if (!supabaseRepo) return
    await migrateLocalToAccount(localRepo, supabaseRepo)
  }

  const value: AuthContextValue = {
    isConfigured,
    isSignedIn,
    isLoading,
    userEmail,
    repo,
    signUp,
    signIn,
    signOut,
    migrateLocalData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
