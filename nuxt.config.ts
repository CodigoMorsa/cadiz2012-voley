import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },

  // La app funciona como SPA (se instala como PWA). El servidor de Nuxt
  // solo se usa para leer la web de la liga desde /api/...
  ssr: false,

  modules: ['@vueuse/nuxt', '@nuxt/fonts', '@vite-pwa/nuxt'],

  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },

  // ⚙️ Todo lo que puedes querer cambiar está aquí
  runtimeConfig: {
    // Web de la que se sacan clasificación y calendario
    ligaUrl: 'https://la-comarca-hazel.vercel.app',
    public: {
      // Nombre EXACTO del equipo tal como aparece en la web de la liga
      miEquipo: 'Cádiz 2012 Mixto',
      // Puestos que van directos a cuartos de la fase final
      puestosDirectos: 5,
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'Cádiz 2012 Mixto',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      // Pone el tema correcto antes de que se pinte nada (sin parpadeo)
      script: [
        {
          innerHTML:
            "try{var t=localStorage.getItem('tema')||'auto';if(t==='auto')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';document.documentElement.dataset.theme=t}catch(e){}",
        },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon.png' },
      ],
    },
  },

  fonts: {
    families: [
      { name: 'Big Shoulders Display', provider: 'google', weights: [600, 800, 900] },
      { name: 'Onest', provider: 'google', weights: [400, 500, 600, 700, 800] },
    ],
  },

  // Genera la "carcasa" HTML para que la PWA abra sin conexión
  nitro: { prerender: { routes: ['/'] } },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Cádiz 2012 Mixto · Voley',
      short_name: 'Cádiz 2012',
      description: 'Liga, partidos y marcador del Cádiz 2012 Mixto',
      lang: 'es',
      theme_color: '#061A28',
      background_color: '#061A28',
      display: 'standalone',
      orientation: 'any',
      start_url: '/',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      navigateFallbackDenylist: [/^\/api\//],
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
      runtimeCaching: [
        {
          // Si no hay cobertura, se enseñan los últimos datos descargados
          urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'datos-liga',
            networkTimeoutSeconds: 6,
            expiration: { maxAgeSeconds: 60 * 60 * 24 * 14 },
          },
        },
      ],
    },
    client: { installPrompt: true },
    devOptions: { enabled: false },
  },
})
