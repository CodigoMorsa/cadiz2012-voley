import type { Calendario, Clasificacion, Jornada, Partido } from '#shared/types/liga'

export function useClasificacion() {
  return useFetch<Clasificacion>('/api/clasificacion', { key: 'clasificacion', lazy: true })
}

export function useCalendario() {
  return useFetch<Calendario>('/api/calendario', { key: 'calendario', lazy: true })
}

export interface MiJornada {
  jornada: Jornada
  partido: Partido | null // null = descansamos
  enCasa: boolean
  rival: string | null
  /** Día de referencia: el del partido o, si no hay, el inicio del fin de semana */
  dia: string | null
}

/** Partidos de nuestro equipo, separados en próximos y jugados */
export function useMisPartidos(calendario: Ref<Calendario | null | undefined>) {
  const { public: { miEquipo } } = useRuntimeConfig()

  const todas = computed<MiJornada[]>(() =>
    (calendario.value?.jornadas ?? []).map((jornada) => {
      const partido = jornada.partidos.find((p) => mismoEquipo(p.local, miEquipo) || mismoEquipo(p.visitante, miEquipo)) ?? null
      const enCasa = !!partido && mismoEquipo(partido.local, miEquipo)
      return {
        jornada,
        partido,
        enCasa,
        rival: partido ? (enCasa ? partido.visitante : partido.local) : null,
        dia: partido?.fecha ?? jornada.inicio,
      }
    }),
  )

  const hoy = hoyEnEspana()
  // Se considera "jugado" si tiene resultado o si ya pasó el fin de semana
  const yaPaso = (j: MiJornada) => {
    if (j.partido?.resultado) return true
    if (!j.dia) return false
    return diasHasta(j.dia) < (j.partido?.fecha ? 0 : -1)
  }

  const proximas = computed(() => todas.value.filter((j) => !yaPaso(j)))
  const jugadas = computed(() => todas.value.filter((j) => yaPaso(j) && j.partido).reverse())
  const siguiente = computed(() => proximas.value.find((j) => j.partido) ?? null)

  /** ¿Ganamos? null si no hay resultado */
  const ganamos = (j: MiJornada): boolean | null => {
    const r = j.partido?.resultado
    if (!r) return null
    return j.enCasa ? r.local > r.visitante : r.visitante > r.local
  }

  return { todas, proximas, jugadas, siguiente, ganamos, hoy }
}
