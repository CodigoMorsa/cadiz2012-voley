<script setup lang="ts">
import { motion } from 'motion-v'

const route = useRoute()
const pestanas = [
  { to: '/', texto: 'Liga', icono: 'liga' },
  { to: '/partidos', texto: 'Partidos', icono: 'partidos' },
  { to: '/pizarra', texto: 'Pizarra', icono: 'pizarra' },
  { to: '/marcador', texto: 'Marcador', icono: 'marcador' },
] as const
const activa = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))

function vibrar() {
  if ('vibrate' in navigator) navigator.vibrate(8)
}
</script>

<template>
  <div class="relative min-h-dvh overflow-x-hidden pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
    <!-- Luz de pabellón: un foco suave arriba, nada de degradados de colores -->
    <div
      class="pointer-events-none fixed inset-x-0 top-0 h-80 opacity-60"
      style="background: radial-gradient(60% 100% at 50% 0%, var(--brillo) 0%, transparent 70%)"
      aria-hidden="true"
    />

    <main
      class="relative mx-auto px-5 pt-[calc(1.25rem+env(safe-area-inset-top))]"
      :class="route.path.startsWith('/pizarra') ? 'max-w-xl min-[900px]:max-w-5xl' : 'max-w-xl'"
    >
      <slot />
    </main>

    <nav
      class="fixed inset-x-0 bottom-0 z-20 px-5 pb-[calc(0.9rem+env(safe-area-inset-bottom))]"
      aria-label="Secciones"
    >
      <ul class="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-[22px] border border-tono/8 bg-capa/80 p-1.5 shadow-[0_18px_40px_-14px_rgb(0_0_0/0.45)] backdrop-blur-xl">
        <li v-for="p in pestanas" :key="p.to" class="relative">
          <NuxtLink
            :to="p.to"
            class="relative z-10 flex h-[3.4rem] flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-semibold transition-colors duration-300"
            :class="activa(p.to) ? 'text-tinta' : 'text-bruma active:text-espuma'"
            :aria-current="activa(p.to) ? 'page' : undefined"
            @click="vibrar"
          >
            <Icono :nombre="p.icono" clase="size-5" />
            <span>{{ p.texto }}</span>
          </NuxtLink>
          <motion.div
            v-if="activa(p.to)"
            layout-id="pestana-activa"
            class="absolute inset-0 rounded-2xl bg-cadiz"
            :transition="{ type: 'spring', stiffness: 520, damping: 38 }"
          />
        </li>
      </ul>
    </nav>
  </div>
</template>
