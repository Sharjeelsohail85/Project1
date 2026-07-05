// Authentication Test Script
// Run this in browser console to test the login flow

const API_BASE_URL = 'http://localhost:8000/api/v1'

async function testAuthFlow() {
  console.log('=== Testing Authentication Flow ===')
  
  // Test 1: Try to access protected endpoint without auth
  console.log('\n1. Testing protected endpoint without auth...')
  const protectedTest = await testEndpoint('/users/me', 'GET')
  
  if (protectedTest.success && protectedTest.data.status === 401) {
    console.log('✓ Authentication required (expected)')
  } else {
    console.log('✗ Unexpected response for unauthenticated request')
  }
  
  // Test 2: Try to login with test credentials
  console.log('\n2. Testing login with test credentials...')
  const loginTest = await testEndpoint('/auth/login', 'POST', {
    data: {
      email: 'test@example.com',
      password: 'password123'
    }
  })
  
  if (loginTest.success) {
    if (loginTest.data.data && loginTest.data.data.token) {
      console.log('✓ Login successful!')
      console.log('Token:', loginTest.data.data.token)
      console.log('Client ID:', loginTest.data.data.client_id)
      
      // Store tokens for next test
      localStorage.setItem('token', loginTest.data.data.token)
      localStorage.setItem('client_id', loginTest.data.data.client_id)
      
      // Test 3: Try to access protected endpoint with auth
      console.log('\n3. Testing protected endpoint with auth...')
      const authHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'token': loginTest.data.data.token,
        'client_id': loginTest.data.data.client_id
      }
      
      const authConfig = {
        method: 'GET',
        headers: authHeaders
      }
      
      const authUrl = `${API_BASE_URL}/users/me`
      const authResponse = await fetch(authUrl, authConfig)
      const authData = await authResponse.json()
      
      console.log('Auth response:', authData)
      
      if (authData.data) {
        console.log('✓ Authenticated request successful!')
      } else {
        console.log('✗ Authenticated request failed')
      }
      
    } else {
      console.log('✗ Login failed - no token returned')
      console.log('Response:', loginTest.data)
    }
  } else {
    console.log('✗ Login request failed')
    console.log('Error:', loginTest.error)
  }
  
  console.log('\n=== Auth Test Complete ===')
}

async function testEndpoint(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
  
  const config = {
    method,
    headers
  }
  
  if (body) {
    config.body = JSON.stringify(body)
  }
  
  try {
    const response = await fetch(url, config)
    const contentType = response.headers.get('content-type')
    
    console.log(`Status: ${response.status}`)
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      return { success: true, data }
    } else {
      const text = await response.text()
      return { success: false, error: 'Non-JSON response' }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Run auth test
testAuthFlow()