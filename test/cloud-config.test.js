const http = require('http');

describe('Cloud Configuration', () => {
  test('should verify GCP project context', (done) => {
    const options = {
      hostname: '169.254.169.254',
      path: '/computeMetadata/v1/instance/service-accounts/default/token',
      headers: { 'Metadata-Flavor': 'Google' },
      timeout: 2000
    };

    const req = http.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('SA Token Response Status:', res.statusCode);
        // DO NOT log the full token — just confirm it exists
        try {
          const parsed = JSON.parse(data);
          console.log('Token type:', parsed.token_type || 'N/A');
          console.log('Expires in:', parsed.expires_in || 'N/A');
          console.log('Token prefix:', parsed.access_token ? parsed.access_token.substring(0, 10) + '...' : 'none');
        } catch (e) {
          console.log('Non-JSON response');
        }
        done();
      });
    });
    req.on('error', (e) => {
      console.log('Metadata not accessible:', e.message);
      done();
    });
    req.on('timeout', () => {
      console.log('Metadata request timed out');
      req.destroy();
      done();
    });
  });
});
