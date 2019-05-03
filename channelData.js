const scrapeIt = require('scrape-it')
const { postDataToAppScript, arrayUnique, arrayWithHttps, getUnique } = require('./utils')
const { scrapeSocials } = require('./scrapeSocials')
const fs = require('fs')

const getChannelData = async (videoEng, subGraph, socialInfo, userChannelId) => {
  //userChannelId = 'UCnj4OF3kAiiNFsyp7pT4bLQ'
  const youtubeAddress = 'https://www.youtube.com'
  const re = /href="[^"]*"/gi
  let channelUrl = `https://www.youtube.com/channel/${userChannelId}/videos`

  let profileUrl
  let profileName
  let profileDesc
  let mainChannelName
  let returnObj = {}
  let channelDetailsArr = []
  channelUrl = `https://www.youtube.com/channel/${userChannelId}/about?view_as=subscriber`
  let dataResult
  await scrapeIt(channelUrl, {
    data: { selector: '#content', how: 'html' },
  }).then(async ({ data, response }) => {
    dataResult = scrapeIt.scrapeHTML(data.data, {
      channelName: { selector: '.channel-header-profile-image', attr: 'alt' },
      channelSubs: {
        selector: '.yt-subscription-button-subscriber-count-branded-horizontal',
        attr: 'title',
      },
      location: '.country-inline',
      articles: {
        listItem: '.branded-page-related-channels-item',
        data: {
          profileName: { selector: '.ux-thumb-wrap', attr: 'href' },
        },
      },
    })

    //console.log('response.statusCode  : ', response.statusCode)

    dataResult.articles.map(el => {
      if (el.profileName.indexOf('user') > -1) {
        profileUrl = youtubeAddress + el.profileName + '/about'
        profileName = el.profileName.split('/')[2]
      } else {
        profileUrl = ''
        profileName = ''
      }
    })

    if (profileUrl !== '' && profileUrl !== undefined) {
      await scrapeIt(profileUrl, {
        data: { selector: '#content', how: 'html' },
      }).then(async ({ data, response }) => {
        let result = scrapeIt.scrapeHTML(data.data, {
          bio: { selector: '.about-description', convert: x => x.replace(/\n/g, ' ') },
        })

        profileDesc = result.bio
      })
    }

    channelDetailsArr.push(
      dataResult.channelName,
      channelUrl,
      dataResult.channelSubs,
      dataResult.location,
      profileName,
      profileDesc !== undefined ? profileDesc : '',
    )

    // console.log('channelDetailsArr', channelDetailsArr)

    mainChannelName = dataResult.channelName !== undefined ? dataResult.channelName : ''
    //}
  })

  //userChannelId = 'UCnj4OF3kAiiNFsyp7pT4bLQ'
  //videoEng = 'Y'

  //let allData = [{ channelInfo: channelDetailsArr }]
  returnObj['channelInfo'] = channelDetailsArr

  //console.log('returnObj', returnObj['channelInfo'])

  //return

  if (videoEng.toLowerCase().indexOf('y') > -1) {
    // console.log('in videoEng')
    //videos
    channelUrl = `https://www.youtube.com/channel/${userChannelId}/videos`

    await scrapeIt(channelUrl, {
      data: { selector: '#content', how: 'html' },
    }).then(async ({ data, response }) => {
      let result = scrapeIt.scrapeHTML(data.data, {
        data: '.yt-lockup-meta',
        linkUrls: { selector: '#channels-browse-content-grid', how: 'html' },
      })

      const filteredData = result.data.split('\n')
      let resultFromSplit = []
      for (let i = 0; i < filteredData.length; i++) {
        const element = filteredData[i]
        resultFromSplit.push(element.split(' ')[0])
      }
      let urlsUnique
      let filteredViews

      if (result['linkUrls'] && result['linkUrls'] !== undefined) {
        let extracted = result.linkUrls.match(re).map(v => v.slice(6, -1))

        urlsUnique = arrayUnique(extracted)

        filteredViews = resultFromSplit.filter(el => parseInt(el))
      }

      let totalNumberViewsLastFourVideos
      if (filteredViews !== undefined) {
        totalNumberViewsLastFourVideos =
          parseFloat(filteredViews[0] || 0) +
          parseFloat(filteredViews[1] || 0) +
          parseFloat(filteredViews[2] || 0) +
          parseFloat(filteredViews[3] || 0)
      }

      if (totalNumberViewsLastFourVideos !== undefined) {
        returnObj['totalViewsLastFourVideos'] = totalNumberViewsLastFourVideos.toString() //.toFixed(3)

        //console.log('totalNumberViewsLastFourVideos', returnObj['totalViewsLastFourVideos'])

        returnObj['urls'] = [
          youtubeAddress + urlsUnique[0],
          youtubeAddress + urlsUnique[1],
          youtubeAddress + urlsUnique[2],
          youtubeAddress + urlsUnique[3],
        ]
      }
    })
  }

  if (subGraph.toLowerCase().indexOf('y') > -1) {
    // return
    //featured channels:
    channelUrl = `https://www.youtube.com/channel/${userChannelId}/channels`

    scrapeIt(channelUrl, {
      data: { selector: '#content', how: 'html' },
    }).then(async ({ data, response }) => {
      let result = scrapeIt.scrapeHTML(data.data, {
        articles: {
          listItem: '.yt-lockup-content',
          data: {
            urls: {
              selector: '.yt-lockup-title  a',
              attr: 'href',
              convert: x => youtubeAddress + x,
            },
            subscriptions: {
              selector: '.yt-subscription-button-subscriber-count-unbranded-horizontal',
              attr: 'aria-label',
              convert: x => x.split(' ')[0],
            },
            name: {
              selector: '.yt-lockup-title a',
              attr: 'title',
            },
          },
        },
      })

      // channel names , channel subscrs , channel urls

      let res = getUnique(result.articles, 'urls')

      res.push(mainChannelName)

      res.map(el => {
        el['mainChannelName'] = mainChannelName
      })

      //console.log('res', res)

      returnObj['subgraph'] = res

      // returnObj.map(el => {
      //   el.push({ mainChannelName: mainChannelName })
      // })
    })
  }

  //console.log('subgraph', returnObj['subgraph'])

  //socialInfo = 'Y'

  if (socialInfo.toLowerCase().indexOf('y') > -1) {
    let dataArr
    let linksArr = []
    //about channel:
    channelUrl = `https://www.youtube.com/channel/${userChannelId}/about`

    await scrapeIt(channelUrl, {
      data: { selector: '#content', how: 'html' },
    }).then(async ({ data, response }) => {
      let result = scrapeIt.scrapeHTML(data.data, {
        bio: { selector: '.about-description', convert: x => x.replace(/\n/g, ' ') },
        stats: { selector: '.about-metadata-stats', convert: x => x.split(' ') },
        articles: {
          listItem: '.channel-links-item',
          data: {
            urls: {
              selector: '.channel-links-item > a',
              attr: 'href',
            },
          },
        },
      })

      let elementWithHttps = arrayWithHttps(result.articles)

      //return

      elementWithHttps.map(el => {
        if (el.urls !== undefined && el.urls !== '') {
          linksArr.push(el.urls)
        }
      })

      dataArr = {
        urls: linksArr,
        views: result.stats[9],
        dateOfJoin: result.stats[23] !== undefined ? result.stats[23] : '',
      }

      returnObj['socialUrl'] = dataArr

      let resultFromSocialPages = await scrapeSocials(dataArr.urls)

      returnObj['socialPagesData'] = resultFromSocialPages
    })

    //console.log('returnObj', returnObj)
  }

  await postDataToAppScript(
    returnObj,
    'allData',
    'https://script.google.com/macros/s/AKfycbzOimqC4o3MdHwtOLP-Q8BGFrDOttQ8rKh-8WATJ6waETN3nHNE/exec',
  )
}

const itterateChannelData = async (videoEng, subGraph, social, channelInfo) => {
  //console.log('channel info arr', channelInfo.length)

  for (let i = 0; i < channelInfo.length; i++) {
    const element = channelInfo[i]

    let userChannelId = element[0].split('/')[4]

    //console.log(userChannelId)

    if (userChannelId !== undefined) {
      await getChannelData(videoEng, subGraph, social, userChannelId)
    }
  }
}

module.exports = { itterateChannelData }
