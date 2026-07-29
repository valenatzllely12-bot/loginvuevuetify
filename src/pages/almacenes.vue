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
          <h1 class="text-h4">Almacenes</h1>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="openDialog"
            :disabled="loadingStores"
          >
            Nuevo Almacén
          </v-btn>
        </div>

        <!-- Alert de error -->
        <v-alert
          v-if="errorStores"
          type="error"
          closable
          class="mb-4"
          @click:close="errorStores = null"
        >
          {{ errorStores }}
        </v-alert>

        <!-- Tabla de almacenes -->
        <v-data-table
          :headers="headers"
          :items="stores"
          :loading="loadingStores"
          class="elevation-1"
        >
          <template v-slot:item.acciones="{ item }">
            <div class="d-flex gap-2">
              <v-btn
                size="small"
                color="warning"
                prepend-icon="mdi-pencil"
                @click="editStore(item)"
                :disabled="loadingStores"
              >
                Editar
              </v-btn>
              <v-btn
                size="small"
                color="error"
                prepend-icon="mdi-delete"
                @click="confirmDelete(item)"
                :disabled="loadingStores"
              >
                Eliminar
              </v-btn>
            </div>
          </template>

          <template v-slot:no-data>
            <div class="text-center py-10">
              <p class="text-h6">No hay almacenes registrados</p>
              <p class="text-subtitle2">Haz clic en "Nuevo Almacén" para crear uno</p>
            </div>
          </template>
        </v-data-table>
      </v-container>
    </v-main>

    <!-- Dialog para crear/editar -->
    <v-dialog v-model="showDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h6">
          {{ isEditing ? 'Editar Almacén' : 'Nuevo Almacén' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="form" @submit.prevent="saveStore">
            <v-text-field
              v-model="formData.codigo"
              label="Código"
              placeholder="Ingresa el código del almacén"
              required
              :rules="[rules.required, rules.codigo]"
              class="mb-4"
            ></v-text-field>

            <v-text-field
              v-model="formData.nombre"
              label="Nombre del Almacén"
              placeholder="Ingresa el nombre del almacén"
              required
              :rules="[rules.required, rules.nombre]"
              class="mb-4"
            ></v-text-field>

            <v-text-field
              v-model="formData.ubicacion"
              label="Ubicación"
              placeholder="Ingresa la ubicación del almacén"
              required
              :rules="[rules.required, rules.ubicacion]"
              class="mb-4"
            ></v-text-field>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="plain"
            @click="closeDialog"
            :disabled="loadingStores"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="saveStore"
            :loading="loadingStores"
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
          ¿Estás seguro de que deseas eliminar el almacén "{{ storeToDelete?.nombre }}"?
          Esta acción no se puede deshacer.
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="plain"
            @click="showDeleteDialog = false"
            :disabled="loadingStores"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="elevated"
            @click="deleteStoreConfirmed"
            :loading="loadingStores"
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
import { useStores, type Almacen } from '@/composables/useStores'
import type { VDataTable } from 'vuetify/components'

const { loading, logout } = useAuth()
const { stores, loading: loadingStores, error: errorStores, createStore, updateStore, deleteStore } = useStores()

const drawer = ref(true)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const isEditing = ref(false)
const form = ref<any>(null)

const formData = ref<{
  codigo: string
  nombre: string
  ubicacion: string
}>({
  codigo: '',
  nombre: '',
  ubicacion: '',
})

const storeToDelete = ref<Almacen | null>(null)
const editingStoreId = ref<string | null>(null)

const headers: VDataTable['headers'] = [
  { title: 'Código', align: 'start', sortable: true, key: 'codigo' },
  { title: 'Nombre', align: 'start', sortable: true, key: 'nombre' },
  { title: 'Ubicación', align: 'start', sortable: true, key: 'ubicacion' },
  { title: 'Acciones', align: 'center', sortable: false, key: 'acciones' },
]

const rules = {
  required: (v: any) => !!v || 'Este campo es requerido',
  codigo: (v: any) => (v && v.length <= 50) || 'El código no debe exceder 50 caracteres',
  nombre: (v: any) => (v && v.length <= 100) || 'El nombre no debe exceder 100 caracteres',
  ubicacion: (v: any) => (v && v.length <= 150) || 'La ubicación no debe exceder 150 caracteres',
}

onMounted(() => {
  // El listener se configura automáticamente en useStores cuando el usuario se autentica
})

const openDialog = () => {
  isEditing.value = false
  formData.value = { codigo: '', nombre: '', ubicacion: '' }
  editingStoreId.value = null
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  formData.value = { codigo: '', nombre: '', ubicacion: '' }
  editingStoreId.value = null
  isEditing.value = false
  form.value?.reset()
}

const editStore = (almacen: Almacen) => {
  isEditing.value = true
  editingStoreId.value = almacen.id || null
  formData.value = {
    codigo: almacen.codigo,
    nombre: almacen.nombre,
    ubicacion: almacen.ubicacion,
  }
  showDialog.value = true
}

const saveStore = async () => {
  const isValid = await form.value?.validate()
  if (!isValid) return

  if (isEditing.value && editingStoreId.value) {
    await updateStore(editingStoreId.value, formData.value)
  } else {
    await createStore(formData.value)
  }

  closeDialog()
}

const confirmDelete = (almacen: Almacen) => {
  storeToDelete.value = almacen
  showDeleteDialog.value = true
}

const deleteStoreConfirmed = async () => {
  if (storeToDelete.value?.id) {
    await deleteStore(storeToDelete.value.id)
    showDeleteDialog.value = false
    storeToDelete.value = null
  }
}

const handleLogout = async () => {
  await logout()
}
</script>

<style scoped>
</style>
