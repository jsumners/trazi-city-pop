import { URL, fileURLToPath } from 'url'
import Fastify from 'fastify'
import population from './lib/routes/population/index.mjs'
import cityDataPlugin from './lib/plugins/city-data.mjs'

const isRunAsApp = process.argv[1] === fileURLToPath(import.meta.url)

const server = Fastify({
  logger: {
    level: isRunAsApp === true ? 'info' : 'silent'
  }
})
const csvFileUrl = new URL('./city_populations.csv', import.meta.url)
const stateFile = process.env.STATE_FILE ?? './city_populations.csv'
const stateFileUrl = new URL(stateFile, import.meta.url)

// The stateFileUrl is where we will persist any changes made by PUT requests
// to our service. This allows us to retain the original data set for easier
// testing.
server.decorate('stateFileUrl', stateFileUrl)

// Here, we register the Fastify plugins that comprise the business logic
// and route handlers for out applications.
await server.register(cityDataPlugin, { csvFileUrl })
await server.register(population, { prefix: 'api' })

// If we started this as an application, listen to the desired port.
// Otherwise, we do not start the server so that our test suite can utilize
// Fastify's built-in testing tool for testing our routes.
if (isRunAsApp === true) {
  server.listen({ port: 5555 })
}

export default server
