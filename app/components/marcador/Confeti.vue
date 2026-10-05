<script setup lang="ts">
import { motion } from 'motion-v'
// Lluvia de confeti con los colores de los dos equipos
const props = defineProps<{ colores: string[] }>()
const piezas = Array.from({ length: 42 }, (_, i) => ({
  i,
  x: Math.random() * 100,
  deriva: (Math.random() - 0.5) * 140,
  giro: (Math.random() - 0.5) * 900,
  retraso: Math.random() * 0.5,
  duracion: 1.8 + Math.random() * 1.4,
  ancho: 6 + Math.random() * 6,
  alto: 10 + Math.random() * 10,
  color: props.colores[i % props.colores.length],
}))
</script>

<template>
  <div class="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
    <motion.span
      v-for="p in piezas"
      :key="p.i"
      class="absolute -top-6 rounded-[2px]"
      :style="{ left: `${p.x}%`, width: `${p.ancho}px`, height: `${p.alto}px`, background: p.color, boxShadow: '0 0 0 1px rgb(0 0 0 / .08)' }"
      :initial="{ y: 0, x: 0, rotate: 0, opacity: 1 }"
      :animate="{ y: '110vh', x: p.deriva, rotate: p.giro, opacity: [1, 1, 0.8] }"
      :transition="{ duration: p.duracion, delay: p.retraso, ease: [0.25, 0.4, 0.6, 1] }"
    />
  </div>
</template>
