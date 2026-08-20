require('dotenv').config()
const mongoose = require('mongoose')

async function fixIndexes() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log('Connected to MongoDB')

        const collection = mongoose.connection.collection('urls')
        const indexes = await collection.indexes()

        console.log('Current indexes on urls collection:')
        indexes.forEach((idx) => {
            console.log('-', idx.name, JSON.stringify(idx.key))
        })

        const hasCustomAliasIndex = indexes.some((idx) => idx.name === 'customAlias_1')

        if (hasCustomAliasIndex) {
            await collection.dropIndex('customAlias_1')
            console.log('Dropped old customAlias_1 index')
        } else {
            console.log('No customAlias_1 index found, already clean')
        }

        console.log('Done. Now restart your server with npm run dev')
        process.exit(0)
    } catch (err) {
        console.error('Error fixing indexes:', err.message)
        process.exit(1)
    }
}

fixIndexes()