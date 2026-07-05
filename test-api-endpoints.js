// Simple test script to verify API endpoints
// Run this in browser console or as a standalone script

const API_BASE_URL = 'http://localhost:8000/api/v1'

async function testEndpoint(endpoint, method = 'GET', body = null) {
  console.log(`\n=== Testing ${method} ${endpoint} ===`)
  
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
    console.log(`Content-Type: ${contentType}`)
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      console.log('Response:', data)
      return { success: true, data }
    } else {
      const text = await response.text()
      console.log('Response (HTML/text):', text.substring(0, 500))
      return { success: false, error: 'Non-JSON response' }
    }
  } catch (error) {
    console.error('Error:', error.message)
    return { success: false, error: error.message }
  }
}

// Test tag endpoints
async function testTagEndpoints() {
  console.log('Testing Tag API Endpoints...')
  
  // Test popular tags (should work without auth)
  await testEndpoint('/tag', 'GET')
  
  // Test user tags (requires auth)
  await testEndpoint('/user/tag', 'GET')
  
  // Test custom tag addition (requires auth)
  await testEndpoint('/user/tag/custom', 'POST', {
    data: {
      name: 'test-tag'
    }
  })
  
  console.log('\n=== Test Complete ===')
}

// Run tests
testTagEndpoints()