<script setup lang="ts">
import { AnimatePresence, motion } from 'motion-v'
import type { EquipoMarcador, Lado, Reglas } from '~/composables/useMarcador'

definePageMeta({ layout: false })
useHead({ title: 'Marcador', bodyAttrs: { class: 'overflow-hidden' } })

const m = useMarcador()
const { partida, aviso, numeroSet, esDecisivo, setsGanados, bola, puedeDeshacer, setGanado, sentidoPuntos } = m

const orden = computed<Lado[]>(() => (partida.value.invertido ? [1, 0] : [0, 1]))
const tinta = (l: Lado) => colorTextoSobre(partida.value.equipos[l].color)
const velo = (l: Lado) => (tinta(l) === '#FFFFFF' ? 'rgb(255 255 255 / 0.16)' : 'rgb(6 26 40 / 0.12)')
const horizontal = useMediaQuery('(orientation: landscape)')
const muelle = { type: 'spring', stiffness: 420, damping: 30 } as const

// ---- Pantalla siempre encendida y pantalla completa
const wakeLock = reactive(useWakeLock())
onMounted(() => wakeLock.isSupported && wakeLock.request('screen').catch(() => {}))
onBeforeUnmount(() => wakeLock.isActive && wakeLock.release())
const { isSupported: hayPantallaCompleta, isFullscreen, toggle: pantallaCompleta } = useFullscreen()

// ---- Onda al tocar
const ondas = ref<{ id: number; x: number; y: number; lado: Lado }[]>([])
function onda(e: PointerEvent, lado: Lado) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const id = performance.now()
  ondas.value.push({ id, x: e.clientX - r.left, y: e.clientY - r.top, lado })
  setTimeout(() => (ondas.value = ondas.value.filter((o) => o.id !== id)), 650)
}

// ---- Celebración de set
watch(setGanado, (s) => {
  if (!s) return
  m.vibrar([30, 60, 30])
  setTimeout(() => {
    if (setGanado.value?.id === s.id) setGanado.value = null
  }, 1900)
})
const origenCelebracion = computed(() => {
  if (!setGanado.value) return '50% 50%'
  const pos = orden.value.indexOf(setGanado.value.lado)
  return horizontal.value ? `${pos === 0 ? 25 : 75}% 50%` : `50% ${pos === 0 ? 25 : 75}%`
})

// ---- Tiempo muerto con cuenta atrás
const tiempo = ref<{ lado: Lado; fin: number; total: number } | null>(null)
const ahora = useNow()
const restante = computed(() => (tiempo.value ? Math.max(0, (tiempo.value.fin - ahora.value.getTime()) / 1000) : 0))
watch(restante, (s, antes) => {
  if (tiempo.value && s === 0 && antes > 0) {
    m.vibrar([250, 120, 250])
    tiempo.value = null
  }
})
function pedirTiempo(l: Lado) {
  const total = partida.value.reglas.segundosTiempo
  if (m.tiempoMuerto(l)) tiempo.value = { lado: l, fin: Date.now() + total * 1000, total }
  else m.avisar(`${partida.value.equipos[l].nombre} ya ha gastado sus tiempos este set`)
}
const RADIO = 46
const vuelta = 2 * Math.PI * RADIO

// ---- Ajustes
const verAjustes = ref(false)
function guardarAjustes(equipos: [EquipoMarcador, EquipoMarcador], reglas: Reglas) {
  m.aplicarAjustes(equipos, reglas)
  verAjustes.value = false
}
function nuevo(equipos: [EquipoMarcador, EquipoMarcador], reglas: Reglas) {
  m.nuevaPartida(equipos, reglas)
  verAjustes.value = false
}
function terminar() {
  m.terminarPartida()
  verAjustes.value = false
  m.avisar('Partido guardado en el historial')
}
</script>

<template>
  <div class="tablero select-none bg-noche text-espuma">
    <!-- ============ Mitades ============ -->
    <section
      v-for="(l, pos) in orden"
      :key="l"
      class="mitad relative overflow-hidden transition-colors duration-500"
      :class="pos === 0 ? 'mitad-a' : 'mitad-b'"
      :style="{ background: partida.equipos[l].color, color: tinta(l) }"
    >
      <button
        class="absolute inset-0"
        :aria-label="`Punto para ${partida.equipos[l].nombre}. Lleva ${partida.puntos[l]}`"
        @pointerdown="onda($event, l)"
        @click="m.punto(l)"
      />
      <span
        v-for="o in ondas.filter((x) => x.lado === l)"
        :key="o.id"
        class="onda pointer-events-none absolute size-24 rounded-full"
        :style="{ left: `${o.x - 48}px`, top: `${o.y - 48}px`, background: tinta(l) }"
      />

      <div class="relleno pointer-events-none relative flex h-full flex-col items-center justify-between">
        <!-- Nombre, saque y sets -->
        <div class="flex w-full flex-col items-center gap-2 text-center">
          <div class="flex max-w-full items-center gap-2">
            <span class="grid size-6 place-items-center">
              <motion.span v-if="partida.saque === l" layout-id="saque" :transition="muelle" class="block">
                <Icono nombre="pelota" clase="size-5" />
              </motion.span>
            </span>
            <p class="truncate text-xl font-extrabold tracking-tight sm:text-2xl">{{ partida.equipos[l].nombre }}</p>
            <span class="size-6" />
          </div>
          <div class="flex gap-1.5" :aria-label="`${setsGanados[l]} sets ganados`">
            <span v-for="s in partida.reglas.setsParaGanar" :key="s" class="relative h-1.5 w-7 overflow-hidden rounded-full" :style="{ background: velo(l) }">
              <motion.span
                class="absolute inset-0 rounded-full bg-current"
                :initial="false"
                :animate="{ scaleX: s <= setsGanados[l] ? 1 : 0 }"
                :transition="{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }"
                style="transform-origin: left"
              />
            </span>
          </div>
        </div>

        <!-- Puntos con efecto rodillo -->
        <div class="relative grid place-items-center overflow-hidden px-4" aria-live="polite">
          <AnimatePresence mode="popLayout" :initial="false">
            <motion.span
              :key="partida.puntos[l]"
              class="puntos cifras col-start-1 row-start-1 block font-marcador font-black leading-[0.8]"
              :initial="{ y: `${sentidoPuntos[l] * 55}%`, opacity: 0, filter: 'blur(6px)' }"
              :animate="{ y: '0%', opacity: 1, filter: 'blur(0px)' }"
              :exit="{ y: `${sentidoPuntos[l] * -55}%`, opacity: 0, filter: 'blur(6px)' }"
              :transition="{ type: 'spring', stiffness: 520, damping: 34, mass: 0.7 }"
            >
              {{ partida.puntos[l] }}
            </motion.span>
          </AnimatePresence>
        </div>

        <!-- Punto de set + tiempos y cambios -->
        <div class="flex w-full flex-col items-center gap-2.5">
          <div class="h-6">
            <AnimatePresence>
              <motion.p
                v-if="bola[l]"
                class="rounded-full px-3 py-0.5 text-sm font-extrabold"
                :style="{ background: tinta(l), color: partida.equipos[l].color }"
                :initial="{ scale: 0.5, opacity: 0 }"
                :animate="{ scale: [1, 1.08, 1], opacity: 1 }"
                :exit="{ scale: 0.5, opacity: 0 }"
                :transition="{ scale: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.2 } }"
              >
                {{ bola[l] }}
              </motion.p>
            </AnimatePresence>
          </div>
          <div class="pointer-events-auto flex gap-2">
            <button
              class="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition-transform active:scale-90 disabled:opacity-35"
              :style="{ background: velo(l) }"
              :disabled="partida.tiempos[l] >= partida.reglas.tiemposPorSet || partida.ganador !== null"
              :aria-label="`Tiempo muerto para ${partida.equipos[l].nombre}`"
              @click="pedirTiempo(l)"
            >
              <Icono nombre="reloj" clase="size-4" />
              Tiempo
              <span class="cifras opacity-70">{{ partida.tiempos[l] }}/{{ partida.reglas.tiemposPorSet }}</span>
            </button>
            <button
              class="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold transition-transform active:scale-90 disabled:opacity-35"
              :style="{ background: velo(l) }"
              :disabled="partida.ganador !== null"
              :aria-label="`Cambio para ${partida.equipos[l].nombre}`"
              @click="m.cambio(l)"
            >
              <Icono nombre="persona" clase="size-4" />
              Cambio
              <span class="cifras opacity-70">{{ partida.cambios[l] }}/{{ partida.reglas.cambiosPorSet }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ Barra central ============ -->
    <div class="barra flex items-center justify-between gap-2 px-2.5 py-2">
      <div class="barra-grupo flex items-center gap-1.5">
        <NuxtLink to="/" class="boton" aria-label="Volver a la app"><Icono nombre="volver" clase="size-5" /></NuxtLink>
        <button class="boton" aria-label="Ajustes del partido" @click="verAjustes = true"><Icono nombre="ajustes" clase="size-5" /></button>
      </div>

      <div class="barra-sets flex items-center gap-1.5 text-center">
        <p class="pr-1 text-[11px] font-bold text-bruma">
          {{ partida.ganador !== null ? 'Final' : esDecisivo ? 'Desempate' : `Set ${numeroSet}` }}
        </p>
        <AnimatePresence>
          <motion.p
            v-for="(s, i) in partida.setsCerrados"
            :key="i"
            class="cifras rounded-lg bg-tono/8 px-2 py-1 font-marcador text-lg leading-none font-extrabold"
            :initial="{ scale: 0, opacity: 0 }"
            :animate="{ scale: 1, opacity: 1 }"
            :exit="{ scale: 0, opacity: 0 }"
            :transition="muelle"
          >
            {{ s[orden[0]!] }}-{{ s[orden[1]!] }}
          </motion.p>
        </AnimatePresence>
      </div>

      <div class="barra-grupo flex items-center gap-1.5">
        <button class="boton" aria-label="Cambiar de lado" @click="m.cambiarLados()"><Icono nombre="cambiar" clase="size-5" /></button>
        <button class="boton !bg-cadiz !text-tinta disabled:!bg-tono/8 disabled:!text-tono/30" :disabled="!puedeDeshacer" aria-label="Deshacer" @click="m.deshacer()">
          <Icono nombre="deshacer" clase="size-5" />
        </button>
        <button v-if="hayPantallaCompleta" class="boton" :aria-label="isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'" @click="pantallaCompleta()">
          <Icono nombre="pantalla" clase="size-5" />
        </button>
      </div>
    </div>

    <!-- ============ Aviso ============ -->
    <AnimatePresence>
      <motion.p
        v-if="aviso"
        class="aviso pointer-events-none fixed left-1/2 z-30 rounded-full bg-tinta/90 px-5 py-2.5 text-center text-sm font-semibold whitespace-nowrap text-white shadow-2xl ring-1 ring-tono/10 backdrop-blur"
        role="status"
        :initial="{ opacity: 0, y: -12, x: '-50%', scale: 0.9 }"
        :animate="{ opacity: 1, y: 0, x: '-50%', scale: 1 }"
        :exit="{ opacity: 0, y: -12, x: '-50%', scale: 0.9 }"
        :transition="muelle"
      >
        {{ aviso }}
      </motion.p>
    </AnimatePresence>

    <!-- ============ Set ganado ============ -->
    <AnimatePresence>
      <motion.button
        v-if="setGanado"
        :key="setGanado.id"
        class="fixed inset-0 z-30 flex flex-col items-center justify-center"
        :style="{ background: partida.equipos[setGanado.lado].color, color: tinta(setGanado.lado) }"
        :initial="{ clipPath: `circle(0% at ${origenCelebracion})` }"
        :animate="{ clipPath: `circle(150% at ${origenCelebracion})` }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }"
        aria-label="Seguir con el partido"
        @click="setGanado = null"
      >
        <motion.p class="text-lg font-semibold opacity-80" :initial="{ y: 20, opacity: 0 }" :animate="{ y: 0, opacity: 0.8 }" :transition="{ delay: 0.3 }">
          Set {{ setGanado.numero }} para
        </motion.p>
        <motion.p class="font-marcador text-6xl leading-none font-black" :initial="{ y: 30, opacity: 0 }" :animate="{ y: 0, opacity: 1 }" :transition="{ delay: 0.38, ...muelle }">
          {{ partida.equipos[setGanado.lado].nombre }}
        </motion.p>
        <motion.p class="cifras mt-2 font-marcador text-[min(30dvh,30vw)] leading-none font-black" :initial="{ scale: 0.6, opacity: 0 }" :animate="{ scale: 1, opacity: 1 }" :transition="{ delay: 0.45, type: 'spring', stiffness: 300, damping: 16 }">
          {{ setGanado.marcador }}
        </motion.p>
      </motion.button>
    </AnimatePresence>

    <!-- ============ Tiempo muerto ============ -->
    <AnimatePresence>
      <motion.button
        v-if="tiempo"
        class="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4"
        :style="{ background: partida.equipos[tiempo.lado].color, color: tinta(tiempo.lado) }"
        :initial="{ opacity: 0, scale: 1.06 }"
        :animate="{ opacity: 1, scale: 1 }"
        :exit="{ opacity: 0, scale: 0.98 }"
        :transition="{ duration: 0.3 }"
        aria-label="Terminar tiempo muerto"
        @click="tiempo = null"
      >
        <p class="text-lg font-semibold">Tiempo muerto · {{ partida.equipos[tiempo.lado].nombre }}</p>
        <div class="relative grid size-[min(62dvh,70vw)] place-items-center">
          <svg viewBox="0 0 100 100" class="absolute inset-0 -rotate-90">
            <circle cx="50" cy="50" :r="RADIO" fill="none" stroke="currentColor" stroke-opacity=".18" stroke-width="3" />
            <circle
              cx="50" cy="50" :r="RADIO" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"
              :stroke-dasharray="vuelta"
              :stroke-dashoffset="vuelta * (1 - restante / tiempo.total)"
            />
          </svg>
          <p class="cifras font-marcador text-[min(30dvh,34vw)] leading-none font-black">{{ Math.ceil(restante) }}</p>
        </div>
        <p class="text-sm font-medium opacity-70">Toca para volver al partido</p>
      </motion.button>
    </AnimatePresence>

    <!-- ============ Fin del partido ============ -->
    <AnimatePresence>
      <motion.div
        v-if="partida.ganador !== null"
        class="fixed inset-0 z-30 flex flex-col items-center justify-center gap-8 p-6 text-center"
        :style="{ background: partida.equipos[partida.ganador].color, color: tinta(partida.ganador) }"
        :initial="{ clipPath: 'circle(0% at 50% 50%)' }"
        :animate="{ clipPath: 'circle(150% at 50% 50%)' }"
        :exit="{ opacity: 0 }"
        :transition="{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }"
      >
        <MarcadorConfeti :colores="[partida.equipos[0].color, partida.equipos[1].color, '#FFFFFF']" />
        <div>
          <motion.p class="text-lg font-semibold opacity-75" :initial="{ y: 20, opacity: 0 }" :animate="{ y: 0, opacity: 0.75 }" :transition="{ delay: 0.4 }">Gana el partido</motion.p>
          <motion.p class="font-marcador text-7xl leading-[0.9] font-black" :initial="{ y: 40, opacity: 0 }" :animate="{ y: 0, opacity: 1 }" :transition="{ delay: 0.5, ...muelle }">
            {{ partida.equipos[partida.ganador].nombre }}
          </motion.p>
          <motion.p class="cifras mt-4 font-marcador text-8xl leading-none font-black" :initial="{ scale: 0.5, opacity: 0 }" :animate="{ scale: 1, opacity: 1 }" :transition="{ delay: 0.65, type: 'spring', stiffness: 280, damping: 14 }">
            {{ setsGanados[partida.ganador] }}-{{ setsGanados[partida.ganador === 0 ? 1 : 0] }}
          </motion.p>
          <motion.div class="mt-4 flex justify-center gap-2" :initial="{ opacity: 0 }" :animate="{ opacity: 1 }" :transition="{ delay: 0.85 }">
            <span v-for="(s, i) in partida.setsCerrados" :key="i" class="cifras rounded-lg px-2.5 py-1 font-marcador text-xl font-extrabold" :style="{ background: velo(partida.ganador) }">{{ s[0] }}-{{ s[1] }}</span>
          </motion.div>
        </div>
        <motion.div class="flex w-full max-w-xs flex-col gap-2" :initial="{ y: 30, opacity: 0 }" :animate="{ y: 0, opacity: 1 }" :transition="{ delay: 1 }">
          <button class="rounded-2xl bg-tinta py-4 font-bold text-white transition-transform active:scale-95" @click="m.nuevaPartida()">Revancha</button>
          <NuxtLink to="/marcador/historial" class="rounded-2xl py-3.5 font-bold" :style="{ background: velo(partida.ganador) }">Ver historial</NuxtLink>
          <button class="py-2 text-sm font-semibold underline underline-offset-4 opacity-80" @click="m.deshacer()">Deshacer el último punto</button>
        </motion.div>
      </motion.div>
    </AnimatePresence>

    <AnimatePresence>
      <MarcadorAjustes
        v-if="verAjustes"
        :equipos="partida.equipos"
        :reglas="partida.reglas"
        :empezada="m.empezada.value"
        @cerrar="verAjustes = false"
        @guardar="guardarAjustes"
        @nuevo="nuevo"
        @terminar="terminar"
      />
    </AnimatePresence>
  </div>
</template>

<style scoped>
.tablero {
  height: 100dvh;
  display: grid;
  grid-template-rows: 1fr auto 1fr;
}
.mitad-a { grid-row: 1; }
.barra { grid-row: 2; }
.mitad-b { grid-row: 3; }

.relleno { padding: max(1rem, env(safe-area-inset-top)) 1rem 1rem; }
.mitad-b .relleno { padding: 1rem 1rem max(1rem, env(safe-area-inset-bottom)); }
.puntos { font-size: min(27dvh, 58vw); }
.aviso { top: calc(50% - 4.25rem); }

.boton {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 9999px;
  background: color-mix(in oklab, var(--color-tono) 8%, transparent);
  transition: transform 150ms, background-color 200ms;
}
.boton:active { transform: scale(0.88); }

@media (orientation: landscape) {
  .tablero {
    grid-template-rows: none;
    grid-template-columns: 1fr auto 1fr;
  }
  .mitad-a { grid-row: 1; grid-column: 1; }
  .barra {
    grid-row: 1;
    grid-column: 2;
    flex-direction: column;
    padding-block: max(0.6rem, env(safe-area-inset-top)) max(0.6rem, env(safe-area-inset-bottom));
  }
  .mitad-b { grid-row: 1; grid-column: 3; }
  .barra-grupo, .barra-sets { flex-direction: column; }
  .relleno, .mitad-b .relleno {
    padding: max(0.75rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-left)) max(0.75rem, env(safe-area-inset-bottom));
  }
  .puntos { font-size: min(58dvh, 30vw); }
  .aviso { top: max(1rem, env(safe-area-inset-top)); }
}

.onda {
  opacity: 0;
  animation: onda 650ms ease-out;
}
@keyframes onda {
  from { transform: scale(0.2); opacity: 0.28; }
  to { transform: scale(7); opacity: 0; }
}
</style>
