<template>
  <h2>
    Swap <small class="color-primary">with {{ provider.name }}</small>
  </h2>
  <!-- {{ provider }} -->
  <div>
    <pre>Send bitcoins on chain. Receive bitcoins off chain (Lightning network)</pre>
    <input
      v-model="invoice"
      type="text"
      placeholder="Paste your invoice (bolt11) you want to pay"
    />
    <div style="width: 100%; text-align: center">
      <button @click="createSwap(invoice, provider.hash)">Create swap</button>
    </div>
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
input {
  width: 100%;
}
</style>