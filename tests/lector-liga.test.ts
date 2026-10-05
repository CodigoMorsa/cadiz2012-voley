// @ts-nocheck
// Prueba rápida del lector con HTML de ejemplo: npm run test:parser
import assert from 'node:assert/strict'
import { parsearCalendario, parsearClasificacion } from '../server/utils/comarca-parser.ts'

const clasif = `<html><body><p>Voleibol · Temporada 2026 / 27</p>
<table><thead><tr><th><abbr title="Posición">#</abbr></th><th>Equipo</th><th><abbr title="Partidos jugados">PJ</abbr></th><th>G</th><th>P</th><th>Dif.</th><th>PTS</th></tr></thead>
<tbody>
<tr><td>1</td><td><img alt="x"><span>🏆Amigos Cádiz</span></td><td>16</td><td>14</td><td>2</td><td>+33</td><td>42</td></tr>
<tr><td>7</td><td>Cádiz 2012 Mixto</td><td>16</td><td>6</td><td>10</td><td>−13</td><td>18</td></tr>
</tbody></table><table><tr><td>otra</td></tr></table></body></html>`

const c = parsearClasificacion(clasif)
assert.equal(c.temporada, '2026/27')
assert.equal(c.filas.length, 2)
assert.deepEqual(c.filas[0], { posicion: 1, equipo: 'Amigos Cádiz', pj: 16, g: 14, p: 2, dif: 33, pts: 42 })
assert.equal(c.filas[1].dif, -13)

const equipos = ['Adevi','Amigos Cádiz','C.V.Chiclana','Cádiz 2012 Masculino','Cádiz 2012 Mixto','CV Neo Osuna','Orka Las Cabezas','Vértigo C.D.','CV La Pengue']
const opciones = ['Todos los equipos', ...equipos].map(e => `<option>${e}</option>`).join('')

// Estilo A: textos en <span> separados, cabecera en varias piezas
const calA = `<body><p>Temporada 2026 / 27</p><select>${opciones}</select>
<h2>JORNADAS</h2>
<section><div><strong>JORNADA <span>1</span></strong><span>10-11 oct</span><span>Ida</span></div>
<ul>
<li><span>Cádiz 2012 Mixto</span><span>vs</span><span>Orka Las Cabezas</span><time>sáb, 10 oct · 12:00</time></li>
<li><span>Amigos Cádiz</span><span>vs</span><span>Cádiz 2012 Masculino</span><span>Sin fecha</span></li>
<li>Descansa: <b>CV La Pengue</b></li></ul></section>
<section><div><strong>JORNADA 2</strong><span>17-18 oct</span><span>Ida</span></div><ul>
<li><span>Cádiz 2012 Masculino</span><span>3 - 1</span><span>CV La Pengue</span><span>sáb, 17 oct · 10:00</span></li>
<li>Descansa: <b>Cádiz 2012 Mixto</b></li></ul></section>
<div>Parón de Navidad 26-27 dic</div>
<section><h3>JORNADA 12 · 16-17 ene · Vuelta</h3><ul>
<li>Orka Las Cabezas vs Cádiz 2012 Mixto · Sin fecha</li>
<li>Descansa: CV La Pengue</li></ul></section>
<section><h3><span>JORNADA 4</span><span>31 oct - 1 nov</span></h3><ul><li>Adevi vs Cádiz 2012 Masculino Sin fecha</li></ul></section>
</body>`
const a = parsearCalendario(calA)
assert.equal(a.jornadas.length, 4)
const [j1, j2, j12, j4] = a.jornadas
assert.equal(j1.numero, 1); assert.equal(j1.fase, 'Ida'); assert.equal(j1.inicio, '2026-10-10'); assert.equal(j1.descansa, 'CV La Pengue')
assert.deepEqual([j1.partidos[0].local, j1.partidos[0].visitante, j1.partidos[0].fecha, j1.partidos[0].hora], ['Cádiz 2012 Mixto','Orka Las Cabezas','2026-10-10','12:00'])
assert.equal(j1.partidos[1].fecha, null)
assert.deepEqual(j2.partidos[0].resultado, { local: 3, visitante: 1 })
assert.equal(j2.descansa, 'Cádiz 2012 Mixto')
assert.equal(j12.numero, 12); assert.equal(j12.fase, 'Vuelta'); assert.equal(j12.inicio, '2027-01-16')
assert.equal(j12.partidos[0].visitante, 'Cádiz 2012 Mixto')
assert.equal(j4.inicio, '2026-10-31')

// Estilo B: sin cabeceras reconocibles → se agrupa por "Descansa"
const calB = `<body><p>Temporada 2026 / 27</p><ul>
<li>Cádiz 2012 MixtovsOrka Las Cabezassáb, 10 oct · 12:00</li>
<li>Descansa: CV La Pengue</li>
<li>Orka Las CabezasvsCV Neo Osunasáb, 17 oct · 10:00</li>
<li>Descansa: Cádiz 2012 Mixto</li></ul></body>`
const b = parsearCalendario(calB, equipos)
assert.equal(b.jornadas.length, 2)
assert.equal(b.jornadas[1].numero, 2)
assert.equal(b.jornadas[1].partidos[0].local, 'Orka Las Cabezas')
assert.equal(b.jornadas[1].inicio, '2026-10-17')

console.log('✅ Lector de la liga: todas las pruebas pasan')
