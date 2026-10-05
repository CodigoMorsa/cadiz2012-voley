/** Compara nombres de equipo sin tener en cuenta tildes ni mayúsculas */
export function mismoEquipo(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false
  return normalizarNombre(a) === normalizarNombre(b)
}

function normalizarNombre(s: string) {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Siglas para el escudo: "Orka Las Cabezas" → "OLC", "Cádiz 2012 Mixto" → "C12" */
export function siglas(nombre: string): string {
  const limpio = nombre.replace(/^(C\.?\s?V\.?|CV|Club|C\.D\.?)\s*/i, '').replace(/[.\-]/g, ' ')
  const palabras = limpio.split(/\s+/).filter((p) => p && !/^(de|del|la|las|los|el|y)$/i.test(p))
  if (palabras.length === 1) return palabras[0]!.slice(0, 3).toUpperCase()
  return palabras
    .slice(0, 3)
    .map((p) => (/^\d+$/.test(p) ? p.slice(-2) : p[0]!.toUpperCase()))
    .join('')
    .slice(0, 3)
}

/** Color fijo para cada equipo (siempre el mismo para el mismo nombre) */
const TONOS = ['#4C9BE8', '#E8794C', '#9B7BE8', '#3FBF9A', '#E85C8A', '#5CC8E8', '#D9603B', '#E8A14C', '#7A9BB3', '#B36BD1', '#5B7CE8']
export function colorEquipo(nombre: string): string {
  let h = 0
  for (const c of normalizarNombre(nombre)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return TONOS[h % TONOS.length]!
}

/** Fecha de hoy en España, formato YYYY-MM-DD */
export function hoyEnEspana(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date())
}

const aFecha = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(a!, m! - 1, d!))
}

/** "2026-10-10" → "sábado 10 de octubre" */
export function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(aFecha(iso))
}

/** "2026-10-10" → "sáb 10 oct" */
export function fechaCorta(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(aFecha(iso))
    .replace(/\./g, '')
}

/** Partes sueltas para maquetar la fecha: { dia: "10", mes: "oct", semana: "sáb" } */
export function fechaPartes(iso: string) {
  const f = aFecha(iso)
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('es-ES', { ...o, timeZone: 'UTC' }).format(f).replace(/\./g, '')
  return { dia: fmt({ day: 'numeric' }), mes: fmt({ month: 'short' }), semana: fmt({ weekday: 'short' }) }
}

/** Días que faltan desde hoy hasta una fecha */
export function diasHasta(iso: string): number {
  return Math.round((aFecha(iso).getTime() - aFecha(hoyEnEspana()).getTime()) / 86_400_000)
}

/** Texto negro o blanco según lo claro que sea el color de fondo */
export function colorTextoSobre(hex: string): string {
  const h = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const lum = 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!)
  return lum > 0.4 ? '#061A28' : '#FFFFFF'
}
