<script setup lang="ts">
import { motion } from 'motion-v'
// Título grande de cada sección, con un dato pequeño y el botón de tema
defineProps<{ titulo: string; dato?: string | null }>()
</script>

<template>
  <header class="mb-6 flex items-end justify-between gap-4">
    <div class="min-w-0">
      <p v-if="dato" class="mb-1.5 text-sm text-bruma">{{ dato }}</p>
      <motion.h1
        class="font-marcador text-[3.25rem] leading-[0.85] font-black tracking-tight"
        :initial="{ opacity: 0, y: 12 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }"
      >
        {{ titulo }}
      </motion.h1>
    </div>
    <BotonTema class="mb-1" />
  </header>
</template>
