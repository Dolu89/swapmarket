<template>
  <article>
    <h1>Brokers online</h1>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Fees</th>
          <th>Trades</th>
        </tr>
      </thead>
      <tr v-for="provider in providers" :key="provider.name">
        <td>
          <inertia-link :href="`/providers/${provider.hash}`">{{ provider.name }}</inertia-link>
        </td>
        <td>0.1 %</td>
        <td>51</td>
      </tr>
    </table>
  </article>
</template>

<script>
export default {
  props: ['providers'],
}
</script>

<style>
</style>