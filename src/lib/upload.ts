import { mkdir } from 'fs/promises'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { join } from 'path'
import { randomUUID } from 'crypto'

export async function saveFile(file: File, folder: string = 'uploads'): Promise<string | null> {
    if (!file || file.size === 0) return null

    // Create unique filename
    const ext = file.name.split('.').pop()
    const filename = `${randomUUID()}.${ext}`

    // Ensure directory exists
    const uploadDir = join(process.cwd(), 'public', folder)
    await mkdir(uploadDir, { recursive: true })

    const filepath = join(uploadDir, filename)

    // Stream file to disk to prevent memory crash
    // @ts-ignore: Readable.fromWeb is available in Node 18+
    const stream = Readable.fromWeb(file.stream())
    await pipeline(stream, createWriteStream(filepath))

    return `/${folder}/${filename}`
}

export async function saveSecureFile(file: File, folder: string = 'uploads'): Promise<{ filePath: string, fileName: string, fileSize: number } | null> {
    if (!file || file.size === 0) return null

    // Create unique filename
    const ext = file.name.split('.').pop()
    const filename = `${randomUUID()}.${ext}`

    // Ensure directory exists - PRIVATE storage outside public
    const uploadDir = join(process.cwd(), 'storage', folder)
    await mkdir(uploadDir, { recursive: true })

    const filepath = join(uploadDir, filename)

    // Stream file to disk
    // @ts-ignore: Readable.fromWeb is available
    const stream = Readable.fromWeb(file.stream())
    await pipeline(stream, createWriteStream(filepath))

    return {
        filePath: `storage/${folder}/${filename}`, // Relative path for internal use
        fileName: file.name,
        fileSize: file.size
    }
}
