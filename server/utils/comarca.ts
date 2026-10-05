import type { Calendario, Clasificacion } from '#shared/types/liga'
import { parsearCalendario, parsearClasificacion } from './comarca-parser'

/** Minutos que se guardan los datos antes de volver a leer la web de la liga */
export const MINUTOS_CACHE = 30

async function descargar(ruta: string): Promise<string> {
  const { ligaUrl } = useRuntimeConfig()
  try {
    return await $fetch<string>(new URL(ruta, ligaUrl).toString(), {
      responseType: 'text',
      timeout: 10_000,
      headers: { 'user-agent': 'Cadiz2012-App/1.0 (app del equipo)' },
    })
  } catch (e: any) {
    throw createError({ statusCode: 502, statusMessage: `No se ha podido abrir la web de la liga (${e?.statusCode ?? 'sin respuesta'})` })
  }
}

function errorDeLectura(e: any): never {
  if (e?.statusCode) throw e
  throw createError({ statusCode: 500, statusMessage: `La web de la liga ha cambiado y no se ha podido leer: ${e?.message}` })
}

export async function obtenerClasificacion(): Promise<Clasificacion> {
  const html = await descargar('/')
  try {
    return parsearClasificacion(html)
  } catch (e) {
    errorDeLectura(e)
  }
}

export async function obtenerCalendario(): Promise<Calendario> {
  const html = await descargar('/calendario')
  // Los equipos de la clasificación ayudan a reconocer nombres si falta el desplegable
  let conocidos: string[] = []
  try {
    conocidos = (await obtenerClasificacion()).filas.map((f) => f.equipo)
  } catch {}
  try {
    const { jornadas, equipos } = parsearCalendario(html, conocidos)
    return { jornadas, equipos, actualizado: new Date().toISOString() }
  } catch (e) {
    errorDeLectura(e)
  }
}
