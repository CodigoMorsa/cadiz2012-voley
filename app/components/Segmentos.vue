<script setup lang="ts">
import { motion } from 'motion-v'
// Selector de dos o más opciones con una pastilla que se desliza
const modelo = defineModel<string>({ required: true })
defineProps<{ opciones: { valor: string; texto: string }[]; id: string }>()
</script>

<template>
  <div class="grid auto-cols-fr grid-flow-col rounded-2xl bg-capa p-1 text-sm font-semibold" role="tablist">
    <button
      v-for="op in opciones"
      :key="op.valor"
      role="tab"
      :aria-selected="modelo === op.valor"
      class="relative rounded-xl py-2.5 transition-colors duration-300"
      :class="modelo === op.valor ? 'text-noche' : 'text-bruma'"
      @click="modelo = op.valor"
    >
      <motion.span
        v-if="modelo === op.valor"
        :layout-id="`seg-${id}`"
        class="absolute inset-0 rounded-xl bg-espuma"
        :transition="{ type: 'spring', stiffness: 500, damping: 38 }"
      />
      <span class="relative">{{ op.texto }}</span>
    </button>
  </div>
</template>
