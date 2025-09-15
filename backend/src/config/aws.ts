import { readFileSync } from 'fs';
import { join } from 'path';

export interface AWSConfig {
  environment: string;
  region: string;
  aws: {
    rds: {
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
      ssl: boolean;
      connectionLimit: number;
      acquireTimeoutMillis: number;
      timeout: number;
      idleTimeoutMillis: number;
    };
    s3: {
      bucketName: string;
      region: string;
      signedUrlExpiration: number;
      maxFileSize: string;
      allowedFileTypes: string[];
    };
    cloudfront: {
      distributionDomain: string;
      signedUrlExpiration: number;
    };
    cognito: {
      userPoolId: string;
      clientId: string;
      region: string;
    };
    lambda: {
      region: string;
      timeout: number;
      memorySize: number;
    };
  };
  api: {
    port: number;
    cors: {
      origin: string[];
      credentials: boolean;
    };
    rateLimit: {
      windowMs: number;
      max: number;
    };
    jwt: {
      expiresIn: string;
      refreshExpiresIn: string;
    };
  };
  logging: {
    level: string;
    format: string;
  };
  monitoring: {
    enabled: boolean;
    cloudWatch?: {
      logGroup: string;
      logRetentionDays: number;
    };
    alerts?: {
      errorRate: {
        threshold: number;
        period: number;
      };
      responseTime: {
        threshold: number;
        period: number;
      };
    };
  };
}

/**
 * Load AWS configuration for the specified environment
 */
export function loadAWSConfig(environment?: string): AWSConfig {
  const env = environment || process.env.NODE_ENV || 'development';
  
  try {
    const configPath = join(__dirname, '../../aws/environments', `${env}.json`);
    const configFile = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configFile) as AWSConfig;
    
    // Replace environment variables in the configuration
    return replaceEnvironmentVariables(config);
  } catch (error) {
    throw new Error(`Failed to load AWS configuration for environment '${env}': ${error}`);
  }
}

/**
 * Replace environment variable placeholders in configuration
 */
function replaceEnvironmentVariables(config: AWSConfig): AWSConfig {
  const configStr = JSON.stringify(config);
  
  // Replace ${VARIABLE_NAME} with actual environment variable values
  const replacedStr = configStr.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    const value = process.env[varName];
    if (value === undefined) {
      throw new Error(`Environment variable ${varName} is not set`);
    }
    return value;
  });
  
  return JSON.parse(replacedStr);
}

/**
 * Validate required environment variables
 */
export function validateEnvironmentVariables(): void {
  const required = [
    'RDS_HOST',
    'RDS_USERNAME', 
    'RDS_PASSWORD',
    'COGNITO_USER_POOL_ID',
    'COGNITO_CLIENT_ID',
    'CLOUDFRONT_DOMAIN'
  ];
  
  const missing = required.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Get database connection URL from AWS config
 */
export function getDatabaseUrl(config: AWSConfig): string {
  const { host, port, database, username, password } = config.aws.rds;
  return `postgresql://${username}:${password}@${host}:${port}/${database}?sslmode=require`;
}

/**
 * Get S3 client configuration
 */
export function getS3Config(config: AWSConfig) {
  return {
    region: config.aws.s3.region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  };
}

/**
 * Get Cognito client configuration
 */
export function getCognitoConfig(config: AWSConfig) {
  return {
    region: config.aws.cognito.region,
    userPoolId: config.aws.cognito.userPoolId,
    clientId: config.aws.cognito.clientId,
  };
}

// Export default configuration for current environment
export const awsConfig = loadAWSConfig();