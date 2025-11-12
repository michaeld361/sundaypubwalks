import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

let openaiClient = null;

/**
 * Get or create OpenAI client (lazy initialization)
 */
function getOpenAIClient() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
}

/**
 * Generate an illustration for the walk
 */
export async function generateIllustration(walk, weather) {
  const prompt = buildImagePrompt(walk, weather);
  
  console.log('Generating image with gpt-image-1...');
  console.log('Prompt:', prompt);

  try {
    const openai = getOpenAIClient();

    // Use gpt-image-1 for superior quality
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      // Change to square so feed posts don't get cropped
      size: "1024x1024",      // 1:1 aspect ratio for Instagram feed
      quality: "high",
      output_format: "png"
    });

    const imageBase64 = response.data[0].b64_json;
    console.log('✅ Image generated successfully with gpt-image-1');

    // Save the base64 image locally
    const imagePath = await saveBase64Image(imageBase64, walk.slug);
    
    // Build public URL that Instagram can access
    const baseUrl = process.env.PUBLIC_URL || process.env.BASE_URL || 'https://sundaypubwalks.onrender.com';
    const filename = path.basename(imagePath);
    const publicUrl = `${baseUrl}/images/${filename}`;

    console.log('Image saved to:', imagePath);
    console.log('Public URL:', publicUrl);

    return {
      url: publicUrl,      // Public URL for Instagram to fetch
      localPath: imagePath // Local path for backup
    };

  } catch (error) {
    console.error('Error generating image:', error.message);
    throw error;
  }
}

/**
 * Build the image generation prompt
 */
function buildImagePrompt(walk, weather) {
  const { area, end_pub_name, landmarks_for_prompt, seasonality } = walk;
  const landmarksText = landmarks_for_prompt.join(", ");
  const seasonHint = getSeasonHint();

  return `Bright, flat-colour vector illustration in a modern travel-poster style. \
A couple of hikers with backpacks walking along a green path in ${area} \
towards a cosy English pub called ${end_pub_name}. \
Show ${landmarksText} in the distance. \
Rich greens and blues, warm light in the pub windows, clean shapes, minimal shading, \
stylised figures with no facial details. \
Weather feels like ${weather.summary.toLowerCase()}. \
Seasonal vibe: ${seasonHint} (${seasonality}). \
Square format, 1:1 aspect ratio, centred composition, full-bleed, suitable for an Instagram feed post. \
British countryside aesthetic with warm, inviting atmosphere.`;
}

/**
 * Determine season hint based on current date
 */
function getSeasonHint(date = new Date()) {
  const month = date.getMonth() + 1;
  if ([12, 1, 2].includes(month)) return "crisp winter";
  if ([3, 4, 5].includes(month)) return "fresh spring";
  if ([6, 7, 8].includes(month)) return "bright summer";
  return "golden autumn";
}

/**
 * Save a base64-encoded image to disk
 */
async function saveBase64Image(base64Data, slug) {
  const timestamp = Date.now();
  const filename = `${slug}-${timestamp}.png`;
  const dir = path.join(process.cwd(), 'generated');
  const filepath = path.join(dir, filename);

  // Create directory if it doesn't exist
  await fs.mkdir(dir, { recursive: true });

  // Decode base64 -> Buffer and write file
  const buffer = Buffer.from(base64Data, 'base64');
  await fs.writeFile(filepath, buffer);

  return filepath;
}
