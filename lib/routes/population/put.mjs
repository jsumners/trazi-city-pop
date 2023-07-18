import fs from 'fs'
import { finished } from 'node:stream/promises'

async function handler (req, reply) {
  const {
    params: {
      city,
      state
    },
    body: population
  } = req
  const { cityData } = this

  if (cityData.hasCity({ city, state }) === false) {
    reply.status(201)
  }

  try {
    this.cityData.addPopulation({
      city,
      state,
      population
    })
  } catch (error) {
    // We could just let the error be handled by Fastify, but that'll result
    // in the status code being 500. Since we want it to be 400, we wrap
    // it up in a new error and return that one instead.
    const result = Error(error.message)
    result.statusCode = 400
    return result
  }
}

async function putPopulationPlugin (fastify) {
  // Basic PUT requests will be sent as form data. We need
  // to register a handler for the appropriate content type
  // that will simply pass it through as plain text.
  fastify.addContentTypeParser(
    'application/x-www-form-urlencoded',
    { parseAs: 'string' },
    fastify.defaultTextParser
  )

  // We use an onResponse hook to persist our data to disk. This is effectively
  // an out-of-band sync to disk because at this point the client has already
  // received the response. In a real implementation we would have likely
  // fired off a message to some queue, or the data store directly, to persist
  // the data before the response is sent. But given that we are storing all of
  // this in a serialized CSV, we want to reduce the amount of work we are doing
  // during the request so that the client can receive their response quickly.
  let persisting = false
  let persistTimeout
  async function commit ({ cityData, dest }) {
    persisting = true
    const outStream = fs.createWriteStream(dest)
    cityData.persist({ stream: outStream })
    await finished(outStream)
    persisting = false
  }

  fastify.addHook('onResponse', async function () {
    // We don't want to thrash the disk if previous connections are already
    // writing to disk. If something is already persisting, we will set an
    // out-of-band operation to perform the action, canceling any previously
    // set operation before doing so. Also, we flush to disk when the server
    // shuts down. Of course, there are still edge cases where we could lose
    // data here. But we are ignoring those for the sake of simplicity for
    // this exercise.
    if (persisting === true) {
      if (persistTimeout) clearTimeout(persistTimeout)
      persistTimeout = setTimeout(
        async () => {
          await commit({ cityData: this.cityData, dest: this.stateFileUrl })
        },
        100
      )
      return
    }

    await commit({ cityData: this.cityData, dest: this.stateFileUrl })
  })

  // Flush the data to disk when the server is shutting down.
  fastify.addHook('onClose', async function () {
    await commit({ cityData: this.cityData, dest: this.stateFileUrl })
  })

  fastify.route({
    method: 'put',
    path: '/state/:state/city/:city',
    schema: {
      params: {
        type: 'object',
        properties: {
          state: { type: 'string' },
          city: { type: 'string' }
        }
      },
      body: { type: 'number' }
    },
    handler
  })
}

export default putPopulationPlugin
