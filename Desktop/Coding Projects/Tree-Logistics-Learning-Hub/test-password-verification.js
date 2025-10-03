const { verifyPassword } = require('./lib/crypto')

async function testPasswordVerification() {
  try {
    // Test with a simple password hash
    const testHash = 'salt:hash'
    const testPassword = 'test'
    
    console.log('Testing password verification...')
    const isValid = await verifyPassword(testPassword, testHash)
    console.log('Password verification result:', isValid)
    
    // Test with the actual admin password
    const adminPassword = 'Admin123!'
    // We need to get the actual hash from the database
    console.log('Admin password test would require database hash')
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testPasswordVerification()
