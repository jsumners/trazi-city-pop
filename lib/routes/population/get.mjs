async function handler (req) {
  const { state, city } = req.params
  const population = this.cityData.getPopulation({ city, state })

  if (!population) {
    const result = Error(`cannot find population for ${city}, ${state}`)
    result.statusCode = 400
    return result
  }

  return { population }
}

async function getPopulationPlugin (fastify) {
  fastify.route({
    method: 'get',
    path: '/state/:state/city/:city',
    schema: {
      params: {
        type: 'object',
        properties: {
          state: { type: 'string' },
          city: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            population: { type: 'number' }
          }
        }
      }
    },
    handler
  })
}

export default getPopulationPlugin
