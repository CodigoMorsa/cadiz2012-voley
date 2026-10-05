/**
 * Tema de la app: "auto" sigue al móvil; "light" y "dark" lo fijan a mano.
 * La elección se guarda en el dispositivo.
 */
export type Tema = 'auto' | 'light' | 'dark'

export const OPCIONES_TEMA = [
  { valor: 'auto', texto: 'Sistema', icono: 'movil' },
  { valor: 'light', texto: 'Claro', icono: 'sol' },
  { valor: 'dark', texto: 'Oscuro', icono: 'luna' },
] as const

export function useTema() {
  const modo = useColorMode({
    attribute: 'data-theme',
    storageKey: 'tema',
    initialValue: 'auto',
    disableTransition: false,
  })

  /** Lo que eligió la persona (auto, light o dark) */
  const eleccion = computed(() => modo.store.value as Tema)
  /** Lo que se ve de verdad ahora mismo (light o dark) */
  const actual = computed(() => modo.state.value as 'light' | 'dark')

  /** Cambia el tema con un círculo que se abre desde donde se tocó */
  async function cambiar(nuevo: Tema, evento?: MouseEvent) {
    if (nuevo === eleccion.value) return
    const doc = document as Document & { startViewTransition?: (cb: () => Promise<void> | void) => { ready: Promise<void> } }
    const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches
    const aplicar = async () => {
      modo.store.value = nuevo
      await nextTick()
      document.documentElement.dataset.theme = modo.state.value
    }

    if (!doc.startViewTransition || sinMovimiento) return aplicar()

    const x = evento?.clientX ?? innerWidth / 2
    const y = evento?.clientY ?? innerHeight / 2
    const radio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
    const transicion = doc.startViewTransition(aplicar)
    await transicion.ready
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio}px at ${x}px ${y}px)`] },
      { duration: 550, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
    )
  }

  return { eleccion, actual, cambiar }
}
