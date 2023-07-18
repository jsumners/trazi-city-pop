import test from 'node:test'
import assert from 'node:assert'
import os from 'node:os'
import crypto from 'node:crypto'
import readline from 'node:readline'
import fs from 'node:fs'
import { stat, unlink } from 'node:fs/promises'
import { URL } from 'node:url'
import { setTimeout } from 'node:timers/promises'
import server from './index.mjs'

await test('GET', async t => {
  await test('Marion, Alabama is correct', async t => {
    const res = await server.inject({
      method: 'get',
      path: '/api/population/state/Alabama/city/Marion'
    })
    assert.deepStrictEqual(res.json(), {
      population: 3178
    })
    assert.strictEqual(res.statusCode, 200)
  })

  await test('invalid combo returns 400', async t => {
    const res = await server.inject({
      method: 'get',
      path: '/api/population/state/Georgia/city/Foobar'
    })
    assert.strictEqual(res.statusCode, 400)
  })

  await test('states are case-insensitive', async t => {
    let res = await server.inject({
      method: 'get',
      path: '/api/population/state/Alabama/city/Marion'
    })
    assert.deepStrictEqual(res.json(), {
      population: 3178
    })

    res = await server.inject({
      method: 'get',
      path: '/api/population/state/alabama/city/Marion'
    })
    assert.deepStrictEqual(res.json(), {
      population: 3178
    })
  })

  await test('cities are case-insensitive', async t => {
    let res = await server.inject({
      method: 'get',
      path: '/api/population/state/Alabama/city/Marion'
    })
    assert.deepStrictEqual(res.json(), {
      population: 3178
    })

    res = await server.inject({
      method: 'get',
      path: '/api/population/state/Alabama/city/marion'
    })
    assert.deepStrictEqual(res.json(), {
      population: 3178
    })
  })
})

await test('PUT', async t => {
  await test('states are case-insensitive', async t => {
    let res = await server.inject({
      method: 'put',
      path: '/api/population/state/Georgia/city/Atlanta',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: '1'
    })
    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(res.body, '')

    res = await server.inject({
      method: 'get',
      path: '/api/population/state/Georgia/city/Atlanta'
    })
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(res.json(), {
      population: 1
    })

    res = await server.inject({
      method: 'put',
      path: '/api/population/state/georgia/city/Atlanta',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: '2'
    })
    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(res.body, '')

    res = await server.inject({
      method: 'get',
      path: '/api/population/state/georgia/city/Atlanta'
    })
    assert.strictEqual(res.statusCode, 200)
    assert.deepStrictEqual(res.json(), {
      population: 2
    })
  })

  await test('returns 400 for bad state', async t => {
    const res = await server.inject({
      method: 'put',
      path: '/api/population/state/boom/city/Atlanta',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: '1'
    })
    assert.strictEqual(res.statusCode, 400)
    assert.deepStrictEqual(
      res.json(),
      {
        statusCode: 400,
        error: 'Bad Request',
        message: 'invalid state name provided'
      }
    )
  })

  await test('returns 201 for new city', async t => {
    const res = await server.inject({
      method: 'put',
      path: '/api/population/state/Fantasia/city/Silver City',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: '1'
    })
    assert.strictEqual(res.statusCode, 201)
  })

  await test('persists writes to disk', async t => {
    const tmpDir = os.tmpdir()
    const tmpFileName = crypto.randomUUID() + '.csv'
    const tmpFileUrl = new URL(`${tmpDir}/${tmpFileName}`, import.meta.url)
    server.stateFileUrl = tmpFileUrl

    await server.inject({
      method: 'put',
      path: '/api/population/state/Fantasia/city/Silver City',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: '1'
    })

    // Give everything time to flush to disk.
    for (let i = 1; i <= 10; i += 1) {
      try {
        await stat(tmpFileUrl)
      } catch {
        await setTimeout(i * 100)
      }
    }

    const readStream = fs.createReadStream(tmpFileUrl)
    const rl = readline.createInterface({
      input: readStream
    })
    const isFantasia = /,Fantasia,/
    for await (const line of rl) {
      if (isFantasia.test(line) === true) {
        assert.strictEqual(line, 'Silver City,Fantasia,1\n')
        break
      }
    }
    rl.close()

    await unlink(tmpFileUrl)
  })
})
