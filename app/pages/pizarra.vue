<script setup lang="ts">
import { AnimatePresence, motion } from 'motion-v'
import type { Fase, SistemaId } from '~/utils/pizarra'
import type { Herramienta } from '~/composables/usePizarra'

useHead({ title: 'Pizarra · Cádiz 2012 Mixto' })

const pz = usePizarra()
const { opciones, sistema, fichas, faltas, trazos, balon, personalizada } = pz

const herramienta = ref<Herramienta>('mover')
const colorTrazo = ref('#FFC93C')
const verEquipo = ref(false)
const pista = ref<{ svg: SVGSVGElement }>()
const suave = [0.16, 1, 0.3, 1] as const

const enJuego = computed(() => ['saque', 'recepcion'].includes(opciones.value.fase))
const dorsal = (f: (typeof fichas.value)[number]) => (f.jugador ? `#${f.jugador.dorsal}` : ROLES[f.rol].nombre)

/** Resumen de quién hace qué en esta jugada */
const resumen = computed(() => {
  const f = fichas.value
  const lineas: { texto: string; valor: string }[] = []
  const fase = opciones.value.fase
  const colocador = f.find((x) => x.coloca)
  if (fase === 'saque') {
    const s = f.find((x) => x.saca)
    if (s) lineas.push({ texto: 'Saca', valor: dorsal(s) })
  }
  if (colocador && sistema.value.id !== '6-0') lineas.push({ texto: 'Coloca', valor: dorsal(colocador) })
  if (fase === 'recepcion') lineas.push({ texto: 'Reciben', valor: f.filter((x) => x.recibe).map(dorsal).join(' · ') })
  if (fase === 'ataque') {
    const delante = f.filter((x) => esDelantera(x.zona) && !x.coloca)
    lineas.push({ texto: 'Atacan', valor: delante.map(dorsal).join(' · ') })
  }
  const libero = f.find((x) => x.libero)
  if (libero) {
    const central = pz.jugador(pz.alineacion.value.huecos[libero.hueco])
    lineas.push({ texto: 'Líbero', valor: `${dorsal(libero)} por ${central ? `#${central.dorsal}` : 'el central'}` })
  }
  return lineas
})

function cambiarSistema(v: string) {
  opciones.value.sistema = v as SistemaId
  opciones.value.rot = 0
}

// Teclado (tablet u ordenador): flechas para rotar
onKeyStroke(['ArrowRight', 'ArrowLeft'], (e) => {
  if ((e.target as HTMLElement)?.closest('input, select, textarea')) return
  pz.rotar(e.key === 'ArrowRight' ? 1 : -1)
})

function alternarBalon() {
  pz.moverBalon(balon.value ? null : { x: 4.5, y: 4.5 })
}

// ---- Guardar la pizarra como imagen
const exportando = ref(false)
async function guardarImagen() {
  if (!pista.value?.svg) return
  exportando.value = true
  try {
    const copia = pista.value.svg.cloneNode(true) as SVGSVGElement
    copia.setAttribute('width', '1180')
    copia.setAttribute('height', '1380')
    copia.querySelectorAll('.ficha').forEach((g) => {
      const t = (g as SVGGElement).style.transform.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)
      if (t) g.setAttribute('transform', `translate(${t[1]} ${t[2]})`)
      ;(g as SVGGElement).removeAttribute('style')
    })
    const texto = new XMLSerializer().serializeToString(copia)
    const url = URL.createObjectURL(new Blob([texto], { type: 'image/svg+xml' }))
    const img = new Image()
    await new Promise((ok, mal) => {
      img.onload = ok
      img.onerror = mal
      img.src = url
    })
    const lienzo = document.createElement('canvas')
    lienzo.width = 1180
    lienzo.height = 1380
    lienzo.getContext('2d')!.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)
    const blob = await new Promise<Blob>((ok) => lienzo.toBlob((b) => ok(b!), 'image/png'))
    const nombre = `pizarra-${sistema.value.nombre}-rot${opciones.value.rot + 1}-${opciones.value.fase}.png`
    const archivo = new File([blob], nombre, { type: 'image/png' })
    if (navigator.canShare?.({ files: [archivo] })) {
      await navigator.share({ files: [archivo], title: 'Pizarra Cádiz 2012' }).catch(() => {})
    } else {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = nombre
      a.click()
    }
  } finally {
    exportando.value = false
  }
}

const HERRAMIENTAS = [
  { valor: 'mover', texto: 'Mover', icono: 'mano' },
  { valor: 'lapiz', texto: 'Lápiz', icono: 'lapiz' },
  { valor: 'flecha', texto: 'Flecha', icono: 'flecha' },
] as const
const COLORES = ['#FFC93C', '#FFFFFF', '#FF5252']
</script>

<template>
  <div>
    <Cabecera titulo="Pizarra" :dato="`Sistema ${sistema.nombre}`" />

    <div class="disposicion">
      <!-- ========= Pista ========= -->
      <div class="columna-pista">
        <motion.div
          class="relative overflow-hidden rounded-[26px] shadow-[0_24px_50px_-24px_rgb(0_0_0/0.6)] ring-1 ring-tono/8"
          :initial="{ opacity: 0, scale: 0.97 }"
          :animate="{ opacity: 1, scale: 1 }"
          :transition="{ duration: 0.6, ease: suave }"
        >
          <PizarraPista
            ref="pista"
            :fichas="fichas"
            :faltas="faltas"
            :trazos="trazos"
            :balon="balon"
            :herramienta="herramienta"
            :color="colorTrazo"
            :nombres="opciones.nombres"
            :zonas="opciones.zonas"
            @mover="pz.moverFicha"
            @balon="pz.moverBalon"
            @trazo="pz.anadirTrazo"
          />

          <!-- Herramientas rápidas, sobre la propia pista -->
          <div class="absolute right-2 top-2 flex gap-1 rounded-2xl bg-[#061A28]/75 p-1 text-white backdrop-blur" role="toolbar" aria-label="Herramientas de la pizarra">
            <button
              v-for="h in HERRAMIENTAS"
              :key="h.valor"
              class="relative grid size-9 place-items-center rounded-xl transition-colors"
              :class="herramienta === h.valor ? 'text-tinta' : 'text-white/80'"
              :aria-label="h.texto"
              :aria-pressed="herramienta === h.valor"
              @click="herramienta = h.valor"
            >
              <motion.span v-if="herramienta === h.valor" layout-id="herramienta-rapida" class="absolute inset-0 rounded-xl bg-cadiz" :transition="{ type: 'spring', stiffness: 500, damping: 38 }" />
              <Icono :nombre="h.icono" clase="relative size-[18px]" />
            </button>
            <button class="grid size-9 place-items-center rounded-xl text-white/80 disabled:opacity-30" aria-label="Deshacer dibujo" :disabled="!trazos.length" @click="pz.deshacerTrazo()">
              <Icono nombre="deshacer" clase="size-[18px]" />
            </button>
          </div>

          <!-- Estado de la regla de posiciones -->
          <div class="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            <AnimatePresence mode="popLayout">
              <motion.p
                v-if="enJuego"
                :key="faltas.length ? 'mal' : 'bien'"
                class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg backdrop-blur"
                :class="faltas.length ? 'bg-[#FF3B3B] text-white' : 'bg-[#061A28]/70 text-white'"
                :initial="{ opacity: 0, scale: 0.8 }"
                :animate="{ opacity: 1, scale: 1 }"
                :exit="{ opacity: 0, scale: 0.8 }"
              >
                <span class="size-2 rounded-full" :class="faltas.length ? 'bg-white' : 'bg-[#4DDBA0]'" />
                {{ faltas.length ? `${faltas.length} ${faltas.length === 1 ? 'falta' : 'faltas'} de posición` : 'Posiciones legales' }}
              </motion.p>
            </AnimatePresence>
            <p v-if="personalizada" class="rounded-full bg-[#061A28]/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">Editada</p>
          </div>
        </motion.div>

        <!-- Rotación -->
        <div class="mt-4 flex items-center gap-3">
          <button class="grid size-12 shrink-0 place-items-center rounded-full bg-capa ring-1 ring-tono/8 transition-transform active:scale-90" aria-label="Rotación anterior" @click="pz.rotar(-1)">
            <Icono nombre="volver" clase="size-5" />
          </button>
          <div class="min-w-0 flex-1 text-center">
            <div class="relative h-9 overflow-hidden">
              <AnimatePresence mode="popLayout" :initial="false">
                <motion.p
                  :key="opciones.rot + sistema.id"
                  class="font-marcador text-3xl leading-9 font-black"
                  :initial="{ y: 30, opacity: 0 }"
                  :animate="{ y: 0, opacity: 1 }"
                  :exit="{ y: -30, opacity: 0 }"
                  :transition="{ duration: 0.35, ease: suave }"
                >
                  Rotación {{ opciones.rot + 1 }}
                </motion.p>
              </AnimatePresence>
            </div>
            <p class="text-xs text-bruma">{{ nombreRotacion(sistema, opciones.rot) }}</p>
            <div class="mt-2 flex justify-center gap-1.5" role="tablist" aria-label="Rotaciones">
              <button
                v-for="r in 6"
                :key="r"
                role="tab"
                :aria-selected="opciones.rot === r - 1"
                :aria-label="`Rotación ${r}`"
                class="relative h-1.5 w-6 overflow-hidden rounded-full bg-raya"
                @click="opciones.rot = r - 1"
              >
                <motion.span v-if="opciones.rot === r - 1" layout-id="rot-activa" class="absolute inset-0 rounded-full bg-cadiz" />
              </button>
            </div>
          </div>
          <button class="grid size-12 shrink-0 place-items-center rounded-full bg-cadiz text-tinta transition-transform active:scale-90" aria-label="Rotar (siguiente rotación)" @click="pz.rotar(1)">
            <Icono nombre="rotar" clase="size-5" />
          </button>
        </div>
      </div>

      <!-- ========= Controles ========= -->
      <div class="columna-controles space-y-4">
        <div>
          <p class="mb-2 text-xs font-semibold text-bruma">Sistema</p>
          <Segmentos
            :model-value="opciones.sistema"
            id="sistema"
            :opciones="Object.values(SISTEMAS).map((s) => ({ valor: s.id, texto: s.nombre }))"
            @update:model-value="cambiarSistema"
          />
        </div>
        <div>
          <p class="mb-2 text-xs font-semibold text-bruma">Momento del juego</p>
          <Segmentos
            :model-value="opciones.fase"
            id="fase"
            :opciones="FASES"
            @update:model-value="opciones.fase = $event as Fase"
          />
        </div>

        <!-- Faltas -->
        <AnimatePresence>
          <motion.ul
            v-if="faltas.length"
            class="space-y-1.5 overflow-hidden rounded-2xl bg-pierde/12 p-3"
            :initial="{ opacity: 0, height: 0 }"
            :animate="{ opacity: 1, height: 'auto' }"
            :exit="{ opacity: 0, height: 0 }"
          >
            <li v-for="f in faltas" :key="f.a + f.b" class="flex gap-2 text-sm font-semibold text-pierde">
              <span aria-hidden="true">•</span>{{ f.texto }}
            </li>
          </motion.ul>
        </AnimatePresence>

        <!-- Quién hace qué -->
        <dl class="grid grid-cols-2 gap-2">
          <div v-for="r in resumen" :key="r.texto" class="rounded-2xl bg-capa px-3.5 py-2.5" :class="r.texto === 'Reciben' || r.texto === 'Atacan' || r.texto === 'Líbero' ? 'col-span-2' : ''">
            <dt class="text-[11px] font-semibold text-bruma">{{ r.texto }}</dt>
            <dd class="font-marcador text-xl font-extrabold">{{ r.valor || '—' }}</dd>
          </div>
        </dl>

        <!-- Herramientas -->
        <div class="rounded-3xl bg-capa p-3">
          <div class="flex items-center gap-2">
            <div class="grid flex-1 grid-cols-3 gap-1 rounded-2xl bg-hondo p-1">
              <button
                v-for="h in HERRAMIENTAS"
                :key="h.valor"
                class="relative flex flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition-colors"
                :class="herramienta === h.valor ? 'text-noche' : 'text-bruma'"
                :aria-pressed="herramienta === h.valor"
                @click="herramienta = h.valor"
              >
                <motion.span v-if="herramienta === h.valor" layout-id="herramienta" class="absolute inset-0 rounded-xl bg-espuma" :transition="{ type: 'spring', stiffness: 500, damping: 38 }" />
                <Icono :nombre="h.icono" clase="relative size-5" />
                <span class="relative">{{ h.texto }}</span>
              </button>
            </div>
            <div class="flex flex-col gap-1.5">
              <button
                v-for="c in COLORES"
                :key="c"
                class="size-6 rounded-full ring-2 transition-transform"
                :class="colorTrazo === c ? 'scale-110 ring-espuma' : 'ring-transparent'"
                :style="{ background: c, boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / .15)' }"
                :aria-label="`Color de dibujo ${c}`"
                @click="colorTrazo = c; herramienta === 'mover' && (herramienta = 'flecha')"
              />
            </div>
          </div>

          <div class="mt-3 grid grid-cols-4 gap-1.5 text-[11px] font-semibold">
            <button class="accion" :disabled="!trazos.length" @click="pz.deshacerTrazo()"><Icono nombre="deshacer" clase="size-5" />Deshacer</button>
            <button class="accion" :disabled="!trazos.length" @click="pz.borrarTrazos()"><Icono nombre="borrar" clase="size-5" />Borrar</button>
            <button class="accion" :class="balon ? '!bg-cadiz !text-tinta' : ''" :aria-pressed="!!balon" @click="alternarBalon"><Icono nombre="pelota" clase="size-5" />Balón</button>
            <button class="accion" :disabled="!personalizada" @click="pz.restablecer()"><Icono nombre="reiniciar" clase="size-5" />Recolocar</button>
          </div>
        </div>

        <!-- Opciones -->
        <div class="divide-y divide-tono/6 rounded-3xl bg-capa px-4">
          <label v-if="sistema.usaLibero" class="flex items-center justify-between py-3">
            <span><span class="font-semibold">Líbero</span><span class="block text-xs text-bruma">Sustituye al central de zaguera</span></span>
            <Interruptor v-model="opciones.libero" />
          </label>
          <label class="flex items-center justify-between py-3">
            <span class="font-semibold">Nombres bajo las fichas</span>
            <Interruptor v-model="opciones.nombres" />
          </label>
          <label class="flex items-center justify-between py-3">
            <span class="font-semibold">Números de zona</span>
            <Interruptor v-model="opciones.zonas" />
          </label>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button class="flex items-center justify-center gap-2 rounded-2xl bg-espuma py-3.5 font-bold text-noche transition-transform active:scale-[0.97]" @click="verEquipo = true">
            <Icono nombre="equipo" clase="size-5" /> Equipo
          </button>
          <button class="flex items-center justify-center gap-2 rounded-2xl bg-capa py-3.5 font-bold transition-transform active:scale-[0.97] disabled:opacity-50" :disabled="exportando" @click="guardarImagen">
            <Icono nombre="descargar" clase="size-5" /> Imagen
          </button>
        </div>

        <p class="px-1 text-xs leading-relaxed text-bruma">
          Arrastra las fichas para ajustar la jugada: los cambios se guardan para esa rotación y momento. "Recolocar" vuelve a la posición recomendada.
          En saque y recepción se comprueba la regla de posiciones al momento.
        </p>
      </div>
    </div>

    <AnimatePresence>
      <PizarraPlantilla v-if="verEquipo" @cerrar="verEquipo = false" />
    </AnimatePresence>
  </div>
</template>

<style scoped>
.accion {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  border-radius: 0.9rem;
  padding: 0.55rem 0;
  background: var(--color-hondo);
  transition: transform 150ms, opacity 150ms;
}
.accion:active { transform: scale(0.92); }
.accion:disabled { opacity: 0.35; }

/* En tablet u ordenador en horizontal: pista a la izquierda y controles a la derecha */
@media (min-width: 900px) {
  .disposicion {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 1.5rem;
    align-items: start;
  }
}
.columna-controles { margin-top: 1.25rem; }
@media (min-width: 900px) {
  .columna-controles { margin-top: 0; }
}
</style>
