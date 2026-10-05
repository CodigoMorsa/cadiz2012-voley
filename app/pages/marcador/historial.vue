<script setup lang="ts">
import { AnimatePresence, motion } from 'motion-v'

useHead({ title: 'Historial · Marcador' })

const { historial, borrarDelHistorial } = useMarcador()
const aBorrar = ref<string | null>(null)

const fecha = (ms: number) =>
  new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(ms))
const hora = (ms: number) => new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(ms))
const setsGanados = (sets: [number, number][], l: 0 | 1) => sets.filter((s) => s[l] > s[l === 0 ? 1 : 0]).length

function borrar(id: string) {
  if (aBorrar.value !== id) {
    aBorrar.value = id
    setTimeout(() => aBorrar.value === id && (aBorrar.value = null), 3000)
    return
  }
  borrarDelHistorial(id)
  aBorrar.value = null
}
</script>

<template>
  <div>
    <NuxtLink to="/marcador" class="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-bruma">
      <Icono nombre="volver" clase="size-4" /> Marcador
    </NuxtLink>
    <Cabecera titulo="Historial" :dato="historial.length ? `${historial.length} partidos` : null" />

    <motion.div
      v-if="!historial.length"
      class="grano relative overflow-hidden rounded-[28px] bg-capa p-6 text-center"
      :initial="{ opacity: 0, y: 16 }"
      :animate="{ opacity: 1, y: 0 }"
    >
      <LineasPista class="text-tono/[0.05]" />
      <p class="relative text-lg font-bold">Aún no hay partidos guardados</p>
      <p class="relative mt-1 text-sm text-bruma">Cuando termines un partido en el marcador, aparecerá aquí.</p>
      <NuxtLink to="/marcador" class="relative mt-5 inline-block rounded-full bg-cadiz px-5 py-2.5 text-sm font-bold text-tinta">Abrir el marcador</NuxtLink>
    </motion.div>

    <ol v-else class="space-y-3">
      <AnimatePresence :initial="false">
        <motion.li
          v-for="(h, i) in historial"
          :key="h.id"
          layout
          class="overflow-hidden rounded-3xl bg-capa"
          :initial="{ opacity: 0, y: 16 }"
          :animate="{ opacity: 1, y: 0, transition: { delay: Math.min(i, 6) * 0.05 } }"
          :exit="{ opacity: 0, x: -80, transition: { duration: 0.25 } }"
        >
          <div class="flex items-center justify-between px-4 pt-3.5 text-xs text-bruma">
            <p><span class="first-letter:uppercase inline-block">{{ fecha(h.fecha) }}</span> · {{ hora(h.fecha) }} · {{ h.minutos }} min</p>
            <span v-if="!h.terminado" class="rounded-full px-2 py-0.5 font-semibold ring-1 ring-raya">Sin terminar</span>
          </div>

          <div class="px-4 py-3">
            <div v-for="l in [0, 1] as const" :key="l" class="flex items-center gap-3 py-1.5">
              <span class="h-7 w-1.5 shrink-0 rounded-full" :style="{ background: h.equipos[l].color }" />
              <p class="min-w-0 flex-1 truncate" :class="h.ganador === l ? 'font-bold' : 'font-medium text-bruma'">{{ h.equipos[l].nombre }}</p>
              <div class="cifras flex gap-1">
                <span
                  v-for="(s, j) in h.sets"
                  :key="j"
                  class="w-7 text-center text-sm"
                  :class="s[l] > s[l === 0 ? 1 : 0] ? 'font-bold text-espuma' : 'text-bruma'"
                >{{ s[l] }}</span>
              </div>
              <span class="cifras w-7 text-right font-marcador text-3xl leading-none font-black" :class="h.ganador === l ? 'text-nuestro' : 'text-bruma'">{{ setsGanados(h.sets, l) }}</span>
            </div>
          </div>

          <button
            class="flex w-full items-center justify-center gap-1.5 border-t border-tono/5 py-2.5 text-xs font-semibold transition-colors"
            :class="aBorrar === h.id ? 'bg-pierde/15 text-pierde' : 'text-bruma'"
            @click="borrar(h.id)"
          >
            <Icono nombre="papelera" clase="size-3.5" />
            {{ aBorrar === h.id ? 'Pulsa otra vez para borrarlo' : 'Borrar' }}
          </button>
        </motion.li>
      </AnimatePresence>
    </ol>
  </div>
</template>
