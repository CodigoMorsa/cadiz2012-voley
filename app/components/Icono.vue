<script setup lang="ts">
// Iconos dibujados a mano (trazo de 2px) para no depender de librerías
defineProps<{ nombre: keyof typeof trazos; clase?: string }>()
</script>

<script lang="ts">
const trazos = {
  liga: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4',
  partidos: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h3M8 17h6',
  marcador: 'M3 5h18v14H3zM12 5v14M7 10v4M17 10l-1.5 4h3',
  deshacer: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  ajustes: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 4v6M8 14v6',
  historial: 'M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5M12 8v4l3 2',
  cambiar: 'M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  pantalla: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  cerrar: 'M6 6l12 12M18 6 6 18',
  volver: 'M15 5l-7 7 7 7',
  reloj: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  persona: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0',
  menos: 'M6 12h12',
  papelera: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
  recargar: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  sol: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  luna: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z',
  movil: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1ZM11 18h2',
  pizarra: 'M4 4h16v12H4zM8 20l4-4 4 4M8 8l2 2M10 8l-2 2M14 12l3-4M15 8h2v2',
  lapiz: 'M4 20l4-1 11-11-3-3L5 16l-1 4ZM14 7l3 3',
  flecha: 'M5 19 19 5M10 5h9v9',
  mano: 'M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a6.5 6.5 0 0 1-12.2 3.1L4.6 14a1.5 1.5 0 0 1 2.4-1.8L9 14',
  equipo: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a6 6 0 0 1 12 0M16 4.5a3 3 0 0 1 0 6M18 14.5a5.5 5.5 0 0 1 3 5.5',
  descargar: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  reiniciar: 'M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5',
  borrar: 'M20 20H9L4 15l9-10 7 7-6 7M9 9l7 7',
  rotar: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5',
  pelota: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 3c-2 4-2 8 0 9s6 1 8.5 3.5M12 12c-4 0-7.5 1.5-8.6 4.5M12 12c2-3.5 1.5-7 .5-9',
} as const
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="clase ?? 'size-6'"
    aria-hidden="true"
  >
    <path :d="trazos[nombre]" />
  </svg>
</template>
