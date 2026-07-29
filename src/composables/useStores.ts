import { ref, watch } from 'vue'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuth } from './useAuth'

export interface Almacen {
  id?: string
  codigo: string
  nombre: string
  ubicacion: string
  createdAt?: any
  updatedAt?: any
  userId?: string
}

export const useStores = () => {
  const { user } = useAuth()
  const stores = ref<Almacen[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let unsubscribe: (() => void) | null = null

  // Configurar listener cuando el usuario cambia
  watch(
    () => user.value,
    (newUser) => {
      // Desuscribir del listener anterior si existe
      if (unsubscribe) {
        unsubscribe()
      }

      // Si hay usuario autenticado, configurar el listener
      if (newUser && newUser.uid) {
        setupListener()
      } else {
        // Si no hay usuario, limpiar almacenes
        stores.value = []
        error.value = null
      }
    }
  )

  // Escuchar cambios en tiempo real
  const setupListener = () => {
    if (!user.value) return

    loading.value = true
    error.value = null

    try {
      const q = query(
        collection(db, 'almacenes'),
        where('userId', '==', user.value.uid)
      )

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          stores.value = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Almacen[]
          loading.value = false
        },
        (err: any) => {
          console.error('Error en listener de almacenes:', err)
          error.value = err.message || 'Error al cargar almacenes'
          loading.value = false
        }
      )
    } catch (err: any) {
      console.error('Error al configurar listener:', err)
      error.value = err.message || 'Error al configurar listener'
      loading.value = false
    }
  }

  // Crear almacén
  const createStore = async (almacen: Omit<Almacen, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user.value) {
      error.value = 'Usuario no autenticado'
      return null
    }

    loading.value = true
    error.value = null

    try {
      const docRef = await addDoc(collection(db, 'almacenes'), {
        ...almacen,
        userId: user.value.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      return docRef.id
    } catch (err: any) {
      error.value = err.message || 'Error al crear almacén'
      return null
    } finally {
      loading.value = false
    }
  }

  // Actualizar almacén
  const updateStore = async (id: string, updates: Partial<Almacen>) => {
    if (!user.value) {
      error.value = 'Usuario no autenticado'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const docRef = doc(db, 'almacenes', id)
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date(),
      })
      return true
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar almacén'
      return false
    } finally {
      loading.value = false
    }
  }

  // Eliminar almacén
  const deleteStore = async (id: string) => {
    if (!user.value) {
      error.value = 'Usuario no autenticado'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const docRef = doc(db, 'almacenes', id)
      await deleteDoc(docRef)
      return true
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar almacén'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    stores,
    loading,
    error,
    createStore,
    updateStore,
    deleteStore,
  }
}
