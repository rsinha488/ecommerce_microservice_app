#!/usr/bin/env node

/**
 * Test script for authentication APIs through the gateway
 * Tests register, login, logout, and session validation using dummy credentials
 */

const axios = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

// Configuration
const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3008';
const TEST_TIMEOUT = 30000; // 30 seconds

// Test data
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPass123!',
  name: 'Test User Gateway'
};

// Create axios instance with cookie jar support
const jar = new CookieJar();
const client = wrapper(axios.create({
  baseURL: GATEWAY_URL,
  timeout: TEST_TIMEOUT,
  jar,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
}));

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`Step ${step}: ${description}`, 'info');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'success');
}

function logError(message) {
  log(`✗ ${message}`, 'error');
}

async function waitForService(url, maxRetries = 30) {
  log(`Waiting for service at ${url}...`);
  for (let i = 0; i < maxRetries; i++) {
    try {
      await axios.get(url, { timeout: 5000 });
      logSuccess(`Service is ready at ${url}`);
      return true;
    } catch (error) {
      if (i === maxRetries - 1) {
        logError(`Service not ready at ${url} after ${maxRetries} attempts`);
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Test functions
async function testRegister() {
  logStep(1, 'Testing user registration');
  try {
    const response = await client.post('/auth/register', testUser);
    logSuccess(`Registration successful - Status: ${response.status}`);
    log(`User ID: ${response.data.user.id}`);
    log(`Email: ${response.data.user.email}`);
    return true;
  } catch (error) {
    logError(`Registration failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      log(`Error details: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testLogin() {
  logStep(2, 'Testing user login');
  try {
    const response = await client.post('/auth/login', {
      email: testUser.email,
      password: testUser.password,
    });

    logSuccess(`Login successful - Status: ${response.status}`);
    log(`Session ID: ${response.data.session_id}`);
    log(`User ID: ${response.data.user_id}`);

    // Check if cookies were set
    const cookies = jar.getCookiesSync(GATEWAY_URL);
    const sessionCookie = cookies.find(cookie => cookie.key === 'session_id');
    if (sessionCookie) {
      logSuccess('Session cookie set correctly');
    } else {
      logError('Session cookie not found');
      return false;
    }

    return true;
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      log(`Error details: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testSession() {
  logStep(3, 'Testing session validation');
  try {
    const response = await client.get('/auth/session');
    logSuccess(`Session validation successful - Status: ${response.status}`);

    if (response.data.valid) {
      logSuccess('Session is valid');
      log(`User email: ${response.data.session.user.email}`);
      log(`Session ID: ${response.data.session.sessionId}`);
      return true;
    } else {
      logError('Session is not valid');
      return false;
    }
  } catch (error) {
    logError(`Session validation failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      log(`Error details: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testLogout() {
  logStep(4, 'Testing user logout');
  try {
    const response = await client.post('/auth/logout');
    logSuccess(`Logout successful - Status: ${response.status}`);
    log(`Message: ${response.data.message}`);

    // Check if session cookie was cleared
    const cookies = jar.getCookiesSync(GATEWAY_URL);
    const sessionCookie = cookies.find(cookie => cookie.key === 'session_id');
    if (sessionCookie && sessionCookie.value === '') {
      logSuccess('Session cookie cleared correctly');
    } else {
      log('Session cookie status: ' + (sessionCookie ? sessionCookie.value : 'not found'));
    }

    return true;
  } catch (error) {
    logError(`Logout failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      log(`Error details: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testSessionAfterLogout() {
  logStep(5, 'Testing session validation after logout');
  try {
    const response = await client.get('/auth/session');
    if (response.status === 401) {
      logSuccess('Session correctly invalidated after logout');
      return true;
    } else {
      logError('Session should be invalid after logout');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Session correctly invalidated after logout');
      return true;
    } else {
      logError(`Unexpected error checking session after logout: ${error.message}`);
      return false;
    }
  }
}

// Main test function
async function runTests() {
  log('='.repeat(60));
  log('TESTING AUTHENTICATION APIs THROUGH GATEWAY');
  log('='.repeat(60));
  log(`Gateway URL: ${GATEWAY_URL}`);
  log(`Test User: ${testUser.email}`);
  log('');

  // Wait for gateway to be ready
  const gatewayReady = await waitForService(`${GATEWAY_URL}/health`);
  if (!gatewayReady) {
    logError('Cannot proceed with tests - Gateway not ready');
    process.exit(1);
  }

  const results = [];

  // Run tests sequentially
  results.push(await testRegister());
  results.push(await testLogin());
  results.push(await testSession());
  results.push(await testLogout());
  results.push(await testSessionAfterLogout());

  // Summary
  log('');
  log('='.repeat(60));
  log('TEST RESULTS SUMMARY');
  log('='.repeat(60));

  const passed = results.filter(r => r).length;
  const total = results.length;

  results.forEach((result, index) => {
    const stepName = ['Registration', 'Login', 'Session Check', 'Logout', 'Post-Logout Session'][index];
    const status = result ? 'PASS' : 'FAIL';
    const color = result ? 'success' : 'error';
    log(`${stepName}: ${status}`, color);
  });

  log('');
  log(`Overall: ${passed}/${total} tests passed`);

  if (passed === total) {
    logSuccess('All authentication tests passed! 🎉');
    process.exit(0);
  } else {
    logError('Some tests failed. Check the logs above for details.');
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests };
