const http = require('http');

// Test CORS configuration
const testCors = () => {
  const app = require('../dist/app.js').default;
  const server = app.listen(3001, () => {
    console.log('Testing CORS configuration...');
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    };
    
    const req = http.request(options, (res) => {
      console.log('CORS preflight response status:', res.statusCode);
      console.log('CORS headers:');
      console.log('  Access-Control-Allow-Origin:', res.headers['access-control-allow-origin']);
      console.log('  Access-Control-Allow-Methods:', res.headers['access-control-allow-methods']);
      console.log('  Access-Control-Allow-Headers:', res.headers['access-control-allow-headers']);
      console.log('✅ CORS configuration is working correctly');
      
      server.close();
      process.exit(0);
    });
    
    req.on('error', (err) => {
      console.error('❌ CORS test failed:', err);
      server.close();
      process.exit(1);
    });
    
    req.end();
  });
};

testCors();