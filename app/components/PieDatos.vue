<script setup lang="ts">
const props = defineProps<{ actualizado?: string; cargando?: boolean }>()
defineEmits<{ recargar: [] }>()

const hace = computed(() => {
  if (!props.actualizado) return ''
  const min = Math.round((Date.now() - new Date(props.actualizado).getTime()) / 60_000)
  if (min < 1) return 'ahora mismo'
  if (min < 60) return `hace ${min} min`
  return `hace ${Math.round(min / 60)} h`
})
</script>

<template>
  <div class="mt-8 flex items-center justify-between gap-3 text-xs text-bruma">
    <p>
      Datos de
      <a href="https://la-comarca-hazel.vercel.app" target="_blank" rel="noopener" class="text-espuma underline decoration-raya underline-offset-4">La Comarca</a>
      <template v-if="hace"> · {{ hace }}</template>
    </p>
    <button
      class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-capa px-3.5 py-2 font-semibold text-espuma active:scale-95 transition-transform"
      :disabled="cargando"
      @click="$emit('recargar')"
    >
      <Icono nombre="recargar" clase="size-3.5" :class="cargando ? 'animate-spin' : ''" /> Actualizar
    </button>
  </div>
</template>
