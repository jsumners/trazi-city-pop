import test from 'node:test'
import assert from 'node:assert'
import { PassThrough } from 'node:stream'
import { finished } from 'node:stream/promises'
import CityData from './city-data.mjs'

await test('initializes empty structure', async t => {
  const cityData = new CityData()
  assert.strictEqual(
    cityData.getPopulation({ city: 'Atlanta', state: 'Georgia' }),
    undefined
  )
})

await test('adds population data', async t => {
  const cityData = new CityData()

  cityData.addPopulation({ city: 'Atlanta', state: 'Georgia', population: 100_000 })
  cityData.addPopulation({ city: 'Douglasville', state: 'Georgia', population: '1000' })

  assert.strictEqual(
    cityData.getPopulation({ city: 'Atlanta', state: 'Georgia' }),
    100_000
  )
  assert.strictEqual(
    cityData.getPopulation({ city: 'Douglasville', state: 'Georgia' }),
    1000
  )
})

await test('blows up for bad state name', async t => {
  const cityData = new CityData()

  try {
    cityData.addPopulation({ city: 'Atlanta', state: 'boom', population: 1000 })
  } catch (error) {
    assert.strictEqual(error.message, 'invalid state name provided')
  }
})

await test('gets population', async t => {
  const cityData = new CityData()

  cityData.addPopulation({ city: 'Atlanta', state: 'Georgia', population: 100_000 })
  assert.strictEqual(
    cityData.getPopulation({ city: 'Atlanta', state: 'Georgia' }),
    100_000
  )

  assert.strictEqual(
    cityData.getPopulation({ city: 'Atlanta', state: 'Douglasville' }),
    undefined
  )
})

await test('can check for cities', async t => {
  const cityData = new CityData()

  cityData.addPopulation({ city: 'Atlanta', state: 'Georgia', population: 100_000 })
  assert.strictEqual(
    cityData.hasCity({ city: 'atlanta', state: 'georgia' }),
    true
  )
  assert.strictEqual(
    cityData.hasCity({ city: 'douglasville', state: 'georgia' }),
    false
  )

  assert.strictEqual(
    cityData.hasCity({ city: 'new york', state: 'new york' }),
    false
  )
})

// Test is skipped because:
// https://github.com/nodejs/node/issues/48819
await test('persists data to a stream', { skip: true }, async t => {
  const cityData = new CityData()

  cityData.addPopulation({ city: 'Atlanta', state: 'Georgia', population: 100_000 })
  cityData.addPopulation({ city: 'Douglasville', state: 'Georgia', population: 1_000 })

  let streamData = ''
  const outStream = new PassThrough({
    transform (chunk, encoding, done) {
      streamData += chunk.toString('utf8')
      done()
    }
  })

  cityData.persist({ stream: outStream })
  outStream.end()
  await finished(outStream)

  assert.strictEqual(
    streamData,
    'Atlanta,Georgia,100000\nDouglasville,Georgia,1000'
  )
})
