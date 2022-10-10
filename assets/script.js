var weatherHistory = [];
var weatherAPIRoot = 'https://api.openweathermap.org';
var weatherAPIKey = 'd91f911bcf2c0f925fb6535547a5ddc9';

var searchForm = document.querySelector('#search-form');
var searchInput = document.querySelector('#search-input');
var todayContainer = document.querySelector('#today');
var forecastContainer = document.querySelector('#forecast');
var weatherHistoryContainer = document.querySelector('#history');

dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);

function renderCurrent(city, weather, timezone) {
  var date = dayjs().tz(timezone).format('M/D/YYYY');

  var tempF = weather.temp;
  var windMph = weather.wind_speed;
  var humidity = weather.humidity;
  var uvi = weather.uvi;
  var iconUrl = `https://openweathermap.org/img/w/${weather.weather[0].icon}.png`;
  var iconDescription = weather.weather[0].description || weather[0].main;

  var cast = document.createElement('div');
  var castBody = document.createElement('div');
  var heading = document.createElement('h2');
  var weatherIcon = document.createElement('img');
  var tempEl = document.createElement('p');
  var windEl = document.createElement('p');
  var humidityEl = document.createElement('p');
  var uvEl = document.createElement('p');
  var uviBadge = document.createElement('button');

  cast.append(castBody);

  heading.setAttribute('class', 'h3');

  heading.textContent = `${city} (${date})`;
  weatherIcon.setAttribute('src', iconUrl);
  weatherIcon.setAttribute('alt', iconDescription);
  heading.append(weatherIcon);
  tempEl.textContent = `Temp: ${tempF}°F`;
  windEl.textContent = `Wind: ${windMph} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;
  castBody.append(heading, tempEl, windEl, humidityEl);

  uvEl.textContent = 'UV Index: ';
  uviBadge.classList.add('btn', 'btn-sm');

  if (uvi < 3) {
    uviBadge.classList.add('btn-success');
  } else if (uvi < 7) {
    uviBadge.classList.add('btn-warning');
  } else {
    uviBadge.classList.add('btn-danger');
  }

  uviBadge.textContent = uvi;
  uvEl.append(uviBadge);
  castBody.append(uvEl);

  todayContainer.innerHTML = '';
  todayContainer.append(cast);
}

function renderForecastSheet(forecast, timezone) {
  var unixTs = forecast.dt;
  var iconUrl = `https://openweathermap.org/img/w/${forecast.weather[0].icon}.png`;
  var iconDescription = forecast.weather[0].description;
  var tempF = forecast.temp.day;
  var { humidity } = forecast;
  var windMph = forecast.wind_speed;

  var col = document.createElement('div');
  var cast = document.createElement('div');
  var castBody = document.createElement('div');
  var castTitle = document.createElement('h5');
  var weatherIcon = document.createElement('img');
  var tempEl = document.createElement('p');
  var windEl = document.createElement('p');
  var humidityEl = document.createElement('p');

  col.append(cast);
  cast.append(castBody);
  castBody.append(castTitle, weatherIcon, tempEl, windEl, humidityEl);

  castTitle.textContent = dayjs.unix(unixTs).tz(timezone).format('M/D/YYYY');
  weatherIcon.setAttribute('src', iconUrl);
  weatherIcon.setAttribute('alt', iconDescription);
  tempEl.textContent = `Temp: ${tempF} °F`;
  windEl.textContent = `Wind: ${windMph} MPH`;
  humidityEl.textContent = `Humidity: ${humidity} %`;

  forecastContainer.append(col);
}

function renderForecast(dailyForecast, timezone) {
  var startWeek = dayjs().tz(timezone).add(1, 'day').startOf('day').unix();
  var endWeek = dayjs().tz(timezone).add(6, 'day').startOf('day').unix();

  var headingColumn = document.createElement('div');
  var heading = document.createElement('h4');

  heading.textContent = '5-Day Forecast:';
  headingColumn.append(heading);

  forecastContainer.innerHTML = '';
  forecastContainer.append(headingColumn);
  for (var i = 0; i < dailyForecast.length; i++) {
    if (dailyForecast[i].dt >= startWeek && dailyForecast[i].dt < endWeek) {
      renderForecastSheet(dailyForecast[i], timezone);
    }
  }
}

function renderItems(city, data) {
  renderCurrent(city, data.current, data.timezone);
  renderForecast(data.daily, data.timezone);
}

function fetchWeather(location) {
  var { lat } = location;
  var { lon } = location;
  var city = location.name;
  var apiUrl = `${weatherAPIRoot}/data/2.5/onecall?lat=${lat}&lon=${lon}&units=imperial&exclude=minutely,hourly&appid=${weatherAPIKey}`;

  fetch(apiUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      renderItems(city, data);
    })
    .catch(function (err) {
      console.error(err);
    });
}

function fetchCoordinates(search) {
  var apiUrl = `${weatherAPIRoot}/geo/1.0/direct?q=${search}&limit=5&appid=${weatherAPIKey}`;

  fetch(apiUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (!data[0]) {
        alert('Location not found');
      } else {
        appendToHistory(search);
        fetchWeather(data[0]);
      }
    })
    .catch(function (err) {
      console.error(err);
    });
}

function handleFormSubmit(e) {
  if (!searchInput.value) {
    return;
  }

  e.preventDefault();
  var search = searchInput.value.trim();
  fetchCoordinates(search);
  searchInput.value = '';
}

function renderHistory() {
  weatherHistoryContainer.innerHTML = '';

  for (var i = weatherHistory.length - 1; i >= 0; i--) {
    var btn = document.createElement('button');
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-controls', 'today forecast');
    btn.classList.add('history-btn', 'btn-history');

    btn.setAttribute('data-search', weatherHistory[i]);
    btn.textContent = weatherHistory[i];
    weatherHistoryContainer.append(btn);
  }
}

function appendToHistory(search) {
  if (weatherHistory.indexOf(search) !== -1) {
    return;
  }
  weatherHistory.push(search);

  localStorage.setItem('search-history', JSON.stringify(weatherHistory));
  renderHistory();
}

function initHistory() {
  var storedHistory = localStorage.getItem('search-history');
  if (storedHistory) {
    weatherHistory = JSON.parse(storedHistory);
  }
  renderHistory();
}

function handleSearchHistoryClick(e) {
  if (!e.target.matches('.btn-history')) {
    return;
  }

  var btn = e.target;
  var search = btn.getAttribute('data-search');
  fetchCoordinates(search);
}

initHistory();
searchForm.addEventListener('submit', handleFormSubmit);
weatherHistoryContainer.addEventListener('click', handleSearchHistoryClick);