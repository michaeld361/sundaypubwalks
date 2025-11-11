import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

/**
 * Verify that all required environment variables are set
 */
function checkEnvironmentVariables() {
  console.log('1️⃣  Checking environment variables...\n');
  
  const required = {
    'INSTAGRAM_ACCESS_TOKEN': process.env.INSTAGRAM_ACCESS_TOKEN,
    'INSTAGRAM_ACCOUNT_ID': process.env.INSTAGRAM_ACCOUNT_ID,
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
    'OPENWEATHER_API_KEY': process.env.OPENWEATHER_API_KEY
  };
  
  const optional = {
    'POST_SCHEDULE': process.env.POST_SCHEDULE || '0 10 * * 6 (default)',
    'NODE_ENV': process.env.NODE_ENV || 'development (default)'
  };
  
  let allGood = true;
  
  // Check required
  for (const [key, value] of Object.entries(required)) {
    if (!value) {
      console.log(`   ❌ ${key} - NOT SET`);
      allGood = false;
    } else {
      const masked = value.substring(0, 8) + '...' + value.substring(value.length - 4);
      console.log(`   ✅ ${key} - ${masked}`);
    }
  }
  
  console.log('');
  
  // Show optional
  for (const [key, value] of Object.entries(optional)) {
    console.log(`   ℹ️  ${key} - ${value}`);
  }
  
  console.log('');
  
  if (!allGood) {
    console.log('⚠️  Some required environment variables are missing!');
    console.log('   Please copy .env.example to .env and fill in your credentials.\n');
    return false;
  }
  
  return true;
}

/**
 * Verify Instagram API access
 */
async function checkInstagramAccess() {
  console.log('2️⃣  Checking Instagram API access...\n');
  
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  
  if (!token || !accountId) {
    console.log('   ⚠️  Instagram credentials not configured, skipping check\n');
    return false;
  }
  
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${accountId}`,
      {
        params: {
          fields: 'id,username,name',
          access_token: token
        }
      }
    );
    
    console.log(`   ✅ Connected to Instagram account: @${response.data.username}`);
    console.log(`   ✅ Account name: ${response.data.name}`);
    console.log(`   ✅ Account ID: ${response.data.id}\n`);
    return true;
    
  } catch (error) {
    console.log('   ❌ Instagram API access failed');
    console.log(`   Error: ${error.response?.data?.error?.message || error.message}\n`);
    console.log('   Troubleshooting:');
    console.log('   - Verify your access token is valid');
    console.log('   - Ensure your account ID is correct');
    console.log('   - Check that your token has instagram_basic and instagram_content_publish permissions\n');
    return false;
  }
}

/**
 * Verify OpenAI API access
 */
async function checkOpenAIAccess() {
  console.log('3️⃣  Checking OpenAI API access...\n');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('   ⚠️  OpenAI API key not configured, skipping check\n');
    return false;
  }
  
  try {
    const response = await axios.get(
      'https://api.openai.com/v1/models',
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    const hasDalle = response.data.data.some(m => m.id.includes('dall-e'));
    
    console.log('   ✅ OpenAI API key is valid');
    console.log(`   ✅ DALL-E access: ${hasDalle ? 'Available' : 'Not found'}\n`);
    
    if (!hasDalle) {
      console.log('   ⚠️  DALL-E models not found. Image generation may not work.\n');
    }
    
    return hasDalle;
    
  } catch (error) {
    console.log('   ❌ OpenAI API access failed');
    console.log(`   Error: ${error.response?.data?.error?.message || error.message}\n`);
    console.log('   Troubleshooting:');
    console.log('   - Verify your API key is correct');
    console.log('   - Ensure you have credits available\n');
    return false;
  }
}

/**
 * Verify weather API access
 */
async function checkWeatherAccess() {
  console.log('4️⃣  Checking weather API access...\n');
  
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  if (!apiKey) {
    console.log('   ⚠️  Weather API key not configured, skipping check\n');
    return false;
  }
  
  try {
    // Test with London coordinates
    const response = await axios.get(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: {
          lat: 51.5074,
          lon: -0.1278,
          appid: apiKey,
          units: 'metric'
        }
      }
    );
    
    console.log('   ✅ Weather API key is valid');
    console.log(`   ✅ Current weather in ${response.data.name}: ${response.data.weather[0].description}, ${Math.round(response.data.main.temp)}°C\n`);
    return true;
    
  } catch (error) {
    console.log('   ❌ Weather API access failed');
    console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
    console.log('   Troubleshooting:');
    console.log('   - Verify your API key is correct');
    console.log('   - Check you haven\'t exceeded rate limits\n');
    return false;
  }
}

/**
 * Main setup verification
 */
async function verifySetup() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║    🥾 Sunday Pub Walks - Setup Verification 🍺       ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  const results = {
    env: false,
    instagram: false,
    openai: false,
    weather: false
  };
  
  results.env = checkEnvironmentVariables();
  
  if (results.env) {
    results.instagram = await checkInstagramAccess();
    results.openai = await checkOpenAIAccess();
    results.weather = await checkWeatherAccess();
  }
  
  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('Summary:\n');
  
  const allPassed = Object.values(results).every(v => v);
  
  if (allPassed) {
    console.log('✅ All checks passed! You\'re ready to go.\n');
    console.log('🤖 This bot uses AI to generate walks on-demand!');
    console.log('   Every post will be unique and completely generated by AI.\n');
    console.log('Next steps:');
    console.log('  1. Run "npm test" to generate a test post');
    console.log('  2. Once happy, set NODE_ENV=production in .env');
    console.log('  3. Run "npm start" to start the scheduler\n');
  } else {
    console.log('⚠️  Some checks failed. Please review the errors above.\n');
    console.log('Once you\'ve fixed the issues, run this script again:');
    console.log('  node src/verify-setup.js\n');
  }
  
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run verification
verifySetup().catch(error => {
  console.error('Setup verification failed:', error);
  process.exit(1);
});
