/**
 * Test script to verify AWS credentials for S3 and Bedrock
 * Run with: npx ts-node scripts/test-aws-credentials.ts
 */

import { S3Client, ListBucketsCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

async function testS3() {
  console.log('\n=== Testing S3 ===')
  
  const region = process.env.AWS_S3_REGION || process.env.AWS_REGION || 'eu-north-1'
  const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  const bucketName = process.env.AWS_S3_BUCKET_NAME || 'trestor-dataroom-prod'
  
  console.log('Region:', region)
  console.log('Bucket:', bucketName)
  console.log('Access Key ID:', accessKeyId ? `${accessKeyId.slice(0, 8)}...` : 'MISSING!')
  console.log('Secret Key:', secretAccessKey ? '***SET***' : 'MISSING!')
  
  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ S3 credentials missing!')
    return false
  }
  
  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
  
  try {
    // Test 1: List buckets
    console.log('\n1. Testing ListBuckets...')
    const buckets = await s3.send(new ListBucketsCommand({}))
    console.log('✅ ListBuckets works! Found', buckets.Buckets?.length || 0, 'buckets')
    
    // Test 2: Put a test object
    const testKey = `_test/credentials-test-${Date.now()}.txt`
    console.log(`\n2. Testing PutObject (${testKey})...`)
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: 'Test file from credentials check',
      ContentType: 'text/plain',
    }))
    console.log('✅ PutObject works!')
    
    // Test 3: Get the object
    console.log('\n3. Testing GetObject...')
    const getResult = await s3.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    }))
    console.log('✅ GetObject works! Size:', getResult.ContentLength, 'bytes')
    
    // Test 4: Delete the object
    console.log('\n4. Testing DeleteObject...')
    await s3.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: testKey,
    }))
    console.log('✅ DeleteObject works!')
    
    console.log('\n✅✅✅ S3 ALL TESTS PASSED ✅✅✅')
    return true
  } catch (error: any) {
    console.error('\n❌ S3 Error:', error.name, '-', error.message)
    if (error.name === 'SignatureDoesNotMatch') {
      console.error('   → Check that AWS_S3_SECRET_ACCESS_KEY is correct')
    }
    if (error.name === 'AccessDenied') {
      console.error('   → Check bucket permissions and IAM policy')
    }
    if (error.name === 'NoSuchBucket') {
      console.error('   → Bucket does not exist or wrong region')
    }
    return false
  }
}

async function testBedrock() {
  console.log('\n\n=== Testing Bedrock ===')
  
  const region = process.env.AWS_BEDROCK_REGION || process.env.AWS_REGION || 'eu-west-1'
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-sonnet-4-5-20250514-v1:0'
  
  console.log('Region:', region)
  console.log('Model:', modelId)
  console.log('Access Key ID:', accessKeyId ? `${accessKeyId.slice(0, 8)}...` : 'MISSING!')
  console.log('Secret Key:', secretAccessKey ? '***SET***' : 'MISSING!')
  
  if (!accessKeyId || !secretAccessKey) {
    console.error('❌ Bedrock credentials missing!')
    console.error('   Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY')
    return false
  }
  
  const bedrock = new BedrockRuntimeClient({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
  
  try {
    console.log('\n1. Testing InvokeModel (Claude)...')
    const response = await bedrock.send(new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 50,
        messages: [
          { role: 'user', content: 'Say "Bedrock works!" in Swedish' }
        ],
      }),
    }))
    
    const result = JSON.parse(new TextDecoder().decode(response.body))
    console.log('✅ Bedrock response:', result.content?.[0]?.text || 'No content')
    
    console.log('\n✅✅✅ BEDROCK TEST PASSED ✅✅✅')
    return true
  } catch (error: any) {
    console.error('\n❌ Bedrock Error:', error.name, '-', error.message)
    if (error.name === 'AccessDeniedException') {
      console.error('   → Check IAM permissions for Bedrock')
      console.error('   → Ensure model access is enabled in AWS console')
    }
    if (error.name === 'ValidationException') {
      console.error('   → Model ID might be wrong or not available in region')
    }
    return false
  }
}

async function main() {
  console.log('🔍 AWS Credentials Test')
  console.log('========================')
  console.log('LLM_PROVIDER:', process.env.LLM_PROVIDER || 'not set')
  
  const s3Ok = await testS3()
  const bedrockOk = await testBedrock()
  
  console.log('\n\n=== SUMMARY ===')
  console.log('S3:', s3Ok ? '✅ Working' : '❌ Failed')
  console.log('Bedrock:', bedrockOk ? '✅ Working' : '❌ Failed')
  
  if (!s3Ok || !bedrockOk) {
    console.log('\n📋 Check these Railway environment variables:')
    if (!s3Ok) {
      console.log('   - AWS_S3_REGION (or AWS_REGION)')
      console.log('   - AWS_S3_BUCKET_NAME')
      console.log('   - AWS_S3_ACCESS_KEY_ID (or AWS_ACCESS_KEY_ID)')
      console.log('   - AWS_S3_SECRET_ACCESS_KEY (or AWS_SECRET_ACCESS_KEY)')
    }
    if (!bedrockOk) {
      console.log('   - AWS_REGION (for Bedrock, typically eu-west-1 or us-east-1)')
      console.log('   - AWS_ACCESS_KEY_ID')
      console.log('   - AWS_SECRET_ACCESS_KEY')
      console.log('   - BEDROCK_MODEL_ID (optional)')
    }
    process.exit(1)
  }
  
  console.log('\n🎉 All AWS services working!')
}

main().catch(console.error)

