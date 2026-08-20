require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const mongoose = require('mongoose')
const rateLimit = require('express-rate-limit')
const { createClient } = require('redis')
const { router: urlRouter } = require('./routes/url')
const authRouter = require('./routes/auth')
const Url = require('./models/Url')

const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('tiny'))

const PORT = process.env.PORT || 3000
const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/urlshortener'

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
app.use(limiter)

// Redis client (optional)
let redisClient
async function initRedis() {
  try {
    if (!process.env.REDIS_URL) return
    redisClient = createClient({ url: process.env.REDIS_URL })
    redisClient.on('error', (e) => console.error('Redis error', e))
    await redisClient.connect()
    console.log('Connected to Redis')
  } catch (err) {
    console.warn('Redis not available:', err.message)
  }
}

// Connect Mongo
mongoose.connect(MONGO)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('Mongo connection error', err))

app.get('/', (req, res) => res.json({ message: 'URL shortener backend running' }))

// APIs
app.use('/api/auth', authRouter)
app.use('/api', urlRouter)

// Redirect route
app.get('/:id', async (req, res) => {
  const { id } = req.params
  try {
    // check cache
    if (redisClient) {
      const cached = await redisClient.get(`short:${id}`)
      if (cached) return res.redirect(cached)
    }
    const doc = await Url.findOne({ shortId: id })
    if (!doc) return res.status(404).send('Not found')
    // record click (async)
    doc.clicks += 1
    doc.clicksLog.push({ ip: req.ip, ua: req.get('user-agent'), referrer: req.get('referer') })
    doc.save().catch(e => console.error('save click', e))
    const dest = doc.originalUrl.match(/^https?:\/\//) ? doc.originalUrl : `https://${doc.originalUrl}`
    if (redisClient) {
      redisClient.setEx(`short:${id}`, 60 * 60, dest).catch(() => {})
    }
    return res.redirect(dest)
  } catch (err) {
    console.error(err)
    return res.status(500).send('server error')
  }
})

async function start() {
  await initRedis()
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`))
}

start()
