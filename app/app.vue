<script setup lang="ts">
const { actual } = useTema()
// Color de la barra del sistema del móvil según el tema
useHead({ meta: [{ name: 'theme-color', content: () => (actual.value === 'light' ? '#EDF1F5' : '#061A28') }] })
</script>

<template>
  <NuxtPwaManifest />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
