import '../css/style.css'
import { createApp, h } from 'vue'
import { createInertiaApp } from '@inertiajs/inertia-vue3'
import Layout from './layouts/main'
import { wsClient } from './socket'

createInertiaApp({
  resolve: (name) => {
    const page = require(`./pages/${name}`).default
    page.layout = page.layout || Layout
    return page
  },
  setup({ el, app, props, plugin }) {
    createApp({ render: () => h(app, props) })
      .use(plugin)
      .mount(el)
  },
})

wsClient.on('connect', (socket) => {
  const swaps = localStorage.getItem('swaps')
  if (swaps) {
    for (const swap in swaps) {
      wsClient.emit('swap:subscribe', swap.uuid)
    }
  }
})
