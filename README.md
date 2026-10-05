# App del Cádiz 2012 Mixto 🏐

App para el móvil con tres pestañas:

- **Liga**: clasificación actual, con nuestro equipo resaltado.
- **Partidos**: próximo rival, siguientes jornadas, resultados y la jornada completa.
- **Pizarra**: pizarra táctica con sistemas 5-1, 6-2, 4-2 y 6-0, las 6 rotaciones, saque, recepción, ataque y defensa, líbero, comprobación de faltas de posición, dibujo de flechas y exportar como imagen.
- **Marcador**: para amistosos. Nombres y colores editables, sets, tiempos muertos, cambios, deshacer e historial.

Los datos de liga y partidos se leen solos de la web de La Comarca (https://la-comarca-hazel.vercel.app).

---

## 1. Probarla en tu ordenador

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Para verla en tu móvil, conecta el móvil a la misma wifi y abre la dirección "Network" que sale en la terminal.

## 2. Publicarla (gratis, en Vercel)

1. Sube esta carpeta a un repositorio de GitHub.
2. Entra en https://vercel.com, pulsa **Add New → Project** e importa el repositorio.
3. Vercel detecta Nuxt solo. Pulsa **Deploy**.
4. En un par de minutos te da un enlace tipo `https://cadiz2012.vercel.app`. Ese es el que compartes con el equipo.

Cada vez que subas cambios a GitHub, Vercel la actualiza sola y al equipo le llega la versión nueva.

## 3. Instalarla en el móvil

- **Android (Chrome)**: abre el enlace → menú ⋮ → **Instalar aplicación**.
- **iPhone (Safari)**: abre el enlace → botón compartir → **Añadir a pantalla de inicio**.

Queda con su icono y a pantalla completa, como una app normal.

---

## Cosas que puedes cambiar

Todo está en `nuxt.config.ts`, en el bloque `runtimeConfig`:

| Qué | Dónde |
|---|---|
| Nombre del equipo (tal cual sale en la web de la liga) | `miEquipo` |
| Puestos que van directos a cuartos | `puestosDirectos` |
| Web de la liga | `ligaUrl` |

Los colores de la app están en `app/assets/css/main.css`: el bloque `@theme` es el modo oscuro y el bloque `:root[data-theme="light"]` es el modo claro.

El modo claro u oscuro sigue al del móvil. También se puede elegir a mano con el botón redondo de arriba a la derecha (o en los ajustes del marcador), y la elección se guarda en el propio móvil.
Cada cuánto se vuelve a leer la web de la liga: `MINUTOS_CACHE` en `server/utils/comarca.ts` (30 min por defecto).

## Si un día la liga o los partidos dejan de cargar

Lo más probable es que la web de la liga haya cambiado su diseño. Todo lo que lee esa web está en un solo archivo: `server/utils/comarca-parser.ts`. Puedes comprobar si sigue funcionando con:

```bash
npm run test:parser
```

Y ver lo que devuelve la app abriendo `/api/clasificacion` y `/api/calendario` en el navegador.

## Cómo está hecha (por si quieres tocar algo)

```
app/
  pages/index.vue            → pestaña Liga
  pages/partidos.vue         → pestaña Partidos
  pages/pizarra.vue          → pizarra táctica
  utils/pizarra.ts           → sistemas, rotaciones, formaciones y regla de posiciones
  composables/usePizarra.ts  → plantilla, alineaciones y jugadas guardadas
  pages/marcador/index.vue   → marcador a pantalla completa
  pages/marcador/historial.vue
  components/marcador/Ajustes.vue → nombres, colores y reglas
  composables/useMarcador.ts → reglas del marcador (puntos, sets, deshacer…)
  composables/useLiga.ts     → datos de liga y "nuestros partidos"
server/
  api/clasificacion.get.ts   → /api/clasificacion
  api/calendario.get.ts      → /api/calendario
  utils/comarca-parser.ts    → lee la web de la liga
```

El marcador guarda todo en el propio móvil: si se cierra la app a mitad de partido, al volver sigue donde estaba. Funciona sin internet.

## Pizarra: cómo se calculan las formaciones

Las posiciones recomendadas de cada sistema, rotación y momento del juego se calculan en `app/utils/pizarra.ts` y siempre cumplen la regla de posiciones en el saque. Puedes comprobarlo con:

```bash
npm run test:pizarra
```

Cuando el entrenador mueve una ficha, ese cambio se guarda solo para esa combinación (por ejemplo, 5-1 · rotación 3 · recepción). El botón "Recolocar" vuelve a la recomendada.
