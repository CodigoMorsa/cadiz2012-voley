// Decide hacia qué lado se desliza la página según el orden de las pestañas
const ORDEN = ['/', '/partidos', '/pizarra', '/marcador', '/marcador/historial']
const orden = (ruta: string) => {
  const i = ORDEN.indexOf(ruta)
  return i >= 0 ? i : ORDEN.length
}

export default defineNuxtRouteMiddleware((to, from) => {
  const dir = orden(to.path) >= orden(from.path) ? 'pagina-der' : 'pagina-izq'
  to.meta.pageTransition = { name: dir, mode: 'default' }
})
