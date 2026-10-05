<script setup lang="ts">
import { AnimatePresence, motion } from 'motion-v'

// Botón redondo que abre un menú: Sistema / Claro / Oscuro
const { eleccion, actual, cambiar } = useTema()
const abierto = ref(false)
const caja = ref<HTMLElement>()
onClickOutside(caja, () => (abierto.value = false))

const iconoBoton = computed(() => (eleccion.value === 'auto' ? 'movil' : actual.value === 'light' ? 'sol' : 'luna'))

function elegir(valor: Tema, e: MouseEvent) {
  cambiar(valor, e)
  setTimeout(() => (abierto.value = false), 180)
}
</script>

<template>
  <div ref="caja" class="relative">
    <button
      class="grid size-10 place-items-center overflow-hidden rounded-full bg-capa text-espuma ring-1 ring-tono/8 transition-transform active:scale-90"
      :aria-label="`Apariencia: ${OPCIONES_TEMA.find((o) => o.valor === eleccion)?.texto}`"
      :aria-expanded="abierto"
      @click="abierto = !abierto"
    >
      <AnimatePresence mode="popLayout" :initial="false">
        <motion.span
          :key="iconoBoton"
          class="block"
          :initial="{ rotate: -90, scale: 0.4, opacity: 0 }"
          :animate="{ rotate: 0, scale: 1, opacity: 1 }"
          :exit="{ rotate: 90, scale: 0.4, opacity: 0 }"
          :transition="{ type: 'spring', stiffness: 420, damping: 24 }"
        >
          <Icono :nombre="iconoBoton" clase="size-[18px]" />
        </motion.span>
      </AnimatePresence>
    </button>

    <AnimatePresence>
      <motion.div
        v-if="abierto"
        class="absolute right-0 top-12 z-30 w-44 origin-top-right rounded-2xl bg-capa p-1.5 shadow-[0_20px_50px_-12px_rgb(0_0_0/0.45)] ring-1 ring-tono/10"
        role="menu"
        :initial="{ opacity: 0, scale: 0.85, y: -6 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.9, y: -4 }"
        :transition="{ type: 'spring', stiffness: 520, damping: 34 }"
      >
        <p class="px-3 pb-1 pt-1.5 text-[11px] font-semibold text-bruma">Apariencia</p>
        <button
          v-for="op in OPCIONES_TEMA"
          :key="op.valor"
          role="menuitemradio"
          :aria-checked="eleccion === op.valor"
          class="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold"
          @click="elegir(op.valor, $event)"
        >
          <motion.span
            v-if="eleccion === op.valor"
            layout-id="tema-elegido"
            class="absolute inset-0 rounded-xl bg-tono/8"
            :transition="{ type: 'spring', stiffness: 500, damping: 38 }"
          />
          <Icono :nombre="op.icono" clase="relative size-[18px]" />
          <span class="relative flex-1 text-left">{{ op.texto }}</span>
          <span v-if="eleccion === op.valor" class="relative size-2 rounded-full bg-cadiz" />
        </button>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
