import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  server: {
    port: number;
    nodeEnv: string;
  };
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  aws: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    s3: {
      bucketName: string;
      region: string;
    };
    cognito: {
      userPoolId: string;
      clientId: string;
      region: string;
    };
  };
  cors: {
    frontendUrl: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  security: {
    maxFileSize: string;
    allowedFileTypes: string[];
    enableVirusScanning: boolean;
    trustedIPs: string[];
  };
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3: {
      bucketName: process.env.S3_BUCKET_NAME || '',
      region: process.env.S3_REGION || 'us-east-1',
    },
    cognito: {
      userPoolId: process.env.COGNITO_USER_POOL_ID || '',
      clientId: process.env.COGNITO_CLIENT_ID || '',
      region: process.env.COGNITO_REGION || 'us-east-1',
    },
  },
  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  security: {
    maxFileSize: process.env.MAX_FILE_SIZE || '50MB',
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf,text/plain').split(','),
    enableVirusScanning: process.env.ENABLE_VIRUS_SCANNING === 'true',
    trustedIPs: (process.env.TRUSTED_IPS || '').split(',').filter(ip => ip.trim()),
  },
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`Warning: ${envVar} environment variable is not set`);
  }
}

export default config;