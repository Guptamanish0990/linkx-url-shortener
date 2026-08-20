const { createClient } = require('redis')

const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
client.on('error', err => console.error('Redis client error', err))

const connectRedis = async () => {
  if (!process.env.REDIS_URL) return null
  await client.connect()
  return client
}

module.exports = { client, connectRedis }
