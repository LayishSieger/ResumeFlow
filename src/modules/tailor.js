export function initTailor() {
    console.log('Tailor module initialized');
    const WORKER_URL = import.meta.env.VITE_WORKER_URL;

    // Fallback list of free-tier models
    let freeTierModels = [
        'meta-llama/llama-3.1-8b-instruct:free',
        'mistralai/mixtral-8x7b-instruct:free',
        'google/gemma-2-9b-it:free',
        'qwen/qwen-2-7b-instruct:free'
    ];

    // Fallback token limits (in tokens)
    let MODEL_TOKEN_LIMITS = {
        'meta-llama/llama-3.1-8b-instruct:free': 8192,
        'mistralai/mixtral-8x7b-instruct:free': 8192,
        'google/gemma-2-9b-it:free': 8192,
        'qwen/qwen-2-7b-instruct:free': 8192,
        'grok-beta': 4000
    };

    // Fetch free models from OpenRouter API
    const fetchFreeModels = async () => {
        try {
            const cacheKey = 'openrouter_free_models';
            const cacheTTL = 24 * 60 * 60 * 1000; // Cache for 24 hours
            const cachedData = localStorage.getItem(cacheKey);
            const now = Date.now();

            if (cachedData) {
                const { timestamp, models, tokenLimits } = JSON.parse(cachedData);
                if (now - timestamp < cacheTTL) {
                    console.log('Using cached free models');
                    freeTierModels = models;
                    MODEL_TOKEN_LIMITS = tokenLimits;
                    return;
                }
            }

            console.log('Fetching free models from OpenRouter API');
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                throw new Error(`OpenRouter API request failed: ${response.statusText}`);
            }
            const data = await response.json();
            const models = data.data || [];

            freeTierModels = models
                .filter(model => model.pricing?.prompt === '0')
                .map(model => model.id);

            MODEL_TOKEN_LIMITS = models.reduce((acc, model) => {
                if (model.pricing?.prompt === '0' && model.max_context_length) {
                    acc[model.id] = model.max_context_length;
                }
                return acc;
            }, { 'grok-beta': 4000 });

            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: now,
                models: freeTierModels,
                tokenLimits: MODEL_TOKEN_LIMITS
            }));
            console.log('Updated free models:', freeTierModels);
            console.log('Updated token limits:', MODEL_TOKEN_LIMITS);
        } catch (error) {
            console.error('Error fetching free models:', error);
            console.warn('Using fallback free models and token limits');
        }
    };

    // Fetch base prompt token count from worker
    const fetchBasePromptTokenCount = async () => {
        try {
            const response = await fetch(`${WORKER_URL}/estimate-tokens`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch base prompt token count: ${response.statusText}`);
            }
            const data = await response.json();
            return data.promptTokenCount || 350; // Fallback to 350 if API fails
        } catch (error) {
            console.error('Error fetching base prompt token count:', error);
            return 350; // Fallback
        }
    };

    fetchFreeModels().catch(error => console.error('Initial model fetch failed:', error));

    // Expose free models for UI
    const getFreeModels = () => freeTierModels;

    const tailorResume = async (
        resumeContent,
        jobDescription,
        provider = 'openrouter',
        model = 'microsoft/mai-ds-r1:free',
    ) => {
        try {
            if (!resumeContent || !jobDescription) {
                throw new Error('Resume content and job description are required');
            }

            if (!['openrouter', 'grok'].includes(provider)) {
                throw new Error('Invalid provider. Use "openrouter" or "grok".');
            }
            if (provider === 'openrouter' && !freeTierModels.includes(model)) {
                throw new Error(`Invalid model for OpenRouter free tier. Use one of: ${freeTierModels.join(', ')}`);
            }

            // Calculate token count
            const basePromptTokenCount = await fetchBasePromptTokenCount();
            const inputTokenCount = Math.ceil((resumeContent.length + jobDescription.length) / 4);
            const estimatedTokenCount = basePromptTokenCount + inputTokenCount;

            const maxTokensLimit = provider === 'grok' ? 4000 : (MODEL_TOKEN_LIMITS[model] || 8192);

            if (estimatedTokenCount > maxTokensLimit * 0.8) {
                throw new Error(`Estimated token count (${estimatedTokenCount}) exceeds 80% of model limit (${maxTokensLimit}). Reduce resume or job description size.`);
            }

            const requestBody = {
                resume: resumeContent,
                jobDescription,
                provider,
                model
            };
            console.log('Sending request to worker:', {
                provider,
                model,
                estimatedTokens: estimatedTokenCount,
                maxTokens: maxTokensLimit
            });
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Worker request failed: ${errorText}`);
            }
            const data = await response.json();
            if (!data.jobDetails || !data.tailoredResume || !data.coverLetter) {
                throw new Error('Invalid Worker response: Missing required fields');
            }
            return data;
        } catch (error) {
            console.error('Error tailoring resume:', error);
            throw error;
        }
    };

    return { tailorResume, getFreeModels };
}