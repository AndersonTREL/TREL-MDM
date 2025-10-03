const { verifyPassword } = require('./lib/crypto')

async function testPassword() {
  try {
    // Test with a known password hash from the database
    const hash = 'salt:hash' // This would be the actual hash from the database
    const password = 'Driver123!'
    
    const isValid = await verifyPassword(password, hash)
    console.log('Password verification result:', isValid)
  } catch (error) {
    console.error('Error:', error)
  }
}

testPassword()
