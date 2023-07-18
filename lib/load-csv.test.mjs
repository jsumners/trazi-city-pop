import test from 'node:test'
import assert from 'node:assert'
import { URL } from 'node:url'
import loadCsv from './load-csv.mjs'

await test('loads data correctly', async t => {
  const data = await loadCsv({
    file: new URL('./_test-data/city-pops.csv', import.meta.url)
  })

  assert.strictEqual(
    data.getPopulation({ city: 'Atlanta', state: 'georgia' }),
    100_000
  )
  assert.strictEqual(
    data.getPopulation({ city: 'douglasville', state: 'georgia' }),
    1000
  )
})
