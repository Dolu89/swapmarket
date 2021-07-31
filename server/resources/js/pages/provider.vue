<template>
  <div>
    <h1>{{ provider.name }}</h1>
    {{ provider }}
  </div>
</template>

<script>
export default {
  props: ['provider'],
}
</script>

<style>
</style>