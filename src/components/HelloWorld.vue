<template>
  <v-sheet class="mx-auto pa-8" max-width="400" rounded="lg" elevation="4">
    <h2 class="text-h5 text-center mb-6 font-weight-bold">Login</h2>
    <v-form validate-on="submit lazy" @submit.prevent="submit">
      <v-text-field
        v-model="userName"
        :rules="userNameRules"
        label="User name"
        variant="outlined"
        color="primary"
        prepend-inner-icon="mdi-account"
      ></v-text-field>

      <v-text-field
        v-model="password"
        :rules="passwordRules"
        label="Password"
        type="password"
        variant="outlined"
        color="primary"
        prepend-inner-icon="mdi-lock"
        class="mt-4"
      ></v-text-field>

      <v-btn
        :loading="loading"
        class="mt-6"
        text="Submit"
        type="submit"
        block
        color="primary"
        size="large"
        rounded="lg"
      ></v-btn>
    </v-form>
  </v-sheet>
</template>

<script setup>
import { ref } from 'vue'

const userNameRules = [value => checkApi(value)]
const passwordRules = [
  value => !!value || 'Password is required.',
  value => (value && value.length >= 8) || 'Password must be at least 8 characters.',
  value => /[A-Z]/.test(value) || 'Password must contain at least one uppercase letter.',
  value => /[a-z]/.test(value) || 'Password must contain at least one lowercase letter.',
  value => /[0-9]/.test(value) || 'Password must contain at least one number.',
]

const loading = ref(false)
const userName = ref('')
const password = ref('')

async function submit(event) {
  loading.value = true
  const results = await event
  loading.value = false
  alert(JSON.stringify(results, null, 2))
}

let timeout = -1
async function checkApi(userName) {
  return new Promise(resolve => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      if (!userName) return resolve('Please enter a user name.')
      if (userName === 'johnleider') return resolve('User name already taken. Please try another one.')
      return resolve(true)
    }, 1000)
  })
}
</script>