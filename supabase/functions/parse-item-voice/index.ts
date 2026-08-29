const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const extractionSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: {
      type: ['string', 'null'],
      description: 'A concise item name without filler words.',
    },
    description: {
      type: ['string', 'null'],
      description: 'Useful details about the item that are not part of its name.',
    },
    tags: {
      type: 'array',
      maxItems: 8,
      items: { type: 'string' },
      description: 'Short categories useful for finding the item later.',
    },
  },
  required: ['name', 'description', 'tags'],
} as const

interface OpenAIResponse {
  output?: Array<{
    content?: Array<{
      type?: string
      text?: string
    }>
  }>
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not configured')
    return jsonResponse({ error: 'Voice extraction is unavailable' }, 503)
  }

  let transcript: unknown
  try {
    const body = await request.json()
    transcript = body?.transcript
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400)
  }

  if (typeof transcript !== 'string' || !transcript.trim() || transcript.length > 1_000) {
    return jsonResponse({ error: 'Transcript must contain 1 to 1000 characters' }, 400)
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-nano',
      instructions: [
        'Extract inventory item fields from natural speech.',
        'The name is the item identity, without phrases such as "this is" or "I have".',
        'Put condition, edition, color, size, and other distinguishing details in description.',
        'Use up to five short tags for categories that are stated or strongly implied.',
        'Do not invent brands, models, or details.',
        'Use null for an unstated name or description and an empty array for unstated tags.',
        'If the speaker is updating only one field, leave the other fields unstated.',
      ].join(' '),
      input: transcript.trim(),
      reasoning: { effort: 'minimal' },
      max_output_tokens: 250,
      store: false,
      text: {
        format: {
          type: 'json_schema',
          name: 'inventory_item',
          strict: true,
          schema: extractionSchema,
        },
      },
    }),
  })

  if (!response.ok) {
    console.error(`OpenAI request failed with status ${response.status}`)
    return jsonResponse({ error: 'Voice extraction failed' }, 502)
  }

  const result = await response.json() as OpenAIResponse
  const outputText = result.output
    ?.flatMap((output) => output.content ?? [])
    .find((content) => content.type === 'output_text')
    ?.text

  if (!outputText) {
    return jsonResponse({ error: 'Voice extraction returned no result' }, 502)
  }

  try {
    return jsonResponse(JSON.parse(outputText))
  } catch {
    return jsonResponse({ error: 'Voice extraction returned an invalid result' }, 502)
  }
})
