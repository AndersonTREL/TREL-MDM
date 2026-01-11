
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    const people = await prisma.person.findMany({
        orderBy: { name: 'asc' },
        include: { assignment: { include: { device: true } } }
    })
    return NextResponse.json(people)
}

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get('content-type') || ''

        let peopleToCreate: any[] = []

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData()
            const file = formData.get('file') as File

            if (!file) {
                return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
            }

            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            // Dynamic import to avoid build issues if xlsx causes trouble on edge or similar (though this is Node runtime)
            const XLSX = await import('xlsx')
            const workbook = XLSX.read(buffer, { type: 'buffer' })
            const sheetName = workbook.SheetNames[0]
            const sheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(sheet)

            // Normalize and Map
            peopleToCreate = jsonData.map((row: any) => {
                // Helper to find key case-insensitively
                const findKey = (patterns: RegExp[]) => Object.keys(row).find(k => patterns.some(p => p.test(k)));

                const firstNameKey = findKey([/^\s*first\s*name\s*$/i, /^\s*name\s*$/i, /^\s*fname\s*$/i]);
                const lastNameKey = findKey([/^\s*last\s*name\s*$/i, /^\s*surname\s*$/i, /^\s*lname\s*$/i]);
                const stationKey = findKey([/^\s*station\s*$/i, /^\s*location\s*$/i, /^\s*hub\s*$/i]);

                const firstName = firstNameKey ? row[firstNameKey] : null;
                const lastName = lastNameKey ? row[lastNameKey] : null; // If name is single column, this might be tricky, but let's assume strict separation
                const station = stationKey ? row[stationKey] : null;

                // Debug log for failed rows
                if (!firstName || !lastName || !station) {
                    console.log('Skipping row due to missing fields:', row);
                    return null;
                }

                return {
                    name: `${firstName} ${lastName}`.trim(),
                    email: `${String(firstName).toLowerCase()}.${String(lastName).toLowerCase()}@example.com`,
                    role: 'Employee',
                    station: String(station)
                }
            }).filter(p => p !== null)

        } else {
            // JSON handling
            const body = await request.json()
            if (Array.isArray(body)) {
                peopleToCreate = body.map(p => ({
                    name: p.name,
                    email: p.email,
                    role: p.role || 'Employee',
                    station: p.station || null
                })).filter(p => p.name && p.email)
            } else {
                return NextResponse.json({ error: 'Expected array or file' }, { status: 400 })
            }
        }

        if (peopleToCreate.length === 0) {
            return NextResponse.json({ error: 'No valid data found' }, { status: 400 })
        }

        // Validate duplicates within the batch could be done here, but Prisma createMany doesn't return created items easily with skipDuplicates
        // For now, we will just try to create. 
        // Note: SQLite doesn't support skipDuplicates in createMany. 
        // We'll process strictly.

        // Enhance: Auto-generate unique emails if collision? 
        // For this demo, we assume emails are unique-ish or we catch error.

        // Let's filter out existing emails to avoid 500s
        const emails = peopleToCreate.map(p => p.email)
        const existing = await prisma.person.findMany({
            where: { email: { in: emails } },
            select: { email: true }
        })
        const existingEmails = new Set(existing.map(e => e.email))

        const finalOps = peopleToCreate.filter(p => !existingEmails.has(p.email))

        if (finalOps.length > 0) {
            await prisma.person.createMany({
                data: finalOps
            })
        }

        return NextResponse.json({
            success: true,
            count: finalOps.length,
            skipped: peopleToCreate.length - finalOps.length
        })

    } catch (e) {
        console.error('API Error:', e)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

        // Check assignments
        const person = await prisma.person.findUnique({
            where: { id },
            include: { assignment: true }
        })

        if (person && person.assignment.length > 0) {
            return NextResponse.json({ error: 'Cannot delete person with active device assignments.' }, { status: 400 })
        }

        await prisma.person.delete({ where: { id } })
        return NextResponse.json({ success: true })

    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
