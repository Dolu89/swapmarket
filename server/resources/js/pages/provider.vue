<template>
  <div>
    <h1>{{ provider.name }}</h1>
    {{ provider }}
    Invoice <input v-model="invoice" type="text" />
    <button @click="createSwap(invoice, provider.hash)">Create swap</button>
  </div>
</template>

<script>
import { Inertia } from '@inertiajs/inertia'
export default {
  data() {
    return {
      invoice: '',
    }
  },
  props: ['provider'],
  methods: {
    createSwap(invoice, providerId) {
      Inertia.post('/swap', {
        invoice,
        providerId,
      })
    },
  },
}
</script>

<style>
</style>