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
      <tr>
        <td><inertia-link href="/broker1">Broker 1</inertia-link></td>
        <td>0.1 %</td>
        <td>51</td>
      </tr>
      <tr>
        <td><inertia-link href="/broker2">Broker 2</inertia-link></td>
        <td>0.2 %</td>
        <td>24</td>
      </tr>
    </table>
  </article>
</template>

<script>
export default {
  props: ['brokers'],
}
</script>

<style>
</style>