// Complete Tag Operations Test Script
// Run this in browser console to test the complete tag workflow

const API_BASE_URL = 'http://localhost:8000/api/v1'

async function testCompleteTagWorkflow() {
  console.log('=== Complete Tag Operations Test ===')
  
  // Step 1: Test popular tags (no auth required)
  console.log('\n1. Testing popular tags endpoint...')
  const popularTest = await testEndpoint('/tag', 'GET')
  
  if (popularTest.success) {
    console.log('✓ Popular tags loaded successfully')
    console.log('Popular tags:', popularTest.data.data || popularTest.data)
  } else {
    console.log('✗ Failed to load popular tags')
    return
  }
  
  // Step 2: Test login
  console.log('\n2. Testing login...')
  const loginTest = await testEndpoint('/auth/login', 'POST', {
    data: {
      email: 'test@example.com',
      password: 'password123'
    }
  })
  
  if (!loginTest.success || !loginTest.data.data?.token) {
    console.log('✗ Login failed. Cannot proceed with authenticated tests.')
    console.log('Note: You may need to create a test user first.')
    return
  }
  
  const { token, client_id } = loginTest.data.data
  console.log('✓ Login successful')
  
  // Step 3: Test user tags with auth
  console.log('\n3. Testing user tags endpoint with auth...')
  const userTagsTest = await testEndpointWithAuth('/user/tag', 'GET', null, token, client_id)
  
  if (userTagsTest.success) {
    console.log('✓ User tags loaded successfully')
    console.log('User tags:', userTagsTest.data.data || userTagsTest.data)
  } else {
    console.log('✗ Failed to load user tags')
  }
  
  // Step 4: Test adding a custom tag
  console.log('\n4. Testing custom tag addition...')
  const customTagTest = await testEndpointWithAuth('/user/tag/custom', 'POST', {
    data: {
      name: 'test-tag-' + Date.now()
    }
  }, token, client_id)
  
  if (customTagTest.success) {
    console.log('✓ Custom tag added successfully')
    console.log('Added tag:', customTagTest.data.data || customTagTest.data)
  } else {
    console.log('✗ Failed to add custom tag')
    console.log('Error:', customTagTest.error)
  }
  
  // Step 5: Test adding a popular tag (if we have one)
  if (popularTest.success && popularTest.data.data && popularTest.data.data.length > 0) {
    console.log('\n5. Testing popular tag addition...')
    const firstPopularTag = popularTest.data.data[0]
    const popularTagTest = await testEndpointWithAuth('/user/tag', 'POST', {
      data: {
        tag_id: firstPopularTag.uuid || firstPopularTag.id
      }
    }, token, client_id)
    
    if (popularTagTest.success) {
      console.log('✓ Popular tag added successfully')
      console.log('Added tag:', popularTagTest.data.data || popularTagTest.data)
    } else {
      console.log('✗ Failed to add popular tag')
      console.log('Error:', popularTagTest.error)
    }
  }
  
  // Step 6: Test final user tags state
  console.log('\n6. Testing final user tags state...')
  const finalUserTagsTest = await testEndpointWithAuth('/user/tag', 'GET', null, token, client_id)
  
  if (finalUserTagsTest.success) {
    console.log('✓ Final user tags loaded successfully')
    console.log('Final user tags:', finalUserTagsTest.data.data || finalUserTagsTest.data)
  } else {
    console.log('✗ Failed to load final user tags')
  }
  
  console.log('\n=== Tag Operations Test Complete ===')
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
      return { success: false, error: `Non-JSON response: ${contentType}` }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function testEndpointWithAuth(endpoint, method = 'GET', body = null, token, client_id) {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'token': token,
    'client_id': client_id
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
      return { success: false, error: `Non-JSON response: ${contentType}` }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Instructions for use
console.log(`
=== Tag Operations Test Instructions ===

To run this test:

1. Open browser developer tools (F12)
2. Go to the Console tab
3. Copy and paste this entire script
4. Press Enter to run

This will test:
- Popular tags endpoint (no auth required)
- User login
- User tags endpoint (with auth)
- Adding custom tags
- Adding popular tags
- Final user tags state

Expected results:
- Popular tags should load successfully
- Login should work (if test user exists)
- Tag operations should work with proper authentication
- All responses should be JSON, not HTML

If you see "Expected JSON response, got text/html" errors,
it means the backend is returning HTML pages instead of JSON.
This usually indicates:
- CORS issues
- 404 errors (endpoint not found)
- Server configuration problems

Check the browser console for detailed error messages.
`)

// Auto-run after a short delay to let instructions display
setTimeout(testCompleteTagWorkflow, 1000)