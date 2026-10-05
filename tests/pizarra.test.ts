// @ts-nocheck
// Prueba: todas las formaciones de saque y recepción deben ser legales
import assert from 'node:assert/strict'
import { SISTEMAS, FASES, formacion, comprobarPosiciones, zonaDe, indicePasador, nombreRotacion } from '../app/utils/pizarra.ts'

let total = 0
for (const sistema of Object.values(SISTEMAS)) {
  for (let rot = 0; rot < 6; rot++) {
    for (const { valor: fase } of FASES) {
      for (const libero of [true, false]) {
        const f = formacion(sistema, rot, fase, libero)
        assert.equal(f.length, 6)
        assert.deepEqual(new Set(f.map((x) => x.zona)).size, 6)
        const faltas = comprobarPosiciones(f, fase)
        assert.equal(faltas.length, 0, `${sistema.id} rot ${rot} ${fase} líbero=${libero}: ${faltas.map((x) => x.texto).join('; ')}`)
        for (const x of f) {
          if (fase === 'saque' && x.saca) continue
          assert.ok(x.x >= 0 && x.x <= 9 && x.y >= 0 && x.y <= 9, `${sistema.id} ${fase} fuera de pista ${x.hueco} ${x.x},${x.y}`)
        }
        if (libero && sistema.usaLibero && fase !== 'saque') assert.equal(f.filter((x) => x.libero).length, 1)
        total++
      }
    }
  }
}
// Rotación: el de zona 2 pasa a zona 1
assert.equal(zonaDe(1, 1), 1)
assert.equal(zonaDe(0, 1), 6)
// 6-2: coloca siempre el de zaguera; 4-2 el de delantera
for (let rot = 0; rot < 6; rot++) {
  assert.ok(zonaDe(indicePasador(SISTEMAS['6-2'], rot), rot) % 6 <= 1 || zonaDe(indicePasador(SISTEMAS['6-2'], rot), rot) >= 5)
  assert.ok([2, 3, 4].includes(zonaDe(indicePasador(SISTEMAS['4-2'], rot), rot)))
}
console.log(`✅ Pizarra: ${total} formaciones legales`)
const ej = formacion(SISTEMAS['5-1'], 0, 'recepcion', true)
console.log(nombreRotacion(SISTEMAS['5-1'], 0), ej.map((f) => `${f.hueco}(z${f.zona}${f.libero ? ',L' : ''}${f.recibe ? ',rec' : ''}) ${f.x.toFixed(1)},${f.y.toFixed(1)}`).join(' | '))
