<script setup lang="ts">
import { AnimatePresence, motion } from 'motion-v'
import type { MiJornada } from '~/composables/useLiga'

useHead({ title: 'Partidos · Cádiz 2012 Mixto' })

const { public: { miEquipo } } = useRuntimeConfig()
const { data, status, error, refresh } = useCalendario()
const { proximas, jugadas, siguiente, ganamos } = useMisPartidos(data)
const cargando = computed(() => status.value === 'pending' && !data.value)

const vista = ref('nuestros')
const suave = [0.16, 1, 0.3, 1] as const

// ---- Jornada completa
const jornadas = computed(() => data.value?.jornadas ?? [])
const indiceElegido = ref<number | null>(null)
const indiceInicial = computed(() => {
  const n = proximas.value[0]?.jornada.numero
  const i = jornadas.value.findIndex((j) => j.numero === n)
  return i >= 0 ? i : Math.max(jornadas.value.length - 1, 0)
})
const indice = computed(() => indiceElegido.value ?? indiceInicial.value)
const jornadaVista = computed(() => jornadas.value[indice.value])
const sentido = ref(1)
function mover(paso: number) {
  const nuevo = Math.min(Math.max(indice.value + paso, 0), jornadas.value.length - 1)
  if (nuevo === indice.value) return
  sentido.value = paso
  indiceElegido.value = nuevo
}

// Deslizar con el dedo para cambiar de jornada
const zona = ref<HTMLElement>()
const { direction, isSwiping } = useSwipe(zona, { threshold: 40 })
watch(isSwiping, (s) => {
  if (!s && direction.value === 'left') mover(1)
  if (!s && direction.value === 'right') mover(-1)
})

const esNuestro = (n: string) => mismoEquipo(n, miEquipo)
const resultadoNuestro = (j: MiJornada) => {
  const r = j.partido!.resultado!
  return j.enCasa ? [r.local, r.visitante] : [r.visitante, r.local]
}
const otras = computed(() => proximas.value.filter((x) => x !== siguiente.value))
</script>

<template>
  <div>
    <Cabecera titulo="Partidos" />

    <Segmentos
      v-model="vista"
      id="partidos"
      class="mb-6"
      :opciones="[{ valor: 'nuestros', texto: 'Nuestros partidos' }, { valor: 'jornada', texto: 'Jornada completa' }]"
    />

    <EstadoDatos :cargando="cargando" :error="!data && error" @reintentar="refresh()" />

    <AnimatePresence mode="wait">
      <!-- ================= NUESTROS PARTIDOS ================= -->
      <motion.div
        v-if="data && vista === 'nuestros'"
        key="nuestros"
        :initial="{ opacity: 0, y: 10 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -6 }"
        :transition="{ duration: 0.3, ease: suave }"
      >
        <!-- Próximo partido -->
        <motion.section
          v-if="siguiente"
          class="grano relative mb-9 overflow-hidden rounded-[28px] bg-capa px-5 pb-5 pt-4"
          aria-label="Próximo partido"
          :initial="{ opacity: 0, scale: 0.96 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ duration: 0.6, ease: suave }"
        >
          <LineasPista class="text-tono/[0.06]" />

          <div class="relative flex items-center justify-between text-xs">
            <p class="font-semibold text-bruma">Jornada {{ siguiente.jornada.numero }}<template v-if="siguiente.jornada.fase"> · {{ siguiente.jornada.fase }}</template></p>
            <span class="rounded-full px-2.5 py-1 font-bold" :class="siguiente.enCasa ? 'bg-cadiz text-tinta' : 'bg-tono/10'">
              {{ siguiente.enCasa ? 'En casa' : 'Fuera' }}
            </span>
          </div>

          <!-- Enfrentamiento -->
          <div class="relative mt-5 grid grid-cols-[1fr_auto_1fr] items-start gap-2 text-center">
            <motion.div
              v-for="(eq, lado) in [siguiente.partido!.local, siguiente.partido!.visitante]"
              :key="eq"
              class="flex flex-col items-center gap-2"
              :class="lado === 1 ? 'col-start-3 row-start-1' : ''"
              :initial="{ opacity: 0, x: lado === 0 ? -30 : 30 }"
              :animate="{ opacity: 1, x: 0 }"
              :transition="{ type: 'spring', stiffness: 260, damping: 22, delay: 0.15 }"
            >
              <Escudo :nombre="eq" :tam="62" :nuestro="esNuestro(eq)" />
              <p class="text-sm font-bold leading-tight" :class="esNuestro(eq) ? 'text-nuestro' : ''">{{ eq }}</p>
            </motion.div>
            <motion.p
              class="col-start-2 row-start-1 self-center pb-6 font-marcador text-2xl font-black text-bruma"
              :initial="{ opacity: 0, scale: 0.4 }"
              :animate="{ opacity: 1, scale: 1 }"
              :transition="{ type: 'spring', stiffness: 400, damping: 14, delay: 0.35 }"
            >
              vs
            </motion.p>
          </div>

          <!-- Cuándo -->
          <div class="relative mt-5 flex items-center gap-4 rounded-2xl bg-noche/50 p-3">
            <template v-if="siguiente.partido?.fecha">
              <div class="grid w-14 place-items-center rounded-xl bg-espuma py-1.5 text-noche">
                <span class="text-[10px] font-bold uppercase">{{ fechaPartes(siguiente.partido.fecha).semana }}</span>
                <span class="font-marcador text-3xl leading-none font-black">{{ fechaPartes(siguiente.partido.fecha).dia }}</span>
                <span class="text-[10px] font-semibold">{{ fechaPartes(siguiente.partido.fecha).mes }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-semibold first-letter:uppercase">{{ fechaLarga(siguiente.partido.fecha) }}</p>
                <p class="text-sm text-bruma">{{ siguiente.partido.hora ? `A las ${siguiente.partido.hora}` : 'Hora por confirmar' }}</p>
              </div>
              <div v-if="diasHasta(siguiente.partido.fecha) >= 0" class="pr-1 text-right text-nuestro">
                <p class="font-marcador text-4xl leading-none font-black">
                  <template v-if="diasHasta(siguiente.partido.fecha) === 0">Hoy</template>
                  <NumeroAnimado v-else :valor="diasHasta(siguiente.partido.fecha)" />
                </p>
                <p v-if="diasHasta(siguiente.partido.fecha) > 0" class="text-[11px] font-semibold">{{ diasHasta(siguiente.partido.fecha) === 1 ? 'día' : 'días' }}</p>
              </div>
            </template>
            <div v-else class="px-1 py-1">
              <p class="font-semibold">Fecha por confirmar</p>
              <p class="text-sm text-bruma">
                Fin de semana del {{ siguiente.jornada.fechas ?? '—' }}.
                {{ siguiente.enCasa ? 'Nos toca poner día y hora.' : `Pone día y hora ${siguiente.rival}.` }}
              </p>
            </div>
          </div>
        </motion.section>
        <p v-else class="mb-8 rounded-3xl bg-capa p-5 text-bruma">No quedan partidos por jugar esta temporada.</p>

        <!-- Siguientes: línea de tiempo -->
        <h2 class="mb-4 text-lg font-bold">Lo que viene</h2>
        <ol class="relative">
          <span class="absolute bottom-6 left-[1.65rem] top-6 w-px bg-raya" aria-hidden="true" />
          <motion.li
            v-for="(j, i) in otras"
            :key="j.jornada.numero"
            class="relative flex items-center gap-4 py-2"
            :initial="{ opacity: 0, y: 14 }"
            :while-in-view="{ opacity: 1, y: 0 }"
            :in-view-options="{ once: true, amount: 0.4 }"
            :transition="{ duration: 0.45, ease: suave, delay: Math.min(i, 4) * 0.05 }"
          >
            <div class="relative z-10 grid w-[3.3rem] shrink-0 place-items-center rounded-xl bg-hondo py-1.5 ring-1 ring-raya">
              <template v-if="j.dia">
                <span class="font-marcador text-2xl leading-none font-black">{{ fechaPartes(j.dia).dia }}</span>
                <span class="text-[10px] font-semibold text-bruma">{{ fechaPartes(j.dia).mes }}</span>
              </template>
              <span v-else class="font-marcador text-xl font-black">J{{ j.jornada.numero }}</span>
            </div>
            <div class="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-1 py-1">
              <template v-if="j.partido">
                <Escudo :nombre="j.rival!" :tam="30" />
                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold">{{ j.rival }}</p>
                  <p class="text-xs text-bruma">
                    Jornada {{ j.jornada.numero }} ·
                    <template v-if="j.partido.fecha">{{ fechaCorta(j.partido.fecha) }}<template v-if="j.partido.hora">, {{ j.partido.hora }}</template></template>
                    <template v-else>sin fecha</template>
                  </p>
                </div>
                <span class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold" :class="j.enCasa ? 'bg-cadiz/15 text-nuestro' : 'text-bruma ring-1 ring-raya'">
                  {{ j.enCasa ? 'Casa' : 'Fuera' }}
                </span>
              </template>
              <template v-else>
                <span class="grid size-[30px] place-items-center rounded-full border border-dashed border-raya text-bruma">
                  <Icono nombre="pelota" clase="size-4" />
                </span>
                <p class="flex-1 text-bruma">Descansamos <span class="text-xs">· jornada {{ j.jornada.numero }}</span></p>
              </template>
            </div>
          </motion.li>
          <li v-if="!otras.length" class="py-2 pl-[4.3rem] text-sm text-bruma">No hay más jornadas.</li>
        </ol>

        <!-- Jugados -->
        <template v-if="jugadas.length">
          <h2 class="mb-3 mt-9 text-lg font-bold">Ya jugados</h2>
          <ol class="space-y-2">
            <li v-for="j in jugadas" :key="j.jornada.numero" class="flex items-center gap-3 rounded-2xl bg-capa/60 p-3">
              <Escudo :nombre="j.rival!" :tam="30" />
              <div class="min-w-0 flex-1">
                <p class="truncate font-semibold">{{ j.rival }}</p>
                <p class="text-xs text-bruma">Jornada {{ j.jornada.numero }} · {{ j.enCasa ? 'en casa' : 'fuera' }}</p>
              </div>
              <div
                v-if="j.partido?.resultado"
                class="flex items-center gap-2 rounded-xl px-3 py-1.5"
                :class="ganamos(j) ? 'bg-gana/15 text-gana' : 'bg-pierde/15 text-pierde'"
              >
                <span class="text-xs font-bold">{{ ganamos(j) ? 'Victoria' : 'Derrota' }}</span>
                <span class="cifras font-marcador text-xl font-black">{{ resultadoNuestro(j).join('-') }}</span>
              </div>
              <span v-else class="text-xs text-bruma">Sin resultado</span>
            </li>
          </ol>
        </template>
      </motion.div>

      <!-- ================= JORNADA COMPLETA ================= -->
      <motion.div
        v-else-if="data && vista === 'jornada' && jornadaVista"
        key="jornada"
        :initial="{ opacity: 0, y: 10 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -6 }"
        :transition="{ duration: 0.3, ease: suave }"
      >
        <div class="mb-5 flex items-center justify-between">
          <button class="grid size-11 place-items-center rounded-full bg-capa active:scale-90 transition-transform disabled:opacity-25" :disabled="indice === 0" aria-label="Jornada anterior" @click="mover(-1)">
            <Icono nombre="volver" clase="size-5" />
          </button>
          <div class="overflow-hidden text-center">
            <AnimatePresence mode="popLayout" :initial="false" :custom="sentido">
              <motion.div
                :key="jornadaVista.numero"
                :initial="{ y: sentido * 24, opacity: 0 }"
                :animate="{ y: 0, opacity: 1 }"
                :exit="{ y: sentido * -24, opacity: 0 }"
                :transition="{ duration: 0.3, ease: suave }"
              >
                <p class="font-marcador text-4xl leading-none font-black">Jornada {{ jornadaVista.numero }}</p>
                <p class="mt-1 text-xs text-bruma">{{ jornadaVista.fechas }}<template v-if="jornadaVista.fase"> · {{ jornadaVista.fase }}</template></p>
              </motion.div>
            </AnimatePresence>
          </div>
          <button class="grid size-11 place-items-center rounded-full bg-capa active:scale-90 transition-transform disabled:opacity-25" :disabled="indice === jornadas.length - 1" aria-label="Jornada siguiente" @click="mover(1)">
            <Icono nombre="volver" clase="size-5 rotate-180" />
          </button>
        </div>

        <div ref="zona" class="touch-pan-y overflow-hidden">
          <AnimatePresence mode="popLayout" :initial="false">
            <motion.ul
              :key="jornadaVista.numero"
              class="space-y-2"
              :initial="{ x: sentido * 60, opacity: 0 }"
              :animate="{ x: 0, opacity: 1 }"
              :exit="{ x: sentido * -60, opacity: 0 }"
              :transition="{ type: 'spring', stiffness: 320, damping: 32 }"
            >
              <li
                v-for="p in jornadaVista.partidos"
                :key="p.id"
                class="flex items-center gap-3 rounded-2xl py-2.5 pl-3 pr-4"
                :class="esNuestro(p.local) || esNuestro(p.visitante) ? 'bg-cadiz/10 ring-1 ring-cadiz/30' : 'bg-capa/60'"
              >
                <div class="min-w-0 flex-1 space-y-1.5">
                  <div v-for="(eq, k) in [p.local, p.visitante]" :key="k" class="flex items-center gap-2.5">
                    <Escudo :nombre="eq" :tam="22" :nuestro="esNuestro(eq)" />
                    <p
                      class="min-w-0 flex-1 truncate text-sm"
                      :class="[esNuestro(eq) ? 'text-nuestro' : '', p.resultado && (k === 0 ? p.resultado.local > p.resultado.visitante : p.resultado.visitante > p.resultado.local) ? 'font-bold' : 'font-medium']"
                    >
                      {{ eq }}
                    </p>
                    <span v-if="p.resultado" class="cifras font-marcador text-xl leading-none font-black">{{ k === 0 ? p.resultado.local : p.resultado.visitante }}</span>
                  </div>
                </div>
                <div v-if="!p.resultado" class="w-16 shrink-0 border-l border-tono/8 pl-3 text-center">
                  <template v-if="p.fecha">
                    <p class="font-marcador text-xl leading-none font-extrabold">{{ p.hora ?? '—' }}</p>
                    <p class="mt-1 text-[10px] text-bruma">{{ fechaCorta(p.fecha) }}</p>
                  </template>
                  <p v-else class="text-[11px] leading-tight text-bruma">Sin<br>fecha</p>
                </div>
              </li>
              <li v-if="jornadaVista.descansa" class="flex items-center justify-center gap-2 py-2 text-sm text-bruma">
                <Escudo :nombre="jornadaVista.descansa" :tam="18" :nuestro="esNuestro(jornadaVista.descansa)" />
                Descansa {{ jornadaVista.descansa }}
              </li>
            </motion.ul>
          </AnimatePresence>
        </div>
        <p class="mt-4 text-center text-xs text-bruma">Desliza para cambiar de jornada · el de arriba juega en casa</p>
      </motion.div>
    </AnimatePresence>

    <PieDatos v-if="data" :actualizado="data.actualizado" :cargando="status === 'pending'" @recargar="refresh()" />
  </div>
</template>
