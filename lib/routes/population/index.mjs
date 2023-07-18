import getPopulationPlugin from './get.mjs'
import putPopulationPlugin from './put.mjs'

async function populationRoutes (fastify) {
  fastify.register(getPopulationPlugin, { prefix: 'population' })
  fastify.register(putPopulationPlugin, { prefix: 'population' })
}

export default populationRoutes
