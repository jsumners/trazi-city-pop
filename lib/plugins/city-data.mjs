import loadCsv from '../load-csv.mjs'

/**
 * A simple plugin that utilizes our `loadCsv` function to read in the
 * specified CSV file and decorate the Fastify instance with the resulting
 * data object.
 *
 * @param {object} fastify
 * @param {URL} csvFileUrl
 * @returns {Promise<void>}
 */
async function cityDataPlugin (fastify, { csvFileUrl }) {
  const cityData = await loadCsv({ file: csvFileUrl })
  fastify.decorate('cityData', cityData)
}

// We'd typically use the `fastify-plugin` module to do this, and provide
// some extra metadata around the plugin, but we don't need such for this
// exercise and we want to keep the dependency list down.
cityDataPlugin[Symbol.for('skip-override')] = true

export default cityDataPlugin
