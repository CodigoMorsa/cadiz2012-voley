/**
 * Toda la lógica del marcador: puntos, sets, tiempos muertos, cambios,
 * deshacer e historial. Se guarda en el móvil, así que si se cierra la
 * app a mitad de partido, al volver sigue donde estaba.
 */
export type Lado = 0 | 1

export interface EquipoMarcador {
  nombre: string
  color: string
}

export interface Reglas {
  setsParaGanar: 2 | 3
  puntosSet: number
  puntosDecisivo: number
  tiemposPorSet: number
  cambiosPorSet: number
  segundosTiempo: number
}

export interface Partida {
  id: string
  inicio: number
  equipos: [EquipoMarcador, EquipoMarcador]
  reglas: Reglas
  setsCerrados: [number, number][]
  puntos: [number, number]
  tiempos: [number, number]
  cambios: [number, number]
  saque: Lado | null
  invertido: boolean
  ganador: Lado | null
  guardada: boolean
}

export interface PartidoGuardado {
  id: string
  fecha: number
  minutos: number
  equipos: [EquipoMarcador, EquipoMarcador]
  sets: [number, number][]
  ganador: Lado | null
  terminado: boolean
}

export const COLORES = ['#F4C430', '#0B3954', '#1F6FB2', '#C8423B', '#2F8F5B', '#7A3E9D', '#E8772E', '#1B1B1B', '#FFFFFF']

export const REGLAS_POR_DEFECTO: Reglas = {
  setsParaGanar: 2,
  puntosSet: 25,
  puntosDecisivo: 15,
  tiemposPorSet: 2,
  cambiosPorSet: 6,
  segundosTiempo: 30,
}

function crearPartida(equipos: [EquipoMarcador, EquipoMarcador], reglas: Reglas): Partida {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    inicio: Date.now(),
    equipos: copiar(equipos),
    reglas: { ...reglas },
    setsCerrados: [],
    puntos: [0, 0],
    tiempos: [0, 0],
    cambios: [0, 0],
    saque: null,
    invertido: false,
    ganador: null,
    guardada: false,
  }
}

const otro = (l: Lado): Lado => (l === 0 ? 1 : 0)

/** Copia independiente (funciona también con datos reactivos) */
export const copiar = <T>(v: T): T => JSON.parse(JSON.stringify(v))

export function useMarcador() {
  const { public: { miEquipo } } = useRuntimeConfig()
  const equiposIniciales: [EquipoMarcador, EquipoMarcador] = [
    { nombre: miEquipo.replace(/\s+mixto$/i, ''), color: '#F4C430' },
    { nombre: 'Rival', color: '#1F6FB2' },
  ]

  const partida = useLocalStorage<Partida>('marcador:partida', crearPartida(equiposIniciales, REGLAS_POR_DEFECTO), { mergeDefaults: true })
  const pila = useLocalStorage<string[]>('marcador:deshacer', [])
  const historial = useLocalStorage<PartidoGuardado[]>('marcador:historial', [])

  /** Último set ganado, para la animación de celebración */
  const setGanado = ref<{ lado: Lado; marcador: string; numero: number; id: number } | null>(null)
  /** +1 o -1 según el último cambio de cada lado (para animar los números hacia arriba o abajo) */
  const sentidoPuntos = ref<[number, number]>([1, 1])

  /** Mensaje corto que aparece encima del marcador */
  const aviso = ref<string | null>(null)
  let temporizadorAviso: ReturnType<typeof setTimeout> | undefined
  function avisar(texto: string, ms = 2600) {
    aviso.value = texto
    clearTimeout(temporizadorAviso)
    temporizadorAviso = setTimeout(() => (aviso.value = null), ms)
  }

  // ---- Datos calculados
  const p = partida
  const numeroSet = computed(() => p.value.setsCerrados.length + 1)
  const esDecisivo = computed(() => numeroSet.value === p.value.reglas.setsParaGanar * 2 - 1)
  const objetivo = computed(() => (esDecisivo.value ? p.value.reglas.puntosDecisivo : p.value.reglas.puntosSet))
  const setsGanados = computed<[number, number]>(() => [
    p.value.setsCerrados.filter(([a, b]) => a > b).length,
    p.value.setsCerrados.filter(([a, b]) => b > a).length,
  ])
  const empezada = computed(() => p.value.setsCerrados.length > 0 || p.value.puntos[0] + p.value.puntos[1] > 0)

  /** "set" o "partido" si ese lado está a un punto de ganarlo */
  const bola = computed<[string | null, string | null]>(() =>
    ([0, 1] as Lado[]).map((l) => {
      if (p.value.ganador !== null) return null
      const mios = p.value.puntos[l]
      const suyos = p.value.puntos[otro(l)]
      if (mios >= objetivo.value - 1 && mios > suyos) {
        return setsGanados.value[l] === p.value.reglas.setsParaGanar - 1 ? 'Punto de partido' : 'Punto de set'
      }
      return null
    }) as [string | null, string | null],
  )

  // ---- Deshacer: se guarda una foto del estado antes de cada acción
  function foto() {
    pila.value.push(JSON.stringify(p.value))
    if (pila.value.length > 150) pila.value.shift()
  }
  function deshacer() {
    const anterior = pila.value.pop()
    if (!anterior) return
    sentidoPuntos.value = [-1, -1]
    partida.value = JSON.parse(anterior)
    // Si se deshace el punto final, el partido sale del historial
    if (!partida.value.guardada) borrarDelHistorial(partida.value.id)
    avisar('Deshecho', 1200)
  }
  const puedeDeshacer = computed(() => pila.value.length > 0)

  // ---- Acciones
  function punto(l: Lado) {
    if (p.value.ganador !== null) return
    foto()
    sentidoPuntos.value = [1, 1]
    const pt = p.value.puntos
    pt[l]++
    p.value.saque = l

    // Cambio de campo a mitad del set decisivo
    const mitad = Math.ceil(objetivo.value / 2)
    if (esDecisivo.value && pt[l] === mitad && pt[otro(l)] < mitad) avisar(`Cambio de campo (${mitad} puntos)`)

    // ¿Se acaba el set?
    if (pt[l] >= objetivo.value && pt[l] - pt[otro(l)] >= 2) {
      p.value.setsCerrados.push([pt[0], pt[1]])
      const marcadorSet = `${Math.max(...pt)}-${Math.min(...pt)}`
      p.value.puntos = [0, 0]
      p.value.tiempos = [0, 0]
      p.value.cambios = [0, 0]

      if (setsGanados.value[l] === p.value.reglas.setsParaGanar) {
        p.value.ganador = l
        guardarEnHistorial(true)
      } else {
        setGanado.value = { lado: l, marcador: marcadorSet, numero: p.value.setsCerrados.length, id: Date.now() }
      }
    }
    vibrar(15)
  }

  function tiempoMuerto(l: Lado): boolean {
    if (p.value.tiempos[l] >= p.value.reglas.tiemposPorSet || p.value.ganador !== null) return false
    foto()
    p.value.tiempos[l]++
    return true
  }

  function cambio(l: Lado) {
    if (p.value.cambios[l] >= p.value.reglas.cambiosPorSet || p.value.ganador !== null) {
      avisar(`${p.value.equipos[l].nombre} no tiene más cambios este set`)
      return
    }
    foto()
    p.value.cambios[l]++
    avisar(`Cambio ${p.value.cambios[l]} de ${p.value.reglas.cambiosPorSet} · ${p.value.equipos[l].nombre}`, 1600)
  }

  function cambiarLados() {
    p.value.invertido = !p.value.invertido
  }

  function aplicarAjustes(equipos: [EquipoMarcador, EquipoMarcador], reglas: Reglas) {
    foto()
    p.value.equipos = copiar(equipos)
    p.value.reglas = { ...reglas }
  }

  function nuevaPartida(equipos = p.value.equipos, reglas = p.value.reglas) {
    if (empezada.value && p.value.ganador === null) guardarEnHistorial(false)
    partida.value = crearPartida(equipos, reglas)
    pila.value = []
  }

  function guardarEnHistorial(terminado: boolean) {
    if (p.value.guardada || !empezada.value) return
    const sets = [...p.value.setsCerrados]
    if (!terminado && p.value.puntos[0] + p.value.puntos[1] > 0) sets.push([...p.value.puntos])
    borrarDelHistorial(p.value.id)
    historial.value.unshift({
      id: p.value.id,
      fecha: p.value.inicio,
      minutos: Math.round((Date.now() - p.value.inicio) / 60_000),
      equipos: copiar(p.value.equipos),
      sets,
      ganador: terminado ? p.value.ganador : null,
      terminado,
    })
    p.value.guardada = true
  }

  function terminarPartida() {
    guardarEnHistorial(false)
    partida.value = crearPartida(p.value.equipos, p.value.reglas)
    pila.value = []
  }

  function borrarDelHistorial(id: string) {
    historial.value = historial.value.filter((h) => h.id !== id)
  }

  function vibrar(ms: number | number[]) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms)
  }

  return {
    partida,
    historial,
    aviso,
    setGanado,
    sentidoPuntos,
    numeroSet,
    esDecisivo,
    objetivo,
    setsGanados,
    empezada,
    bola,
    puedeDeshacer,
    punto,
    tiempoMuerto,
    cambio,
    cambiarLados,
    deshacer,
    aplicarAjustes,
    nuevaPartida,
    terminarPartida,
    borrarDelHistorial,
    avisar,
    vibrar,
  }
}
