import axios from 'axios';
import fs from 'fs/promises';

const GRAPH_API_VERSION = 'v18.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Post an image with caption to Instagram
 */
export async function postToInstagram({ imageUrl, imagePath, caption }) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    throw new Error('Instagram credentials not configured. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID in .env');
  }

  try {
    console.log('Creating Instagram media container...');

    // Step 1: Create media container
    // Instagram requires the image to be publicly accessible
    // In production, you'd upload to a CDN or hosting service
    const containerId = await createMediaContainer({
      accountId,
      accessToken,
      imageUrl, // Must be a publicly accessible URL
      caption
    });

    console.log('Media container created:', containerId);

    // Step 2: Wait a moment for processing
    await sleep(2000);

    // Step 3: Publish the container
    console.log('Publishing media container...');
    const result = await publishMediaContainer({
      accountId,
      accessToken,
      containerId
    });

    console.log('Successfully posted to Instagram:', result);
    return result;

  } catch (error) {
    console.error('Error posting to Instagram:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create an Instagram media container
 */
async function createMediaContainer({ accountId, accessToken, imageUrl, caption }) {
  const response = await axios.post(
    `${BASE_URL}/${accountId}/media`,
    {
      image_url: imageUrl,
      caption: caption,
      access_token: accessToken
    }
  );

  return response.data.id;
}

/**
 * Publish a media container to Instagram feed
 */
async function publishMediaContainer({ accountId, accessToken, containerId }) {
  const response = await axios.post(
    `${BASE_URL}/${accountId}/media_publish`,
    {
      creation_id: containerId,
      access_token: accessToken
    }
  );

  return response.data;
}

/**
 * Check status of a media container
 */
async function checkMediaStatus({ containerId, accessToken }) {
  const response = await axios.get(
    `${BASE_URL}/${containerId}`,
    {
      params: {
        fields: 'status_code',
        access_token: accessToken
      }
    }
  );

  return response.data;
}

/**
 * Simple sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Log a post to local storage (for tracking)
 */
export async function logPost(walk, result) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    walkId: walk.id,
    walkTitle: walk.walk_title,
    slug: walk.slug,
    pubName: walk.end_pub_name, // Track pub name to avoid duplicates
    area: walk.area_short,
    instagramPostId: result.id,
    success: true
  };

  const logDir = 'logs';
  const logFile = `${logDir}/posts.jsonl`;

  try {
    await fs.mkdir(logDir, { recursive: true });
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
    console.log('Post logged to:', logFile);
  } catch (error) {
    console.error('Error logging post:', error.message);
  }
}
