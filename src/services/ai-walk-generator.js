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
 * Get list of pubs that have already been posted
 */
async function getUsedPubs() {
  const logPath = path.join(process.cwd(), 'logs', 'posts.jsonl');
  
  try {
    const data = await fs.readFile(logPath, 'utf-8');
    const lines = data.trim().split('\n');
    const posts = lines.map(line => JSON.parse(line));
    
    // Extract unique pub names
    const pubs = [...new Set(posts.map(p => p.pubName).filter(Boolean))];
    console.log(`📋 Found ${pubs.length} previously used pubs`);
    return pubs;
  } catch (error) {
    // No log file yet or empty
    console.log('📋 No previous posts found - fresh start!');
    return [];
  }
}

/**
 * Generate a complete Sunday pub walk using AI
 */
export async function generateWalk(maxAttempts = 5, attempt = 1) {
  console.log(`🤖 Generating a new walk with AI... (attempt ${attempt}/${maxAttempts})`);
  
  // Safety check
  if (attempt > maxAttempts) {
    throw new Error('Failed to generate a unique pub after maximum attempts');
  }
  
  // Get pubs we've already used
  const usedPubs = await getUsedPubs();
  
  const prompt = buildWalkGenerationPrompt(usedPubs);
  
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-5", // Latest and most capable model
      messages: [
        {
          role: "system",
          content: "You are an expert on London walks and traditional British pubs. You generate authentic, detailed walking routes that combine beautiful scenery with excellent pub destinations. You know real London geography, real pubs, and create engaging, walkable routes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 1.0, // High creativity for variety
      response_format: { type: "json_object" }
    });

    const walkData = JSON.parse(response.choices[0].message.content);
    
    // Check if this pub was already used
    if (usedPubs.includes(walkData.end_pub_name)) {
      console.warn(`⚠️  Pub "${walkData.end_pub_name}" was already used. Regenerating...`);
      // Recursively try again with incremented attempt counter
      return await generateWalk(maxAttempts, attempt + 1);
    }
    
    console.log('✅ Generated walk:', walkData.walk_title);
    console.log('🍺 Pub:', walkData.end_pub_name, '(new!)');
    
    // Validate and format the walk data
    return formatWalkData(walkData);
    
  } catch (error) {
    console.error('Error generating walk:', error.message);
    throw error;
  }
}

/**
 * Build the prompt for walk generation
 */
function buildWalkGenerationPrompt(usedPubs = []) {
  const season = getCurrentSeason();
  const area = getRandomArea();
  
  // Build exclusion list for prompt
  let pubExclusion = '';
  if (usedPubs.length > 0) {
    pubExclusion = `\n\nIMPORTANT - DO NOT USE THESE PUBS (already posted):
${usedPubs.map(p => `- ${p}`).join('\n')}

You MUST choose a different pub that we haven't featured before.`;
  }
  
  return `Generate a complete Sunday pub walk in ${area}, London that would be perfect for ${season}.

CRITICAL REQUIREMENTS:
- Use REAL locations, REAL pub names, REAL landmarks that actually exist in London
- Provide accurate GPS coordinates (lat/lng) for the walk's midpoint
- The pub MUST be a real pub that exists - check your knowledge
- Create a fun, punchy, slightly cheeky walk title (e.g. "Heath to Hearth", "Pints Above the Park")
- Make it sound inviting and achievable
- Include 3-5 clear highlights that sell the walk
- Provide 5-7 step-by-step directions that are actually followable
- List 3-5 landmarks for AI image generation (visual elements: bridges, parks, ponds, hills, buildings)${pubExclusion}

Return a JSON object with this EXACT structure:

{
  "walk_title": "Catchy, tongue-in-cheek title (4-6 words max)",
  "area": "Full area description (e.g., Hampstead Heath, North London)",
  "area_short": "Short name (e.g., Hampstead Heath)",
  "start_point": "Specific starting location (tube/train station or landmark)",
  "end_pub_name": "REAL pub name (e.g., The Spaniards Inn)",
  "end_pub_handle": "Instagram handle if known (or null if unknown)",
  "distance_km": 4.5,
  "duration_minutes": 75,
  "terrain": "Brief terrain description",
  "difficulty": "easy|moderate|challenging",
  "highlights": [
    "First amazing thing about this walk",
    "Second great feature",
    "Third highlight including the pub finish"
  ],
  "landmarks_for_prompt": [
    "Landmark 1 for image",
    "Landmark 2 for image",
    "Visual element 3"
  ],
  "dog_friendly": true,
  "kid_friendly": true,
  "pram_friendly": false,
  "best_for": "What makes this walk special (one sentence)",
  "seasonality": "Why this walk works for ${season}",
  "location_coords": {
    "lat": 51.560,
    "lng": -0.170
  },
  "directions": [
    "Step 1: Start from [place]...",
    "Step 2: Walk towards...",
    "Step 3: Continue along...",
    "Step 4: Look for...",
    "Step 5: Finally, [pub name] will be on your [left/right]..."
  ],
  "pub_description": "Brief description of why this pub is great (for context)"
}

IMPORTANT: 
- All locations must be REAL and in London
- GPS coordinates must be accurate for the area
- The pub must actually exist
- Distance should be 3-8km (30-120 minutes walking)
- Make it sound fun and inviting, not clinical
- Use British English and pub culture language`;
}

/**
 * Format and validate walk data from AI
 */
function formatWalkData(walkData) {
  // Add generated metadata
  const walk = {
    id: `walk-${Date.now()}`,
    slug: walkData.walk_title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, ''),
    ...walkData
  };
  
  // Validate required fields
  const required = [
    'walk_title', 'area', 'area_short', 'start_point', 
    'end_pub_name', 'distance_km', 'duration_minutes',
    'highlights', 'landmarks_for_prompt', 'location_coords', 'directions'
  ];
  
  for (const field of required) {
    if (!walk[field]) {
      throw new Error(`Generated walk missing required field: ${field}`);
    }
  }
  
  // Validate coordinates
  if (!walk.location_coords.lat || !walk.location_coords.lng) {
    throw new Error('Generated walk has invalid coordinates');
  }
  
  // Ensure arrays have content
  if (walk.highlights.length < 2) {
    throw new Error('Walk must have at least 2 highlights');
  }
  
  if (walk.directions.length < 4) {
    throw new Error('Walk must have at least 4 direction steps');
  }
  
  return walk;
}

/**
 * Get current season for context
 */
function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if ([12, 1, 2].includes(month)) return "winter (cosy pubs, crisp air, roaring fires)";
  if ([3, 4, 5].includes(month)) return "spring (fresh blooms, mild weather, beer gardens opening)";
  if ([6, 7, 8].includes(month)) return "summer (long days, sunny terraces, riverside pints)";
  return "autumn (golden leaves, mild temperatures, harvest season)";
}

/**
 * Get a random London area for variety
 */
function getRandomArea() {
  const areas = [
    "North London (Hampstead, Highgate, or Primrose Hill)",
    "South West London (Richmond, Barnes, or Wimbledon)",
    "East London (Victoria Park, Hackney, or Walthamstow)",
    "West London (Chiswick, Kew, or Ealing)",
    "South London (Greenwich, Dulwich, or Clapham Common)",
    "Central London parks (Regent's Park, Hyde Park, or Battersea Park)",
    "Thames Path (anywhere along the river through London)",
    "Regent's Canal (from Angel to Victoria Park or beyond)"
  ];
  
  return areas[Math.floor(Math.random() * areas.length)];
}

/**
 * Generate multiple walk options and select the best one
 * This ensures quality by giving us choice
 */
export async function generateBestWalk(options = 2) {
  console.log(`🎲 Generating ${options} walk options to choose from...`);
  
  const walks = [];
  
  for (let i = 0; i < options; i++) {
    try {
      const walk = await generateWalk();
      walks.push(walk);
      
      // Small delay to avoid rate limits
      if (i < options - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.warn(`Failed to generate walk option ${i + 1}:`, error.message);
    }
  }
  
  if (walks.length === 0) {
    throw new Error('Failed to generate any walks');
  }
  
  // For now, just return the first successful one
  // Could add scoring logic here to pick the "best" one
  const selectedWalk = walks[0];
  
  console.log(`✅ Selected: "${selectedWalk.walk_title}"`);
  return selectedWalk;
}
