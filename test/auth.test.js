const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../server.js');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_tests';

test('Authentication Middleware Tests', async (t) => {
  let server;
  let port;

  // Setup server for testing
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      resolve();
    });
  });

  t.after(() => {
    server.close();
  });

  const request = (path, options = {}) => {
    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port,
        path,
        method: options.method || 'GET',
        headers: options.headers || {},
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: data ? JSON.parse(data) : null,
            });
          } catch (err) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: data,
            });
          }
        });
      });

      req.on('error', reject);
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  };

  await t.test('Missing Authorization header returns 401', async () => {
    const res = await request('/hello');
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error, 'Missing or invalid Authorization header');
  });

  await t.test('Invalid Authorization header format returns 401', async () => {
    const res = await request('/hello', {
      headers: { 'Authorization': 'NotBearer token' }
    });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error, 'Missing or invalid Authorization header');
  });

  await t.test('Invalid token returns 401', async () => {
    const res = await request('/hello', {
      headers: { 'Authorization': 'Bearer invalid_token_here' }
    });
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.error, 'Invalid or expired token');
  });

  await t.test('Valid token allows access to GET /hello', async () => {
    const token = jwt.sign({ user: 'test' }, JWT_SECRET);
    const res = await request('/hello', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.message, 'Hello, World!');
  });

  await t.test('Valid token allows access to POST /data', async () => {
    const token = jwt.sign({ user: 'test' }, JWT_SECRET);
    const res = await request('/data', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: { test: 'data' }
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.received, true);
    assert.strictEqual(res.body.size, 15); // {"test":"data"} length
  });
});
