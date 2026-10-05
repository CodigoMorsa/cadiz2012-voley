export default defineCachedEventHandler(() => obtenerClasificacion(), {
  name: 'clasificacion',
  maxAge: MINUTOS_CACHE * 60,
  swr: true,
})
