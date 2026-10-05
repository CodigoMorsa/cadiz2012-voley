<script setup lang="ts">
import { motion } from 'motion-v'
// Interruptor tipo iOS
const activo = defineModel<boolean>({ required: true })
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="activo"
    class="relative flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300"
    :class="activo ? 'justify-end bg-gana' : 'justify-start bg-raya'"
    @click.prevent="activo = !activo"
  >
    <motion.span layout class="size-6 rounded-full bg-white shadow" :transition="{ type: 'spring', stiffness: 600, damping: 35 }" />
  </button>
</template>
