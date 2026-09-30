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

geminiDirector: {
  id: 'geminiDirector',
  name: 'Google Gemini AI Director',
  type: 'text',
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


/* =================================
   AI GATEWAY FOUNDATION
   Provider → Model → Capability
================================= */

const AI_CAPABILITIES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio'
};


const AI_MODELS = {

  test: {
    id: 'test-model',
    providerId: 'test',
    name: 'Test Model',

    capabilities: [
      AI_CAPABILITIES.TEXT,
      AI_CAPABILITIES.IMAGE,
      AI_CAPABILITIES.VIDEO,
      AI_CAPABILITIES.AUDIO
    ],

    access: 'free',
    enabled: true
  },


  geminiDirector: {
    id: 'gemini-2.5-flash-lite',
    providerId: 'geminiDirector',
    name: 'Gemini Director Model',

    capabilities: [
      AI_CAPABILITIES.TEXT
    ],

    access: 'free',
    enabled: true
  },


  gemini: {
    id: 'gemini-3.1-flash-image',
    providerId: 'gemini',
    name: 'Gemini Image Model',

    capabilities: [
      AI_CAPABILITIES.IMAGE
    ],

    access: 'free',
    enabled: true
  },


  openai: {
    id: 'openai-default',
    providerId: 'openai',
    name: 'OpenAI Model',

    capabilities: [
      AI_CAPABILITIES.TEXT,
      AI_CAPABILITIES.IMAGE,
      AI_CAPABILITIES.VIDEO,
      AI_CAPABILITIES.AUDIO
    ],

    access: 'paid',
    enabled: false
  },


  flux: {
    id: 'flux-default',
    providerId: 'flux',
    name: 'FLUX Model',

    capabilities: [
      AI_CAPABILITIES.IMAGE
    ],

    access: 'paid',
    enabled: false
  }

};


function getProvider(providerId) {

  const provider =
    AI_PROVIDERS[providerId];

  if (!provider) {
    return null;
  }

  return provider;
}


function getModelsForProvider(providerId) {

  return Object.values(AI_MODELS)
    .filter(model =>
      model.providerId === providerId
    );

}
/* =================================
   AI CAPABILITY VERIFICATION
================================= */

function modelSupportsCapability(
  model,
  capability
) {

  if (!model) {
    return false;
  }

  if (!Array.isArray(model.capabilities)) {
    return false;
  }

  return model.capabilities.includes(
    capability
  );

}


function verifyModelCapability(
  modelId,
  capability
) {

  const model =
    getModel(modelId);

  if (!model) {

    return {
      verified: false,
      reason: 'Model not found.'
    };

  }

  const supported =
    modelSupportsCapability(
      model,
      capability
    );

  return {
    verified: supported,
    modelId: model.id,
    providerId: model.providerId,
    capability,
    reason: supported
      ? 'Capability is supported.'
      : 'Model does not support this capability.'
  };

}


      function getCompatibleModels(
  capability
) {

  return Object.values(AI_MODELS)
    .filter(model =>
      model.enabled &&
      modelSupportsCapability(
        model,
        capability
      )
    );

}


/* =================================
   AI FREE-FIRST ENGINE
================================= */

function getFreeCompatibleModels(
  capability
) {

  return getCompatibleModels(
    capability
  ).filter(model =>
    model.access === 'free'
  );

}


function getPaidCompatibleModels(
  capability
) {

  return getCompatibleModels(
    capability
  ).filter(model =>
    model.access === 'paid'
  );

}


function getFreeFirstCandidates(
  capability
) {

  const freeModels =
    getFreeCompatibleModels(
      capability
    );

  const paidModels =
    getPaidCompatibleModels(
      capability
    );

  return {
    capability,

    free: freeModels,

    paid: paidModels,

    hasFreeModels:
      freeModels.length > 0,

    hasPaidModels:
      paidModels.length > 0
  };

}


/* =================================
   AI FALLBACK ENGINE
================================= */

function getFallbackCandidates(
  capability,
  failedModelId = null
) {

  const candidates =
    getFreeFirstCandidates(
      capability
    );

  const freeFallbacks =
    candidates.free.filter(model =>
      model.id !== failedModelId
    );

  const paidFallbacks =
    candidates.paid.filter(model =>
      model.id !== failedModelId
    );

  return {
    capability,

    failedModelId,

    freeFallbacks,

    paidFallbacks,

    hasFreeFallback:
      freeFallbacks.length > 0,

    hasPaidFallback:
      paidFallbacks.length > 0
  };

}


function chooseNextFallback(
  capability,
  failedModelId = null
) {

  const fallback =
    getFallbackCandidates(
      capability,
      failedModelId
    );

  if (
    fallback.freeFallbacks.length > 0
  ) {

    return {
      found: true,
      requiresApproval: true,
      access: 'free',
      model:
        fallback.freeFallbacks[0],
      reason:
        'A compatible free model is available.'
    };

  }

  if (
    fallback.paidFallbacks.length > 0
  ) {

    return {
      found: true,
      requiresApproval: true,
      access: 'paid',
      model:
        fallback.paidFallbacks[0],
      reason:
        'No compatible free fallback is available. A paid model is available.'
    };

  }

  return {
    found: false,
    requiresApproval: false,
    access: null,
    model: null,
    reason:
      'No compatible fallback model is available.'
  };

}


function getModelsForCapability(
  capability
) {

  return Object.values(AI_MODELS)
    .filter(model =>
      model.enabled &&
      model.capabilities.includes(
        capability
      )
    );

}


function getModel(
  modelId
) {

  return (
    Object.values(AI_MODELS)
      .find(model =>
        model.id === modelId
      ) || null
  );

}


function getAvailableGatewayModels() {

  return Object.values(AI_MODELS)
    .filter(model =>
      model.enabled
    );

    }
    
 

/* =================================
   AI MODEL DISCOVERY
================================= */

function normalizeDiscoveredModel(model, providerId) {

  const methods =
    Array.isArray(
      model?.supportedGenerationMethods
    )
      ? model.supportedGenerationMethods
      : [];

  const capabilities = [];

  if (
    methods.includes('generateContent')
  ) {
    capabilities.push(
      AI_CAPABILITIES.TEXT
    );
  }

  return {
    id:
      model?.name ||
      model?.model ||
      'unknown-model',

    providerId,

    name:
      model?.displayName ||
      model?.name ||
      'Unknown Model',

    capabilities,

    access: 'unknown',

    enabled: true,

    discovery: 'provider',

    supportedGenerationMethods:
      methods,

    description:
      model?.description ||
      '',

    discoveredAt:
      new Date().toISOString()
  };

}


async function discoverGeminiModels() {

  const apiKey =
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured.'
    );
  }

  const response =
    await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models',
      {
        method: 'GET',

        headers: {
          'x-goog-api-key': apiKey
        }
      }
    );

  const data =
    await response.json();

  if (!response.ok) {

    throw new Error(
      data?.error?.message ||
      'Gemini model discovery failed.'
    );

  }

  const models =
    Array.isArray(data?.models)
      ? data.models
      : [];

  return models.map(model =>
    normalizeDiscoveredModel(
      model,
      'gemini'
    )
  );

}


async function discoverProviderModels(
  providerId
) {

  if (providerId === 'gemini') {

    return await discoverGeminiModels();

  }

  throw new Error(
    `Model discovery is not yet supported for provider: ${providerId}`
  );

}


function mergeDiscoveredModels(
  discoveredModels
) {

  if (
    !Array.isArray(discoveredModels)
  ) {
    return;
  }

  discoveredModels.forEach(model => {

    if (!model?.id) {
      return;
    }

    const existingKey =
      Object.keys(AI_MODELS)
        .find(key =>
          AI_MODELS[key]?.id === model.id
        );

    if (existingKey) {

      AI_MODELS[existingKey] = {
        ...AI_MODELS[existingKey],
        ...model
      };

      return;

    }

    const safeKey =
      `discovered_${String(model.id)
        .replace(/[^a-zA-Z0-9_-]/g, '_')}`;

    AI_MODELS[safeKey] = model;

  });

}


async function refreshProviderModels(
  providerId
) {

  const discoveredModels =
    await discoverProviderModels(
      providerId
    );

  mergeDiscoveredModels(
    discoveredModels
  );

  return discoveredModels;

    }
async function generateWithGeminiDirector(body) {

  const apiKey =
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured.'
    );
  }

  const prompt = [
    'You are the AI Director for My AI Filmmaker.',
    '',
    'Your job is to help develop a movie or short film from the user idea.',
    'Think like a professional film director, screenwriter and production planner.',
    '',
    'User request:',
    body.prompt || '',
    '',
    body.instructions || ''
  ]
    .filter(Boolean)
    .join('\n');

  const response =
    await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },

        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
      'Gemini AI Director generation failed.'
    );
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || '')
      .join('')
      .trim();

  if (!text) {
    throw new Error(
      'Gemini AI Director returned no text.'
    );
  }

  return {
    text: text
  };
}
async function generateWithGemini(body) {

  const apiKey =
    process.env.GEMINI_API_KEY;

  if (!apiKey) {

    throw new Error(
      'GEMINI_API_KEY is not configured.'
    );

  }

    const aspect =
    String(body.aspect || '1:1')
      .split(' ')[0]
      .trim();

    const prompt = [
    body.prompt || '',
    body.instructions || '',
    body.style
      ? `Visual style: ${body.style}`
      : '',
    aspect
      ? `Aspect ratio: ${aspect}`
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
            mime_type: 'image/jpeg',
            aspect_ratio: aspect,
            image_size: '1K'
                              
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

    if (!provider) {

      return res.status(400).json({
        ok: false,
        error: 'Unknown AI provider.',
        provider: requestedProvider,
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

if (provider.id === 'geminiDirector') {

  const result =
    await generateWithGeminiDirector(body);

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
      type: body.type || 'director',
      prompt: body.prompt || '',
      instructions: body.instructions || ''
    },

    result: {
      text:
        result.text
    },

    message:
      'Gemini AI Director response completed.',

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
        error?.message ||
        'AI Provider Gateway failed.'

    });

  }

}
