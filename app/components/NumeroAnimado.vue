<script setup lang="ts">
import { animate } from 'motion-v'

// Número que "cuenta" desde 0 (o desde su valor anterior) hasta el nuevo
const props = withDefaults(defineProps<{ valor: number; signo?: boolean; duracion?: number }>(), { duracion: 0.9 })
const mostrado = ref(0)
let control: { stop: () => void } | undefined

watch(
  () => props.valor,
  (nuevo) => {
    control?.stop()
    control = animate(mostrado.value, nuevo, {
      duration: props.duracion,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (mostrado.value = Math.round(v)),
    })
  },
  { immediate: true },
)
onBeforeUnmount(() => control?.stop())
</script>

<template>
  <span class="cifras">{{ signo && mostrado > 0 ? '+' : '' }}{{ mostrado }}</span>
</template>
