export default defineCachedEventHandler(() => obtenerCalendario(), {
  name: 'calendario',
  maxAge: MINUTOS_CACHE * 60,
  swr: true,
})
