const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const queue = require('queue')
const q = queue()

const { scrape } = require('./scrape')
const { itterateChannelData } = require('./channelData')

const PORT = 4000

let port = normalizePort(process.env.PORT || PORT)

let results = []

app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '5mb',
    parameterLimit: 100000,
  }),
)
app.use(
  bodyParser.json({
    limit: '5mb',
  }),
)

app.post('/searchvideos', async (req, res) => {
  const {
    inputUploadDate,
    inputQuery,
    inputSortBy,
    inputNumberOfVideos,
    inputLocation,
    inputLocationRadius,
    scriptUrl,
  } = req.body

  //console.log(req.body)

  q.push(async cb => {
    await scrape(
      inputUploadDate,
      inputQuery,
      inputSortBy,
      inputNumberOfVideos,
      inputLocation,
      inputLocationRadius,
      scriptUrl,
    )
    cb()
  })

  q.start()

  res.send({ msg: 'success' })
})

app.post('/getchannelinfo', async (req, res) => {
  const { videoEng, subGraph, social, channelInfo } = req.body

  q.push(async cb => {
    await itterateChannelData(videoEng, subGraph, social, channelInfo)
    cb()
  })

  q.start()

  res.send({ msg: 'success' })
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

function normalizePort(val) {
  let port = parseInt(val, 10)

  if (isNaN(port)) {
    // named pipe
    return val
  }

  if (port >= 0) {
    // port number
    return port
  }

  return false
}
