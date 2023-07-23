import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { angularPlugin } from '../plugin-vue-plus/src'
import { writeFile } from 'fs/promises'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    angularPlugin(),
    vue({
      include: /(\.vue$)|(\.xvue.ts$)/
    }),
    {
      name: 'test-plugin',
      async transform(code: string, id: string) {
        // console.log(code)
        if (
          /\.(vue)$/.test(id) &&
          id === 'E:/project/web/vue-plus/packages/dev-test/src/components/HelloWorld.vue'
        ) {
          /*
          console.log(id)
          console.log(code)
          console.log(1111111111111111)*/
          const tempFilePath = `${id}.test.js`
          await writeFile(tempFilePath, code, 'utf-8')
        }
      }
    }
  ],
  esbuild: {
    exclude: /(\.xvue.ts$)/
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@vugular/core': fileURLToPath(new URL('../vue-plus/src', import.meta.url)),
      '@vugular/store': fileURLToPath(new URL('../store/src', import.meta.url))
    }
  }
})
