<script setup lang="ts">
defineProps<{ cargando: boolean; error: any }>()
defineEmits<{ reintentar: [] }>()
</script>

<template>
  <div v-if="cargando" class="space-y-2.5" aria-busy="true" aria-label="Cargando datos de la liga">
    <div class="h-40 animate-pulse rounded-3xl bg-capa" />
    <div v-for="i in 6" :key="i" class="h-12 animate-pulse rounded-xl bg-capa/60" :style="{ animationDelay: `${i * 80}ms` }" />
  </div>
  <div v-else-if="error" class="rounded-3xl bg-capa p-5">
    <p class="font-semibold">No se han podido cargar los datos de la liga</p>
    <p class="mt-1 text-sm text-bruma">{{ error?.data?.statusMessage || error?.statusMessage || 'Comprueba la conexión.' }}</p>
    <button class="mt-4 inline-flex items-center gap-2 rounded-full bg-cadiz px-4 py-2 text-sm font-bold text-tinta" @click="$emit('reintentar')">
      <Icono nombre="recargar" clase="size-4" /> Reintentar
    </button>
  </div>
</template>
