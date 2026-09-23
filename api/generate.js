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
    enabled: true
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


    if (!provider) {

      return res.status(400).json({
        ok: false,
        error: 'Requested AI provider is not configured.',
        requestedProvider,
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
