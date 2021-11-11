<template>
  <div v-if="currentSwap">
    <h1>Swap in progress - {{ uuid }}</h1>
    <div>Address to pay : {{ currentSwap.swapAddress }}</div>
    <div>Total to pay : {{ currentSwap.amount }}</div>
  </div>
  <div v-else>Swap not found</div>
</template>

<script>
import { Inertia } from '@inertiajs/inertia'
export default {
  data() {
    return {
      currentSwap: null,
    }
  },
  props: ['uuid', 'swap'],
  methods: {
    getSwaps() {
      const stringSwaps = localStorage.getItem('swaps')
      let swaps = []
      if (stringSwaps) {
        swaps = JSON.parse(stringSwaps)
      }
      return swaps
    },
  },
  mounted() {
    const swaps = this.getSwaps()
    let currentSwap = null

    // Swap created
    if (this.swap) {
      currentSwap = { uuid: this.uuid, swap: this.swap }
      swaps.push(currentSwap)
      localStorage.setItem('swaps', JSON.stringify(swaps))
    }

    this.currentSwap =
      currentSwap !== null
        ? currentSwap.swap
        : this.getSwaps().find((s) => s.uuid === this.uuid).swap
  },
}
</script>

<style>
</style>