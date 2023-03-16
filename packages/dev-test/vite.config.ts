import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { angularPlugin } from "plugin-vue-plus/src";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [angularPlugin(), vue({
    include: /\.x?vue$/
  })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'vue-plus': fileURLToPath(new URL('../vue-plus/src', import.meta.url)),
    }
  }
})
