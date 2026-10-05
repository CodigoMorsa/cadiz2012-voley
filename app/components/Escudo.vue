<script setup lang="ts">
// Escudo genérico con las siglas del equipo (la liga no publica escudos)
const props = withDefaults(defineProps<{ nombre: string; tam?: number; nuestro?: boolean; oscuro?: boolean }>(), { tam: 36 })
const fondo = computed(() => (props.oscuro ? '#061A28' : props.nuestro ? '#FFC93C' : colorEquipo(props.nombre)))
const tinta = computed(() => (props.oscuro ? '#FFC93C' : props.nuestro ? '#061A28' : '#FFFFFF'))
const texto = computed(() => siglas(props.nombre))
</script>

<template>
  <svg :width="tam" :height="tam * 1.12" viewBox="0 0 40 45" class="shrink-0" role="img" :aria-label="`Escudo de ${nombre}`">
    <path d="M20 1.5 37.5 7v15.5c0 10.5-7.4 17.8-17.5 21-10.1-3.2-17.5-10.5-17.5-21V7L20 1.5Z" :fill="fondo" />
    <path d="M20 1.5 37.5 7v15.5c0 10.5-7.4 17.8-17.5 21Z" fill="#000" opacity=".14" />
    <text
      x="20"
      y="26"
      text-anchor="middle"
      :fill="tinta"
      font-family="Big Shoulders Display, sans-serif"
      font-weight="900"
      :font-size="texto.length > 2 ? 14 : 17"
      letter-spacing=".3"
    >{{ texto }}</text>
  </svg>
</template>
