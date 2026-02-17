// WeatherApp Constructor Function
function WeatherApp(apiKey) {
    // Store the API key
    this.apiKey = apiKey;
    
    // Store the API URLs
    this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
    this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';
    
    // Get references to DOM elements and store them
    this.searchBtn = document.getElementById('search-btn');
    this.cityInput = document.getElementById('city-input');
    this.weatherDisplay = document.getElementById('weather-display');
    
    // Call init method to set up event listeners
    this.init();
}

// Initialize event listeners
WeatherApp.prototype.init = function() {
    // Add click event listener to search button
    // Use .bind(this) to maintain context
    this.searchBtn.addEventListener('click', this.handleSearch.bind(this));
    
    // Add keypress event listener to input
    // Listen for Enter key
    this.cityInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            this.handleSearch();
        }
    }.bind(this));
    
    // Display welcome message
    this.showWelcome();
};

// Handle search logic
WeatherApp.prototype.handleSearch = function() {
    // Get city name from input
    const city = this.cityInput.value.trim();
    
    // Validate it's not empty
    if (!city) {
        this.showError('❌ Please enter a city name');
        return;
    }
    
    // Validate minimum length
    if (city.length < 2) {
        this.showError('❌ City name too short (minimum 2 characters)');
        return;
    }
    
    // Call getWeather with the city
    this.getWeather(city);
};

// Fetch weather data
WeatherApp.prototype.getWeather = async function(city) {
    // Show loading state
    this.showLoading();
    
    // Disable search button during request
    this.searchBtn.disabled = true;
    this.searchBtn.textContent = 'Searching...';
    
    // Build the complete URLs
    const currentWeatherUrl = `${this.apiUrl}?q=${city}&appid=${this.apiKey}&units=metric`;
    const forecastUrl = `${this.forecastUrl}?q=${city}&appid=${this.apiKey}&units=metric`;
    
    try {
        // Use Promise.all to fetch both current and forecast data in parallel
        const [currentWeatherResponse, forecastResponse] = await Promise.all([
            axios.get(currentWeatherUrl),
            axios.get(forecastUrl)
        ]);
        
        // Log the responses (for debugging)
        console.log('Weather Data:', currentWeatherResponse.data);
        console.log('Forecast Data:', forecastResponse.data);
        
        // Display current weather
        this.displayWeather(currentWeatherResponse.data);
        
        // Display forecast
        this.displayForecast(forecastResponse.data);
        
    } catch (error) {
        // Log the error
        console.error('Error fetching weather:', error);
        
        // Show appropriate error message based on error type
        if (error.response && error.response.status === 404) {
            // City not found
            this.showError(`❌ City "${city}" not found. Please check the spelling.`);
        } else if (error.response && error.response.status === 401) {
            // API key invalid
            this.showError('❌ API key error. Please check configuration.');
        } else if (error.message === 'Network Error') {
            // Network error
            this.showError('❌ Network error. Please check your internet connection.');
        } else {
            // Generic error
            this.showError('❌ Could not fetch weather data. Please try again.');
        }
    } finally {
        // Re-enable search button
        this.searchBtn.disabled = false;
        this.searchBtn.textContent = '🔍 Search';
    }
};

// Display weather data
WeatherApp.prototype.displayWeather = function(data) {
    // Extract the data we need
    const cityName = data.name;
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    
    // Create HTML to display
    const weatherHTML = `
        <div class="weather-info">
            <h2 class="city-name">${cityName}</h2>
            <img src="${iconUrl}" alt="${description}" class="weather-icon">
            <div class="temperature">${temperature}°C</div>
            <p class="description">${description}</p>
        </div>
    `;
    
    // Put it on the page
    this.weatherDisplay.innerHTML = weatherHTML;
    
    // Fetch and display forecast for this city
    this.getForecast(cityName);
    
    // Focus back on the input for quick next search
    this.cityInput.focus();
};

// Fetch forecast data
WeatherApp.prototype.getForecast = async function(city) {
    // Build the forecast URL
    const url = `${this.forecastUrl}?q=${city}&appid=${this.apiKey}&units=metric`;
    
    try {
        // Make API call using Axios with await
        const response = await axios.get(url);
        
        // Log the forecast response (for debugging)
        console.log('Forecast Data:', response.data);
        
        // Call displayForecast with response.data
        this.displayForecast(response.data);
        
    } catch (error) {
        // Log the error
        console.error('Error fetching forecast:', error);
        
        // Show appropriate error message based on error type
        if (error.response && error.response.status === 404) {
            // City not found
            console.error(`Forecast not found for city`);
        } else if (error.response && error.response.status === 401) {
            // API key invalid
            console.error('API key error');
        } else if (error.message === 'Network Error') {
            // Network error
            console.error('Network error');
        } else {
            // Generic error
            console.error('Could not fetch forecast data');
        }
    }
};

// Process forecast data to get one entry per day at noon
WeatherApp.prototype.processForecastData = function(data) {
    // Filter forecast list to get one entry per day (at 12:00:00)
    const dailyForecasts = data.list.filter(function(item) {
        // Each item has dt_txt like "2024-01-20 12:00:00"
        return item.dt_txt.includes('12:00:00');
    });
    
    // Take only first 5 days
    return dailyForecasts.slice(0, 5);
};

// Display forecast data
WeatherApp.prototype.displayForecast = function(data) {
    // Get processed daily forecasts
    const dailyForecasts = this.processForecastData(data);
    
    // Create forecast cards HTML
    let forecastHTML = '<div class="forecast-container">';
    
    dailyForecasts.forEach(forecast => {
        const temp = Math.round(forecast.main.temp);
        const description = forecast.weather[0].description;
        const icon = forecast.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
        const dateTime = new Date(forecast.dt * 1000).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric'
        });
        
        forecastHTML += `
            <div class="forecast-card">
                <h4 class="forecast-day">${dateTime}</h4>
                <img src="${iconUrl}" alt="${description}" class="forecast-icon">
                <p class="forecast-temp">${temp}°C</p>
                <p class="forecast-description">${description}</p>
            </div>
        `;
    });
    
    forecastHTML += '</div>';
    
    // Create forecast section HTML
    const forecastSection = `
        <div class="forecast-section">
            <h3 class="forecast-title">5-Day Forecast</h3>
            ${forecastHTML}
        </div>
    `;
    
    // Append forecast to weather display
    this.weatherDisplay.innerHTML += forecastSection;
};

// Display error message
WeatherApp.prototype.showError = function(message = 'Could not fetch weather data. Please try again.') {
    // Create HTML for error message with emoji and styling
    const errorHTML = `
        <p style="color: #ff6b6b; font-size: 1.1rem; margin: 20px 0;">
            ❌ ${message}
        </p>
    `;
    
    // Display in weather-display div
    this.weatherDisplay.innerHTML = errorHTML;
};

// Display loading message
WeatherApp.prototype.showLoading = function() {
    // Create loading HTML with spinner animation
    const loadingHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p class="loading-text">Loading weather data...</p>
        </div>
    `;
    
    // Display in weather-display
    this.weatherDisplay.innerHTML = loadingHTML;
};

// Display welcome message
WeatherApp.prototype.showWelcome = function() {
    // Create welcome HTML
    const welcomeHTML = `
        <div class="welcome-message">
            <div style="font-size: 3rem; margin-bottom: 10px;">🌤️</div>
            <h2 style="color: #667eea; margin-bottom: 10px;">Welcome to SkyFetch</h2>
            <p style="color: #667eea; font-size: 1.1rem; margin: 20px 0;">
                Enter a city name and click Search to get started!
            </p>
        </div>
    `;
    
    // Display in weather display area
    this.weatherDisplay.innerHTML = welcomeHTML;
};

// Create an instance of WeatherApp and initialize it
const app = new WeatherApp('54012a0ff8babaa339b664af09286842');