/**
 * Lee el HTML de la web de la liga y lo convierte en datos.
 *
 * Está escrito para ser tolerante: no depende de clases CSS concretas,
 * sino de cosas que se ven en la página (la tabla, las palabras
 * "JORNADA", "vs", "Descansa" y los nombres de los equipos).
 * Si la web cambia mucho, este es el único archivo que habría que tocar.
 */
import * as cheerio from 'cheerio'
import type { Clasificacion, FilaClasificacion, Jornada, Partido } from '../../shared/types/liga'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const RE_MES = '(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\\.?'

/** Quita espacios sobrantes */
export function limpiar(texto: string): string {
  return texto.replace(/\s+/g, ' ').trim()
}

/** Minúsculas y sin tildes, conservando la longitud del texto */
export function normalizar(texto: string): string {
  return Array.from(texto)
    .map((c) => Array.from(c.normalize('NFD'))[0]!.toLowerCase())
    .join('')
}

function aNumero(texto: string): number {
  const n = parseInt(texto.replace(/[−–]/g, '-').replace(/[^\d+-]/g, ''), 10)
  return Number.isNaN(n) ? 0 : n
}

/** Quita trofeos, emojis o símbolos delante del nombre de un equipo */
function limpiarEquipo(texto: string): string {
  return limpiar(texto).replace(/^[^\p{L}\p{N}]+/u, '')
}

// ---------------------------------------------------------------------------
// Clasificación
// ---------------------------------------------------------------------------

export function parsearClasificacion(html: string): Clasificacion {
  const $ = cheerio.load(html)
  const tabla = $('table').first()
  if (!tabla.length) throw new Error('No se ha encontrado la tabla de clasificación')

  // Averigua qué columna es cada dato leyendo la cabecera
  const cabeceras = tabla
    .find('thead th, tr:first-child th')
    .map((_, th) => normalizar(limpiar($(th).text())))
    .get()

  const indice = (prueba: (h: string) => boolean, porDefecto: number) => {
    const i = cabeceras.findIndex(prueba)
    return i >= 0 ? i : porDefecto
  }
  const col = {
    posicion: indice((h) => h.startsWith('#') || h.startsWith('pos'), 0),
    equipo: indice((h) => h.startsWith('equipo'), 1),
    pj: indice((h) => h.startsWith('pj'), 2),
    g: indice((h) => h === 'g' || h.startsWith('g ') || h.startsWith('ganad'), 3),
    p: indice((h) => h === 'p' || h.startsWith('p ') || h.startsWith('perdid'), 4),
    dif: indice((h) => h.startsWith('dif'), 5),
    pts: indice((h) => h.startsWith('pts') || h.startsWith('punt'), 6),
  }

  const filas: FilaClasificacion[] = []
  tabla.find('tr').each((_, tr) => {
    const celdas = $(tr)
      .find('td')
      .map((_, td) => limpiar($(td).text()))
      .get()
    if (celdas.length < 5) return
    const equipo = limpiarEquipo(celdas[col.equipo] ?? '')
    if (!equipo) return
    filas.push({
      posicion: aNumero(celdas[col.posicion] ?? '') || filas.length + 1,
      equipo,
      pj: aNumero(celdas[col.pj] ?? ''),
      g: aNumero(celdas[col.g] ?? ''),
      p: aNumero(celdas[col.p] ?? ''),
      dif: aNumero(celdas[col.dif] ?? ''),
      pts: aNumero(celdas[col.pts] ?? ''),
    })
  })

  if (!filas.length) throw new Error('La tabla de clasificación está vacía')

  const temporada = $('body').text().match(/Temporada\s*(\d{4}\s*\/\s*\d{2})/i)?.[1]?.replace(/\s/g, '') ?? null

  return { temporada, filas, actualizado: new Date().toISOString() }
}

// ---------------------------------------------------------------------------
// Calendario
// ---------------------------------------------------------------------------

/** Textos sueltos dentro de un elemento, en orden */
function textosHoja($: cheerio.CheerioAPI, el: any): string[] {
  const salida: string[] = []
  const recorrer = (nodo: any) => {
    if (nodo.type === 'text') {
      const t = limpiar(nodo.data ?? '')
      if (t) salida.push(t)
    } else if (nodo.children) {
      nodo.children.forEach(recorrer)
    }
  }
  recorrer(el)
  return salida
}

/** Convierte "17 oct" (+ año de inicio de temporada) en "2026-10-17" */
function fechaISO(dia: number, mes: string, anioInicio: number): string {
  const m = MESES.indexOf(mes.slice(0, 3).toLowerCase())
  const anio = m >= 7 ? anioInicio : anioInicio + 1 // de agosto en adelante: primer año
  return `${anio}-${String(m + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

interface Encontrado {
  equipo: string
  inicio: number
  fin: number
}

/** Busca los nombres de equipo dentro de un texto, en orden de aparición */
function buscarEquipos(texto: string, equipos: string[]): Encontrado[] {
  let norm = normalizar(texto)
  const encontrados: Encontrado[] = []
  // Los nombres largos primero, para no confundir "Cádiz 2012 Mixto" con otros
  for (const equipo of [...equipos].sort((a, b) => b.length - a.length)) {
    const buscado = normalizar(equipo)
    let i = norm.indexOf(buscado)
    while (i >= 0) {
      encontrados.push({ equipo, inicio: i, fin: i + buscado.length })
      norm = norm.slice(0, i) + ' '.repeat(buscado.length) + norm.slice(i + buscado.length)
      i = norm.indexOf(buscado)
    }
  }
  return encontrados.sort((a, b) => a.inicio - b.inicio)
}

const RE_RESULTADO = /(?<![\d:])([0-3])\s*[-–]\s*([0-3])(?![\d:])/

function parsearPartido(texto: string, equipos: string[], jornada: number, anioInicio: number, n: number): Partido | null {
  const hallados = buscarEquipos(texto, equipos)
  if (hallados.length < 2) return null
  const [a, b] = hallados as [Encontrado, Encontrado]

  const enMedio = texto.slice(a.fin, b.inicio)
  const resto = limpiar(texto.slice(b.fin))

  // ¿Ya se ha jugado? El resultado puede ir entre los equipos o al final
  const res = enMedio.match(RE_RESULTADO) ?? resto.match(RE_RESULTADO)
  const resultado = res ? { local: Number(res[1]), visitante: Number(res[2]) } : null

  const f = resto.match(new RegExp(`(\\d{1,2})\\s+${RE_MES}`, 'i'))
  const h = resto.match(/(\d{1,2}):(\d{2})/)

  return {
    id: `j${jornada}-${n}`,
    jornada,
    local: a.equipo,
    visitante: b.equipo,
    fecha: f ? fechaISO(Number(f[1]), f[2]!, anioInicio) : null,
    hora: h ? `${h[1]!.padStart(2, '0')}:${h[2]}` : null,
    fechaTexto: resto.replace(RE_RESULTADO, '').trim() || 'Sin fecha',
    resultado,
  }
}

export function parsearCalendario(html: string, equiposConocidos: string[] = []): { jornadas: Jornada[]; equipos: string[] } {
  const $ = cheerio.load(html)
  const textoPagina = $('body').text()

  const anioInicio = Number(textoPagina.match(/Temporada\s*(\d{4})/i)?.[1]) ||
    (new Date().getMonth() >= 7 ? new Date().getFullYear() : new Date().getFullYear() - 1)

  // Lista de equipos: el desplegable "Ver equipo" + los que conozcamos
  const equipos = new Set<string>(equiposConocidos)
  $('option').each((_, o) => {
    const t = limpiarEquipo($(o).text())
    if (t && !/todos/i.test(t)) equipos.add(t)
  })
  const listaEquipos = [...equipos]
  if (!listaEquipos.length) throw new Error('No se han encontrado los nombres de los equipos')

  const jornadas: Jornada[] = []
  let actual: Jornada | null = null
  let cerrada = true // tras un "Descansa", el siguiente partido abre jornada nueva

  const nuevaJornada = (numero?: number): Jornada => {
    const j: Jornada = {
      numero: numero ?? (jornadas.at(-1)?.numero ?? 0) + 1,
      fechas: null,
      inicio: null,
      fase: null,
      partidos: [],
      descansa: null,
    }
    jornadas.push(j)
    cerrada = false
    return j
  }

  $('body *').each((_, el) => {
    const nodo = $(el)
    const tag = (el as any).tagName?.toLowerCase()

    // --- Cabecera de jornada: "JORNADA 1 · 10-11 oct · Ida"
    if (tag !== 'li' && !nodo.find('li').length) {
      const texto = limpiar(nodo.text())
      const padre = nodo.parent()
      const padreTambien = padre.length && !padre.find('li').length && /^JORNADA\s*\d/i.test(limpiar(padre.text()))
      if (/^JORNADA\s*\d/i.test(texto) && !padreTambien) {
        const partes = textosHoja($, el)
        const unido = partes.join(' | ')
        const numero = Number(unido.match(/JORNADA\s*\|?\s*(\d{1,2})/i)?.[1]) || undefined
        actual = nuevaJornada(numero)
        const sinTitulo = unido.replace(/JORNADA\s*\|?\s*\d{1,2}/i, ' ')
        const rango = sinTitulo
          .match(new RegExp(`\\d{1,2}\\s*(?:${RE_MES})?\\s*[-–]\\s*\\d{1,2}\\s*${RE_MES}|\\d{1,2}\\s+${RE_MES}`, 'i'))?.[0]
          ?.trim()
        if (rango) {
          actual.fechas = rango
          const r = rango.match(new RegExp(`(\\d{1,2})(?:\\s*${RE_MES})?.*?${RE_MES}`, 'i'))
          if (r) actual.inicio = fechaISO(Number(r[1]), (r[2] ?? r[3])!, anioInicio)
        }
        const fase = unido.match(/\b(Ida|Vuelta)\b/i)?.[1]
        if (fase) actual.fase = fase.toLowerCase() === 'ida' ? 'Ida' : 'Vuelta'
      }
      return
    }

    if (tag !== 'li') return
    const texto = limpiar(nodo.text())

    // --- "Descansa: Equipo"
    if (/descansa/i.test(texto)) {
      const eq = buscarEquipos(texto, listaEquipos)[0]
      if (eq) {
        if (!actual || cerrada) actual = nuevaJornada()
        actual.descansa = eq.equipo
        cerrada = true
      }
      return
    }

    // --- Partido
    if (!actual || cerrada) actual = nuevaJornada()
    const partido = parsearPartido(texto, listaEquipos, actual.numero, anioInicio, actual.partidos.length + 1)
    if (partido) actual.partidos.push(partido)
  })

  const validas = jornadas.filter((j) => j.partidos.length || j.descansa)
  if (!validas.length) throw new Error('No se han encontrado partidos en el calendario')

  // Si una jornada no trae fecha propia, se deduce de sus partidos
  for (const j of validas) {
    if (!j.inicio) j.inicio = j.partidos.map((p) => p.fecha).filter(Boolean).sort()[0] ?? null
  }

  return { jornadas: validas, equipos: listaEquipos }
}
