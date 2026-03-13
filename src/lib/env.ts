type RequiredEnvKey =
  | 'MONGODB_URI'
  | 'AUTH_SECRET'
  | 'ADMIN_USERNAME'
  | 'ADMIN_PASSWORD';

export interface AppEnv {
  MONGODB_URI: string;
  AUTH_SECRET: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
}

let cachedEnv: AppEnv | null = null;

function readRequiredEnv(key: RequiredEnvKey): string {
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
