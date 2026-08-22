import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/myprime/',
  plugins: [react(), VitePWA({ registerType: 'autoUpdate', manifest: {
    name: 'MyPrime', short_name: 'MyPrime', description: 'Личный журнал тренировок',
    lang: 'ru', start_url: '/myprime/', display: 'standalone', background_color: '#F3F2F0', theme_color: '#FF5B3D',
    icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
  }})]
})
