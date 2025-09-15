#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  coverage?: number;
  errors?: string[];
}

interface TestSuite {
  name: string;
  command: string;
  timeout: number;
  required: boolean;
}

class ComprehensiveTestRunner {
  private results: TestResult[] = [];
  private startTime: number = Date.now();

  private testSuites: TestSuite[] = [
    {
      name: 'Unit Tests',
      command: 'npm run test:unit',
      timeout: 300000, // 5 minutes
      required: true,
    },
    {
      name: 'Integration Tests',
      command: 'npm run test:integration',
      timeout: 600000, // 10 minutes
      required: true,
    },
    {
      name: 'End-to-End Tests',
      command: 'npm run test:e2e',
      timeout: 900000, // 15 minutes
      required: true,
    },
    {
      name: 'Performance Tests',
      command: 'npm run test:performance',
      timeout: 1200000, // 20 minutes
      required: false,
    },
    {
      name: 'Security Tests',
      command: 'npm test -- --testPathPattern=security.test.ts',
      timeout: 300000, // 5 minutes
      required: true,
    },
    {
      name: 'Migration Tests',
      command: 'npm run migration:test',
      timeout: 300000, // 5 minutes
      required: true,
    },
  ];

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Test Suite');
    console.log('=====================================\n');

    // Setup test environment
    await this.setupTestEnvironment();

    // Run each test suite
    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    // Generate coverage report
    await this.generateCoverageReport();

    // Generate final report
    this.generateFinalReport();

    // Exit with appropriate code
    const hasFailures = this.results.some(r => !r.passed && this.testSuites.find(s => s.name === r.name)?.required);
    process.exit(hasFailures ? 1 : 0);
  }

  private async setupTestEnvironment(): Promise<void> {
    console.log('🔧 Setting up test environment...');

    try {
      // Ensure test database is ready
      execSync('npm run db:generate', { stdio: 'inherit' });
      
      // Run migrations if needed
      if (process.env.NODE_ENV === 'test' && process.env.TEST_DATABASE_URL) {
        execSync('npm run db:migrate', { stdio: 'inherit' });
      }

      // Create necessary directories
      const dirs = ['coverage', 'test-results', 'performance-results'];
      dirs.forEach(dir => {
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
      });

      console.log('✅ Test environment setup complete\n');
    } catch (error) {
      console.error('❌ Failed to setup test environment:', error);
      process.exit(1);
    }
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`📋 Running ${suite.name}...`);
    const startTime = Date.now();

    try {
      // Set timeout for the command
      const timeoutId = setTimeout(() => {
        throw new Error(`Test suite timed out after ${suite.timeout / 1000} seconds`);
      }, suite.timeout);

      // Run the test command
      const output = execSync(suite.command, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: suite.timeout,
      });

      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      
      // Parse coverage if available
      let coverage: number | undefined;
      const coverageMatch = output.match(/All files[^|]*\|[^|]*\|[^|]*\|[^|]*\|[^|]*(\d+\.?\d*)/);
      if (coverageMatch) {
        coverage = parseFloat(coverageMatch[1]);
      }

      this.results.push({
        name: suite.name,
        passed: true,
        duration,
        coverage,
      });

      console.log(`✅ ${suite.name} passed in ${(duration / 1000).toFixed(2)}s`);
      if (coverage !== undefined) {
        console.log(`   Coverage: ${coverage}%`);
      }
      console.log();

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.results.push({
        name: suite.name,
        passed: false,
        duration,
        errors: [errorMessage],
      });

      if (suite.required) {
        console.log(`❌ ${suite.name} failed in ${(duration / 1000).toFixed(2)}s`);
        console.log(`   Error: ${errorMessage}`);
        console.log();
      } else {
        console.log(`⚠️  ${suite.name} failed (non-critical) in ${(duration / 1000).toFixed(2)}s`);
        console.log(`   Error: ${errorMessage}`);
        console.log();
      }
    }
  }

  private async generateCoverageReport(): Promise<void> {
    console.log('📊 Generating comprehensive coverage report...');

    try {
      execSync('npm run test:coverage', {
        stdio: 'inherit',
        timeout: 600000, // 10 minutes
      });

      console.log('✅ Coverage report generated\n');
    } catch (error) {
      console.log('⚠️  Failed to generate coverage report:', error);
      console.log();
    }
  }

  private generateFinalReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.results.filter(r => r.passed).length;
    const totalTests = this.results.length;
    const requiredTests = this.testSuites.filter(s => s.required).length;
    const passedRequiredTests = this.results.filter(r => 
      r.passed && this.testSuites.find(s => s.name === r.name)?.required
    ).length;

    console.log('📋 Final Test Report');
    console.log('===================');
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`Required Tests Passed: ${passedRequiredTests}/${requiredTests}`);
    console.log();

    // Detailed results
    console.log('Detailed Results:');
    console.log('-----------------');
    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const required = this.testSuites.find(s => s.name === result.name)?.required ? '(Required)' : '(Optional)';
      const duration = (result.duration / 1000).toFixed(2);
      
      console.log(`${status} ${result.name} ${required} - ${duration}s`);
      
      if (result.coverage !== undefined) {
        console.log(`   Coverage: ${result.coverage}%`);
      }
      
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`   Error: ${error}`);
        });
      }
    });

    console.log();

    // Coverage summary
    const coverageResults = this.results.filter(r => r.coverage !== undefined);
    if (coverageResults.length > 0) {
      const avgCoverage = coverageResults.reduce((sum, r) => sum + (r.coverage || 0), 0) / coverageResults.length;
      console.log(`Average Coverage: ${avgCoverage.toFixed(2)}%`);
      console.log();
    }

    // Performance summary
    const perfResult = this.results.find(r => r.name === 'Performance Tests');
    if (perfResult) {
      console.log('Performance Test Summary:');
      console.log(`Status: ${perfResult.passed ? 'PASSED' : 'FAILED'}`);
      console.log(`Duration: ${(perfResult.duration / 1000).toFixed(2)}s`);
      console.log();
    }

    // Recommendations
    console.log('Recommendations:');
    console.log('---------------');
    
    const failedRequired = this.results.filter(r => 
      !r.passed && this.testSuites.find(s => s.name === r.name)?.required
    );
    
    if (failedRequired.length > 0) {
      console.log('❌ Critical issues found:');
      failedRequired.forEach(result => {
        console.log(`   - Fix ${result.name} before deployment`);
      });
    } else {
      console.log('✅ All required tests passed - Ready for deployment');
    }

    const lowCoverage = coverageResults.filter(r => (r.coverage || 0) < 80);
    if (lowCoverage.length > 0) {
      console.log('⚠️  Coverage improvements needed:');
      lowCoverage.forEach(result => {
        console.log(`   - ${result.name}: ${result.coverage}% (target: 80%+)`);
      });
    }

    console.log();

    // Save report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      totalDuration: totalDuration,
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        requiredPassed: passedRequiredTests,
        requiredTotal: requiredTests,
      },
      results: this.results,
      recommendations: {
        readyForDeployment: failedRequired.length === 0,
        criticalIssues: failedRequired.map(r => r.name),
        coverageIssues: lowCoverage.map(r => ({ name: r.name, coverage: r.coverage })),
      },
    };

    writeFileSync(
      join('test-results', `comprehensive-test-report-${Date.now()}.json`),
      JSON.stringify(reportData, null, 2)
    );

    console.log('📄 Detailed report saved to test-results/');
  }
}

// Run the comprehensive test suite
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  runner.runAllTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
}

export { ComprehensiveTestRunner };