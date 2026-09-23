const AI_PROVIDERS = {
  test: {
    id: 'test',
    name: 'Test Provider',
    type: 'test',
    enabled: true
  },

  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    type: 'image',
    enabled: false
  },

  openai: {
    id: 'openai',
    name: 'OpenAI',
    type: 'image',
    enabled: false
  },

  flux: {
    id: 'flux',
    name: 'FLUX',
    type: 'image',
    enabled: false
  }
};


const DEFAULT_PROVIDER = 'test';


function getProvider(providerId) {

  const provider =
    AI_PROVIDERS[providerId];

  if (!provider) {
    return null;
  }

  return provider;
}


async function generateWithGemini(body) {

  const apiKey =
    process.env.GEMINI_API_KEY;

  if (!apiKey) {

    throw new Error(
      'GEMINI_API_KEY is not configured.'
    );

  }

  const prompt = [
    body.prompt || '',
    body.instructions || '',
    body.style
      ? `Visual style: ${body.style}`
      : '',
    body.aspect
      ? `Aspect ratio: ${body.aspect}`
      : ''
  ]
    .filter(Boolean)
    .join('\n\n');

  const response =
    await fetch(
      'https://generativelanguage.googleapis.com/v1beta/interactions',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },

        body: JSON.stringify({
          model: 'gemini-3.1-flash-image',

          input: prompt,

          response_format: {
            type: 'image',
            mime_type: 'image/png',
            aspect_ratio:
              body.aspect || '1:1'
          }
        })
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data?.error?.message ||
      'Gemini image generation failed.'
    );

  }

  const image =
    data?.output_image;

  if (!image?.data) {

    throw new Error(
      'Gemini returned no generated image.'
    );

  }

  return {
    resultUrl:
      `data:${image.mime_type || 'image/png'};base64,${image.data}`,

    resultName:
      `gemini-${body.id || Date.now()}.png`
  };

}


function getAvailableProviders() {

  return Object.values(AI_PROVIDERS)
    .filter(provider => provider.enabled)
    .map(provider => ({
      id: provider.id,
      name: provider.name,
      type: provider.type
    }));

}


export default async function handler(req, res) {

  if (req.method !== 'POST') {

    return res.status(405).json({
      ok: false,
      error: 'Method not allowed'
    });

  }


  try {

    const body =
      req.body || {};


    const requestedProvider =
      body.provider ||
      DEFAULT_PROVIDER;


    const provider =
      getProvider(requestedProvider);

    if (!provider.enabled) {

  return res.status(400).json({
    ok: false,
    error: 'Requested AI provider is currently disabled.',
    provider: provider.id,
    availableProviders:
      getAvailableProviders()
  });

    }


    if (provider.id === 'gemini') {

  const result =
    await generateWithGemini(body);

  return res.status(200).json({

    ok: true,

    gateway: {
      connected: true,
      provider: provider.id,
      providerName: provider.name,
      providerType: provider.type
    },

    request: {
      id: body.id || null,
      type: body.type || 'image',
      prompt: body.prompt || '',
      instructions: body.instructions || '',
      style: body.style || '',
      aspect: body.aspect || '',
      duration: body.duration || ''
    },

    result: {
      resultUrl:
        result.resultUrl,

      resultName:
        result.resultName
    },

    message:
      'Gemini image generation completed.',

    availableProviders:
      getAvailableProviders()

  });

  }

    if (!provider.enabled) {

      return res.status(400).json({
        ok: false,
        error: 'Requested AI provider is currently disabled.',
        provider: provider.id,
        availableProviders:
          getAvailableProviders()
      });

    }


    return res.status(200).json({

      ok: true,

      gateway: {
        connected: true,
        provider: provider.id,
        providerName: provider.name,
        providerType: provider.type
      },

      request: {
        id: body.id || null,
        type: body.type || 'image',
        prompt: body.prompt || '',
        instructions: body.instructions || '',
        style: body.style || '',
        aspect: body.aspect || '',
        duration: body.duration || ''
      },

      message:
        'AI Provider Gateway connected. Test provider selected.',

      availableProviders:
        getAvailableProviders()

    });


  } catch (error) {

    console.error(error);

    return res.status(500).json({

      ok: false,

      error:
        'AI Provider Gateway failed.'

    });

  }

      }
