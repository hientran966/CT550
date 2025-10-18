import { createApp } from 'vue'
import { createPinia } from "pinia";
import App from './App.vue'
import router from './router'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/style.css'

import { initSocket } from './plugins/socket'

const app = createApp(App)

app.use(createPinia());
app.use(router)
app.use(ElementPlus)

const user = JSON.parse(localStorage.getItem("user"))
if (user?.id) {
  initSocket(user.id)
}

app.mount('#app')
