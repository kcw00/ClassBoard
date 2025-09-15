#!/usr/bin/env node

/**
 * Integration Validation Script
 * Tests environment variable integration between Terraform outputs and backend configuration
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

/**
 * Validate environment configuration
 */
function validateEnvironmentConfig(environment) {
    logInfo(`Validating environment configuration for: ${environment}`);
    
    const configPath = path.join(__dirname, 'environments', `${environment}.json`);
    
    if (!fs.existsSync(configPath)) {
        logError(`Configuration file not found: ${configPath}`);
        return false;
    }
    
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        logSuccess(`Configuration file parsed successfully: ${configPath}`);
        
        // Extract environment variable placeholders
        const envVarsInConfig = [];
        const configStr = JSON.stringify(config);
        const matches = configStr.match(/\$\{([^}]+)\}/g);
        
        if (matches) {
            matches.forEach(match => {
                const varName = match.slice(2, -1); // Remove ${ and }
                if (!envVarsInConfig.includes(varName)) {
                    envVarsInConfig.push(varName);
                }
            });
        }
        
        logInfo(`Environment variables required by config:`);
        envVarsInConfig.forEach(varName => {
            const isSet = process.env[varName] !== undefined;
            if (isSet) {
                logSuccess(`  ${varName}: ${process.env[varName] ? 'SET' : 'EMPTY'}`);
            } else {
                logError(`  ${varName}: NOT SET`);
            }
        });
        
        return {
            success: true,
            config,
            requiredEnvVars: envVarsInConfig,
            missingEnvVars: envVarsInConfig.filter(varName => !process.env[varName])
        };
        
    } catch (error) {
        logError(`Failed to parse configuration: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Test AWS configuration loading
 */
function testAWSConfigLoading(environment) {
    logInfo(`Testing AWS configuration loading for: ${environment}`);
    
    try {
        // Simulate the backend's config loading
        const configPath = path.join(__dirname, '..', 'src', 'config', 'aws.ts');
        
        if (!fs.existsSync(configPath)) {
            logWarning(`AWS config file not found at: ${configPath}`);
            logWarning(`This is expected if running from aws/ directory only`);
            return { success: true, warning: 'Config file not accessible for testing' };
        }
        
        // For now, just validate the structure exists
        logSuccess(`AWS config file exists: ${configPath}`);
        return { success: true };
        
    } catch (error) {
        logError(`Failed to test AWS config loading: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Validate Terraform output mapping
 */
function validateTerraformMapping() {
    logInfo(`Validating Terraform output to environment variable mapping`);
    
    const expectedMappings = {
        'RDS_HOST': 'rds_endpoint',
        'RDS_USERNAME': 'TF_VAR_db_username (variable)',
        'RDS_PASSWORD': 'TF_VAR_db_password (variable)', 
        'COGNITO_USER_POOL_ID': 'cognito_user_pool_id',
        'COGNITO_CLIENT_ID': 'cognito_client_id',
        'CLOUDFRONT_DOMAIN': 'cloudfront_domain_name'
    };
    
    logInfo(`Expected environment variable mappings:`);
    Object.entries(expectedMappings).forEach(([envVar, tfOutput]) => {
        const isSet = process.env[envVar] !== undefined;
        const status = isSet ? '✅' : '❌';
        log(`  ${status} ${envVar} ← ${tfOutput}`);
    });
    
    const missingVars = Object.keys(expectedMappings).filter(envVar => !process.env[envVar]);
    
    if (missingVars.length === 0) {
        logSuccess(`All required environment variables are set`);
        return { success: true };
    } else {
        logWarning(`Missing environment variables: ${missingVars.join(', ')}`);
        return { 
            success: false, 
            missingVars,
            recommendation: 'Run ./set-env-vars.sh <environment> to generate environment variables'
        };
    }
}

/**
 * Main validation function
 */
function main() {
    const environment = process.argv[2] || 'development';
    
    log(`\n🔍 ClassBoard AWS Integration Validation`, 'blue');
    log(`Environment: ${environment}`, 'blue');
    log(`Timestamp: ${new Date().toISOString()}`, 'blue');
    log(`\n${'='.repeat(50)}`, 'blue');
    
    // Test 1: Validate environment configuration
    log(`\n1. Environment Configuration Validation`, 'yellow');
    const configValidation = validateEnvironmentConfig(environment);
    
    // Test 2: Test AWS config loading
    log(`\n2. AWS Config Loading Test`, 'yellow');
    const awsConfigTest = testAWSConfigLoading(environment);
    
    // Test 3: Validate Terraform mapping
    log(`\n3. Terraform Output Mapping Validation`, 'yellow');
    const terraformMapping = validateTerraformMapping();
    
    // Summary
    log(`\n${'='.repeat(50)}`, 'blue');
    log(`\n📋 Validation Summary`, 'blue');
    
    const tests = [
        { name: 'Environment Config', result: configValidation.success },
        { name: 'AWS Config Loading', result: awsConfigTest.success },
        { name: 'Terraform Mapping', result: terraformMapping.success }
    ];
    
    tests.forEach(test => {
        const status = test.result ? '✅ PASS' : '❌ FAIL';
        log(`${status} ${test.name}`);
    });
    
    const allPassed = tests.every(test => test.result);
    
    if (allPassed) {
        log(`\n🎉 All validations passed! Integration looks good.`, 'green');
    } else {
        log(`\n⚠️  Some validations failed. Review the output above.`, 'yellow');
        
        if (configValidation.missingEnvVars && configValidation.missingEnvVars.length > 0) {
            log(`\n💡 Recommendations:`, 'blue');
            log(`1. Run: ./set-env-vars.sh ${environment}`);
            log(`2. Source the generated export script`);
            log(`3. Set required Terraform variables (TF_VAR_db_password, etc.)`);
            log(`4. Re-run this validation`);
        }
    }
    
    log(`\n${'='.repeat(50)}`, 'blue');
    
    process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
    main();
}