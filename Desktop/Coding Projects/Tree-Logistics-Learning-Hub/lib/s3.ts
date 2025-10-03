import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT }),
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'tree-learning-hub'

export interface UploadResult {
  url: string
  key: string
}

export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<UploadResult> {
  const fileExtension = fileName.split('.').pop()
  const randomName = `${crypto.randomBytes(16).toString('hex')}.${fileExtension}`
  const key = `${folder}/${randomName}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
  })

  await s3Client.send(command)

  const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
  
  return { url, key }
}

export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  return getSignedUrl(s3Client, command, { expiresIn })
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.pathname.substring(1) // Remove leading /
  } catch {
    return null
  }
}

export async function uploadDocumentImage(
  file: Buffer,
  fileName: string,
  userId: string,
  documentType: string
): Promise<UploadResult> {
  const folder = `documents/${userId}/${documentType}`
  const contentType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg'
  
  return uploadFile(file, fileName, contentType, folder)
}

