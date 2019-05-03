const axios = require('axios')
const cities = require('all-the-cities')
const citiesData = require('cities')

//const { getChannelData } = require('./channelData')

const postDataToAppScript = async (data, name, scriptUrl) => {
  let objData = { [name]: data }

  console.log('objData', objData)
  //console.log('objData.allData.channelIdentification', objData.channelIdentification)
  //return
  if (objData !== {}) {
    return axios
      .post(scriptUrl, objData)
      .then(resp => {
        console.log(resp.data)
        return resp.data
      })
      .catch(err => console.log('error', err))
  }
}

const arrayUnique = arr => {
  return arr.filter((item, index) => {
    return arr.indexOf(item) >= index
  })
}

const arrayWithHttps = arr => {
  let newArr = []
  if (arr.length > 0) {
    arr.map(el => {
      if (el.urls.indexOf('https://') > -1) {
        newArr.push(el)
      }
    })
  }
  return newArr
}

const getUnique = (arr, comp) => {
  const unique = arr
    .map(e => e[comp])
    .map((e, i, final) => final.indexOf(e) === i && i)
    .filter(e => arr[e])
    .map(e => arr[e])

  return unique
}

const getLatLotOfCity = (name, stateName) => {
  let cityData
  let returnData
  cities.filter(city => {
    if (city.name === name && city.country === 'US') {
      cityData = citiesData.gps_lookup(city.lat, city.lon)
      if (cityData.state === stateName) {
        returnData = cityData
      }
    }
  })
  //console.log(returnData)
  return returnData
}

//getLatLotOfCity('Houston', 'Mississippi')

module.exports = {
  postDataToAppScript,
  arrayUnique,
  arrayWithHttps,
  getUnique,
  getLatLotOfCity,
}
