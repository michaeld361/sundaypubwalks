import cron from 'node-cron';
import dotenv from 'dotenv';
import http from 'http';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { generateBestWalk } from './services/ai-walk-generator.js';
import { fetchWeatherSummary } from './services/weather.js';
import { buildCaption, validateCaption } from './services/caption.js';
import { generateIllustration } from './services/image.js';
import { postToInstagram, logPost } from './services/instagram.js';

// Load environment variables
dotenv.config();

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTANT: generated images are saved at project root in /generated
// (e.g. /opt/render/project/src/generated/...)
const PROJECT_ROOT = process.cwd();
const GENERATED_DIR = path.join(PROJECT_ROOT, 'generated');

// Server/env config
const PORT = process.env.PORT || 3000;
const TRIGGER_SECRET = process.env.TRIGGER_SECRET || 'change-me-in-production';

/**
 * Main job that creates and publishes a Sunday pub walk post
 */
async function publishSundayWalkPost() {
  console.log('\n=== Starting Sunday Pub Walk post generation ===');
  console.log(`Time: ${new Date().toISOString()}`);

  try {
    // 1. Generate a walk with AI
    console.log('\n[1/5] Generating walk with AI...');
    const walk = await generateBestWalk(1); // Generate 1 walk (can increase for more options)

    // 2. Fetch weather
    console.log('\n[2/5] Fetching weather...');
    const weather = await fetchWeatherSummary(walk);
    console.log('Weather:', weather);

    // 3. Build caption
    console.log('\n[3/5] Building caption...');
    const caption = buildCaption({ walk, weather });
    const isValid = validateCaption(caption);

    if (!isValid) {
      console.warn('Caption may be too long, but continuing...');
    }

    console.log('Caption preview (first 200 chars):');
    console.log(caption.substring(0, 200) + '...\n');

    // 4. Generate image
    console.log('[4/5] Generating illustration...');
    const image = await generateIllustration(walk, weather);
    console.log('Image generated:', image.url);

    // 5. Post to Instagram
    console.log('\n[5/5] Posting to Instagram...');

    // Check if we're in test mode
    if (process.env.NODE_ENV === 'development') {
      console.log('\n⚠️  DEVELOPMENT MODE - Post not published to Instagram');
      console.log('To publish for real, set NODE_ENV=production in .env');
      console.log('\nGenerated content saved:');
      console.log('- Image:', image.localPath);
      console.log('- Caption length:', caption.length, 'characters');

      // Save caption to file for review
      const captionPath = image.localPath.replace(/\.png$/i, '-caption.txt');
      await fsp.writeFile(captionPath, caption, 'utf8');
      console.log('- Caption:', captionPath);

      return {
        success: true,
        mode: 'development',
        walk: walk.walk_title,
        image: image.localPath
      };
    }

    // Production: actually post to Instagram
    const result = await postToInstagram({
      imageUrl: image.url,
      imagePath: image.localPath,
      caption
    });

    // Log the successful post
    await logPost(walk, result);

    console.log('\n✅ Successfully published Sunday Pub Walk post!');
    console.log('Walk:', walk.walk_title);
    console.log('Instagram Post ID:', result.id);

    return {
      success: true,
      mode: 'production',
      walk: walk.walk_title,
      postId: result.id
    };

  } catch (error) {
    console.error('\n❌ Error publishing post:', error.message);
    console.error(error);

    // In production, you might want to send alerts here
    // e.g., email, Slack notification, etc.

    throw error;
  }
}

// Create simple HTTP server for Render health checks, manual triggers, and images
const server = http.createServer(async (req, res) => {
  try {
    // Parse URL once
    const url = new URL(req.url, `http://${req.headers.host}`);

    // 1) Health check endpoint
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        service: 'Sunday Pub Walks Bot',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // 2) Manual trigger endpoint
    if (url.pathname === '/trigger') {
      const providedSecret = url.searchParams.get('secret');

      if (providedSecret !== TRIGGER_SECRET) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Unauthorized',
          message: 'Invalid or missing secret token'
        }));
        return;
      }

      // Trigger the post!
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'triggered',
        message: 'Post generation started! Check logs for progress.'
      }));

      // Run the post job asynchronously
      console.log('🎯 Manual trigger received!');
      publishSundayWalkPost().catch(error => {
        console.error('Manual trigger failed:', error);
      });

      return;
    }

    // 3) Serve generated images from /images/*
    if (url.pathname.startsWith('/images/')) {
      const filename = path.basename(url.pathname); // strip any dirs
      const filePath = path.join(GENERATED_DIR, filename);

      console.log(`[images] Request for ${filename} -> ${filePath}`);

      try {
        // Ensure file exists
        const stat = await fsp.stat(filePath);
        if (!stat.isFile()) {
          throw new Error('Not a file');
        }

        // Determine content type
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.avif') contentType = 'image/avif';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*'
        });

        // Stream the file to the response
        const stream = fs.createReadStream(filePath);
        stream.on('error', err => {
          console.error('Error streaming image:', err);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
          }
          res.end(JSON.stringify({ error: 'Error reading image' }));
        });
        stream.pipe(res);
      } catch (err) {
        console.warn(`Image not found: ${filePath}`, err.message);
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Not Found',
          detail: `No such image: ${filename}`
        }));
      }

      return;
    }

    // 4) Default response (simple HTML status page)
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sunday Pub Walks Bot</title>
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            max-width: 600px; 
            margin: 50px auto; 
            padding: 20px;
            line-height: 1.6;
          }
          h1 { color: #2563eb; }
          .status { 
            background: #f0fdf4; 
            border: 1px solid #86efac; 
            padding: 15px; 
            border-radius: 8px;
            margin: 20px 0;
          }
          .emoji { font-size: 1.5em; }
          a { color: #2563eb; }
          code { 
            background: #f3f4f6; 
            padding: 2px 6px; 
            border-radius: 4px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <h1><span class="emoji">🥾</span> Sunday Pub Walks Bot <span class="emoji">🍺</span></h1>
        
        <div class="status">
          <strong>✅ Bot is running!</strong><br>
          Next scheduled post: Check schedule in Render dashboard
        </div>
        
        <h2>Endpoints:</h2>
        <ul>
          <li><code>/health</code> - Health check</li>
          <li><code>/trigger?secret=YOUR_SECRET</code> - Manual trigger</li>
          <li><code>/images/&lt;filename&gt;</code> - Generated images</li>
        </ul>
        
        <p>
          To manually trigger a post, visit:<br>
          <code>/trigger?secret=YOUR_SECRET</code>
        </p>
        
        <p>
          <em>Set TRIGGER_SECRET in your environment variables for security.</em>
        </p>
      </body>
      </html>
    `);
  } catch (err) {
    console.error('Server error handling request:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

server.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
  console.log(`Serving generated images from: ${GENERATED_DIR}`);
});

/**
 * Start the scheduler
 */
function startScheduler() {
  const schedule = process.env.POST_SCHEDULE || '0 10 * * 6'; // Default: Saturday 10am

  console.log('🚀 Sunday Pub Walks Bot Started');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Schedule:', schedule);
  console.log('Next run will generate and post a Sunday walk recommendation\n');

  // Validate schedule
  if (!cron.validate(schedule)) {
    throw new Error(`Invalid cron schedule: ${schedule}`);
  }

  // Schedule the job
  const task = cron.schedule(schedule, async () => {
    console.log('\n⏰ Scheduled job triggered');
    try {
      await publishSundayWalkPost();
    } catch (error) {
      console.error('Scheduled job failed:', error.message);
    }
  });

  console.log('✅ Scheduler is running');
  console.log('Press Ctrl+C to stop\n');

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping scheduler...');
    task.stop();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\n👋 Received SIGTERM, stopping gracefully...');
    task.stop();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

// Start the application
if (import.meta.url === `file://${process.argv[1]}`) {
  startScheduler();
}

// Export for testing
export { publishSundayWalkPost, startScheduler };
