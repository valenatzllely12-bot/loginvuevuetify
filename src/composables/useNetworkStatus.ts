import { ref, onMounted, onBeforeUnmount } from 'vue'

const isOnline = ref(true)
const showNetworkBanner = ref(false)
const snackMessage = ref('')
const snackColor = ref<'success' | 'error' | 'info'>('info')
const timeout = ref(0)
const lastConnectionTime = ref<number | null>(null)
const connectionAttempts = ref(0)

const ONLINE_CHECK_URL = 'https://www.gstatic.com/generate_204'
let networkStatusCleanup: (() => void) | null = null
let isNetworkStatusInitialized = false

/**
 * Detecta cambios en el estado de la conexión y actualiza los estados reactivos
 */
const updateNetworkStatus = (online: boolean) => {
  const wasOnline = isOnline.value
  isOnline.value = online
  lastConnectionTime.value = Date.now()

  if (online) {
    snackMessage.value = '✓ Conexión restaurada. Ahora estás en línea.'
    snackColor.value = 'success'
    timeout.value = 4000
    connectionAttempts.value = 0
    showNetworkBanner.value = true

    console.log('[useNetworkStatus] Online detected - connection confirmed')
  } else {
    snackMessage.value = '✗ Sin conexión a internet. Estás trabajando en modo offline.'
    snackColor.value = 'error'
    timeout.value = 0
    if (wasOnline) {
      connectionAttempts.value += 1
    }
    showNetworkBanner.value = true

    console.log('[useNetworkStatus] Offline detected - internet unavailable')
  }
}

const handleOnline = async () => {
  console.log('[useNetworkStatus] Online event fired')
  const hasInternet = await validateConnection()
  updateNetworkStatus(hasInternet)
}

const handleOffline = () => {
  console.log('[useNetworkStatus] Offline event fired')
  updateNetworkStatus(false)
}

/**
 * Valida la conexión con un chequeo real a un endpoint externo.
 * Evita que la app marque como online por caché del servicio o del mismo origen.
 */
const validateConnection = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  if (!navigator.onLine) return false

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 4000)

  try {
    await fetch(ONLINE_CHECK_URL, {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      redirect: 'manual',
      signal: controller.signal,
    })

    return true
  } catch (error) {
    console.warn('[useNetworkStatus] Connection validation failed:', error)
    return false
  } finally {
    window.clearTimeout(timeoutId)
  }
}

/**
 * Intenta reconectar si la aplicación detecta que debería estar online
 * pero no puede alcanzar el servidor
 */
const attemptReconnect = async () => {
  if (isOnline.value) return

  console.log(`[useNetworkStatus] Attempting reconnection (attempt ${connectionAttempts.value})`)

  const isConnected = await validateConnection()
  if (isConnected) {
    updateNetworkStatus(true)
  } else {
    window.setTimeout(() => {
      void attemptReconnect()
    }, 10000)
  }
}

const setupNetworkStatus = () => {
  if (typeof window === 'undefined' || isNetworkStatusInitialized) {
    return networkStatusCleanup
  }

  isNetworkStatusInitialized = true

  void (async () => {
    const initialOnline = navigator.onLine && (await validateConnection())
    updateNetworkStatus(initialOnline)
  })()

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  const validationInterval = window.setInterval(async () => {
    if (!navigator.onLine) {
      updateNetworkStatus(false)
      return
    }

    const isConnected = await validateConnection()
    if (!isConnected) {
      console.warn('[useNetworkStatus] Server unreachable - marking as offline')
      updateNetworkStatus(false)
    } else if (!isOnline.value) {
      updateNetworkStatus(true)
    }
  }, 15000)

  const cleanup = () => {
    window.clearInterval(validationInterval)
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    networkStatusCleanup = null
    isNetworkStatusInitialized = false
  }

  networkStatusCleanup = cleanup

  return cleanup
}

const teardownNetworkStatus = () => {
  if (typeof window === 'undefined') return

  if (networkStatusCleanup) {
    networkStatusCleanup()
  }
}

export const useNetworkStatus = () => {
  onMounted(() => {
    const clearValidation = setupNetworkStatus()

    onBeforeUnmount(() => {
      teardownNetworkStatus()
      if (clearValidation) {
        clearValidation()
      }
    })
  })

  return {
    isOnline,
    showNetworkBanner,
    snackMessage,
    snackColor,
    timeout,
    lastConnectionTime,
    connectionAttempts,
    attemptReconnect,
    validateConnection,
  }
}
