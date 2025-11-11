# 🥾 Sunday Pub Walks Bot

**Fully AI-generated Instagram bot** that creates and posts unique Sunday walk + pub recommendations every week.

## 🤖 How It's Different

**Everything is generated on-demand with AI.** No database, no templates, no pre-written content.

Every post is completely unique:
- **Walk route** - AI generates real London walks with real locations
- **Pub destination** - Real pubs that actually exist
- **Never repeats pubs** - Automatic tracking ensures no duplicate pubs! 🍺
- **Illustration** - Custom AI-generated travel poster for each walk
- **Weather forecast** - Real-time data for that specific Sunday
- **Caption & directions** - Written fresh each time

## 📋 Features

- **100% AI-generated content** - Every walk is unique and created on-demand
- **Automated posting** - Scheduled to post every Saturday (or your preferred schedule)
- **Beautiful illustrations** - Travel-poster style images using DALL-E
- **Real locations** - AI generates walks using actual London geography and pubs
- **Real-time weather** - Fetches actual weather forecasts for the walk location
- **Professional captions** - Engaging, informative captions with walk details and directions
- **Zero maintenance** - No database to manage or walks to curate
- **Infinite variety** - Never runs out of content

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ installed
- Instagram Business or Creator account
- Facebook Developer account for Instagram API access
- OpenAI API key (for image generation)
- OpenWeatherMap API key (for weather data)

### 2. Installation

```bash
# Clone or download this repository
cd sunday-pub-walks

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 3. Configuration

Edit `.env` and add your credentials:

```env
# Instagram Graph API
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_ACCOUNT_ID=your_instagram_business_account_id

# OpenAI API for image generation
OPENAI_API_KEY=your_openai_api_key

# Weather API (OpenWeatherMap)
OPENWEATHER_API_KEY=your_openweather_api_key

# Schedule (cron format)
POST_SCHEDULE=0 10 * * 6  # Saturday at 10:00 AM

# Environment
NODE_ENV=development
```

### 4. Getting API Credentials

#### Instagram Access Token

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app and add Instagram Graph API
3. Connect your Instagram Business account
4. Generate a long-lived access token
5. Get your Instagram Account ID from the API

📚 **Detailed guide**: https://developers.facebook.com/docs/instagram-api/getting-started

#### OpenAI API Key

1. Sign up at https://platform.openai.com/
2. Go to API keys section
3. Create a new secret key
4. Make sure you have credits available for DALL-E 3

#### OpenWeatherMap API Key

1. Sign up at https://openweathermap.org/
2. Go to API keys section
3. Use the free tier (sufficient for this use case)

### 5. Test Run

Before scheduling, test that everything works:

```bash
# Test in development mode (won't actually post to Instagram)
npm test

# View pub history (check which pubs have been used)
npm run show-pubs

# Check the generated/ folder for the image and caption
```

This will:
- Select a walk
- Fetch weather
- Generate an illustration
- Create a caption
- Save everything locally (but not post to Instagram)

### 6. Start the Scheduler

Once you're happy with the test results:

```bash
# Set to production mode in .env
NODE_ENV=production

# Start the scheduler
npm start
```

The bot will now run continuously and post according to your schedule.

## 📁 Project Structure

```
sunday-pub-walks/
├── data/                   # (empty - no database needed!)
├── src/
│   ├── services/
│   │   ├── ai-walk-generator.js  # AI walk generation
│   │   ├── weather.js            # Weather API integration
│   │   ├── caption.js            # Caption generation
│   │   ├── image.js              # Image generation (DALL-E)
│   │   └── instagram.js          # Instagram posting
│   ├── index.js            # Main app & scheduler
│   └── test-post.js        # Manual testing script
├── generated/              # Generated images (created automatically)
├── logs/                   # Post history (created automatically)
├── .env                    # Your credentials (create from .env.example)
├── .env.example           # Template for environment variables
└── package.json
```

## 🤖 How AI Generation Works

Every time the bot runs, it:

1. **Checks previous posts** to see which pubs have been used

2. **Asks GPT-4o** to generate a complete walk based on:
   - Current season (for seasonal recommendations)
   - Random London area (for variety)
   - Real geography and real pubs
   - **Excluding previously used pubs** (no duplicates!)

3. **Validates** the generated data:
   - Ensures all required fields are present
   - Checks coordinates are valid
   - Verifies directions are complete
   - **Confirms pub hasn't been used before**

4. **Uses the walk** to create the post:
   - Fetches real weather for the location
   - Generates a custom illustration
   - Builds the caption
   - Posts to Instagram
   - **Logs the pub name** to prevent future duplicates

## 🎨 Customizing AI Generation

Want to adjust what kinds of walks get generated? Edit `src/services/ai-walk-generator.js`:

**Change the areas:**
```javascript
const areas = [
  "North London (Hampstead, Highgate, or Primrose Hill)",
  "Add your preferred areas here",
  // ...
];
```

**Adjust the prompt:**
Modify `buildWalkGenerationPrompt()` to emphasize:
- Longer/shorter walks
- Specific pub styles
- Certain landmarks or features
- Difficulty levels

**Control creativity:**
```javascript
temperature: 1.0  // Higher = more creative, Lower = more conservative
```

## ⚙️ Configuration Options

### Schedule Format

The `POST_SCHEDULE` uses cron syntax:

```
# Format: minute hour day-of-month month day-of-week

# Examples:
0 10 * * 6    # Saturday at 10:00 AM
0 9 * * 0     # Sunday at 9:00 AM
30 8 * * 6    # Saturday at 8:30 AM
0 18 * * 5    # Friday at 6:00 PM
```

### AI Generation Options

You can control how many walk options to generate:

```javascript
// In src/index.js
const walk = await generateBestWalk(2); // Generate 2 options, pick the best
```

Higher numbers give you more variety but use more API credits.

## 🧪 Testing

```bash
# Test with automatic walk selection
npm test

# Test with specific walk ID
npm test walk-001

# List available walks
npm test
```

## 📊 Monitoring

### Post Logs

All published posts are logged to `logs/posts.jsonl`:

```json
{"timestamp":"2024-11-11T10:00:00Z","walkId":"walk-001","walkTitle":"Heath to Hearth","instagramPostId":"12345","success":true}
```

### Generated Content

Images and captions are saved to `generated/` directory for reference.

## 🔧 Troubleshooting

### "Instagram credentials not configured"

Make sure you have both `INSTAGRAM_ACCESS_TOKEN` and `INSTAGRAM_ACCOUNT_ID` in your `.env` file.

### "Failed to generate walk"

- Check your OpenAI API key is valid
- Ensure you have credits available
- Try increasing the timeout or retrying
- Check OpenAI service status

### "Image generation failed"

- Check your OpenAI API key is valid
- Ensure you have credits available
- Check if DALL-E 3 is accessible in your region

### "Weather API error"

- Verify your OpenWeatherMap API key
- Check if you've exceeded the free tier limits (60 calls/minute)

### Posts not appearing on schedule

- Ensure the app is running (`npm start`)
- Check the cron schedule is valid
- Verify your system time is correct

### AI generates invalid walks

- The AI should generate real London locations
- If you get bad results, try adjusting the temperature in `ai-walk-generator.js`
- Check the prompt instructions are clear

## 🚀 Deployment

### Running on a Server

Use PM2 to keep the bot running:

```bash
# Install PM2 globally
npm install -g pm2

# Start the bot
pm2 start src/index.js --name sunday-pub-walks

# View logs
pm2 logs sunday-pub-walks

# Stop the bot
pm2 stop sunday-pub-walks
```

### Running with Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "start"]
```

```bash
docker build -t sunday-pub-walks .
docker run -d --env-file .env sunday-pub-walks
```

## 📝 Notes

- **Instagram API Limits**: Be aware of Instagram's posting limits (typically 25 posts per day)
- **Access Token Expiry**: Long-lived tokens expire after 60 days - you'll need to refresh them
- **AI Generation Costs**: 
  - GPT-4 for walk generation: ~$0.01-0.02 per walk
  - DALL-E 3 for images: ~$0.04 per image
  - **Total per post: ~$0.05-0.06**
- **Weather API Limits**: Free tier allows 60 calls/minute, 1000 calls/day
- **Content Quality**: AI-generated walks use real locations but always verify accuracy
- **Variety**: Every post is unique - you'll never run out of content!

## 🤝 Contributing

Want to improve the AI-generated content? Here's how:

1. **Adjust the prompt** in `src/services/ai-walk-generator.js` to:
   - Focus on specific types of walks
   - Emphasize certain pub styles
   - Include/exclude certain areas

2. **Add area diversity** by expanding the `areas` array

3. **Improve validation** to ensure higher quality walks

4. **Tweak creativity** by adjusting the temperature parameter

## 📜 License

MIT

---

Made with ❤️ for Sunday walkers and pub lovers
