import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// THEN import the app
import { publishSundayWalkPost } from './index.js';

/**
 * Test script to manually trigger post generation
 * Useful for testing without waiting for the cron schedule
 */
async function testPost() {
  console.log('🧪 Manual test run - generating a Sunday Pub Walk post');
  console.log('🤖 This will use AI to generate a completely new walk!');
  console.log('⚠️  Content will be created but NOT posted to Instagram (development mode)');
  console.log('💡 To post for real, set NODE_ENV=production in .env\n');
  
  // Ensure we're in development mode for testing
  process.env.NODE_ENV = 'development';
  
  try {
    const result = await publishSundayWalkPost();
    
    console.log('\n✅ Test completed successfully!');
    console.log('Result:', result);
    console.log('\nCheck the generated/ directory for the image and caption files.');
    console.log('🎉 Every test generates a completely unique walk!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testPost();
