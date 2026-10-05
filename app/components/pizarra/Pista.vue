<script setup lang="ts">
import type { Falta, Ficha, Punto } from '~/utils/pizarra'
import type { Herramienta, Jugador, Trazo } from '~/composables/usePizarra'

const props = defineProps<{
  fichas: (Ficha & { jugador: Jugador | null })[]
  faltas: Falta[]
  trazos: Trazo[]
  balon: Punto | null
  herramienta: Herramienta
  color: string
  nombres: boolean
  zonas: boolean
}>()

const emit = defineEmits<{
  mover: [hueco: string, p: Punto]
  balon: [p: Punto]
  trazo: [t: Omit<Trazo, 'id'>]
}>()

const svg = ref<SVGSVGElement>()
defineExpose({ svg })

// Medidas del dibujo (en metros)
const VISTA = { x: -1.4, y: -1.7, w: 11.8, h: 13.8 }
const COLORES_TRAZO = ['#FFC93C', '#FFFFFF', '#FF5252']

/** Pasa de píxeles de pantalla a metros de la pista */
function aPista(e: PointerEvent): Punto {
  const m = svg.value!.getScreenCTM()!.inverse()
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m)
  return { x: p.x, y: p.y }
}
const limitar = (p: Punto): Punto => ({
  x: Math.min(VISTA.x + VISTA.w - 0.6, Math.max(VISTA.x + 0.6, p.x)),
  y: Math.min(VISTA.y + VISTA.h - 0.9, Math.max(VISTA.y + 0.6, p.y)),
})
const redondear = (p: Punto): Punto => ({ x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 })

// ---- Arrastrar fichas y balón
const arrastre = ref<{ id: string; p: Punto; desfase: Punto } | null>(null)

function cogerFicha(e: PointerEvent, id: string, actual: Punto) {
  if (props.herramienta !== 'mover') return
  e.stopPropagation()
  svg.value!.setPointerCapture(e.pointerId)
  const p = aPista(e)
  arrastre.value = { id, p: actual, desfase: { x: actual.x - p.x, y: actual.y - p.y } }
  if ('vibrate' in navigator) navigator.vibrate(6)
}

const posicion = (id: string, original: Punto) => (arrastre.value?.id === id ? arrastre.value.p : original)

// ---- Dibujar
const trazoActual = ref<Omit<Trazo, 'id'> | null>(null)

function bajar(e: PointerEvent) {
  if (props.herramienta === 'mover') return
  svg.value!.setPointerCapture(e.pointerId)
  const p = redondear(aPista(e))
  trazoActual.value = { tipo: props.herramienta, color: props.color, puntos: [p, p] }
}

function mover(e: PointerEvent) {
  if (arrastre.value) {
    const p = aPista(e)
    arrastre.value.p = limitar({ x: p.x + arrastre.value.desfase.x, y: p.y + arrastre.value.desfase.y })
    return
  }
  if (!trazoActual.value) return
  const p = redondear(aPista(e))
  const puntos = trazoActual.value.puntos
  if (trazoActual.value.tipo === 'flecha') puntos[1] = p
  else if (Math.hypot(p.x - puntos.at(-1)!.x, p.y - puntos.at(-1)!.y) > 0.08) puntos.push(p)
}

function subir() {
  if (arrastre.value) {
    const { id, p } = arrastre.value
    if (id === 'balon') emit('balon', redondear(p))
    else emit('mover', id, redondear(p))
    arrastre.value = null
    return
  }
  const t = trazoActual.value
  trazoActual.value = null
  if (!t) return
  const largo = t.puntos.reduce((s, p, i) => (i ? s + Math.hypot(p.x - t.puntos[i - 1]!.x, p.y - t.puntos[i - 1]!.y) : 0), 0)
  if (largo > 0.25) emit('trazo', t)
}

// ---- Dibujo de trazos
function camino(puntos: Punto[]) {
  if (puntos.length < 2) return ''
  // Curva suave que pasa por los puntos
  let d = `M${puntos[0]!.x},${puntos[0]!.y}`
  for (let i = 1; i < puntos.length - 1; i++) {
    const medio = { x: (puntos[i]!.x + puntos[i + 1]!.x) / 2, y: (puntos[i]!.y + puntos[i + 1]!.y) / 2 }
    d += ` Q${puntos[i]!.x},${puntos[i]!.y} ${medio.x},${medio.y}`
  }
  const u = puntos.at(-1)!
  return `${d} L${u.x},${u.y}`
}
const idMarca = (color: string) => `punta-${COLORES_TRAZO.indexOf(color) >= 0 ? COLORES_TRAZO.indexOf(color) : 0}`

// ---- Faltas
const enFalta = computed(() => new Set(props.faltas.flatMap((f) => [f.a, f.b])))
const fichaDe = (hueco: string) => props.fichas.find((f) => f.hueco === hueco)!

const ZONAS = Object.entries(BASE).map(([z, p]) => ({ z, ...p }))
const etiqueta = (f: Ficha & { jugador: Jugador | null }) => {
  if (!f.jugador) return ROLES[f.rol].nombre
  return f.jugador.nombre?.trim() || ROLES[f.rol].nombre
}
</script>

<template>
  <svg
    ref="svg"
    :viewBox="`${VISTA.x} ${VISTA.y} ${VISTA.w} ${VISTA.h}`"
    class="pista block h-auto w-full select-none"
    :class="herramienta === 'mover' ? 'modo-mover' : 'modo-dibujo'"
    role="img"
    aria-label="Pizarra táctica: media pista de voley con la posición de cada jugador"
    font-family="'Onest', system-ui, sans-serif"
    @pointerdown="bajar"
    @pointermove="mover"
    @pointerup="subir"
    @pointercancel="subir"
  >
    <defs>
      <marker v-for="(c, i) in COLORES_TRAZO" :id="`punta-${i}`" :key="c" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
        <path d="M0 0 10 5 0 10z" :fill="c" />
      </marker>
      <filter id="sombra" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0.08" stdDeviation="0.08" flood-color="#000" flood-opacity=".45" />
      </filter>
    </defs>

    <!-- Zona libre y pista -->
    <rect :x="VISTA.x" :y="VISTA.y" :width="VISTA.w" :height="VISTA.h" fill="#1B4D6B" />
    <rect x="0" :y="VISTA.y" width="9" :height="-VISTA.y" fill="#B9622C" opacity=".55" />
    <rect x="0" y="0" width="9" height="9" fill="#DD7A3A" />
    <rect x="0" y="0" width="9" height="3" fill="#000" opacity=".06" />

    <!-- Líneas -->
    <g stroke="#fff" stroke-width=".05" fill="none">
      <rect x="0" y="0" width="9" height="9" />
      <line x1="0" y1="3" x2="9" y2="3" />
      <line x1="-1.3" y1="3" x2="0" y2="3" stroke-dasharray=".15 .2" />
      <line x1="9" y1="3" x2="10.3" y2="3" stroke-dasharray=".15 .2" />
      <line x1="0" y1="9.2" x2="0" y2="9.35" />
      <line x1="9" y1="9.2" x2="9" y2="9.35" />
    </g>

    <!-- Números de zona -->
    <g v-if="zonas" fill="#fff" opacity=".16" font-family="'Big Shoulders Display', 'Arial Narrow', sans-serif" font-weight="900" font-size="2.2" text-anchor="middle">
      <text v-for="z in ZONAS" :key="z.z" :x="z.x" :y="z.y + 0.8">{{ z.z }}</text>
    </g>

    <!-- Red -->
    <rect x="-0.5" y="-0.12" width="10" height=".24" fill="#0B1F2C" />
    <line x1="-0.5" y1="0" x2="9.5" y2="0" stroke="#fff" stroke-width=".04" stroke-dasharray=".12 .12" />
    <rect x="-0.06" y="-0.5" width=".12" height="1" fill="#fff" />
    <rect x="8.94" y="-0.5" width=".12" height="1" fill="#fff" />
    <g fill="#E53935">
      <rect x="-0.06" y="-0.5" width=".12" height=".2" />
      <rect x="-0.06" y="-0.1" width=".12" height=".2" />
      <rect x="-0.06" y=".3" width=".12" height=".2" />
      <rect x="8.94" y="-0.5" width=".12" height=".2" />
      <rect x="8.94" y="-0.1" width=".12" height=".2" />
      <rect x="8.94" y=".3" width=".12" height=".2" />
    </g>
    <text x="-1.05" :y="VISTA.y + 1.0" fill="#fff" opacity=".55" font-size=".4" font-weight="600">Campo rival</text>
    <text x="10.1" y="11.75" fill="#fff" opacity=".4" font-size=".36" font-weight="600" text-anchor="end">Zona de saque</text>

    <!-- Faltas de posición -->
    <g v-for="f in faltas" :key="f.a + f.b">
      <line
        :x1="posicion(f.a, fichaDe(f.a)).x" :y1="posicion(f.a, fichaDe(f.a)).y"
        :x2="posicion(f.b, fichaDe(f.b)).x" :y2="posicion(f.b, fichaDe(f.b)).y"
        stroke="#FF3B3B" stroke-width=".08" stroke-dasharray=".2 .14" stroke-linecap="round"
      />
    </g>

    <!-- Dibujos -->
    <g fill="none" stroke-linecap="round" stroke-linejoin="round" pointer-events="none">
      <path
        v-for="t in [...trazos, ...(trazoActual ? [trazoActual] : [])]"
        :key="'id' in t ? (t as Trazo).id : 'actual'"
        :d="t.tipo === 'flecha' ? `M${t.puntos[0]!.x},${t.puntos[0]!.y} L${t.puntos.at(-1)!.x},${t.puntos.at(-1)!.y}` : camino(t.puntos)"
        :stroke="t.color"
        stroke-width=".11"
        :stroke-dasharray="t.tipo === 'flecha' ? '.3 .18' : undefined"
        :marker-end="t.tipo === 'flecha' ? `url(#${idMarca(t.color)})` : undefined"
        filter="url(#sombra)"
      />
    </g>

    <!-- Fichas -->
    <g
      v-for="f in fichas"
      :key="f.hueco"
      class="ficha"
      :class="{ arrastrando: arrastre?.id === f.hueco }"
      :style="{ transform: `translate(${posicion(f.hueco, f).x}px, ${posicion(f.hueco, f).y}px)` }"
      @pointerdown="cogerFicha($event, f.hueco, f)"
    >
      <circle r=".95" fill="transparent" />
      <circle v-if="enFalta.has(f.hueco)" r=".78" fill="none" stroke="#FF3B3B" stroke-width=".09" class="latido" />
      <circle v-if="f.coloca && !enFalta.has(f.hueco)" r=".74" fill="none" stroke="#fff" stroke-width=".05" stroke-dasharray=".14 .1" />
      <g class="cuerpo" filter="url(#sombra)">
        <circle r=".56" :fill="ROLES[f.rol].color" stroke="#061A28" stroke-width=".05" />
        <text
          y=".2"
          text-anchor="middle"
          fill="#061A28"
          font-family="'Big Shoulders Display', 'Arial Narrow', sans-serif"
          font-weight="900"
          :font-size="String(f.jugador?.dorsal ?? '').length > 1 ? '.6' : '.66'"
        >{{ f.jugador?.dorsal ?? '?' }}</text>
        <!-- Rol -->
        <circle cx=".46" cy="-.42" r=".24" fill="#061A28" />
        <text x=".46" y="-.34" text-anchor="middle" fill="#fff" font-size=".24" font-weight="800">{{ ROLES[f.rol].corto }}</text>
        <!-- Saca -->
        <g v-if="f.saca && f.y > 9" transform="translate(-.5 -.45)">
          <circle r=".22" fill="#fff" stroke="#061A28" stroke-width=".04" />
          <path d="M-.2 0Q0 -.08 .2 0M0 -.2Q-.08 0 0 .2" stroke="#061A28" stroke-width=".03" fill="none" />
        </g>
      </g>
      <text
        v-if="nombres"
        y="1.02"
        text-anchor="middle"
        fill="#fff"
        stroke="#061A28"
        stroke-width=".12"
        paint-order="stroke"
        stroke-linejoin="round"
        font-size=".34"
        font-weight="700"
      >{{ etiqueta(f) }}</text>
    </g>

    <!-- Balón -->
    <g
      v-if="balon"
      class="ficha"
      :class="{ arrastrando: arrastre?.id === 'balon' }"
      :style="{ transform: `translate(${posicion('balon', balon).x}px, ${posicion('balon', balon).y}px)` }"
      @pointerdown="cogerFicha($event, 'balon', balon)"
    >
      <circle r=".7" fill="transparent" />
      <g filter="url(#sombra)">
        <circle r=".3" fill="#FFF8E1" stroke="#061A28" stroke-width=".04" />
        <path d="M-.28 -.05Q0 -.15 .26 .1M-.05 -.29Q-.12 0 .12 .26M.2 -.2Q-.05 .05 -.22 .2" stroke="#1565C0" stroke-width=".05" fill="none" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.pista.modo-mover { touch-action: none; }
.pista.modo-dibujo { touch-action: none; cursor: crosshair; }

.ficha {
  transition: transform 650ms cubic-bezier(0.34, 1.3, 0.5, 1);
  cursor: grab;
}
.ficha.arrastrando {
  transition: none;
  cursor: grabbing;
}
.ficha .cuerpo {
  transition: transform 160ms ease;
  transform-box: fill-box;
  transform-origin: center;
}
.ficha.arrastrando .cuerpo {
  transform: scale(1.18);
}
.modo-dibujo .ficha {
  pointer-events: none;
}
.latido {
  animation: latido 1s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}
@keyframes latido {
  50% { opacity: 0.35; transform: scale(1.12); }
}
</style>
