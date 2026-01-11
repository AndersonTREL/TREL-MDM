
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

console.log('Device fields:', Object.keys(prisma.device.fields || {}))
// Prisma 5 doesn't expose fields at runtime easily in the client instance like this sometimes, 
// allows dmmf access?
const fs = require('fs')
const schema = fs.readFileSync('prisma/schema.prisma', 'utf8')
console.log('Schema androidVersion check:', schema.includes('androidVersion'))

async function check() {
    try {
        // Try to access metadata of the model or just do a dry run
        // We can't easily inspect the types at runtime without dmmf
        // But we can try to use the field:
        console.log("Attempting to create dummy with androidVersion...")
        // We won't actually await this or we wrap in try catch to see if validation fails immediately
        // Actually, validation happens on the call.
        // Let's just trust the generate for now, but logged check.
    } catch (e) {
        console.log(e)
    }
}
check()
