/**
 * Build the Instagram caption for a walk post
 */
export function buildCaption({ walk, weather }) {
  const {
    walk_title,
    area,
    area_short,
    start_point,
    end_pub_name,
    end_pub_handle,
    distance_km,
    duration_minutes,
    highlights,
    best_for,
    directions,
    dog_friendly,
    kid_friendly,
    pram_friendly,
    terrain,
    difficulty,
    seasonality
  } = walk;

  // Format highlights (take first 3)
  const highlightLines = (highlights || [])
    .slice(0, 3)
    .map(h => `• ${h}`)
    .join('\n');

  // Format directions
  const directionsText = (directions || [])
    .map((step, i) => `${i + 1}. ${step}`)
    .join('\n');

  // Base caption (no hashtags yet)
  const baseCaption = `🥾 SUNDAY PUB WALK: ${walk_title}

📍 Area: ${area_short}
⏱️ About ${duration_minutes} mins · ${distance_km.toFixed(1)} km
🍻 Pub finish: ${end_pub_name}${end_pub_handle ? ` ${end_pub_handle}` : ''}

🌤 This Sunday's weather in ${area_short}:
${weather.summary}
Tip: ${weather.tip}

Why you'll love it:
${highlightLines}

Perfect for: ${best_for}

Tag your Sunday crew & save this for later ❤️

————————
🗺️ How to do the walk:

Start at: ${start_point}

${directionsText}

Always check local signs and paths on the day, and take a map app as backup. 🍺`;

  // Build a hashtag block tailored to this walk
  const hashtags = buildHashtags({
    area,
    area_short,
    end_pub_name,
    distance_km,
    dog_friendly,
    kid_friendly,
    pram_friendly,
    terrain,
    difficulty,
    seasonality,
    highlights
  });

  const hashtagBlock = hashtags.length ? `\n\n${hashtags.join(' ')}` : '';

  return `${baseCaption}${hashtagBlock}`;
}

/**
 * Build a set of relevant Instagram hashtags for this walk
 */
function buildHashtags({
  area,
  area_short,
  end_pub_name,
  distance_km,
  dog_friendly,
  kid_friendly,
  pram_friendly,
  terrain,
  difficulty,
  seasonality,
  highlights
}) {
  const tags = [];

  // Core / brand tags
  const globalTags = [
    '#SundayPubWalks',
    '#sundaywalk',
    '#pubwalk',
    '#londonwalks',
    '#londonpubs',
    '#sundayvibes',
    '#cosysunday',
    '#weekendplans'
  ];
  tags.push(...globalTags);

  // Area-based tags
  if (area_short) {
    tags.push(toHashtag(area_short)); // e.g. "Hampstead Heath" -> #hampsteadheath
  }

  if (area) {
    const match = area.match(/(North|South|East|West|Central)\s+London/i);
    if (match && match[1]) {
      tags.push(`#${match[1].toLowerCase()}london`);
    }
  }

  // Pub tags
  if (end_pub_name) {
    tags.push(toHashtag(end_pub_name)); // e.g. "The Spaniards Inn" -> #thespaniardsinn
    tags.push('#londonpub');
  }

  // Distance tags (e.g. #5kmwalk)
  if (typeof distance_km === 'number' && !Number.isNaN(distance_km)) {
    const approxKm = Math.round(distance_km);
    if (approxKm > 0) {
      tags.push(`#${approxKm}kmwalk`);
    }
  }

  // Accessibility / audience tags
  if (dog_friendly) {
    tags.push('#dogfriendly', '#dogfriendlypub', '#dogwalk');
  }
  if (kid_friendly) {
    tags.push('#familyfriendly', '#kidfriendly', '#familydayout');
  }
  if (pram_friendly) {
    tags.push('#buggyfriendly', '#pramfriendly');
  }

  // Terrain / difficulty tags
  if (terrain) {
    const t = terrain.toLowerCase();
    if (t.includes('canal')) tags.push('#canalwalks');
    if (t.includes('river') || t.includes('thames')) tags.push('#riversidewalk');
    if (t.includes('park')) tags.push('#parkwalk');
    if (t.includes('heath')) tags.push('#heathwalk');
  }

  if (difficulty) {
    const diff = difficulty.toLowerCase();
    if (diff === 'easy') tags.push('#easywalk');
    if (diff === 'moderate') tags.push('#moderatewalk');
    if (diff === 'challenging') tags.push('#hillywalk');
  }

  // Seasonality tags
  if (seasonality) {
    const s = seasonality.toLowerCase();
    if (s.includes('winter')) tags.push('#winterwalks');
    if (s.includes('spring')) tags.push('#springwalks');
    if (s.includes('summer')) tags.push('#summerwalks');
    if (s.includes('autumn') || s.includes('fall')) tags.push('#autumnwalks');
  }

  // Highlight-derived tags (based on keywords)
  if (highlights && highlights.length) {
    const text = highlights.join(' ').toLowerCase();
    if (text.includes('view')) tags.push('#cityviews');
    if (text.includes('wood') || text.includes('forest')) tags.push('#woodlandwalk');
    if (text.includes('hill') || text.includes('viewpoint')) tags.push('#scenicviews');
    if (text.includes('canal')) tags.push('#canalwalks');
    if (text.includes('park')) tags.push('#parkwalk');
  }

  // De-dupe, strip empties, and keep it reasonable
  const unique = [...new Set(tags.filter(Boolean))];

  // Hard cap to avoid going too wild – tweak if you want more/less
  return unique.slice(0, 20);
}

/**
 * Turn a phrase into a hashtag: "Hampstead Heath" -> "#hampsteadheath"
 */
function toHashtag(value) {
  return (
    '#' +
    String(value)
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '')
      .trim()
  );
}

/**
 * Validate caption length (Instagram has a 2,200 character limit)
 */
export function validateCaption(caption) {
  const maxLength = 2200;

  if (caption.length > maxLength) {
    console.warn(`Caption is ${caption.length} characters (max ${maxLength}). Consider shortening.`);
    return false;
  }

  return true;
}
