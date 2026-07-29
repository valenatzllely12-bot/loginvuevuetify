import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
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

export interface Producto {
  id?: string
  codigo: string
  descripcion: string
  almacenId?: string
  almacenNombre?: string
  createdAt?: any
  updatedAt?: any
  userId?: string
  pendingSync?: boolean // true si aún no se ha confirmado con el servidor
}

interface PendingOperation {
  tempId: string
  type: 'create' | 'update' | 'delete'
  productId?: string // id real en Firestore (solo update/delete)
  data?: Partial<Producto>
  timestamp: number
}

const PENDING_QUEUE_KEY = 'productos_pending_queue'

// --- Cola persistente en localStorage (estado a nivel de módulo, compartido) ---
const loadQueue = (): PendingOperation[] => {
  try {
    const raw = localStorage.getItem(PENDING_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Error leyendo cola de sincronización:', err)
    return []
  }
}

const pendingOperations = ref<PendingOperation[]>(loadQueue())

const saveQueue = () => {
  try {
    localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(pendingOperations.value))
  } catch (err) {
    console.error('Error guardando cola de sincronización:', err)
  }
}

const isTempId = (id: string) => id.startsWith('local_')

const generateTempId = () =>
  `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const isNetworkError = (err: any) => {
  const code = err?.code || ''
  const message = (err?.message || '').toLowerCase()
  return (
    code === 'unavailable' ||
    message.includes('network') ||
    message.includes('offline') ||
    message.includes('failed to fetch')
  )
}

export const useProducts = () => {
  const { user } = useAuth()
  const firestoreProducts = ref<Producto[]>([])
  const loading = ref(false)
  const syncing = ref(false)
  const error = ref<string | null>(null)
  let unsubscribe: (() => void) | null = null

  // --- Vista combinada: productos del servidor + operaciones pendientes aplicadas encima ---
  const products = computed<Producto[]>(() => {
    let list = firestoreProducts.value.map(p => ({ ...p }))

    for (const op of pendingOperations.value) {
      if (op.type === 'update' && op.productId) {
        const idx = list.findIndex(p => p.id === op.productId)
        if (idx !== -1) list[idx] = { ...list[idx], ...op.data, pendingSync: true }
      }
      if (op.type === 'delete' && op.productId) {
        list = list.filter(p => p.id !== op.productId)
      }
    }

    const pendingCreates = pendingOperations.value
      .filter(op => op.type === 'create')
      .map(op => ({ id: op.tempId, ...op.data, pendingSync: true } as Producto))

    return [...list, ...pendingCreates]
  })

  const pendingCount = computed(() => pendingOperations.value.length)

  // Configurar listener cuando el usuario cambia
  watch(
    () => user.value,
    newUser => {
      if (unsubscribe) unsubscribe()

      if (newUser && newUser.uid) {
        setupListener()
      } else {
        firestoreProducts.value = []
        error.value = null
      }
    }
  )

  const setupListener = () => {
    if (!user.value) return

    loading.value = true
    error.value = null

    try {
      const q = query(
        collection(db, 'productos'),
        where('userId', '==', user.value.uid)
      )

      unsubscribe = onSnapshot(
        q,
        snapshot => {
          firestoreProducts.value = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
          })) as Producto[]
          loading.value = false
        },
        (err: any) => {
          console.error('Error en listener de productos:', err)
          error.value = err.message || 'Error al cargar productos'
          loading.value = false
        }
      )
    } catch (err: any) {
      console.error('Error al configurar listener:', err)
      error.value = err.message || 'Error al configurar listener'
      loading.value = false
    }
  }

  // --- Crear producto (con soporte offline) ---
  const createProduct = async (producto: Omit<Producto, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user.value) {
      error.value = 'Usuario no autenticado'
      return null
    }

    const payload = { ...producto, userId: user.value.uid }

    if (!navigator.onLine) {
      return queueCreate(payload)
    }

    loading.value = true
    error.value = null
    try {
      const docRef = await addDoc(collection(db, 'productos'), {
        ...payload,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      return docRef.id
    } catch (err: any) {
      if (isNetworkError(err)) return queueCreate(payload)
      error.value = err.message || 'Error al crear producto'
      return null
    } finally {
      loading.value = false
    }
  }

  const queueCreate = (data: Partial<Producto>) => {
    const tempId = generateTempId()
    pendingOperations.value.push({ tempId, type: 'create', data, timestamp: Date.now() })
    saveQueue()
    return tempId
  }

  // --- Actualizar producto (con soporte offline) ---
  const updateProduct = async (id: string, updates: Partial<Producto>) => {
    if (!user.value) {
      error.value = 'Usuario no autenticado'
      return false
    }

    // Si el producto todavía no existe en el servidor (fue creado offline),
    // solo actualizamos los datos dentro de la misma operación en cola.
    if (isTempId(id)) {
      const op = pendingOperations.value.find(o => o.tempId === id && o.type === 'create')
      if (op) {
        op.data = { ...op.data, ...updates }
        saveQueue()
        return true
      }
      return false
    }

    if (!navigator.onLine) {
      pendingOperations.value.push({
        tempId: generateTempId(),
        type: 'update',
        productId: id,
        data: updates,
        timestamp: Date.now(),
      })
      saveQueue()
      return true
    }

    loading.value = true
    error.value = null
    try {
      await updateDoc(doc(db, 'productos', id), { ...updates, updatedAt: new Date() })
      return true
    } catch (err: any) {
      if (isNetworkError(err)) {
        pendingOperations.value.push({
          tempId: generateTempId(),
          type: 'update',
          productId: id,
          data: updates,
          timestamp: Date.now(),
        })
        saveQueue()
        return true
      }
      error.value = err.message || 'Error al actualizar producto'
      return false
    } finally {
      loading.value = false
    }
  }

  // --- Eliminar producto (con soporte offline) ---
  const deleteProduct = async (id: string) => {
    if (!user.value) {
      error.value = 'Usuario no autenticado'
      return false
    }

    // Si aún no existe en el servidor, simplemente se quita de la cola.
    if (isTempId(id)) {
      pendingOperations.value = pendingOperations.value.filter(o => o.tempId !== id)
      saveQueue()
      return true
    }

    if (!navigator.onLine) {
      pendingOperations.value.push({
        tempId: generateTempId(),
        type: 'delete',
        productId: id,
        timestamp: Date.now(),
      })
      saveQueue()
      return true
    }

    loading.value = true
    error.value = null
    try {
      await deleteDoc(doc(db, 'productos', id))
      return true
    } catch (err: any) {
      if (isNetworkError(err)) {
        pendingOperations.value.push({
          tempId: generateTempId(),
          type: 'delete',
          productId: id,
          timestamp: Date.now(),
        })
        saveQueue()
        return true
      }
      error.value = err.message || 'Error al eliminar producto'
      return false
    } finally {
      loading.value = false
    }
  }

  // --- Sincronización de la cola pendiente contra el servidor ---
  const syncPendingOperations = async () => {
    if (syncing.value || pendingOperations.value.length === 0 || !user.value) return

    syncing.value = true
    const queueSnapshot = [...pendingOperations.value]

    for (const op of queueSnapshot) {
      try {
        if (op.type === 'create') {
          await addDoc(collection(db, 'productos'), {
            ...op.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        } else if (op.type === 'update' && op.productId) {
          await updateDoc(doc(db, 'productos', op.productId), {
            ...op.data,
            updatedAt: new Date(),
          })
        } else if (op.type === 'delete' && op.productId) {
          await deleteDoc(doc(db, 'productos', op.productId))
        }

        // Éxito: se quita de la cola
        pendingOperations.value = pendingOperations.value.filter(o => o.tempId !== op.tempId)
        saveQueue()
      } catch (err) {
        console.error('Error sincronizando operación pendiente, se reintentará luego:', op, err)
        // Se deja en la cola para el próximo intento
      }
    }

    syncing.value = false
  }

  const handleOnline = () => {
    syncPendingOperations()
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    if (navigator.onLine) syncPendingOperations()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', handleOnline)
  })

  return {
    products,
    loading,
    error,
    pendingCount,
    syncing,
    createProduct,
    updateProduct,
    deleteProduct,
    syncPendingOperations,
  }
}