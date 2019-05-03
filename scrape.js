const fetchVideoInfo = require('youtube-info')
const scrapeIt = require('scrape-it')
const { YTSearcher } = require('ytsearcher')
const moment = require('moment')
const h2p = require('html2plaintext')
const { postDataToAppScript, getLatLotOfCity } = require('./utils')
const fs = require('fs')

const API_KEY = 'AIzaSyDhfrxxV6Biga3-VlaeVU6eC08ZG9w4DEg'

const scrape = async (
  UPLOAD_DATE,
  QUERY_INPUT,
  SORT_BY,
  NUMBER_PAGES,
  LOCATION,
  LOCATION_RADIUS,
  SCRIPT_URL,
) => {
  now = moment()
  const todayDate = new Date()

  const hourago = new Date(todayDate.getTime() - 1000 * 60 * 60).toISOString()
  const currentTime = new Date(todayDate.getTime()).toISOString()

  const startOfDay = now
    .startOf('day')
    .add(1, 'hours')
    .toISOString()

  const endOfDay = now
    .endOf('day')
    .add(1, 'hours')
    .toISOString()

  const startOfMounth = now.startOf('month').toISOString()
  const endOfMounth = now.endOf('month').toISOString()

  const startOfYear = now.startOf('year').toISOString()
  const endOfYear = now.endOf('year').toISOString()

  let results
  let searchResult

  const APIKEY = API_KEY
  const QUERY = QUERY_INPUT

  const ytsearcher = new YTSearcher(APIKEY)

  let city = LOCATION.split(',')[0]
  let country = LOCATION.split(',')[1]

  let findedLocation = getLatLotOfCity(city, country)

  //console.log(`${findedLocation.lat.toString()},${findedLocation.lon.toString()}`)

  //return

  if (
    SORT_BY.toLowerCase()
      .trim()
      .replace(/\s/g, '')
      .indexOf('uploaddate') > -1
  ) {
    SORT_BY = 'date'
  }
  if (
    SORT_BY.toLowerCase()
      .trim()
      .replace(/\s/g, '')
      .indexOf('viewcount') > -1
  ) {
    SORT_BY = 'viewCount'
  }
  if (
    SORT_BY.toLowerCase()
      .trim()
      .indexOf('rating') > -1
  ) {
    SORT_BY = 'rating'
  }
  if (SORT_BY === '') {
    SORT_BY = 'relevance'
  }

  if (UPLOAD_DATE !== '') {
    if (
      UPLOAD_DATE.toLowerCase()
        .trim()
        .replace(/\s/g, '')
        .indexOf('lasthour') > -1
    ) {
      if (findedLocation && LOCATION_RADIUS !== '') {
        searchResult = await ytsearcher.search(QUERY, {
          type: 'video',
          publishedAfter: hourago,
          publishedBefore: currentTime,
          order: SORT_BY,
          maxResults: 50,
          location: findedLocation
            ? `${findedLocation.latitude.toString()},${findedLocation.longitude.toString()}`
            : '',
          locationRadius: LOCATION_RADIUS ? LOCATION_RADIUS : '',
        })
      } else {
        searchResult = await ytsearcher.search(QUERY, {
          type: 'video',
          publishedAfter: hourago,
          publishedBefore: currentTime,
          order: SORT_BY,
          maxResults: 50,
        })
      }
    }
    if (
      UPLOAD_DATE.toLowerCase()
        .trim()
        .indexOf('today') > -1
    ) {
      if (findedLocation && LOCATION_RADIUS !== '') {
        searchResult = await ytsearcher.search(QUERY, {
          type: 'video',
          publishedAfter: startOfDay,
          publishedBefore: endOfDay,
          order: SORT_BY,
          maxResults: 50,
          location: findedLocation
            ? `${findedLocation.latitude.toString()},${findedLocation.longitude.toString()}`
            : '',
          locationRadius: LOCATION_RADIUS ? LOCATION_RADIUS : '',
        })
      } else {
        searchResult = await ytsearcher.search(QUERY, {
          type: 'video',
          publishedAfter: startOfDay,
          publishedBefore: endOfDay,
          order: SORT_BY,
          maxResults: 50,
        })
      }
    }
    if (
      UPLOAD_DATE.toLowerCase()
        .trim()
        .replace(/\s/g, '')
        .indexOf('thismonth') > -1
    ) {
      if (findedLocation && LOCATION_RADIUS !== '') {
        searchResult = await ytsearcher.search(QUERY, {
          type: 'video',
          publishedAfter: startOfMounth,
          publishedBefore: endOfMounth,
          order: SORT_BY,
          maxResults: 50,
          location: findedLocation
            ? `${findedLocation.latitude.toString()},${findedLocation.longitude.toString()}`
            : ' ',
          locationRadius: LOCATION_RADIUS ? LOCATION_RADIUS : '',
        })
      } else {
        searchResult = await ytsearcher.search(QUERY, {
          type: 'video',
          publishedAfter: startOfMounth,
          publishedBefore: endOfMounth,
          order: SORT_BY,
          maxResults: 50,
        })
      }
    }
    if (
      UPLOAD_DATE.toLowerCase()
        .trim()
        .replace(/\s/g, '')
        .indexOf('thisyear') > -1
    ) {
      if (findedLocation && LOCATION_RADIUS !== '') {
        searchResult = await ytsearcher.search(QUERY, {
          type: 'video',
          publishedAfter: startOfYear,
          publishedBefore: endOfYear,
          order: SORT_BY,
          maxResults: 50,
          location: findedLocation
            ? `${findedLocation.latitude.toString()},${findedLocation.longitude.toString()}`
            : '',
          locationRadius: LOCATION_RADIUS ? LOCATION_RADIUS : '',
        })
      } else {
        searchResult = await ytsearcher.search(QUERY, {
          type: 'video',
          publishedAfter: startOfYear,
          publishedBefore: endOfYear,
          order: SORT_BY,
          maxResults: 50,
        })
      }
    }
  } else {
    if (findedLocation && LOCATION_RADIUS !== '') {
      searchResult = await ytsearcher.search(QUERY, {
        type: 'video',
        maxResults: 50,
        location: findedLocation
          ? `${findedLocation.latitude.toString()},${findedLocation.longitude.toString()}`
          : '',
        locationRadius: LOCATION_RADIUS ? LOCATION_RADIUS : '',
      })
    } else {
      searchResult = await ytsearcher.search(QUERY, {
        type: 'video',
        maxResults: 50,
      })
    }
  }
  //let secondPage = await searchResult.nextPage()
  //console.log('secondPage', searchResult.currentPage)

  // return
  // let secondPage = null
  let resultsArr = []
  if (NUMBER_PAGES > 1) {
    for (let i = 0; i < NUMBER_PAGES - 1; i++) {
      let secondPage = await searchResult.nextPage()
      //console.log(secondPage)
      if (secondPage !== null) {
        // resultsArr.push(secondPage.currentPage)
        for (let i = 0; i < secondPage.currentPage.length; i++) {
          //   const element = resultsArr[0][i]
          //   // console.log(element)
          await searchYoutubeByid(secondPage.currentPage[i].id, SCRIPT_URL)
          //console.log(secondPage.currentPage[i].id)
        }
      } else {
        for (let i = 0; i < searchResult.currentPage.length; i++) {
          const element = searchResult.currentPage[i]
          await searchYoutubeByid(element.id, SCRIPT_URL)
        }
      }
    }
  } else {
    results = searchResult.currentPage
    for (let i = 0; i < results.length; i++) {
      const element = results[i]
      await searchYoutubeByid(element.id, SCRIPT_URL)
    }
  }
}

const searchYoutubeByid = async (videoId, SCRIPT_URL) => {
  //console.log(videoId)
  //return

  return fetchVideoInfo(videoId).then(async videoInfo => {
    const videoTitle = videoInfo.title
    const linkToVideo = videoInfo.url
    const videoViews = videoInfo.views
    const videoDescription = h2p(videoInfo.description)
    const channelOwner = videoInfo.owner
    const channelUrl = 'https://www.youtube.com/channel/' + videoInfo.channelId
    const datePublished = videoInfo.datePublished

    const dataObjMainSheet = {
      videoTitle,
      linkToVideo,
      videoViews,
      videoDescription: videoDescription.replace(/\n/g, ' '),
      channelOwner,
      channelUrl,
      datePublished,
    }

    await postDataToAppScript([dataObjMainSheet], 'contentIdentification', SCRIPT_URL)
    await scrapeSubscribers(channelUrl, channelOwner, SCRIPT_URL)
  })
}

const scrapeSubscribers = async (channelUrl, channelOwner, SCRIPT_URL) => {
  scrapeIt(channelUrl, {
    subscribers: { selector: '#content', how: 'html' },
  }).then(async ({ data, response }) => {
    let parsedData = h2p(data.subscribers)
    let finalDataSubsc = parsedData
      .replace(/\n/g, ' ')
      .replace(/^\D+/g, '')
      .split(' ')[0]

    const dataObjSecondSheet = {
      channelUrl,
      channelOwner,
      finalDataSubsc,
    }

    await postDataToAppScript([dataObjSecondSheet], 'channelIdentification', SCRIPT_URL)
  })
}

module.exports = { scrape }
