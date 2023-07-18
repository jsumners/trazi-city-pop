import fs from 'fs'
import readline from 'readline/promises'
import CityData from './city-data.mjs'

/**
 * Read a CSV file with lines in format `City,State,Population` and build
 * an in-memory object representation.
 *
 * @param {URL} file Path to the CSV file.
 * @returns {Promise<CityData>}
 */
async function loadCsv ({ file } = {}) {
  const stream = fs.createReadStream(file)
  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  })

  const cityData = new CityData()
  for await (const line of rl) {
    const [city, state, population] = line.split(',').map(item => item.trim())
    cityData.addPopulation({ city, state, population })
  }
  rl.close()

  return cityData
}

export default loadCsv
