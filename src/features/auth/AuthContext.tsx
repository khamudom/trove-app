import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase'
import { isSupabaseConfigured } from '@/lib/utils'
import { createLocalRepository, createSupabaseRepository, migrateLocalToAccount } from '@/repositories'
import type { TroveRepository } from '@/repositories/types'

interface AuthContextValue {
  isConfigured: boolean
  isSignedIn: boolean
  isLoading: boolean
  userEmail?: string
  displayName?: string
  repo: TroveRepository
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  migrateLocalData: () => Promise<void>
}

function displayNameFromUser(user: User | null | undefined): string | undefined {
  const meta = user?.user_metadata?.display_name
  if (typeof meta === 'string' && meta.trim()) return meta.trim()
  return undefined
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isConfigured = isSupabaseConfigured()
  const localRepo = useMemo(() => createLocalRepository(), [])
  const supabaseRepo = useMemo(() => (isConfigured ? createSupabaseRepository() : null), [isConfigured])
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(isConfigured)
  const [userEmail, setUserEmail] = useState<string>()
  const [displayName, setDisplayName] = useState<string>()

  const applyUser = (user: User | null | undefined) => {
    setIsSignedIn(Boolean(user))
    setUserEmail(user?.email ?? undefined)
    setDisplayName(displayNameFromUser(user))
  }

  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) {
      setIsLoading(false)
      return
    }

    void client.auth.getSession().then(({ data }) => {
      applyUser(data.session?.user ?? null)
      setIsLoading(false)
    })

    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null)
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
    applyUser(data.session.user)
    await migrateLocalToAccount(localRepo, supabaseRepo!)
    return { needsConfirmation: false }
  }

  const signIn = async (email: string, password: string) => {
    const client = getSupabaseClient()
    if (!client) throw new Error("Accounts aren't available right now")
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw error
    applyUser(data.user)
    await migrateLocalToAccount(localRepo, supabaseRepo!)
  }

  const signOut = async () => {
    const client = getSupabaseClient()
    if (client) await client.auth.signOut()
    applyUser(null)
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
    displayName,
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
