import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate an illustration for the walk
 */
export async function generateIllustration(walk, weather) {
  const prompt = buildImagePrompt(walk, weather);
  
  console.log('Generating image with prompt:', prompt);

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1792", // 9:16 aspect ratio
      quality: "standard",
      style: "natural"
    });

    const imageUrl = response.data[0].url;
    console.log('Image generated successfully:', imageUrl);

    // Download and save the image locally
    const imagePath = await downloadImage(imageUrl, walk.slug);
    
    return {
      url: imageUrl,
      localPath: imagePath
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
Portrait orientation, full-bleed, suitable for an Instagram post. \
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
 * Download image from URL and save locally
 */
async function downloadImage(url, slug) {
  const timestamp = Date.now();
  const filename = `${slug}-${timestamp}.png`;
  const dir = path.join(process.cwd(), 'generated');
  const filepath = path.join(dir, filename);

  // Create directory if it doesn't exist
  await fs.mkdir(dir, { recursive: true });

  // Download image
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'arraybuffer'
  });

  // Save to file
  await fs.writeFile(filepath, response.data);
  console.log('Image saved to:', filepath);

  return filepath;
}
