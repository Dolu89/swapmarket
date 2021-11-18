<template>
  <div v-if="currentSwap">
    <h1>Swap {{ uuid }}</h1>
    <div v-if="!currentSwap.completed">
      Please, pay
      <span style="font-weight: bold">{{ currentSwap.amount }}</span>
      satoshis to
      <span style="font-weight: bold">{{ currentSwap.swapAddress }}</span>
    </div>
    <div v-if="currentSwap.completed">Swap completed</div>
  </div>

  <div v-if="!currentSwap">Swap not found</div>
</template>

<script>
import { Inertia } from '@inertiajs/inertia'
import { wsClient } from '../socket'
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
      currentSwap = { uuid: this.uuid, swap: { ...this.swap, completed: false } }
      swaps.push(currentSwap)
      localStorage.setItem('swaps', JSON.stringify(swaps))
    }

    this.currentSwap =
      currentSwap !== null
        ? currentSwap.swap
        : this.getSwaps().find((s) => s.uuid === this.uuid).swap

    wsClient.emit('swap:subscribe', this.uuid)
    const objThis = this
    wsClient.on('swap:completed', (id) => {
      objThis.currentSwap.completed = true
      const currentSwap = objThis.getSwaps().find((s) => s.uuid === id)
      const swaps = objThis.getSwaps().filter((s) => s.uuid !== currentSwap.uuid)
      currentSwap.swap.completed = true
      swaps.push(currentSwap)
      localStorage.setItem('swaps', JSON.stringify(swaps))
    })
  },
}
</script>

<style>
</style>