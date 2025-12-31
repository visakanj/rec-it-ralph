import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    // Plugin to serve parent directory files in dev mode
    {
      name: 'serve-parent-files',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Serve /v2-react-build/app.js from parent directory
          if (req.url === '/v2-react-build/app.js') {
            const filePath = path.resolve(__dirname, '../app.js')
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'application/javascript')
              const stat = fs.statSync(filePath)
              res.setHeader('Content-Length', stat.size.toString())

              const stream = fs.createReadStream(filePath)
              stream.pipe(res)

              // Ensure we don't call next() - this response is complete
              return
            }
          }
          // Serve /v2-react-build/v2/data-adapter.js from parent directory
          if (req.url === '/v2-react-build/v2/data-adapter.js') {
            const filePath = path.resolve(__dirname, '../v2/data-adapter.js')
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', 'application/javascript')
              const stat = fs.statSync(filePath)
              res.setHeader('Content-Length', stat.size.toString())

              const stream = fs.createReadStream(filePath)
              stream.pipe(res)

              // Ensure we don't call next() - this response is complete
              return
            }
          }
          // Only call next() if we didn't handle the request
          next()
        })
      }
    }
  ],
  root: '.',
  base: '/v2-react-build/',
  publicDir: 'public',
  build: {
    outDir: '../v2-react-build',
    emptyOutDir: true
  }
})
