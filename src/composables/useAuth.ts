import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '@/config/firebase'
import SecureLS from 'secure-ls'

const ls = new SecureLS({ encodingType: 'AES' })
const LAST_EMAIL_KEY_SECURE = 'lastAuthenticatedEmail'
const LAST_EMAIL_KEY_PLAIN = 'lastAuthenticatedEmailPlain'

export const useAuth = () => {
  const router = useRouter()
  const user = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Listen for auth changes
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
  })

  const saveLastEmail = (email: string) => {
    try {
      // Guardar encriptado en SecureLS
      ls.set(LAST_EMAIL_KEY_SECURE, email)
      // Guardar no encriptado en localStorage normal
      localStorage.setItem(LAST_EMAIL_KEY_PLAIN, email)
    } catch (err) {
      console.error('Error saving email to storage:', err)
    }
  }

  const getLastEmail = (): string => {
    try {
      const email = ls.get(LAST_EMAIL_KEY_SECURE)
      return email || ''
    } catch (err) {
      console.error('Error retrieving email from secure storage:', err)
      return ''
    }
  }

  const getLastEmailPlain = (): string => {
    try {
      const email = localStorage.getItem(LAST_EMAIL_KEY_PLAIN)
      return email || ''
    } catch (err) {
      console.error('Error retrieving email from plain storage:', err)
      return ''
    }
  }

  const clearLastEmail = () => {
    try {
      ls.removeAll()
      localStorage.removeItem(LAST_EMAIL_KEY_PLAIN)
    } catch (err) {
      console.error('Error clearing storage:', err)
    }
  }

  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    try {
      await signInWithEmailAndPassword(auth, email, password)
      saveLastEmail(email)
      router.push('/welcome')
    } catch (err: any) {
      error.value = err.message || 'Error al iniciar sesión'
      console.error('Login error:', err)
    } finally {
      loading.value = false
    }
  }

  const register = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      saveLastEmail(email)
      router.push('/welcome')
    } catch (err: any) {
      error.value = err.message || 'Error al registrarse'
      console.error('Register error:', err)
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    error.value = null
    try {
      await signOut(auth)
      router.push('/')
    } catch (err: any) {
      error.value = err.message || 'Error al cerrar sesión'
      console.error('Logout error:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    saveLastEmail,
    getLastEmail,
    getLastEmailPlain,
    clearLastEmail,
  }
}
