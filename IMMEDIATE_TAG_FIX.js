// IMMEDIATE TAG FIX - Run this in browser console NOW
// This script will diagnose and attempt to fix the "failed to fetch error"

const API_BASE_URL = 'http://localhost:8000/api/v1'

async function immediateTagFix() {
  console.log('🚀 IMMEDIATE TAG FIX - Starting diagnosis...')
  
  // Step 1: Check if backend is accessible
  console.log('\n1️⃣ Checking backend connectivity...')
  try {
    const response = await fetch(`${API_BASE_URL}/tag`)
    console.log(`Backend status: ${response.status}`)
    
    if (response.ok) {
      console.log('✅ Backend is accessible')
      const data = await response.json()
      console.log('Popular tags loaded:', data.data?.length || 0, 'tags')
    } else {
      console.log('❌ Backend returned error:', response.status)
      const errorText = await response.text()
      if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
        console.log('💡 Issue: Backend returning HTML instead of JSON')
        console.log('🔧 Solution: Check if Laravel server is running on port 8000')
        console.log('   Run: cd Video-master && php artisan serve')
      }
      return
    }
  } catch (error) {
    console.log('❌ Backend connectivity failed:', error.message)
    console.log('💡 Issue: Network connectivity problem')
    console.log('🔧 Solutions:')
    console.log('   1. Check if Laravel server is running: cd Video-master && php artisan serve')
    console.log('   2. Verify API URL is correct')
    console.log('   3. Check firewall/network settings')
    return
  }
  
  // Step 2: Check authentication
  console.log('\n2️⃣ Checking authentication...')
  const token = localStorage.getItem('token')
  const client_id = localStorage.getItem('client_id')
  
  if (!token || !client_id) {
    console.log('❌ No authentication tokens found')
    console.log('💡 Issue: User not logged in or tokens missing')
    console.log('🔧 Solution: Login first to get valid tokens')
    console.log('   Check if login endpoint works: POST /api/v1/auth/login')
    return
  } else {
    console.log('✅ Authentication tokens found')
  }
  
  // Step 3: Test user tags endpoint
  console.log('\n3️⃣ Testing user tags endpoint...')
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
    
    console.log(`User tags status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ User tags loaded successfully')
      console.log('User tags count:', data.data?.length || 0)
    } else if (response.status === 401) {
      console.log('❌ Authentication failed')
      console.log('💡 Issue: Invalid or expired tokens')
      console.log('🔧 Solution: Login again to refresh tokens')
      localStorage.removeItem('token')
      localStorage.removeItem('client_id')
      console.log('   Tokens cleared - please login again')
    } else {
      console.log('❌ User tags request failed:', response.status)
      const errorText = await response.text()
      console.log('Error response:', errorText.substring(0, 300))
    }
  } catch (error) {
    console.log('❌ User tags request failed:', error.message)
  }
  
  // Step 4: Test adding a tag
  console.log('\n4️⃣ Testing tag addition...')
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
          name: 'test-tag-' + Date.now()
        }
      })
    })
    
    console.log(`Custom tag status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Custom tag added successfully')
      console.log('Added tag:', data.data)
    } else {
      console.log('❌ Custom tag request failed:', response.status)
      const errorText = await response.text()
      console.log('Error response:', errorText.substring(0, 300))
      
      if (response.status === 404) {
        console.log('💡 Issue: Endpoint not found')
        console.log('🔧 Solution: Check if /user/tag/custom route exists in Laravel')
      } else if (response.status === 500) {
        console.log('💡 Issue: Server error')
        console.log('🔧 Solution: Check Laravel logs for database or controller errors')
      }
    }
  } catch (error) {
    console.log('❌ Custom tag request failed:', error.message)
  }
  
  // Step 5: Check CORS
  console.log('\n5️⃣ Checking CORS configuration...')
  try {
    const response = await fetch(`${API_BASE_URL}/tag`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    })
    
    console.log('CORS preflight status:', response.status)
    const allowOrigin = response.headers.get('access-control-allow-origin')
    const allowMethods = response.headers.get('access-control-allow-methods')
    
    if (allowOrigin === '*' || allowOrigin === 'http://localhost:3000') {
      console.log('✅ CORS configured correctly')
    } else {
      console.log('❌ CORS not configured properly')
      console.log('💡 Issue: Cross-origin requests blocked')
      console.log('🔧 Solution: Add CORS configuration to Video-master/.env:')
      console.log('   CORS_ALLOWED_ORIGINS=http://localhost:3000')
      console.log('   Then restart Laravel server')
    }
  } catch (error) {
    console.log('CORS test failed:', error.message)
  }
  
  console.log('\n🎯 DIAGNOSIS COMPLETE')
  console.log('\n📋 SUMMARY:')
  console.log('If you see ✅ for all steps, tags should work')
  console.log('If you see ❌, follow the 🔧 solutions above')
  console.log('\n🔄 NEXT STEPS:')
  console.log('1. Fix any issues identified above')
  console.log('2. Restart both frontend and backend servers')
  console.log('3. Test tag operations again')
  console.log('4. If still failing, check browser console for detailed errors')
}

// Instructions
console.log(`
🎯 IMMEDIATE TAG FIX INSTRUCTIONS

To run this diagnostic script:

1. Open browser developer tools (F12)
2. Go to Console tab
3. Copy and paste this entire script
4. Press Enter to run

This will:
- Check backend connectivity
- Verify authentication
- Test user tags endpoint
- Test tag addition
- Check CORS configuration

Follow the 🔧 solutions for any ❌ issues found.
`)

// Auto-run after 2 seconds
setTimeout(immediateTagFix, 2000)
