<template>
  <div>
    <h1>Swap in progress</h1>
    <div>Address to pay : {{ swap.swapAddress }}</div>
    <div>Total to pay : {{ swap.amount }}</div>
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
  props: ['swap'],
  methods: {},
}
</script>

<style>
</style>