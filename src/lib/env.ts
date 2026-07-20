type RequiredEnvKey =
  | 'MONGODB_URI'
  | 'AUTH_SECRET'
  | 'ADMIN_USERNAME'
  | 'ADMIN_PASSWORD';

type OpenAiEnvKey = 'OPENAI_API_KEY' | 'OPENAI_MODEL';

export interface AppEnv {
  MONGODB_URI: string;
  AUTH_SECRET: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
}

export interface OpenAiEnv {
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
}

let cachedEnv: AppEnv | null = null;
let cachedOpenAiEnv: OpenAiEnv | null = null;

function readRequiredEnv(key: RequiredEnvKey | OpenAiEnvKey): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = {
    MONGODB_URI: readRequiredEnv('MONGODB_URI'),
    AUTH_SECRET: readRequiredEnv('AUTH_SECRET'),
    ADMIN_USERNAME: readRequiredEnv('ADMIN_USERNAME'),
    ADMIN_PASSWORD: readRequiredEnv('ADMIN_PASSWORD'),
  };

  return cachedEnv;
}

/** OpenAI credentials — read on AI routes only so non-AI paths stay usable. */
export function getOpenAiEnv(): OpenAiEnv {
  if (cachedOpenAiEnv) {
    return cachedOpenAiEnv;
  }

  cachedOpenAiEnv = {
    OPENAI_API_KEY: readRequiredEnv('OPENAI_API_KEY'),
    OPENAI_MODEL: readRequiredEnv('OPENAI_MODEL'),
  };

  return cachedOpenAiEnv;
}
