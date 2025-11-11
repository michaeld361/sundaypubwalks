import axios from 'axios';

/**
 * Fetch weather summary for a given location on Sunday
 * Uses OpenWeatherMap API
 */
export async function fetchWeatherSummary(walk) {
  const { lat, lng } = walk.location_coords;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    console.warn('No OpenWeatherMap API key found, using mock weather data');
    return getMockWeather();
  }

  try {
    // Get 5-day forecast
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: {
        lat,
        lon: lng,
        appid: apiKey,
        units: 'metric'
      }
    });

    // Find Sunday's forecast (or closest available)
    const sunday = getNextSunday();
    const sundayForecasts = response.data.list.filter(item => {
      const forecastDate = new Date(item.dt * 1000);
      return forecastDate.toDateString() === sunday.toDateString();
    });

    if (sundayForecasts.length === 0) {
      console.warn('No Sunday forecast found, using mock data');
      return getMockWeather();
    }

    // Use midday forecast (around 12:00)
    const middayForecast = sundayForecasts.find(f => {
      const hour = new Date(f.dt * 1000).getHours();
      return hour >= 11 && hour <= 13;
    }) || sundayForecasts[0];

    return formatWeatherData(middayForecast);
  } catch (error) {
    console.error('Error fetching weather:', error.message);
    return getMockWeather();
  }
}

/**
 * Get next Sunday's date
 */
function getNextSunday() {
  const today = new Date();
  const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
  const sunday = new Date(today);
  sunday.setDate(today.getDate() + daysUntilSunday);
  sunday.setHours(12, 0, 0, 0);
  return sunday;
}

/**
 * Format weather API response into caption-ready strings
 */
function formatWeatherData(forecast) {
  const temp = Math.round(forecast.main.temp);
  const feelsLike = Math.round(forecast.main.feels_like);
  const description = forecast.weather[0].description;
  const mainCondition = forecast.weather[0].main.toLowerCase();
  const windSpeed = Math.round(forecast.wind.speed * 2.237); // Convert m/s to mph

  // Build summary
  let summary = `${capitalizeFirst(description)}, ${temp}°C`;
  if (Math.abs(temp - feelsLike) > 3) {
    summary += ` (feels like ${feelsLike}°C)`;
  }

  // Build tip based on conditions
  let tip = getTipForConditions(mainCondition, temp, windSpeed, forecast.pop);

  return { summary, tip };
}

/**
 * Generate appropriate weather tip based on conditions
 */
function getTipForConditions(condition, temp, windSpeed, precipProbability) {
  const tips = [];

  // Temperature tips
  if (temp < 8) {
    tips.push('Pack plenty of layers');
  } else if (temp < 13) {
    tips.push('Bring a warm layer');
  } else if (temp > 20) {
    tips.push('Sun cream and a hat recommended');
  }

  // Rain tips
  if (precipProbability > 0.6) {
    tips.push('waterproofs essential');
  } else if (precipProbability > 0.3) {
    tips.push('pack a waterproof just in case');
  }

  // Wind tips
  if (windSpeed > 20) {
    tips.push("expect it blustery across open areas");
  }

  // Condition-specific tips
  if (condition === 'rain' || condition === 'drizzle') {
    tips.push('boots might be wise');
  } else if (condition === 'snow') {
    tips.push('check path conditions before setting off');
  } else if (condition === 'clear' && temp > 15) {
    tips.push('perfect walking weather');
  }

  return tips.length > 0 
    ? capitalizeFirst(tips.join(', ')) + '.'
    : 'Check conditions on the day and dress accordingly.';
}

/**
 * Mock weather data for testing/fallback
 */
function getMockWeather() {
  const conditions = [
    { summary: "Cool and bright, 11°C with sunny spells", tip: "Pack a layer and maybe some waterproof boots." },
    { summary: "Mild and partly cloudy, 15°C", tip: "Perfect walking weather – just bring a light jacket." },
    { summary: "Crisp and clear, 8°C", tip: "Pack warm layers and gloves – it'll be chilly in the shade." },
    { summary: "Grey but dry, 13°C", tip: "Overcast but comfortable – a jumper should do it." },
    { summary: "Light rain expected, 10°C", tip: "Waterproofs and boots essential – embrace the mud!" }
  ];

  return conditions[Math.floor(Math.random() * conditions.length)];
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
