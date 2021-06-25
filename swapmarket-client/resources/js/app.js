import '../css/app.css'
import { createApp, h } from 'vue'
import { createInertiaApp } from '@inertiajs/inertia-vue3'
import Layout from './layouts/main'

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
