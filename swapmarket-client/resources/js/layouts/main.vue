<template>
  <div>
    <header>
      <nav>
        <inertia-link href="/"><h1>Swapmarket</h1></inertia-link>
        <ul>
          <li><inertia-link href="/">Home</inertia-link></li>
          <li><inertia-link href="/about">About</inertia-link></li>
          <li><a href="https://github.com/Dolu89/swapmarket" target="_blank">Github ↗</a></li>
        </ul>
      </nav>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>