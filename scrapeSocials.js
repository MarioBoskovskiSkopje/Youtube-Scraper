const scrapeIt = require('scrape-it')
const fs = require('fs')
const request = require('request-promise')
const cheerio = require('cheerio')
const h2p = require('html2plaintext')

const scrapeSocials = async socialLinks => {
  // const socialLinks = [
  //   'https://www.instagram.com/the_nutri_gurl',
  //   'https://twitter.com/thenutrigurl',
  //   'https://www.facebook.com/thenutrigurl',
  // ]

  //console.log('socialLinks', socialLinks)

  let objData = {}

  for (let i = 0; i < socialLinks.length; i++) {
    const element = socialLinks[i]

    if (element.indexOf('twitter') > -1) {
      let twitterResults = await scrapeTwitter(element)
      objData['twitterResults'] = twitterResults || ''
    }
    if (element.indexOf('facebook') > -1) {
      let facebookResults = await scrapeFacebook(element)
      objData['facebookResults'] = facebookResults || ''
    }
    if (element.indexOf('instagram') > -1) {
      let instagramResults = await scrapeInstagram(element)
      objData['instagramResults'] = instagramResults || ''
    }
  }

  //console.log('objData', objData)

  return objData
}

const scrapeTwitter = async url => {
  let res
  await scrapeIt(url, {
    data: { selector: '.AppContent', how: 'html' },
  })
    .then(async ({ data, response }) => {
      if (data['data'] && data['data'] !== '') {
        res = await scrapeIt.scrapeHTML(data.data, {
          twitterName: { selector: '.username', convert: x => x.split('@')[1].trim() },
          twitterBio: {
            selector: '.ProfileHeaderCard-bio',
            convert: x => x.replace('/', ' ').trim(),
          },
          location: '.ProfileHeaderCard-locationText',
          articles: {
            listItem: '.ProfileNav-item',
            convert: x => x.replace(/[^0-9]/g, ''),
          },
        })
      } else {
        res = ''
      }
      //console.log('twitter res', res)
    })
    .catch(err => {
      // console.log(err)
    })
  return res
}

const scrapeFacebook = async url => {
  let dataObj

  await request(
    url,
    {
      headers: {
        'user-agent': 'curl/7.47.0',
        'accept-language': 'en-US,en',
        accept: '*/*',
      },
    },

    async function(error, response, body) {
      if (error) {
        throw error
      }
      if (response.statusCode === 200) {
        return body
      } else {
        //console.log('HTTP Error: ' + response.statusCode)
        return ''
      }
    },
  )
    .then(el => {
      let res = h2p(el)

      //console.log('res', res)

      let facebookLikes
      let facebookFollows

      let arrayInfo = res.split(' ')
      let arr = []
      for (let index = 0; index < arrayInfo.length; index++) {
        const element = arrayInfo[index]

        if (element.indexOf('All') > -1) {
          if (element.match(/\d+/g) !== null) {
            facebookLikes = element.replace(/\D/g, '')
          }
        }
        if (element.indexOf('this') > -1) {
          arr.push(element)

          if (arr.length > 2) {
            facebookFollows = arr[2].replace(/\D/g, '')
          }
        }
      }
      let facebookBio
      if (res.indexOf('©') > -1) {
        facebookBio = res.split('©')[1].replace(/  /g, '')
      } else {
        facebookBio = ''
      }

      let facebookName = url.split('/')[3]

      dataObj = {
        facebookLikes: facebookLikes || '',
        facebookFollows: facebookFollows || '',
        facebookBio: facebookBio.trim() || '',
        facebookName: facebookName !== undefined ? facebookName.trim() : '',
      }
      // console.log('dataObj', dataObj)
    })
    .catch(err => {
      //console.log(err)
    })

  return dataObj
}

const scrapeInstagram = async url => {
  const BASE_URL = url

  let response = await request(BASE_URL, {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'accept-encoding': 'gzip, deflate, br',
    'accept-language': 'en-US,en;q=0.9,fr;q=0.8,ro;q=0.7,ru;q=0.6,la;q=0.5,pt;q=0.4,de;q=0.3',
    'cache-control': 'max-age=0',
    'upgrade-insecure-requests': '1',
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
  })
    .then(res => {
      return res
    })
    .catch(err => {
      return ''
    })

  let $ = cheerio.load(response)

  let script = $('script')
    .eq(4)
    .html()

  try {
    let {
      entry_data: {
        ProfilePage: {
          [0]: {
            graphql: { user },
          },
        },
      },
    } = JSON.parse(/window\._sharedData = (.+);/g.exec(script)[1])

    let objData = {
      userBio: user.biography.trim() || '',
      followers: user.edge_followed_by.count || '',
      posts: user.edge_owner_to_timeline_media.count || '',
      following: user.edge_follow.count || '',
      userName: user.username.trim() || '',
    }

    //console.log(objData)

    return objData
  } catch (error) {
    return ''
  }
}

//scrapeSocials()

module.exports = { scrapeSocials }
