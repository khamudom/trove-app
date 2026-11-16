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
      description: 'A short specific name for the main object in the photo.',
    },
    description: {
      type: ['string', 'null'],
      description: 'Always null. Descriptions are entered by the user.',
    },
    tags: {
      type: 'array',
      maxItems: 1,
      items: { type: 'string' },
      description: 'One short category for the main object, or an empty array when the category is unclear.',
    },
  },
  required: ['name', 'description', 'tags'],
} as const

const MAX_IMAGE_LENGTH = 1_500_000

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

function clip(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 80)
  return text || undefined
}

function promptFor(body: Record<string, unknown>): string {
  const details = [
    clip(body.binName) ? `Bin: ${clip(body.binName)}` : '',
    clip(body.category) ? `Category: ${clip(body.category)}` : '',
    clip(body.location) ? `Location: ${clip(body.location)}` : '',
  ].filter(Boolean)

  return [
    'Identify the main physical object in this photo for a home inventory.',
    details.join('. '),
    'Use the bin details only to disambiguate the object.',
    'Do not copy the bin name into the item name unless the object itself is that thing.',
  ].filter(Boolean).join(' ')
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
    return jsonResponse({ error: 'Image extraction is unavailable' }, 503)
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400)
  }

  const image = body.image
  if (typeof image !== 'string' || !/^data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=\r\n]+$/i.test(image)) {
    return jsonResponse({ error: 'Image must be a base64 data URL' }, 400)
  }
  if (image.length > MAX_IMAGE_LENGTH) {
    return jsonResponse({ error: 'Image is too large' }, 413)
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
        'Name the main object with a short label a person would search for.',
        'A recognizable object always gets a name, such as "Gray suit jacket".',
        'Leave the description null.',
        'Return one short tag for the main category, such as "jacket".',
        'Use an empty tag array when the category is unclear.',
        'Do not invent brands, text, model numbers, or details that are not visible.',
        'Do not copy the bin name or location into the tag.',
        'If several objects are shown, name the main subject.',
        'Use a JSON null for the name only when no object is recognizable.',
        'Use a JSON null for the description when the name and tags already cover what is visible.',
        'Never use the words null, undefined, n/a, or none as a value.',
      ].join(' '),
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: promptFor(body) },
            { type: 'input_image', image_url: image, detail: 'low' },
          ],
        },
      ],
      reasoning: { effort: 'minimal' },
      max_output_tokens: 800,
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
    return jsonResponse({ error: 'Image extraction failed' }, 502)
  }

  const result = await response.json() as OpenAIResponse
  const outputText = result.output
    ?.flatMap((output) => output.content ?? [])
    .find((content) => content.type === 'output_text')
    ?.text

  if (!outputText) {
    return jsonResponse({ error: 'Image extraction returned no result' }, 502)
  }

  try {
    const parsed = JSON.parse(outputText) as Record<string, unknown>
    for (const field of ['name', 'description']) {
      const value = parsed[field]
      if (typeof value === 'string' && /^(null|undefined|n\/a|none)$/i.test(value.trim())) {
        parsed[field] = null
      }
    }
    return jsonResponse(parsed)
  } catch {
    return jsonResponse({ error: 'Image extraction returned an invalid result' }, 502)
  }
})
