
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const devices = await prisma.device.findMany({
            include: {
                assignment: {
                    include: { person: true }
                }
            }
        })
        return NextResponse.json(devices)
    } catch (error) {
        console.error('Error fetching devices:', error)
        return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const device = await prisma.device.create({
            data: {
                assetTag: body.assetTag,
                serialNumber: body.serialNumber,
                imei: body.imei,
                platform: body.platform,
                manufacturer: body.manufacturer,
                model: body.model,
                status: 'In Stock', // Default status
                notes: body.notes,
                location: body.location
            }
        })
        return NextResponse.json(device)
    } catch (error) {
        console.error('Error creating device:', error)
        return NextResponse.json({ error: 'Failed to create device' }, { status: 500 })
    }
}
