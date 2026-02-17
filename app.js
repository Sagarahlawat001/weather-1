// Your OpenWeatherMap API Key
const API_KEY = '52246952fc2213fb7c95f8ab82f3edda';  // Replace with your actual API key
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Function to fetch weather data (async/await)
async function getWeather(city) {
    const url = `${API_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    // show loading UI while we fetch
    showLoading();
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.disabled = true;
        // store original text so we can restore it
        searchBtn.dataset.origText = searchBtn.textContent;
        searchBtn.textContent = 'Searching...';
    }
    try {
        const response = await axios.get(url);
        console.log('Weather Data:', response.data);
        displayWeather(response.data);
    } catch (error) {
        console.error('Error fetching weather:', error);
        let message = 'Could not fetch weather data. Please try again.';
        if (error.response) {
            // Server responded with a status outside 2xx
            const status = error.response.status;
            if (status === 404) {
                message = `City "${city}" not found. Please check the spelling.`;
            } else if (status === 401) {
                message = 'Invalid API key. Please check your API key.';
            } else {
                message = `Server error (${status}). Please try again later.`;
            }
        } else if (error.request) {
            // Request was made but no response
            message = 'No response from the server. Check your network connection.';
        } else {
            // Something else happened
            message = 'An unexpected error occurred.';
        }
        showError(message);
    }
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.textContent = searchBtn.dataset.origText || '🔍 Search';
            delete searchBtn.dataset.origText;
        }
}

// Function to display weather data
function displayWeather(data) {
    const cityName = data.name;
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    const weatherHTML = `
        <div class="weather-info">
            <h2 class="city-name">${cityName}</h2>
            <img src="${iconUrl}" alt="${description}" class="weather-icon">
            <div class="temperature">${temperature}°C</div>
            <p class="description">${description}</p>
        </div>
    `;

    document.getElementById('weather-display').innerHTML = weatherHTML;
    // focus the city input so users can quickly search again
    const cityInputEl = document.getElementById('city-input');
    if (cityInputEl) {
        cityInputEl.focus();
    }
}

// Function to show error messages in the UI
function showError(message) {
    const errorHTML = `
        <div class="error-message">
            <div class="error-icon">❌</div>
            <div class="error-content">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        </div>
    `;
    document.getElementById('weather-display').innerHTML = errorHTML;
}

// Show a simple loading UI (spinner + text)
function showLoading() {
    const loadingHTML = `
        <div class="loading-container">
            <div class="spinner" aria-hidden="true"></div>
            <div class="loading-text">Loading...</div>
        </div>
    `;
    document.getElementById('weather-display').innerHTML = loadingHTML;
}

// Wire up UI events when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');

    if (searchBtn && cityInput) {
        searchBtn.addEventListener('click', () => {
            const city = cityInput.value.trim();
            if (!city) {
                showError('Please enter a city name.');
                return;
            }
            getWeather(city);
        });

        cityInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }

    // Initial load
    getWeather('London');
});