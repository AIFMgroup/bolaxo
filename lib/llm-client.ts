/**
 * LLM Client Abstraction
 * 
 * Supports both AWS Bedrock (for production/sensitive data) and OpenAI (for development).
 * 
 * AWS Bedrock keeps all data within your AWS account - nothing leaves your infrastructure.
 * This is critical for sensitive DD documents.
 * 
 * Environment variables:
 * - LLM_PROVIDER: 'bedrock' | 'openai' (default: 'bedrock' if AWS credentials present)
 * - AWS_REGION: AWS region for Bedrock (default: 'eu-west-1')
 * - AWS_ACCESS_KEY_ID: AWS credentials
 * - AWS_SECRET_ACCESS_KEY: AWS credentials
 * - OPENAI_API_KEY: Fallback for OpenAI
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMResponse {
  content: string
  model: string
  provider: 'bedrock' | 'openai'
}

export interface LLMOptions {
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
}

// Determine which provider to use
function getProvider(): 'bedrock' | 'openai' {
  const explicit = process.env.LLM_PROVIDER
  if (explicit === 'openai') return 'openai'
  if (explicit === 'bedrock') return 'bedrock'
  
  // Auto-detect: prefer Bedrock if AWS credentials are available
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return 'bedrock'
  }
  
  return 'openai'
}

// AWS Bedrock client (lazy initialized)
let bedrockClient: BedrockRuntimeClient | null = null

function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_BEDROCK_REGION || process.env.AWS_REGION || 'eu-west-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })
  }
  return bedrockClient
}

// Call AWS Bedrock (Claude)
async function callBedrock(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<LLMResponse> {
  const client = getBedrockClient()
  
  // Use Claude 3 Haiku for fast, cost-effective analysis
  // Other options: anthropic.claude-3-sonnet, anthropic.claude-3-opus
  const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-sonnet-4-5-20250514-v1:0'
  
  // Convert messages to Claude format
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const userMessages = messages.filter(m => m.role !== 'system')
  
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: options.maxTokens || 1000,
    temperature: options.temperature || 0.3,
    system: systemMessage,
    messages: userMessages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  }

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  })

  const response = await client.send(command)
  const responseBody = JSON.parse(new TextDecoder().decode(response.body))
  
  return {
    content: responseBody.content[0]?.text || '',
    model: modelId,
    provider: 'bedrock',
  }
}

// Call OpenAI (fallback for development)
async function callOpenAI(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<LLMResponse> {
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  
  const response = await client.chat.completions.create({
    model,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    temperature: options.temperature || 0.3,
    max_tokens: options.maxTokens || 1000,
    ...(options.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
  })

  return {
    content: response.choices[0]?.message?.content || '',
    model,
    provider: 'openai',
  }
}

/**
 * Main LLM function - automatically uses Bedrock or OpenAI based on configuration
 * 
 * For sensitive DD documents, ensure LLM_PROVIDER=bedrock or AWS credentials are set.
 * Data sent to Bedrock stays within your AWS account.
 */
export async function callLLM(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<LLMResponse> {
  const provider = getProvider()
  
  console.log(`[LLM] Using provider: ${provider}`)
  
  if (provider === 'bedrock') {
    return callBedrock(messages, options)
  } else {
    return callOpenAI(messages, options)
  }
}

/**
 * Parse JSON from LLM response (handles markdown code blocks)
 */
export function parseJSONResponse<T = any>(content: string): T {
  // Remove markdown code blocks if present
  let cleaned = content.trim()
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }
  
  return JSON.parse(cleaned.trim())
}

/**
 * Get current LLM provider info (for logging/debugging)
 */
export function getLLMProviderInfo(): { provider: string; secure: boolean } {
  const provider = getProvider()
  return {
    provider,
    secure: provider === 'bedrock', // Bedrock keeps data in AWS
  }
}

