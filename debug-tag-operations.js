// Debug Tag Operations Script
// Run this in browser console to diagnose the "failed to fetch error when entering tags"

const API_BASE_URL = 'http://localhost:8000/api/v1'

async function debugTagOperations() {
  console.log('=== Debug Tag Operations ===')
  
  // Test 1: Check if backend is accessible
  console.log('\n1. Testing backend connectivity...')
  try {
    const response = await fetch(`${API_BASE_URL}/tag`)
    console.log(`Backend response status: ${response.status}`)
    console.log(`Content-Type: ${response.headers.get('content-type')}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✓ Backend is accessible')
      console.log('Popular tags response:', data)
    } else {
      console.log('✗ Backend returned error:', response.status)
      const errorText = await response.text()
      console.log('Error response:', errorText.substring(0, 500))
    }
  } catch (error) {
    console.log('✗ Backend connectivity failed:', error.message)
    return
  }
  
  // Test 2: Check authentication
  console.log('\n2. Testing authentication...')
  const token = localStorage.getItem('token')
  const client_id = localStorage.getItem('client_id')
  
  if (!token || !client_id) {
    console.log('✗ No authentication tokens found')
    console.log('Tokens:', { token, client_id })
    console.log('Note: You need to be logged in to test authenticated endpoints')
    return
  } else {
    console.log('✓ Authentication tokens found')
  }
  
  // Test 3: Test user tags endpoint with auth
  console.log('\n3. Testing user tags endpoint with authentication...')
  try {
    const response = await fetch(`${API_BASE_URL}/user/tag`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'token': token,
        'client_id': client_id
      }
    })
    
    console.log(`User tags response status: ${response.status}`)
    console.log(`Content-Type: ${response.headers.get('content-type')}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✓ User tags loaded successfully')
      console.log('User tags response:', data)
    } else {
      console.log('✗ User tags request failed:', response.status)
      const errorText = await response.text()
      console.log('Error response:', errorText.substring(0, 500))
    }
  } catch (error) {
    console.log('✗ User tags request failed:', error.message)
  }
  
  // Test 4: Test adding a custom tag
  console.log('\n4. Testing custom tag addition...')
  try {
    const response = await fetch(`${API_BASE_URL}/user/tag/custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'token': token,
        'client_id': client_id
      },
      body: JSON.stringify({
        data: {
          name: 'debug-tag-' + Date.now()
        }
      })
    })
    
    console.log(`Custom tag response status: ${response.status}`)
    console.log(`Content-Type: ${response.headers.get('content-type')}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✓ Custom tag added successfully')
      console.log('Custom tag response:', data)
    } else {
      console.log('✗ Custom tag request failed:', response.status)
      const errorText = await response.text()
      console.log('Error response:', errorText.substring(0, 500))
    }
  } catch (error) {
    console.log('✗ Custom tag request failed:', error.message)
  }
  
  // Test 5: Check CORS headers
  console.log('\n5. Testing CORS headers...')
  try {
    const response = await fetch(`${API_BASE_URL}/tag`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    })
    
    console.log('CORS preflight response status:', response.status)
    console.log('Access-Control-Allow-Origin:', response.headers.get('access-control-allow-origin'))
    console.log('Access-Control-Allow-Methods:', response.headers.get('access-control-allow-methods'))
    console.log('Access-Control-Allow-Headers:', response.headers.get('access-control-allow-headers'))
  } catch (error) {
    console.log('CORS test failed:', error.message)
  }
  
  console.log('\n=== Debug Complete ===')
  console.log('\nCommon issues and solutions:')
  console.log('1. "Failed to fetch" usually means:')
  console.log('   - Backend server is not running')
  console.log('   - CORS policy blocking the request')
  console.log('   - Network connectivity issues')
  console.log('   - Incorrect API endpoint URL')
  console.log('')
  console.log('2. If you see "Expected JSON response, got text/html":')
  console.log('   - Backend is returning HTML error page instead of JSON')
  console.log('   - Check if the endpoint exists and is properly configured')
  console.log('   - Check Laravel routes and controller methods')
  console.log('')
  console.log('3. If authentication fails:')
  console.log('   - Check if user is logged in and tokens are valid')
  console.log('   - Verify token and client_id are being sent correctly')
  console.log('   - Check if middleware is properly configured')
}

// Instructions
console.log(`
=== Tag Operations Debug Instructions ===

To run this debug script:

1. Open browser developer tools (F12)
2. Go to the Console tab
3. Copy and paste this entire script
4. Press Enter to run

This will test:
- Backend connectivity
- Authentication status
- User tags endpoint
- Custom tag addition
- CORS configuration

Look for any errors or unexpected responses in the console output.
`)

// Auto-run after a short delay
setTimeout(debugTagOperations, 1000)