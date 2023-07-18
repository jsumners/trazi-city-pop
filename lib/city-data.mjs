const symData = Symbol('city.data')

/**
 * @typedef {object} CityInfo
 * @property {string} name The name of the city.
 * @property {number} population The population of the city.
 */

/**
 * @typedef {object} StateInfo
 * @property {string} name The name of the state.
 * @property {Map<string, CityInfo>} data Collection of information about each
 * city in the state.
 */

/**
 * An object for handling state and city data. Allows for easy access by state
 * name and city name.
 *
 * @returns {CityData}
 * @constructor
 */
function CityData () {
  if (!(this instanceof CityData)) {
    return new CityData()
  }

  this[symData] = new Map()
}

/**
 * Add new state and city information to the object.
 *
 * @param {string} city
 * @param {string} state
 * @param {number} population
 */
CityData.prototype.addPopulation = function ({ city, state, population }) {
  state = state.toLowerCase()

  if (state === 'boom') {
    throw Error('invalid state name provided')
  }

  const stateData = this[symData].has(state)
    ? this[symData].get(state)
    : {
        name: state,
        data: new Map()
      }

  stateData.data.set(city.toLowerCase(), {
    name: city,
    population: Number(population)
  })

  this[symData].set(state, stateData)
}

/**
 * Retrieve the population of a city in a given state.
 *
 * @param {string} city
 * @param {string} state
 * @returns {undefined|number}
 */
CityData.prototype.getPopulation = function ({ city, state }) {
  city = city.toLowerCase()
  state = state.toLowerCase()

  const stateData = this[symData].get(state)
  if (!stateData) {
    return undefined
  }

  return stateData.data.get(city)?.population
}

/**
 * Determine if a given city and state combination exists within the data set
 * via a case-insensitive lookup.
 *
 * @param {string} city
 * @param {string} state
 * @returns {boolean}
 */
CityData.prototype.hasCity = function ({ city, state }) {
  city = city.toLowerCase()
  state = state.toLowerCase()

  // We can't rely on the internal Map.has methods because
  // we need to consider case insensitivity. Ideally we'd use
  // a data store that can handle this sort of thing for us, but
  // since we are keeping things simple for the sake of the exercise,
  // we are doing it with our own comparison.
  let result = false
  hasIter: for (const [stateName, stateObj] of this[symData]) {
    if (stateName !== state) {
      continue
    }
    for (const [cityName] of stateObj.data) {
      if (cityName !== city) {
        continue
      }
      result = true
      break hasIter
    }
  }
  return result
}

/**
 * Serialize the object into CSV data and write it to a provided stream.
 *
 * @param {WritableStream} stream
 */
CityData.prototype.persist = function ({ stream }) {
  for (const [, state] of this[symData]) {
    for (const [, city] of state.data) {
      stream.write(`${city.name},${state.name},${city.population}\n`)
    }
  }
}

export default CityData
