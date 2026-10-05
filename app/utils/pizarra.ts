/**
 * Reglas y formaciones de la pizarra táctica.
 *
 * Medidas reales en metros: nuestra media pista mide 9 × 9.
 *   x = 0 (banda izquierda) → 9 (banda derecha), mirando a la red
 *   y = 0 (red) → 9 (línea de fondo). La línea de 3 m está en y = 3.
 *
 * Las zonas siguen el reglamento:   4 3 2   (delantera)
 *                                   5 6 1   (zaguera)
 */

export type Rol = 'C' | 'O' | 'CE' | 'R' | 'L' | 'J'
export type Fase = 'saque' | 'recepcion' | 'ataque' | 'defensa'
export type SistemaId = '5-1' | '6-2' | '4-2' | '6-0'

export interface Punto {
  x: number
  y: number
}

export const ROLES: Record<Rol, { nombre: string; corto: string; color: string }> = {
  C: { nombre: 'Colocador', corto: 'C', color: '#FFC93C' },
  O: { nombre: 'Opuesto', corto: 'O', color: '#FF8A65' },
  CE: { nombre: 'Central', corto: 'Ce', color: '#64B5F6' },
  R: { nombre: 'Receptor', corto: 'R', color: '#4DDBA0' },
  L: { nombre: 'Líbero', corto: 'L', color: '#C792EA' },
  J: { nombre: 'Jugador', corto: 'J', color: '#B0C4D4' },
}

export const FASES: { valor: Fase; texto: string }[] = [
  { valor: 'saque', texto: 'Saque' },
  { valor: 'recepcion', texto: 'Recepción' },
  { valor: 'ataque', texto: 'Ataque' },
  { valor: 'defensa', texto: 'Defensa' },
]

export interface Hueco {
  id: string
  rol: Rol
  etiqueta: string
}

export interface Sistema {
  id: SistemaId
  nombre: string
  resumen: string
  /** Los 6 puestos en orden de rotación: el primero empieza en zona 1, el segundo en zona 2… */
  huecos: Hueco[]
  usaLibero: boolean
}

export const SISTEMAS: Record<SistemaId, Sistema> = {
  '5-1': {
    id: '5-1',
    nombre: '5-1',
    resumen: 'Un único colocador en las seis rotaciones. Opuesto en diagonal al colocador, receptores y centrales en diagonal entre sí.',
    huecos: [
      { id: 'c', rol: 'C', etiqueta: 'Colocador' },
      { id: 'r1', rol: 'R', etiqueta: 'Receptor 1' },
      { id: 'ce1', rol: 'CE', etiqueta: 'Central 1' },
      { id: 'o', rol: 'O', etiqueta: 'Opuesto' },
      { id: 'r2', rol: 'R', etiqueta: 'Receptor 2' },
      { id: 'ce2', rol: 'CE', etiqueta: 'Central 2' },
    ],
    usaLibero: true,
  },
  '6-2': {
    id: '6-2',
    nombre: '6-2',
    resumen: 'Dos colocadores en diagonal. Coloca el que está en zaguera; el de delantera ataca como opuesto. Siempre hay tres atacantes en la red.',
    huecos: [
      { id: 'c1', rol: 'C', etiqueta: 'Colocador 1' },
      { id: 'r1', rol: 'R', etiqueta: 'Receptor 1' },
      { id: 'ce1', rol: 'CE', etiqueta: 'Central 1' },
      { id: 'c2', rol: 'C', etiqueta: 'Colocador 2' },
      { id: 'r2', rol: 'R', etiqueta: 'Receptor 2' },
      { id: 'ce2', rol: 'CE', etiqueta: 'Central 2' },
    ],
    usaLibero: true,
  },
  '4-2': {
    id: '4-2',
    nombre: '4-2',
    resumen: 'Dos colocadores en diagonal. Coloca el que está en delantera, desde zona 2-3. Sistema sencillo, con dos atacantes en la red.',
    huecos: [
      { id: 'c1', rol: 'C', etiqueta: 'Colocador 1' },
      { id: 'r1', rol: 'R', etiqueta: 'Receptor 1' },
      { id: 'ce1', rol: 'CE', etiqueta: 'Central 1' },
      { id: 'c2', rol: 'C', etiqueta: 'Colocador 2' },
      { id: 'r2', rol: 'R', etiqueta: 'Receptor 2' },
      { id: 'ce2', rol: 'CE', etiqueta: 'Central 2' },
    ],
    usaLibero: true,
  },
  '6-0': {
    id: '6-0',
    nombre: '6-0',
    resumen: 'Sin especialistas: todos rotan por todas las posiciones y coloca quien esté en zona 3. Recepción en W con cinco jugadores.',
    huecos: [1, 2, 3, 4, 5, 6].map((n) => ({ id: `j${n}`, rol: 'J' as Rol, etiqueta: `Jugador ${n}` })),
    usaLibero: false,
  },
}

/** Centro de cada zona */
export const BASE: Record<number, Punto> = {
  1: { x: 7.5, y: 6.6 },
  2: { x: 7.5, y: 1.5 },
  3: { x: 4.5, y: 1.5 },
  4: { x: 1.5, y: 1.5 },
  5: { x: 1.5, y: 6.6 },
  6: { x: 4.5, y: 6.6 },
}

export const esDelantera = (zona: number) => zona >= 2 && zona <= 4

/** Zona en la que está el puesto `indice` tras `rot` rotaciones */
export const zonaDe = (indice: number, rot: number) => ((((indice - rot) % 6) + 6) % 6) + 1
/** Puesto que ocupa una zona tras `rot` rotaciones */
export const indiceEnZona = (zona: number, rot: number) => (zona - 1 + rot) % 6

export interface Ficha extends Punto {
  hueco: string
  indice: number
  zona: number
  /** Rol del puesto según el sistema */
  rolBase: Rol
  /** Rol que hace en esta jugada (p. ej. el colocador de delantera en 6-2 ataca como opuesto) */
  rol: Rol
  libero: boolean
  saca: boolean
  coloca: boolean
  recibe: boolean
}

/** Qué puesto coloca en esta rotación */
export function indicePasador(sistema: Sistema, rot: number): number {
  const colocadores = sistema.huecos.map((h, i) => (h.rol === 'C' ? i : -1)).filter((i) => i >= 0)
  switch (sistema.id) {
    case '5-1':
      return colocadores[0]!
    case '6-2':
      return colocadores.find((i) => !esDelantera(zonaDe(i, rot)))!
    case '4-2':
      return colocadores.find((i) => esDelantera(zonaDe(i, rot)))!
    default:
      return indiceEnZona(3, rot)
  }
}

// ---------------------------------------------------------------------------
// Reglas de posición (falta de rotación) en el momento del saque
// ---------------------------------------------------------------------------

/** [zona de atrás, zona de delante] */
const PARES_FONDO: [number, number][] = [[1, 2], [6, 3], [5, 4]]
/** [zona de la izquierda, zona de la derecha] */
const PARES_LADO: [number, number][] = [[4, 3], [3, 2], [5, 6], [6, 1]]

export interface Falta {
  a: string
  b: string
  texto: string
}

/** Comprueba la regla de posiciones en el momento del saque */
export function comprobarPosiciones(fichas: Ficha[], fase: Fase): Falta[] {
  if (fase !== 'saque' && fase !== 'recepcion') return []
  const porZona = new Map(fichas.map((f) => [f.zona, f]))
  // Quien saca no cuenta para la regla
  const cuenta = (z: number) => !(fase === 'saque' && z === 1)
  const faltas: Falta[] = []
  for (const [atras, delante] of PARES_FONDO) {
    if (!cuenta(atras) || !cuenta(delante)) continue
    const a = porZona.get(atras)!
    const d = porZona.get(delante)!
    if (a.y <= d.y) faltas.push({ a: a.hueco, b: d.hueco, texto: `Zona ${atras} tiene que estar más atrás que zona ${delante}` })
  }
  for (const [izq, der] of PARES_LADO) {
    if (!cuenta(izq) || !cuenta(der)) continue
    const i = porZona.get(izq)!
    const d = porZona.get(der)!
    if (i.x >= d.x) faltas.push({ a: i.hueco, b: d.hueco, texto: `Zona ${izq} tiene que estar más a la izquierda que zona ${der}` })
  }
  return faltas
}

/** Ajusta posiciones para que no haya falta, moviendo lo mínimo posible */
function legalizar(fichas: Ficha[], fase: Fase, margen = 0.45) {
  const porZona = new Map(fichas.map((f) => [f.zona, f]))
  const cuenta = (z: number) => !(fase === 'saque' && z === 1)
  for (let vuelta = 0; vuelta < 80; vuelta++) {
    let cambios = false
    for (const [atras, delante] of PARES_FONDO) {
      if (!cuenta(atras) || !cuenta(delante)) continue
      const a = porZona.get(atras)!
      const d = porZona.get(delante)!
      const falta = d.y + margen - a.y
      if (falta > 0.001) {
        a.y += falta / 2
        d.y -= falta / 2
        cambios = true
      }
    }
    for (const [izq, der] of PARES_LADO) {
      if (!cuenta(izq) || !cuenta(der)) continue
      const i = porZona.get(izq)!
      const d = porZona.get(der)!
      const falta = i.x + margen - d.x
      if (falta > 0.001) {
        i.x -= falta / 2
        d.x += falta / 2
        cambios = true
      }
    }
    for (const f of fichas) {
      if (fase === 'saque' && f.saca) continue
      f.x = Math.min(8.6, Math.max(0.4, f.x))
      f.y = Math.min(8.6, Math.max(0.5, f.y))
    }
    if (!cambios) break
  }
}

// ---------------------------------------------------------------------------
// Formaciones
// ---------------------------------------------------------------------------

const DIANAS_RECEPCION: Record<number, Punto[]> = {
  2: [{ x: 2.7, y: 6.2 }, { x: 6.3, y: 6.2 }],
  3: [{ x: 1.6, y: 6.1 }, { x: 4.5, y: 6.6 }, { x: 7.4, y: 6.1 }],
  4: [{ x: 1.3, y: 5.6 }, { x: 3.4, y: 6.6 }, { x: 5.6, y: 6.6 }, { x: 7.7, y: 5.6 }],
  5: [{ x: 1.3, y: 4.6 }, { x: 4.5, y: 4.3 }, { x: 7.7, y: 4.6 }, { x: 2.9, y: 7.4 }, { x: 6.1, y: 7.4 }],
}

type Lado = 'izq' | 'centro' | 'der'
function ladoDeRol(rol: Rol): Lado | null {
  if (rol === 'R') return 'izq'
  if (rol === 'CE' || rol === 'L') return 'centro'
  if (rol === 'C' || rol === 'O') return 'der'
  return null
}

function permutaciones<T>(lista: T[]): T[][] {
  if (lista.length <= 1) return [lista]
  return lista.flatMap((x, i) => permutaciones([...lista.slice(0, i), ...lista.slice(i + 1)]).map((p) => [x, ...p]))
}

function esReceptor(sistema: Sistema, f: Ficha): boolean {
  if (f.coloca) return false
  if (sistema.id === '6-0') return true
  if (sistema.id === '4-2') return !esDelantera(f.zona) || f.rol === 'R'
  return f.rol === 'R' || f.rol === 'L' || (f.rol === 'CE' && !esDelantera(f.zona))
}

export function formacion(sistema: Sistema, rot: number, fase: Fase, conLibero: boolean): Ficha[] {
  const pasador = indicePasador(sistema, rot)
  const fichas: Ficha[] = sistema.huecos.map((h, i) => {
    const zona = zonaDe(i, rot)
    return { hueco: h.id, indice: i, zona, rolBase: h.rol, rol: h.rol, libero: false, saca: zona === 1, coloca: i === pasador, recibe: false, ...BASE[zona]! }
  })

  for (const f of fichas) {
    // En 6-2 y 4-2 el colocador que no coloca hace de opuesto
    if (f.rolBase === 'C' && !f.coloca && sistema.id !== '5-1') f.rol = 'O'
    // El líbero entra por el central de zaguera (salvo si ese central está sacando)
    if (sistema.usaLibero && conLibero && f.rolBase === 'CE' && !esDelantera(f.zona) && !(fase === 'saque' && f.saca)) {
      f.rol = 'L'
      f.libero = true
    }
  }

  const enZona = (z: number) => fichas.find((f) => f.zona === z)!

  if (fase === 'saque') {
    const sacador = enZona(1)
    sacador.x = 7.6
    sacador.y = 10.2
    for (const f of fichas) if (!f.saca && esDelantera(f.zona)) f.y = 1.1
    return fichas
  }

  if (fase === 'recepcion') {
    const colocador = fichas[pasador]!
    const receptores = fichas.filter((f) => esReceptor(sistema, f))
    receptores.forEach((f) => (f.recibe = true))
    const resto = fichas.filter((f) => !f.recibe && !f.coloca)

    // Los que no reciben se esconden: en la red los de delante, al fondo los de atrás
    for (const f of resto) {
      f.x = BASE[f.zona]!.x
      f.y = esDelantera(f.zona) ? 0.8 : 8.4
    }
    if (esDelantera(colocador.zona)) {
      colocador.x = Math.min(BASE[colocador.zona]!.x + 1.1, 8.3)
      colocador.y = 0.8
    }

    // Reparte a los receptores en las dianas buscando el reparto sin faltas y con menos carrera
    const dianas = DIANAS_RECEPCION[receptores.length] ?? DIANAS_RECEPCION[3]!
    let mejor: { coste: number; orden: Punto[] } | null = null
    for (const orden of permutaciones(dianas.slice(0, receptores.length))) {
      receptores.forEach((f, i) => Object.assign(f, orden[i]))
      // El colocador de zaguera aún no está colocado: no se tiene en cuenta aquí
      const ignorar = esDelantera(colocador.zona) ? null : colocador.hueco
      const faltas = comprobarPosiciones(fichas, fase).filter((x) => x.a !== ignorar && x.b !== ignorar).length
      const carrera = receptores.reduce((s, f, i) => s + Math.hypot(BASE[f.zona]!.x - orden[i]!.x, BASE[f.zona]!.y - orden[i]!.y), 0)
      const coste = faltas * 100 + carrera
      if (!mejor || coste < mejor.coste) mejor = { coste, orden }
    }
    receptores.forEach((f, i) => Object.assign(f, mejor!.orden[i]))

    // El colocador de zaguera "penetra": se pega detrás de su compañero de delante
    if (!esDelantera(colocador.zona)) {
      const vecino = enZona(colocador.zona === 1 ? 2 : colocador.zona === 6 ? 3 : 4)
      // Separación suficiente para que no se tapen las fichas
      colocador.x = vecino.x + (colocador.zona === 5 ? 0.8 : 0.9)
      colocador.y = vecino.y + 1.4
    }

    legalizar(fichas, fase)
    return fichas
  }

  if (fase === 'ataque') {
    for (const f of fichas) {
      if (f.coloca) {
        f.x = 6.3
        f.y = 0.9
        continue
      }
      const lado = ladoDeRol(f.rol)
      if (esDelantera(f.zona)) {
        const destino = lado === 'izq' || (!lado && f.zona === 4) ? { x: 0.9, y: 3.7 } : lado === 'centro' || (!lado && f.zona === 3) ? { x: 4.2, y: 2.5 } : { x: 8.2, y: 3.7 }
        Object.assign(f, destino)
      } else {
        // Zagueros: uno prepara el ataque por detrás de los 3 m (pipe) y el resto cubre
        const destino =
          lado === 'izq' ? { x: 4.7, y: 5.2 }
          : lado === 'centro' ? { x: 2.5, y: 6.9 }
          : lado === 'der' ? { x: 7.3, y: 5.8 }
          : f.zona === 5 ? { x: 2.2, y: 6.6 } : f.zona === 6 ? { x: 4.5, y: 7.4 } : { x: 6.8, y: 6.6 }
        Object.assign(f, destino)
      }
    }
    return fichas
  }

  // Defensa: cada uno a su puesto especialista (defensa en perímetro)
  for (const f of fichas) {
    const lado = ladoDeRol(f.rol)
    if (!lado) continue
    const delante = esDelantera(f.zona)
    const destino = {
      izq: delante ? { x: 1.3, y: 1.2 } : { x: 1.3, y: 6.4 },
      centro: delante ? { x: 4.5, y: 0.9 } : { x: 4.5, y: 8.1 },
      der: delante ? { x: 7.7, y: 1.2 } : { x: 7.7, y: 6.4 },
    }[lado]
    Object.assign(f, destino)
  }
  return fichas
}

/** Texto de la rotación: "Colocador en zona 1" */
export function nombreRotacion(sistema: Sistema, rot: number): string {
  if (sistema.id === '6-0') return `Rotación ${rot + 1}`
  return `Colocador en zona ${zonaDe(indicePasador(sistema, rot), rot)}`
}
