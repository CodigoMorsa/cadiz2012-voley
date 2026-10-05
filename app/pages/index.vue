<script setup lang="ts">
import { motion } from 'motion-v'

useHead({ title: 'Liga · Cádiz 2012 Mixto' })

const { public: { miEquipo, puestosDirectos } } = useRuntimeConfig()
const { data, status, error, refresh } = useClasificacion()

const filas = computed(() => data.value?.filas ?? [])
const nosotros = computed(() => filas.value.find((f) => mismoEquipo(f.equipo, miEquipo)) ?? null)
const sinEmpezar = computed(() => filas.value.length > 0 && filas.value.every((f) => f.pj === 0))
const directos = computed(() => (nosotros.value ? nosotros.value.posicion <= puestosDirectos : false))
const cargando = computed(() => status.value === 'pending' && !data.value)

const suave = [0.16, 1, 0.3, 1] as const
</script>

<template>
  <div>
    <Cabecera titulo="Liga" :dato="data?.temporada ? `Temporada ${data.temporada}` : null" />

    <EstadoDatos :cargando="cargando" :error="!data && error" @reintentar="refresh()" />

    <template v-if="data">
      <!-- Nuestra posición -->
      <motion.section
        v-if="nosotros"
        class="grano relative mb-8 overflow-hidden rounded-[28px] bg-cadiz px-5 pb-5 pt-4 text-tinta"
        aria-label="Nuestra posición"
        :initial="{ opacity: 0, y: 24, scale: 0.97 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :transition="{ duration: 0.7, ease: suave }"
      >
        <!-- Número gigante de fondo -->
        <motion.span
          class="contorno cifras pointer-events-none absolute -right-3 -top-10 font-marcador text-[15rem] font-black leading-none text-tinta/15 select-none"
          aria-hidden="true"
          :initial="{ x: 40, opacity: 0 }"
          :animate="{ x: 0, opacity: 1 }"
          :transition="{ duration: 1.1, ease: suave, delay: 0.15 }"
        >
          {{ nosotros.posicion }}
        </motion.span>

        <div class="relative flex items-center gap-2.5">
          <Escudo :nombre="nosotros.equipo" :tam="26" oscuro />
          <p class="font-bold">{{ nosotros.equipo }}</p>
        </div>

        <div class="relative mt-4 flex items-end gap-3">
          <p class="font-marcador text-[6.5rem] leading-[0.78] font-black">
            <NumeroAnimado :valor="nosotros.posicion" :duracion="0.8" /><span class="text-5xl align-top">º</span>
          </p>
          <p class="pb-1.5 text-sm font-semibold leading-snug">
            de {{ filas.length }}<br>
            <span class="font-normal opacity-75">
              {{ sinEmpezar ? 'Aún no ha empezado' : directos ? 'Directos a cuartos' : 'Iríamos a la ronda 1' }}
            </span>
          </p>
        </div>

        <dl class="relative mt-5 grid grid-cols-4 border-t border-tinta/15 pt-3">
          <div v-for="(d, i) in [{ t: 'Puntos', v: nosotros.pts, s: false }, { t: 'Ganados', v: nosotros.g, s: false }, { t: 'Perdidos', v: nosotros.p, s: false }, { t: 'Dif. sets', v: nosotros.dif, s: true }]" :key="d.t" :class="i ? 'border-l border-tinta/15 pl-3' : ''">
            <dd class="font-marcador text-3xl font-extrabold leading-none"><NumeroAnimado :valor="d.v" :signo="d.s" /></dd>
            <dt class="mt-1 text-[11px] font-semibold opacity-70">{{ d.t }}</dt>
          </div>
        </dl>
      </motion.section>

      <!-- Clasificación -->
      <div class="mb-2 grid grid-cols-[1.6rem_1fr_repeat(4,1.55rem)_2.1rem] items-center px-2 text-[11px] font-semibold text-bruma" aria-hidden="true">
        <span>#</span><span>Equipo</span>
        <span class="text-center">PJ</span><span class="text-center">G</span><span class="text-center">P</span><span class="text-center">Dif</span>
        <span class="text-right">Pts</span>
      </div>

      <ol aria-label="Clasificación">
        <template v-for="(f, i) in filas" :key="f.equipo">
          <motion.li
            class="relative grid grid-cols-[1.6rem_1fr_repeat(4,1.55rem)_2.1rem] items-center rounded-xl px-1.5 py-2.5 text-sm"
            :class="mismoEquipo(f.equipo, miEquipo) ? 'bg-cadiz/12 text-nuestro' : 'odd:bg-tono/[0.025]'"
            :initial="{ opacity: 0, x: -10 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ duration: 0.45, ease: suave, delay: 0.25 + i * 0.035 }"
            :aria-label="`${f.posicion}º ${f.equipo}: ${f.pts} puntos, ${f.pj} jugados, ${f.g} ganados, ${f.p} perdidos`"
          >
            <span v-if="mismoEquipo(f.equipo, miEquipo)" class="absolute inset-y-2 -left-0.5 w-1 rounded-full bg-cadiz" />
            <span class="cifras font-marcador text-lg font-extrabold" :class="mismoEquipo(f.equipo, miEquipo) ? '' : 'text-bruma'">{{ f.posicion }}</span>
            <span class="flex min-w-0 items-center gap-2">
              <Escudo :nombre="f.equipo" :tam="18" :nuestro="mismoEquipo(f.equipo, miEquipo)" />
              <span class="truncate" :class="mismoEquipo(f.equipo, miEquipo) ? 'font-bold' : 'font-medium'">{{ f.equipo }}</span>
            </span>
            <span class="cifras text-center text-bruma">{{ f.pj }}</span>
            <span class="cifras text-center">{{ f.g }}</span>
            <span class="cifras text-center">{{ f.p }}</span>
            <span class="cifras text-center text-bruma">{{ f.dif > 0 ? `+${f.dif}` : f.dif }}</span>
            <span class="cifras text-right font-marcador text-lg font-extrabold">{{ f.pts }}</span>
          </motion.li>

          <!-- Línea de corte, como la línea de ataque de la pista -->
          <motion.li
            v-if="f.posicion === puestosDirectos && i < filas.length - 1"
            class="flex items-center gap-3 px-2 py-2.5"
            aria-hidden="true"
            :initial="{ opacity: 0, scaleX: 0.6 }"
            :animate="{ opacity: 1, scaleX: 1 }"
            :transition="{ duration: 0.6, ease: suave, delay: 0.25 + i * 0.035 + 0.1 }"
          >
            <span class="h-px flex-1 bg-[repeating-linear-gradient(90deg,var(--color-cadiz)_0_6px,transparent_6px_12px)] opacity-60" />
            <span class="text-[11px] font-semibold text-nuestro">Arriba, directos a cuartos</span>
            <span class="h-px w-4 bg-[repeating-linear-gradient(90deg,var(--color-cadiz)_0_6px,transparent_6px_12px)] opacity-60" />
          </motion.li>
        </template>
      </ol>

      <p v-if="sinEmpezar" class="mt-3 px-2 text-xs text-bruma">Sin partidos jugados, la tabla sale en orden alfabético.</p>

      <PieDatos :actualizado="data.actualizado" :cargando="status === 'pending'" @recargar="refresh()" />
    </template>
  </div>
</template>
