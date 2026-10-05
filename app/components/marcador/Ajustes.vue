<script setup lang="ts">
import { motion, useDragControls } from 'motion-v'
import { COLORES, copiar, type EquipoMarcador, type Reglas } from '~/composables/useMarcador'

const props = defineProps<{
  equipos: [EquipoMarcador, EquipoMarcador]
  reglas: Reglas
  empezada: boolean
}>()

const emit = defineEmits<{
  cerrar: []
  guardar: [equipos: [EquipoMarcador, EquipoMarcador], reglas: Reglas]
  nuevo: [equipos: [EquipoMarcador, EquipoMarcador], reglas: Reglas]
  terminar: []
}>()

// Copia de trabajo: no toca el partido hasta pulsar un botón
const equipos = ref(copiar(props.equipos))
const reglas = ref({ ...props.reglas })

const confirmarNuevo = ref(false)
const controles = useDragControls()
const { eleccion, cambiar } = useTema()

function nuevo() {
  if (props.empezada && !confirmarNuevo.value) {
    confirmarNuevo.value = true
    return
  }
  emit('nuevo', equipos.value, reglas.value)
}

// Arrastrar hacia abajo para cerrar
function soltar(_: unknown, info: { offset: { y: number }; velocity: { y: number } }) {
  if (info.offset.y > 120 || info.velocity.y > 600) emit('cerrar')
}

function paso(campo: 'tiemposPorSet' | 'cambiosPorSet', delta: number, max: number) {
  reglas.value[campo] = Math.min(Math.max(reglas.value[campo] + delta, 0), max)
}
</script>

<template>
  <motion.div
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
    :initial="{ opacity: 0 }"
    :animate="{ opacity: 1 }"
    :exit="{ opacity: 0 }"
    @click="emit('cerrar')"
  />
  <motion.div
    class="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-[30px] bg-hondo text-espuma ring-1 ring-tono/8"
    role="dialog"
    aria-modal="true"
    aria-labelledby="titulo-ajustes"
    :initial="{ y: '100%' }"
    :animate="{ y: 0 }"
    :exit="{ y: '100%' }"
    :transition="{ type: 'spring', stiffness: 380, damping: 38 }"
    drag="y"
    :drag-constraints="{ top: 0, bottom: 0 }"
    :drag-elastic="{ top: 0, bottom: 0.6 }"
    :drag-listener="false"
    :drag-controls="controles"
    @drag-end="soltar"
  >
    <div class="shrink-0 cursor-grab touch-none px-5 pb-2 pt-3" @pointerdown="controles.start($event)">
      <span class="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-raya" />
      <div class="flex items-center justify-between">
        <h2 id="titulo-ajustes" class="font-marcador text-4xl leading-none font-black">Ajustes</h2>
        <button class="grid size-10 place-items-center rounded-full bg-capa" aria-label="Cerrar" @pointerdown.stop @click="emit('cerrar')">
          <Icono nombre="cerrar" clase="size-5" />
        </button>
      </div>
    </div>

    <div class="space-y-5 overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3">
      <!-- Equipos -->
      <section v-for="(eq, i) in equipos" :key="i" class="rounded-3xl bg-capa p-4">
        <div class="flex items-center gap-3">
          <span class="size-10 shrink-0 rounded-full ring-2 ring-tono/15 transition-colors" :style="{ background: eq.color }" />
          <div class="flex-1">
            <label :for="`nombre-${i}`" class="text-xs font-semibold text-bruma">Equipo {{ i + 1 }}</label>
            <input
              :id="`nombre-${i}`"
              v-model.trim="eq.nombre"
              maxlength="22"
              class="w-full bg-transparent text-lg font-bold outline-none placeholder:text-bruma"
              placeholder="Nombre del equipo"
            >
          </div>
        </div>
        <div class="mt-4 flex flex-wrap gap-2.5">
          <button
            v-for="c in COLORES"
            :key="c"
            class="relative size-9 rounded-full ring-1 ring-tono/15 transition-transform active:scale-90"
            :style="{ background: c }"
            :aria-label="`Color ${c}`"
            :aria-pressed="eq.color.toLowerCase() === c.toLowerCase()"
            @click="eq.color = c"
          >
            <motion.span
              v-if="eq.color.toLowerCase() === c.toLowerCase()"
              :layout-id="`color-${i}`"
              class="absolute -inset-1 rounded-full ring-2 ring-espuma"
              :transition="{ type: 'spring', stiffness: 500, damping: 34 }"
            />
          </button>
          <label class="relative grid size-9 cursor-pointer place-items-center rounded-full border border-dashed border-bruma text-sm font-bold text-bruma" title="Otro color">
            +
            <input v-model="eq.color" type="color" class="absolute inset-0 cursor-pointer opacity-0" aria-label="Elegir otro color">
          </label>
        </div>
      </section>

      <!-- Reglas -->
      <section class="space-y-5 rounded-3xl bg-capa p-4">
        <div>
          <p class="mb-2 text-xs font-semibold text-bruma">Partido</p>
          <Segmentos
            :model-value="String(reglas.setsParaGanar)"
            id="sets"
            class="!bg-hondo"
            :opciones="[{ valor: '2', texto: 'Al mejor de 3' }, { valor: '3', texto: 'Al mejor de 5' }]"
            @update:model-value="reglas.setsParaGanar = Number($event) as 2 | 3"
          />
        </div>
        <div>
          <p class="mb-2 text-xs font-semibold text-bruma">Puntos por set</p>
          <Segmentos
            :model-value="String(reglas.puntosSet)"
            id="puntos"
            class="!bg-hondo"
            :opciones="[25, 21, 15].map((n) => ({ valor: String(n), texto: String(n) }))"
            @update:model-value="reglas.puntosSet = Number($event)"
          />
        </div>
        <div>
          <p class="mb-2 text-xs font-semibold text-bruma">Set de desempate</p>
          <Segmentos
            :model-value="String(reglas.puntosDecisivo)"
            id="desempate"
            class="!bg-hondo"
            :opciones="[15, 21, 25].map((n) => ({ valor: String(n), texto: String(n) }))"
            @update:model-value="reglas.puntosDecisivo = Number($event)"
          />
        </div>
        <div>
          <p class="mb-2 text-xs font-semibold text-bruma">Duración del tiempo muerto</p>
          <Segmentos
            :model-value="String(reglas.segundosTiempo)"
            id="segundos"
            class="!bg-hondo"
            :opciones="[{ valor: '30', texto: '30 s' }, { valor: '60', texto: '60 s' }]"
            @update:model-value="reglas.segundosTiempo = Number($event)"
          />
        </div>

        <div
          v-for="c in [{ k: 'tiemposPorSet', t: 'Tiempos muertos por set', max: 5 }, { k: 'cambiosPorSet', t: 'Cambios por set', max: 15 }] as const"
          :key="c.k"
          class="flex items-center justify-between"
        >
          <p class="font-semibold">{{ c.t }}</p>
          <div class="flex items-center gap-1 rounded-full bg-hondo p-1">
            <button class="grid size-9 place-items-center rounded-full transition-transform active:scale-85" :aria-label="`Menos ${c.t}`" @click="paso(c.k, -1, c.max)">
              <Icono nombre="menos" clase="size-4" />
            </button>
            <span class="cifras w-7 text-center font-marcador text-2xl font-black">{{ reglas[c.k] }}</span>
            <button class="grid size-9 place-items-center rounded-full text-xl font-bold transition-transform active:scale-85" :aria-label="`Más ${c.t}`" @click="paso(c.k, 1, c.max)">+</button>
          </div>
        </div>
      </section>

      <!-- Apariencia de la app -->
      <section class="rounded-3xl bg-capa p-4">
        <p class="mb-2 text-xs font-semibold text-bruma">Apariencia de la app</p>
        <Segmentos
          :model-value="eleccion"
          id="tema"
          class="!bg-hondo"
          :opciones="OPCIONES_TEMA.map((o) => ({ valor: o.valor, texto: o.texto }))"
          @update:model-value="cambiar($event as Tema)"
        />
      </section>

      <!-- Acciones -->
      <div class="space-y-2">
        <button class="w-full rounded-2xl bg-espuma py-4 font-bold text-noche transition-transform active:scale-[0.98]" @click="emit('guardar', equipos, reglas)">
          Guardar cambios
        </button>
        <button
          class="w-full rounded-2xl py-4 font-bold transition-all active:scale-[0.98]"
          :class="confirmarNuevo ? 'bg-pierde text-white' : 'bg-cadiz text-tinta'"
          @click="nuevo"
        >
          {{ confirmarNuevo ? 'Sí, empezar de cero (el actual se guarda)' : 'Empezar partido nuevo' }}
        </button>
        <button v-if="empezada" class="w-full rounded-2xl bg-capa py-4 font-semibold transition-transform active:scale-[0.98]" @click="emit('terminar')">
          Terminar y guardar en el historial
        </button>
        <NuxtLink to="/marcador/historial" class="flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold text-bruma">
          <Icono nombre="historial" clase="size-4" /> Ver partidos guardados
        </NuxtLink>
      </div>
    </div>
  </motion.div>
</template>
