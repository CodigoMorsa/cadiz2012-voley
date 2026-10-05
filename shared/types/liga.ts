export interface FilaClasificacion {
  posicion: number
  equipo: string
  pj: number
  g: number
  p: number
  dif: number
  pts: number
}

export interface Clasificacion {
  temporada: string | null
  filas: FilaClasificacion[]
  actualizado: string
}

export interface Partido {
  id: string
  jornada: number
  local: string
  visitante: string
  /** YYYY-MM-DD, o null si la web pone "Sin fecha" */
  fecha: string | null
  /** HH:MM, o null */
  hora: string | null
  /** Texto tal cual aparece en la web */
  fechaTexto: string
  resultado: { local: number; visitante: number } | null
}

export interface Jornada {
  numero: number
  /** "10-11 oct" */
  fechas: string | null
  /** Primer día del fin de semana, YYYY-MM-DD */
  inicio: string | null
  fase: 'Ida' | 'Vuelta' | null
  partidos: Partido[]
  descansa: string | null
}

export interface Calendario {
  jornadas: Jornada[]
  equipos: string[]
  actualizado: string
}
