<template>
  <header>
    <nav>
      <inertia-link href="/"><h1 class="header">Swapmarket</h1></inertia-link>
      <div class="menu">
        <inertia-link href="/">Home</inertia-link>
        <inertia-link href="/about">About</inertia-link>
        <a href="https://github.com/Dolu89/swapmarket" target="_blank">Github ↗</a>
      </div>
    </nav>
  </header>
  <main>
    <slot />
  </main>
</template>

<style lang="less" scoped>
nav,
.menu {
  display: flex;
  flex-direction: row;
  align-items: baseline;
}

.menu > a {
  text-decoration: none;
  margin-left: 15px;
}

.header {
  color: #454545;
}
</style>