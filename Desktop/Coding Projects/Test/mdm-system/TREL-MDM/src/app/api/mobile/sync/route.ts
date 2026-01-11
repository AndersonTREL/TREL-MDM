
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            assetTag,
            serialNumber,
            manufacturer,
            model,
            androidVersion,
            securityPatch,
            appVersion,
            userId
        } = body

        // 1. Find device by Asset Tag or Serial
        let device = await prisma.device.findUnique({ where: { assetTag } })

        if (!device && serialNumber) {
            device = await prisma.device.findUnique({ where: { serialNumber } })
        }

        let status = 'Success'
        let deviceId = device?.id

        if (device) {
            // Update existing
            await prisma.device.update({
                where: { id: device.id },
                data: {
                    manufacturer,
                    model,
                    androidVersion,
                    securityPatch,
                    appVersion,
                    lastSyncAt: new Date(),
                    // If serial was missing, add it
                    serialNumber: device.serialNumber || serialNumber,
                    location: body.location
                }
            })
        } else {
            // Create new (Pending/Assigned)
            // For now, if userId is provided, we could assign? Or just leave In Stock.
            // Let's create as "In Stock" (or "Pending" if we had that state, using In Stock for MVP)
            const newDevice = await prisma.device.create({
                data: {
                    assetTag, // Assuming provided by app or needed
                    serialNumber,
                    manufacturer,
                    model,
                    platform: 'Android',
                    androidVersion,
                    securityPatch,
                    appVersion,
                    status: 'In Stock',
                    lastSyncAt: new Date(),
                    location: body.location
                }
            })
            deviceId = newDevice.id
        }

        // 2. Log Sync
        await prisma.syncLog.create({
            data: {
                deviceId,
                source: 'Android Driver App',
                status,
                payload: JSON.stringify(body),
                userId
            }
        })

        return NextResponse.json({ success: true, deviceId })

    } catch (error) {
        console.error('Sync error:', error)
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
    }
}
