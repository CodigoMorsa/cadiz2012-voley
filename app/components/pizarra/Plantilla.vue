<script setup lang="ts">
import { AnimatePresence, motion } from 'motion-v'
import type { Rol } from '~/utils/pizarra'

defineEmits<{ cerrar: [] }>()
const { plantilla, sistema, alineacion, guardarAlineacion, anadirJugador, quitarJugador, jugador } = usePizarra()

const vista = ref('alineacion')
const ROLES_PLANTILLA: Rol[] = ['C', 'O', 'CE', 'R', 'L']

// Ordenados por dorsal, para elegir más rápido
const ordenados = computed(() => [...plantilla.value].sort((a, b) => a.dorsal - b.dorsal))

function asignar(hueco: string, id: string) {
  const a = alineacion.value
  const huecos = { ...a.huecos }
  let libero = a.libero
  // Si ese jugador ya estaba en otro puesto, se intercambian
  const anterior = hueco === 'libero' ? a.libero : huecos[hueco]
  for (const [h, j] of Object.entries(huecos)) if (j === id && h !== hueco) huecos[h] = anterior ?? null
  if (libero === id && hueco !== 'libero') libero = anterior ?? null
  if (hueco === 'libero') libero = id || null
  else huecos[hueco] = id || null
  guardarAlineacion({ huecos, libero })
}

const repetidos = computed(() => {
  const ids = [...Object.values(alineacion.value.huecos), alineacion.value.libero].filter(Boolean)
  return ids.length !== new Set(ids).size
})
</script>

<template>
  <HojaInferior titulo="Equipo" @cerrar="$emit('cerrar')">
    <Segmentos
      v-model="vista"
      id="plantilla"
      class="mb-5"
      :opciones="[{ valor: 'alineacion', texto: `Alineación ${sistema.nombre}` }, { valor: 'plantilla', texto: 'Plantilla' }]"
    />

    <!-- Alineación -->
    <div v-if="vista === 'alineacion'" class="space-y-2">
      <p class="mb-3 text-sm text-bruma">{{ sistema.resumen }}</p>
      <div v-for="(h, i) in sistema.huecos" :key="h.id" class="flex items-center gap-3 rounded-2xl bg-capa p-3">
        <span class="grid size-10 shrink-0 place-items-center rounded-full font-marcador text-lg font-black text-tinta" :style="{ background: ROLES[h.rol].color }">
          {{ jugador(alineacion.huecos[h.id])?.dorsal ?? '?' }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold">{{ h.etiqueta }}</p>
          <p class="text-xs text-bruma">Empieza en zona {{ i + 1 }}</p>
        </div>
        <select
          class="max-w-[9.5rem] rounded-xl bg-hondo px-2.5 py-2 text-sm font-semibold ring-1 ring-raya outline-none"
          :value="alineacion.huecos[h.id] ?? ''"
          :aria-label="`Jugador para ${h.etiqueta}`"
          @change="asignar(h.id, ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Sin asignar</option>
          <option v-for="j in ordenados" :key="j.id" :value="j.id">#{{ j.dorsal }} {{ j.nombre || ROLES[j.rol].nombre }}</option>
        </select>
      </div>

      <div v-if="sistema.usaLibero" class="flex items-center gap-3 rounded-2xl bg-capa p-3">
        <span class="grid size-10 shrink-0 place-items-center rounded-full font-marcador text-lg font-black text-tinta" :style="{ background: ROLES.L.color }">
          {{ jugador(alineacion.libero)?.dorsal ?? '–' }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold">Líbero</p>
          <p class="text-xs text-bruma">Entra por el central de zaguera</p>
        </div>
        <select
          class="max-w-[9.5rem] rounded-xl bg-hondo px-2.5 py-2 text-sm font-semibold ring-1 ring-raya outline-none"
          :value="alineacion.libero ?? ''"
          aria-label="Líbero"
          @change="asignar('libero', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Sin líbero</option>
          <option v-for="j in ordenados" :key="j.id" :value="j.id">#{{ j.dorsal }} {{ j.nombre || ROLES[j.rol].nombre }}</option>
        </select>
      </div>
      <p v-if="repetidos" class="rounded-xl bg-pierde/15 px-3 py-2 text-sm font-semibold text-pierde">Hay un jugador en dos puestos a la vez.</p>
      <p class="pt-2 text-xs text-bruma">El orden de los puestos es el orden de rotación. Si eliges a alguien que ya estaba en otro puesto, se intercambian.</p>
    </div>

    <!-- Plantilla -->
    <div v-else>
      <ol class="space-y-2">
        <AnimatePresence :initial="false">
          <motion.li
            v-for="j in plantilla"
            :key="j.id"
            layout
            class="flex items-center gap-2 rounded-2xl bg-capa p-2.5"
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, x: -60 }"
          >
            <input
              v-model.number="j.dorsal"
              type="number"
              inputmode="numeric"
              min="0"
              max="99"
              class="h-11 w-12 shrink-0 rounded-full text-center font-marcador text-xl font-black text-tinta outline-none"
              :style="{ background: ROLES[j.rol].color }"
              aria-label="Dorsal"
            >
            <input v-model.trim="j.nombre" maxlength="16" placeholder="Nombre" class="min-w-0 flex-1 bg-transparent px-1 font-semibold outline-none placeholder:text-bruma" aria-label="Nombre">
            <select v-model="j.rol" class="rounded-xl bg-hondo px-2 py-2 text-sm font-semibold ring-1 ring-raya outline-none" aria-label="Posición">
              <option v-for="r in ROLES_PLANTILLA" :key="r" :value="r">{{ ROLES[r].nombre }}</option>
            </select>
            <button class="grid size-9 shrink-0 place-items-center rounded-full text-bruma active:text-pierde" :aria-label="`Quitar a #${j.dorsal}`" @click="quitarJugador(j.id)">
              <Icono nombre="papelera" clase="size-4" />
            </button>
          </motion.li>
        </AnimatePresence>
      </ol>
      <button class="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-raya py-3.5 font-semibold text-bruma active:scale-[0.98] transition-transform" @click="anadirJugador">
        + Añadir jugador
      </button>
    </div>
  </HojaInferior>
</template>
