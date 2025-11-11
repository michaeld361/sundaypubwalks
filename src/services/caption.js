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
    directions
  } = walk;

  // Format highlights (take first 3)
  const highlightLines = highlights
    .slice(0, 3)
    .map(h => `• ${h}`)
    .join('\n');

  // Format directions
  const directionsText = directions
    .map((step, i) => `${i + 1}. ${step}`)
    .join('\n');

  // Build the caption
  const caption = `🥾 SUNDAY PUB WALK: ${walk_title}

📍 Area: ${area_short}
⏱️ About ${duration_minutes} mins · ${distance_km.toFixed(1)} km
🍻 Pub finish: ${end_pub_name} ${end_pub_handle}

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

  return caption;
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
