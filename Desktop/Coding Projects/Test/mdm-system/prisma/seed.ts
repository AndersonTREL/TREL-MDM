
import { PrismaClient } from '@prisma/client'

// Instantiate PrismaClient
const prisma = new PrismaClient()

async function main() {
    const alice = await prisma.person.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: {
            email: 'alice@example.com',
            name: 'Alice',
            role: 'Employee'
        },
    })

    const bob = await prisma.person.upsert({
        where: { email: 'bob@example.com' },
        update: {},
        create: {
            email: 'bob@example.com',
            name: 'Bob',
            role: 'Manager'
        },
    })

    const charlie = await prisma.person.upsert({
        where: { email: 'charlie@example.com' },
        update: {},
        create: {
            email: 'charlie@example.com',
            name: 'Charlie',
            role: 'Admin'
        }
    })

    console.log({ alice, bob, charlie })

    // Create devices
    const iphone = await prisma.device.upsert({
        where: { assetTag: 'TAB-001' },
        update: {},
        create: {
            assetTag: 'TAB-001',
            manufacturer: 'Apple',
            model: 'iPhone 13',
            platform: 'iOS',
            status: 'Assigned',
            serialNumber: 'SN12345',
            assignment: {
                create: {
                    personId: alice.id
                }
            }
        }
    })

    const samsung = await prisma.device.upsert({
        where: { assetTag: 'TAB-002' },
        update: {},
        create: {
            assetTag: 'TAB-002',
            manufacturer: 'Samsung',
            model: 'Galaxy S21',
            platform: 'Android',
            status: 'In Stock',
            serialNumber: 'SN67890'
        }
    })

    console.log({ iphone, samsung })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
