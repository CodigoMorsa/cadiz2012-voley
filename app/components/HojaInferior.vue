<script setup lang="ts">
import { motion, useDragControls } from 'motion-v'
// Panel que sube desde abajo; se cierra arrastrándolo hacia abajo
defineProps<{ titulo: string }>()
const emit = defineEmits<{ cerrar: [] }>()
const controles = useDragControls()
function soltar(_: unknown, info: { offset: { y: number }; velocity: { y: number } }) {
  if (info.offset.y > 120 || info.velocity.y > 600) emit('cerrar')
}
</script>

<template>
  <motion.div
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
    :initial="{ opacity: 0 }"
    :animate="{ opacity: 1 }"
    :exit="{ opacity: 0 }"
    @click="emit('cerrar')"
  />
  <motion.div
    class="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-[30px] bg-hondo text-espuma ring-1 ring-tono/8"
    role="dialog"
    aria-modal="true"
    :aria-label="titulo"
    :initial="{ y: '100%' }"
    :animate="{ y: 0 }"
    :exit="{ y: '100%' }"
    :transition="{ type: 'spring', stiffness: 380, damping: 38 }"
    drag="y"
    :drag-constraints="{ top: 0, bottom: 0 }"
    :drag-elastic="{ top: 0, bottom: 0.6 }"
    :drag-listener="false"
    :drag-controls="controles"
    @drag-end="soltar"
  >
    <div class="shrink-0 cursor-grab touch-none px-5 pb-2 pt-3" @pointerdown="controles.start($event)">
      <span class="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-raya" />
      <div class="flex items-center justify-between">
        <h2 class="font-marcador text-4xl leading-none font-black">{{ titulo }}</h2>
        <button class="grid size-10 place-items-center rounded-full bg-capa" aria-label="Cerrar" @pointerdown.stop @click="emit('cerrar')">
          <Icono nombre="cerrar" clase="size-5" />
        </button>
      </div>
    </div>
    <div class="overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3">
      <slot />
    </div>
  </motion.div>
</template>
