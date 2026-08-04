#!/usr/bin/env node
/**
 * Diagnostic script to identify API hang issues
 * Run: node diagnose-api-hang.js
 */

const http = require('http');
const https = require('https');

const API_BASE_URL = 'http://localhost:8000/api/v1';
const TIMEOUT = 5000;

console.log('🔍 API Diagnostic Report\n');
console.log(`Target: ${API_BASE_URL}`);
console.log(`Timeout: ${TIMEOUT}ms\n`);

function testEndpoint(url, method = 'GET') {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      timeout: TIMEOUT,
      method,
    };

    console.log(`⏳ Testing: ${method} ${url}`);

    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`   ✅ Status: ${res.statusCode}`);
        if (data) console.log(`   Response: ${data.substring(0, 100)}...`);
        resolve(true);
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ Error: ${err.code || err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`   ⏱️  TIMEOUT after ${TIMEOUT}ms - Backend not responding!`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function runDiagnostics() {
  console.log('--- Step 1: DNS/Network Check ---');
  const dnsCheck = await testEndpoint(API_BASE_URL);

  console.log('\n--- Step 2: Backend Health ---');
  const healthCheck = await testEndpoint(`${API_BASE_URL}/health`, 'GET');

  console.log('\n--- Step 3: User Auth Status ---');
  const authCheck = await testEndpoint(`${API_BASE_URL}/users/me`, 'GET');

  console.log('\n--- Summary ---');
  if (!dnsCheck) {
    console.log('❌ Backend NOT reachable');
    console.log('   Fix: Run "cd Video-master && php artisan serve --port=8000"');
  } else if (!healthCheck && !authCheck) {
    console.log('⚠️  Backend responds but endpoints failing');
    console.log('   Fix: Check Laravel error logs at Video-master/storage/logs/');
  } else {
    console.log('✅ API appears to be working');
  }

  console.log('\n--- Troubleshooting Checklist ---');
  console.log('1. Is backend running? php artisan serve --port=8000');
  console.log('2. Is database migrated? php artisan migrate');
  console.log('3. Check logs: tail -f Video-master/storage/logs/laravel.log');
  console.log('4. Browser DevTools Network tab: Check request URL + status');
  console.log('5. Try hard refresh: Ctrl+Shift+R');
}

runDiagnostics().catch(console.error);
