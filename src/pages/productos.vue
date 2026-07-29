<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" permanent>
      <v-list>
        <v-list-item
          title="Bienvenido"
          subtitle="Menú"
          prepend-icon="mdi-home"
          to="/welcome"
        ></v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-item
          title="Productos"
          prepend-icon="mdi-package"
          to="/productos"
        ></v-list-item>

        <v-list-item
          title="Almacenes"
          prepend-icon="mdi-warehouse"
          to="/almacenes"
        ></v-list-item>
      </v-list>

      <template v-slot:append>
        <v-list>
          <v-list-item
            title="Cerrar sesión"
            prepend-icon="mdi-logout"
            @click="handleLogout"
            :loading="loading"
          ></v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-main>
      <v-container class="pa-6">
        <div class="d-flex justify-space-between align-center mb-6">
          <h1 class="text-h4">Productos</h1>

          <div class="d-flex align-center gap-2">
            <v-chip v-if="pendingCount > 0" color="warning" prepend-icon="mdi-cloud-sync-outline">
              {{ pendingCount }} sin sincronizar
            </v-chip>
            <v-btn
              v-if="pendingCount > 0"
              variant="text"
              size="small"
              prepend-icon="mdi-sync"
              :loading="syncing"
              @click="syncPendingOperations"
            >
              Sincronizar ahora
            </v-btn>

            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="openDialog"
              :disabled="loadingProducts"
            >
              Nuevo Producto
            </v-btn>
          </div>
        </div>

        <!-- Alert de error -->
        <v-alert
          v-if="errorProducts"
          type="error"
          closable
          class="mb-4"
          @click:close="errorProducts = null"
        >
          {{ errorProducts }}
        </v-alert>

        <!-- Tabla de productos -->
        <v-data-table
          :headers="headers"
          :items="products"
          :loading="loadingProducts"
          class="elevation-1"
        >
          <template v-slot:item.almacenNombre="{ item }">
            <v-chip v-if="item.almacenNombre" color="info" text-color="white">
              {{ item.almacenNombre }}
            </v-chip>
            <span v-else class="text-grey">Sin almacén</span>
          </template>

          <template v-slot:item.pendingSync="{ item }">
            <v-chip v-if="item.pendingSync" size="small" color="warning" prepend-icon="mdi-cloud-off-outline">
              Pendiente
            </v-chip>
            <v-chip v-else size="small" color="success" variant="tonal">
              Sincronizado
            </v-chip>
          </template>

          <template v-slot:item.acciones="{ item }">
            <div class="d-flex gap-2">
              <v-btn
                size="small"
                color="warning"
                prepend-icon="mdi-pencil"
                @click="editProduct(item)"
                :disabled="loadingProducts"
              >
                Editar
              </v-btn>
              <v-btn
                size="small"
                color="error"
                prepend-icon="mdi-delete"
                @click="confirmDelete(item)"
                :disabled="loadingProducts"
              >
                Eliminar
              </v-btn>
            </div>
          </template>

          <template v-slot:no-data>
            <div class="text-center py-10">
              <p class="text-h6">No hay productos registrados</p>
              <p class="text-subtitle2">Haz clic en "Nuevo Producto" para crear uno</p>
            </div>
          </template>
        </v-data-table>
      </v-container>
    </v-main>

    <!-- Dialog para crear/editar -->
    <v-dialog v-model="showDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h6">
          {{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="form" @submit.prevent="saveProduct">
            <v-text-field
              v-model="formData.codigo"
              label="Código"
              placeholder="Ingresa el código del producto"
              required
              :rules="[rules.required, rules.codigo]"
              class="mb-4"
            ></v-text-field>

            <v-select
              v-model="selectedStoreId"
              label="Almacén"
              placeholder="Selecciona un almacén"
              :items="stores"
              item-title="nombre"
              item-value="id"
              @update:modelValue="updateSelectedStore"
              class="mb-4"
            ></v-select>

            <v-textarea
              v-model="formData.descripcion"
              label="Descripción"
              placeholder="Ingresa la descripción del producto"
              required
              :rules="[rules.required, rules.descripcion]"
              rows="4"
              class="mb-4"
            ></v-textarea>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="plain"
            @click="closeDialog"
            :disabled="loadingProducts"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="saveProduct"
            :loading="loadingProducts"
          >
            {{ isEditing ? 'Actualizar' : 'Crear' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmación para eliminar -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">Confirmar eliminación</v-card-title>

        <v-card-text>
          ¿Estás seguro de que deseas eliminar el producto "{{ productToDelete?.codigo }}"?
          Esta acción no se puede deshacer.
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="plain"
            @click="showDeleteDialog = false"
            :disabled="loadingProducts"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="deleteProductConfirmed"
            :loading="loadingProducts"
          >
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useProducts, type Producto } from '@/composables/useProducts'
import { useStores } from '@/composables/useStores'
import type { VDataTable } from 'vuetify/components'

const { loading, logout } = useAuth()
const {
  products,
  loading: loadingProducts,
  error: errorProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  pendingCount,
  syncing,
  syncPendingOperations,
} = useProducts()
const { stores, loading: loadingStores } = useStores()

const drawer = ref(true)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const form = ref<any>(null)

const formData = ref<{
  codigo: string
  descripcion: string
  almacenId?: string
  almacenNombre?: string
}>({
  codigo: '',
  descripcion: '',
  almacenId: '',
  almacenNombre: '',
})

const productToDelete = ref<Producto | null>(null)
const editingProductId = ref<string | null>(null)
const selectedStoreId = ref<string>('')

const headers: VDataTable['headers'] = [
  { title: 'Código', align: 'start', sortable: true, key: 'codigo' },
  { title: 'Descripción', align: 'start', sortable: false, key: 'descripcion' },
  { title: 'Almacén', align: 'start', sortable: true, key: 'almacenNombre' },
  { title: 'Estado', align: 'center', sortable: false, key: 'pendingSync' },
  { title: 'Acciones', align: 'center', sortable: false, key: 'acciones' },
]

const rules = {
  required: (v: any) => !!v || 'Este campo es requerido',
  codigo: (v: any) => (v && v.length <= 50) || 'El código no debe exceder 50 caracteres',
  descripcion: (v: any) => (v && v.length <= 500) || 'La descripción no debe exceder 500 caracteres',
}

onMounted(() => {
  // El listener se configura automáticamente en useProducts cuando el usuario se autentica
})

const openDialog = () => {
  isEditing.value = false
  formData.value = { codigo: '', descripcion: '', almacenId: '', almacenNombre: '' }
  selectedStoreId.value = ''
  editingProductId.value = null
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  formData.value = { codigo: '', descripcion: '', almacenId: '', almacenNombre: '' }
  selectedStoreId.value = ''
  editingProductId.value = null
  isEditing.value = false
  form.value?.reset()
}

const editProduct = (product: Producto) => {
  isEditing.value = true
  editingProductId.value = product.id || null
  formData.value = {
    codigo: product.codigo,
    descripcion: product.descripcion,
    almacenId: product.almacenId || '',
    almacenNombre: product.almacenNombre || '',
  }
  selectedStoreId.value = product.almacenId || ''
  showDialog.value = true
}

const saveProduct = async () => {
  const isValid = await form.value?.validate()
  if (!isValid) return

  if (isEditing.value && editingProductId.value) {
    await updateProduct(editingProductId.value, {
      codigo: formData.value.codigo,
      descripcion: formData.value.descripcion,
      almacenId: formData.value.almacenId,
      almacenNombre: formData.value.almacenNombre,
    })
  } else {
    await createProduct({
      codigo: formData.value.codigo,
      descripcion: formData.value.descripcion,
      almacenId: formData.value.almacenId,
      almacenNombre: formData.value.almacenNombre,
    })
  }

  closeDialog()
}

const confirmDelete = (product: Producto) => {
  productToDelete.value = product
  showDeleteDialog.value = true
}

const updateSelectedStore = (storeId: string) => {
  const selectedStore = stores.value.find(s => s.id === storeId)
  if (selectedStore) {
    formData.value.almacenId = storeId
    formData.value.almacenNombre = selectedStore.nombre
  }
}

const deleteProductConfirmed = async () => {
  if (productToDelete.value?.id) {
    await deleteProduct(productToDelete.value.id)
    showDeleteDialog.value = false
    productToDelete.value = null
  }
}

const handleLogout = async () => {
  await logout()
}
</script>

<style scoped>
</style>