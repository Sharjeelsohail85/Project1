#!/usr/bin/env node

/**
 * Test script to verify CORS fix
 * This script tests the CORS configuration by making requests to the backend
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:8000/api/v1';
const FRONTEND_ORIGIN = 'http://localhost:3000';

async function testCORS() {
  console.log('🧪 Testing CORS Configuration...\n');
  
  try {
    // Test 1: OPTIONS preflight request
    console.log('1. Testing OPTIONS preflight request...');
    const optionsResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,token,client_id',
      }
    });
    
    console.log(`   Status: ${optionsResponse.status}`);
    console.log(`   Access-Control-Allow-Origin: ${optionsResponse.headers.get('access-control-allow-origin')}`);
    console.log(`   Access-Control-Allow-Methods: ${optionsResponse.headers.get('access-control-allow-methods')}`);
    console.log(`   Access-Control-Allow-Headers: ${optionsResponse.headers.get('access-control-allow-headers')}`);
    console.log(`   Access-Control-Allow-Credentials: ${optionsResponse.headers.get('access-control-allow-credentials')}`);
    console.log(`   ✅ OPTIONS preflight: ${optionsResponse.status === 200 ? 'PASS' : 'FAIL'}\n`);
    
    // Test 2: Actual POST request with credentials
    console.log('2. Testing actual POST request with credentials...');
    const postResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Content-Type': 'application/json',
        'token': 'test-token',
        'client_id': 'test-client-id',
      },
      body: JSON.stringify({
        data: {
          email: 'test@example.com',
          password: 'test123'
        }
      })
    });
    
    console.log(`   Status: ${postResponse.status}`);
    console.log(`   Access-Control-Allow-Origin: ${postResponse.headers.get('access-control-allow-origin')}`);
    console.log(`   Access-Control-Allow-Credentials: ${postResponse.headers.get('access-control-allow-credentials')}`);
    
    // Check if the response headers match the origin (not wildcard)
    const allowOrigin = postResponse.headers.get('access-control-allow-origin');
    const allowCredentials = postResponse.headers.get('access-control-allow-credentials');
    
    const isOriginMatch = allowOrigin === FRONTEND_ORIGIN;
    const hasCredentials = allowCredentials === 'true';
    
    console.log(`   ✅ Origin match: ${isOriginMatch ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Credentials allowed: ${hasCredentials ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Overall POST request: ${isOriginMatch && hasCredentials ? 'PASS' : 'FAIL'}\n`);
    
    // Test 3: Test with different origin (should still work)
    console.log('3. Testing with 127.0.0.1 origin...');
    const localResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://127.0.0.1:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
      }
    });
    
    console.log(`   Status: ${localResponse.status}`);
    console.log(`   Access-Control-Allow-Origin: ${localResponse.headers.get('access-control-allow-origin')}`);
    console.log(`   ✅ 127.0.0.1 origin: ${localResponse.status === 200 ? 'PASS' : 'FAIL'}\n`);
    
    // Summary
    const allTestsPass = (
      optionsResponse.status === 200 &&
      isOriginMatch &&
      hasCredentials &&
      localResponse.status === 200
    );
    
    console.log('📊 CORS Fix Summary:');
    console.log(`   Overall Status: ${allTestsPass ? '✅ ALL TESTS PASS' : '❌ SOME TESTS FAILED'}`);
    
    if (allTestsPass) {
      console.log('\n🎉 CORS fix appears to be working correctly!');
      console.log('The backend should now properly handle:');
      console.log('   • OPTIONS preflight requests');
      console.log('   • Actual requests with credentials');
      console.log('   • Multiple allowed origins');
      console.log('   • Proper origin matching (not wildcard)');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure the Laravel backend is running on http://localhost:8000');
  }
}

// Run the test
testCORS();