import type { Fase, Ficha, Punto, Rol, SistemaId } from '~/utils/pizarra'

export interface Jugador {
  id: string
  dorsal: number
  nombre: string
  rol: Rol
}

export interface Alineacion {
  huecos: Record<string, string | null>
  libero: string | null
}

export interface Trazo {
  id: string
  tipo: 'lapiz' | 'flecha'
  color: string
  puntos: Punto[]
}

export interface OpcionesPizarra {
  sistema: SistemaId
  fase: Fase
  rot: number
  libero: boolean
  nombres: boolean
  zonas: boolean
}

export type Herramienta = 'mover' | 'lapiz' | 'flecha'

const nuevoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

const PLANTILLA_INICIAL: Jugador[] = [
  { dorsal: 3, rol: 'C' },
  { dorsal: 8, rol: 'C' },
  { dorsal: 7, rol: 'R' },
  { dorsal: 11, rol: 'R' },
  { dorsal: 4, rol: 'R' },
  { dorsal: 12, rol: 'CE' },
  { dorsal: 15, rol: 'CE' },
  { dorsal: 9, rol: 'O' },
  { dorsal: 1, rol: 'L' },
].map((j, i) => ({ ...j, id: `p${i}`, nombre: '' })) as Jugador[]

/** Alineación automática: coge de la plantilla a quien encaja en cada puesto */
function alineacionAutomatica(sistemaId: SistemaId, plantilla: Jugador[]): Alineacion {
  const sistema = SISTEMAS[sistemaId]
  const usados = new Set<string>()
  const coger = (prueba: (j: Jugador) => boolean) => {
    const j = plantilla.find((x) => !usados.has(x.id) && prueba(x))
    if (j) usados.add(j.id)
    return j?.id ?? null
  }
  const libero = sistema.usaLibero ? coger((j) => j.rol === 'L') : null
  const huecos: Record<string, string | null> = {}
  for (const h of sistema.huecos) {
    huecos[h.id] = h.rol === 'J' ? coger((j) => j.rol !== 'L') : coger((j) => j.rol === h.rol)
  }
  // Si falta alguien con ese rol, se rellena con quien quede
  for (const h of sistema.huecos) if (!huecos[h.id]) huecos[h.id] = coger((j) => j.rol !== 'L')
  return { huecos, libero }
}

export function usePizarra() {
  const plantilla = useLocalStorage<Jugador[]>('pizarra:plantilla', PLANTILLA_INICIAL)
  const alineaciones = useLocalStorage<Partial<Record<SistemaId, Alineacion>>>('pizarra:alineaciones', {})
  const opciones = useLocalStorage<OpcionesPizarra>(
    'pizarra:opciones',
    { sistema: '5-1', fase: 'recepcion', rot: 0, libero: true, nombres: true, zonas: true },
    { mergeDefaults: true },
  )
  const posiciones = useLocalStorage<Record<string, Record<string, Punto>>>('pizarra:posiciones', {})
  const dibujos = useLocalStorage<Record<string, Trazo[]>>('pizarra:dibujos', {})
  const balones = useLocalStorage<Record<string, Punto | null>>('pizarra:balones', {})

  const sistema = computed(() => SISTEMAS[opciones.value.sistema])
  /** Cada combinación sistema + rotación + fase tiene sus propias posiciones y dibujos */
  const clave = computed(() => `${opciones.value.sistema}:${opciones.value.rot}:${opciones.value.fase}`)

  const alineacion = computed<Alineacion>(() => alineaciones.value[opciones.value.sistema] ?? alineacionAutomatica(opciones.value.sistema, plantilla.value))

  function guardarAlineacion(nueva: Alineacion) {
    alineaciones.value = { ...alineaciones.value, [opciones.value.sistema]: nueva }
  }

  const jugador = (id: string | null | undefined) => plantilla.value.find((j) => j.id === id) ?? null

  /** Fichas recomendadas + los cambios que haya hecho el entrenador */
  const recomendadas = computed(() => formacion(sistema.value, opciones.value.rot, opciones.value.fase, opciones.value.libero && !!alineacion.value.libero))
  const fichas = computed<(Ficha & { jugador: Jugador | null })[]>(() => {
    const propias = posiciones.value[clave.value] ?? {}
    return recomendadas.value.map((f) => ({
      ...f,
      ...(propias[f.hueco] ?? {}),
      jugador: f.libero ? jugador(alineacion.value.libero) : jugador(alineacion.value.huecos[f.hueco]),
    }))
  })
  const personalizada = computed(() => !!posiciones.value[clave.value] && Object.keys(posiciones.value[clave.value]!).length > 0)
  const faltas = computed(() => comprobarPosiciones(fichas.value, opciones.value.fase))

  function moverFicha(hueco: string, p: Punto) {
    posiciones.value = { ...posiciones.value, [clave.value]: { ...(posiciones.value[clave.value] ?? {}), [hueco]: p } }
  }
  function restablecer() {
    const { [clave.value]: _, ...resto } = posiciones.value
    posiciones.value = resto
  }

  // ---- Dibujos
  const trazos = computed(() => dibujos.value[clave.value] ?? [])
  function anadirTrazo(t: Omit<Trazo, 'id'>) {
    dibujos.value = { ...dibujos.value, [clave.value]: [...trazos.value, { ...t, id: nuevoId() }] }
  }
  function deshacerTrazo() {
    dibujos.value = { ...dibujos.value, [clave.value]: trazos.value.slice(0, -1) }
  }
  function borrarTrazos() {
    dibujos.value = { ...dibujos.value, [clave.value]: [] }
  }

  // ---- Balón
  const balon = computed(() => balones.value[clave.value] ?? null)
  function moverBalon(p: Punto | null) {
    balones.value = { ...balones.value, [clave.value]: p }
  }

  // ---- Rotar
  function rotar(paso: number) {
    opciones.value.rot = (opciones.value.rot + paso + 6) % 6
  }

  // ---- Plantilla
  function anadirJugador() {
    const usados = new Set(plantilla.value.map((j) => j.dorsal))
    let dorsal = 1
    while (usados.has(dorsal)) dorsal++
    plantilla.value = [...plantilla.value, { id: nuevoId(), dorsal, nombre: '', rol: 'R' }]
  }
  function quitarJugador(id: string) {
    plantilla.value = plantilla.value.filter((j) => j.id !== id)
    // Lo sacamos de las alineaciones donde estuviera
    const limpias: Partial<Record<SistemaId, Alineacion>> = {}
    for (const [s, a] of Object.entries(alineaciones.value) as [SistemaId, Alineacion][]) {
      limpias[s] = {
        huecos: Object.fromEntries(Object.entries(a.huecos).map(([h, j]) => [h, j === id ? null : j])),
        libero: a.libero === id ? null : a.libero,
      }
    }
    alineaciones.value = limpias
  }

  return {
    plantilla,
    opciones,
    sistema,
    clave,
    alineacion,
    guardarAlineacion,
    jugador,
    fichas,
    faltas,
    personalizada,
    moverFicha,
    restablecer,
    trazos,
    anadirTrazo,
    deshacerTrazo,
    borrarTrazos,
    balon,
    moverBalon,
    rotar,
    anadirJugador,
    quitarJugador,
  }
}
