import { randomBytes } from 'crypto'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

const {
  AWS_S3_REGION,
  AWS_S3_BUCKET_NAME,
  AWS_S3_ACCESS_KEY_ID,
  AWS_S3_SECRET_ACCESS_KEY,
} = process.env

if (!AWS_S3_REGION || !AWS_S3_BUCKET_NAME || !AWS_S3_ACCESS_KEY_ID || !AWS_S3_SECRET_ACCESS_KEY) {
  throw new Error('Missing S3 env vars (AWS_S3_REGION, AWS_S3_BUCKET_NAME, AWS_S3_ACCESS_KEY_ID, AWS_S3_SECRET_ACCESS_KEY)')
}

const s3 = new S3Client({
  region: AWS_S3_REGION,
  credentials: {
    accessKeyId: AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
  },
})

async function main() {
  const key = `test-uploads/smoke-${Date.now()}-${randomBytes(4).toString('hex')}.txt`
  const body = `S3 smoke test at ${new Date().toISOString()}`

  // Upload
  await s3.send(
    new PutObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: 'text/plain',
    })
  )
  console.log('Uploaded:', key)

  // List
  const listed = await s3.send(
    new ListObjectsV2Command({
      Bucket: AWS_S3_BUCKET_NAME,
      Prefix: key,
    })
  )
  console.log('Listed KeyCount:', listed.KeyCount)

  // Get (just to verify metadata; not streaming body here)
  const got = await s3.send(
    new GetObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
    })
  )
  console.log('Got object ContentType:', got.ContentType)

  // Delete
  await s3.send(
    new DeleteObjectCommand({
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
    })
  )
  console.log('Deleted:', key)
}

main().catch((err) => {
  console.error('S3 smoke test failed:', err)
  process.exit(1)
})

