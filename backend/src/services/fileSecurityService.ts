import crypto from 'crypto';
import { promisify } from 'util';

export interface FileSecurityResult {
  isSecure: boolean;
  threats: string[];
  fileHash: string;
  metadata: {
    size: number;
    mimeType: string;
    extension: string;
    isExecutable: boolean;
    hasEmbeddedContent: boolean;
  };
}

export interface VirusScanResult {
  isClean: boolean;
  threats: string[];
  scanEngine: string;
  scanTime: number;
}

export class FileSecurityService {
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/json'
  ];

  private readonly dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.php', '.asp', '.jsp', '.py', '.rb', '.pl', '.sh', '.ps1', '.msi',
    '.deb', '.rpm', '.dmg', '.app', '.ipa', '.apk'
  ];

  private readonly executableSignatures = [
    Buffer.from([0x4D, 0x5A]), // PE executable (MZ)
    Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
    Buffer.from([0xFE, 0xED, 0xFA, 0xCE]), // Mach-O executable (32-bit)
    Buffer.from([0xFE, 0xED, 0xFA, 0xCF]), // Mach-O executable (64-bit)
    Buffer.from([0xCA, 0xFE, 0xBA, 0xBE]), // Java class file
  ];

  /**
   * Perform comprehensive security scan on uploaded file
   */
  async scanFile(fileBuffer: Buffer, originalName: string, mimeType: string): Promise<FileSecurityResult> {
    const startTime = Date.now();
    const threats: string[] = [];

    // Generate file hash for integrity checking
    const fileHash = this.generateFileHash(fileBuffer);

    // Basic file metadata
    const metadata = {
      size: fileBuffer.length,
      mimeType,
      extension: this.getFileExtension(originalName),
      isExecutable: false,
      hasEmbeddedContent: false
    };

    // Size validation
    if (fileBuffer.length > this.maxFileSize) {
      threats.push(`File size ${fileBuffer.length} exceeds maximum allowed size of ${this.maxFileSize}`);
    }

    // MIME type validation
    if (!this.allowedMimeTypes.includes(mimeType)) {
      threats.push(`MIME type ${mimeType} is not allowed`);
    }

    // Extension validation
    const extension = this.getFileExtension(originalName).toLowerCase();
    if (this.dangerousExtensions.includes(extension)) {
      threats.push(`File extension ${extension} is potentially dangerous`);
    }

    // Executable detection
    metadata.isExecutable = this.isExecutableFile(fileBuffer);
    if (metadata.isExecutable) {
      threats.push('File appears to be executable');
    }

    // Embedded content detection
    metadata.hasEmbeddedContent = this.hasEmbeddedContent(fileBuffer, mimeType);
    if (metadata.hasEmbeddedContent) {
      threats.push('File contains embedded content that may be malicious');
    }

    // Filename validation
    const filenameThreats = this.validateFilename(originalName);
    threats.push(...filenameThreats);

    // Content validation based on file type
    const contentThreats = await this.validateFileContent(fileBuffer, mimeType);
    threats.push(...contentThreats);

    // Simulate virus scanning
    const virusScanResult = await this.simulateVirusScan(fileBuffer, originalName);
    if (!virusScanResult.isClean) {
      threats.push(...virusScanResult.threats);
    }

    const scanTime = Date.now() - startTime;
    console.log(`File security scan completed in ${scanTime}ms for ${originalName}`);

    return {
      isSecure: threats.length === 0,
      threats,
      fileHash,
      metadata
    };
  }

  /**
   * Generate SHA-256 hash of file content
   */
  private generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Extract file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  }

  /**
   * Check if file is executable based on magic bytes
   */
  private isExecutableFile(buffer: Buffer): boolean {
    return this.executableSignatures.some(signature => 
      buffer.subarray(0, signature.length).equals(signature)
    );
  }

  /**
   * Detect embedded content in files
   */
  private hasEmbeddedContent(buffer: Buffer, mimeType: string): boolean {
    const content = buffer.toString('binary');

    // Check for embedded scripts in images
    if (mimeType.startsWith('image/')) {
      const scriptPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i
      ];
      return scriptPatterns.some(pattern => pattern.test(content));
    }

    // Check for macros in Office documents
    if (mimeType.includes('officedocument') || mimeType.includes('msword')) {
      const macroPatterns = [
        /vba/i,
        /macro/i,
        /autoopen/i,
        /document_open/i
      ];
      return macroPatterns.some(pattern => pattern.test(content));
    }

    // Check for embedded executables
    return this.executableSignatures.some(signature => 
      content.includes(signature.toString('binary'))
    );
  }

  /**
   * Validate filename for security issues
   */
  private validateFilename(filename: string): string[] {
    const threats: string[] = [];

    // Check for null bytes
    if (filename.includes('\0')) {
      threats.push('Filename contains null bytes');
    }

    // Check for path traversal attempts
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      threats.push('Filename contains path traversal characters');
    }

    // Check for reserved names (Windows)
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    const nameWithoutExt = filename.split('.')[0].toUpperCase();
    if (reservedNames.includes(nameWithoutExt)) {
      threats.push('Filename uses reserved system name');
    }

    // Check for excessive length
    if (filename.length > 255) {
      threats.push('Filename is too long');
    }

    // Check for suspicious characters
    const suspiciousChars = /[<>:"|?*\x00-\x1f]/;
    if (suspiciousChars.test(filename)) {
      threats.push('Filename contains suspicious characters');
    }

    return threats;
  }

  /**
   * Validate file content based on MIME type
   */
  private async validateFileContent(buffer: Buffer, mimeType: string): Promise<string[]> {
    const threats: string[] = [];

    try {
      // Validate image files
      if (mimeType.startsWith('image/')) {
        const imageThreats = this.validateImageContent(buffer, mimeType);
        threats.push(...imageThreats);
      }

      // Validate PDF files
      if (mimeType === 'application/pdf') {
        const pdfThreats = this.validatePDFContent(buffer);
        threats.push(...pdfThreats);
      }

      // Validate text files
      if (mimeType.startsWith('text/')) {
        const textThreats = this.validateTextContent(buffer);
        threats.push(...textThreats);
      }

    } catch (error) {
      threats.push(`Content validation failed: ${error}`);
    }

    return threats;
  }

  /**
   * Validate image file content
   */
  private validateImageContent(buffer: Buffer, mimeType: string): string[] {
    const threats: string[] = [];

    // Check image magic bytes
    const magicBytes: { [key: string]: Buffer[] } = {
      'image/jpeg': [Buffer.from([0xFF, 0xD8, 0xFF])],
      'image/png': [Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])],
      'image/gif': [Buffer.from('GIF87a'), Buffer.from('GIF89a')],
      'image/webp': [Buffer.from('WEBP', 'ascii')]
    };

    const expectedMagic = magicBytes[mimeType];
    if (expectedMagic) {
      const hasValidMagic = expectedMagic.some(magic => 
        buffer.subarray(0, magic.length).equals(magic) ||
        (mimeType === 'image/webp' && buffer.subarray(8, 12).equals(magic))
      );

      if (!hasValidMagic) {
        threats.push('Image file header does not match declared MIME type');
      }
    }

    // Check for EXIF data that might contain malicious content
    const content = buffer.toString('binary');
    if (content.includes('<?xml') || content.includes('<script')) {
      threats.push('Image contains potentially malicious metadata');
    }

    return threats;
  }

  /**
   * Validate PDF file content
   */
  private validatePDFContent(buffer: Buffer): string[] {
    const threats: string[] = [];

    // Check PDF magic bytes
    if (!buffer.subarray(0, 4).equals(Buffer.from('%PDF'))) {
      threats.push('PDF file header is invalid');
    }

    const content = buffer.toString('binary');

    // Check for JavaScript in PDF
    if (content.includes('/JavaScript') || content.includes('/JS')) {
      threats.push('PDF contains JavaScript');
    }

    // Check for forms and actions
    if (content.includes('/Action') || content.includes('/OpenAction')) {
      threats.push('PDF contains automatic actions');
    }

    // Check for embedded files
    if (content.includes('/EmbeddedFile')) {
      threats.push('PDF contains embedded files');
    }

    return threats;
  }

  /**
   * Validate text file content
   */
  private validateTextContent(buffer: Buffer): string[] {
    const threats: string[] = [];

    try {
      const content = buffer.toString('utf8');

      // Check for script tags
      if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
        threats.push('Text file contains script tags');
      }

      // Check for suspicious URLs
      const urlPattern = /(https?:\/\/[^\s]+)/gi;
      const urls = content.match(urlPattern) || [];
      
      for (const url of urls) {
        if (this.isSuspiciousURL(url)) {
          threats.push(`Text file contains suspicious URL: ${url}`);
        }
      }

    } catch (error) {
      threats.push('Text file contains invalid UTF-8 encoding');
    }

    return threats;
  }

  /**
   * Check if URL is suspicious
   */
  private isSuspiciousURL(url: string): boolean {
    const suspiciousDomains = [
      'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', // URL shorteners
      'localhost', '127.0.0.1', '0.0.0.0', // Local addresses
    ];

    const suspiciousPatterns = [
      /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
      /[a-z0-9]{20,}\.com/, // Random domain names
      /\.(tk|ml|ga|cf)$/, // Suspicious TLDs
    ];

    try {
      const urlObj = new URL(url);
      
      // Check suspicious domains
      if (suspiciousDomains.some(domain => urlObj.hostname.includes(domain))) {
        return true;
      }

      // Check suspicious patterns
      if (suspiciousPatterns.some(pattern => pattern.test(urlObj.hostname))) {
        return true;
      }

    } catch (error) {
      return true; // Invalid URL is suspicious
    }

    return false;
  }

  /**
   * Simulate virus scanning (in production, integrate with real antivirus API)
   */
  private async simulateVirusScan(buffer: Buffer, filename: string): Promise<VirusScanResult> {
    const startTime = Date.now();
    
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));

    const threats: string[] = [];

    // Simulate detection of known malicious patterns
    const content = buffer.toString('binary');
    
    // Check for common malware signatures (simplified)
    const malwarePatterns = [
      'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*', // EICAR test string
      'eval(', // Potentially malicious JavaScript
      'exec(', // Potentially malicious code execution
      'system(', // System command execution
    ];

    for (const pattern of malwarePatterns) {
      if (content.includes(pattern)) {
        threats.push(`Detected malicious pattern: ${pattern.substring(0, 20)}...`);
      }
    }

    // Simulate random false positives (very low rate)
    if (Math.random() < 0.001) {
      threats.push('Heuristic detection: Suspicious behavior pattern');
    }

    const scanTime = Date.now() - startTime;

    return {
      isClean: threats.length === 0,
      threats,
      scanEngine: 'ClassBoard Security Scanner v1.0',
      scanTime
    };
  }

  /**
   * Generate security report for file
   */
  generateSecurityReport(result: FileSecurityResult, filename: string): string {
    const report = {
      filename,
      timestamp: new Date().toISOString(),
      securityStatus: result.isSecure ? 'SECURE' : 'THREAT_DETECTED',
      fileHash: result.fileHash,
      metadata: result.metadata,
      threats: result.threats,
      recommendations: this.generateRecommendations(result)
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate security recommendations based on scan results
   */
  private generateRecommendations(result: FileSecurityResult): string[] {
    const recommendations: string[] = [];

    if (!result.isSecure) {
      recommendations.push('File upload should be rejected due to security threats');
    }

    if (result.metadata.isExecutable) {
      recommendations.push('Consider implementing additional sandboxing for executable content');
    }

    if (result.metadata.hasEmbeddedContent) {
      recommendations.push('Review embedded content before allowing file access');
    }

    if (result.metadata.size > 10 * 1024 * 1024) {
      recommendations.push('Large file size may impact performance - consider compression');
    }

    return recommendations;
  }
}

export const fileSecurityService = new FileSecurityService();