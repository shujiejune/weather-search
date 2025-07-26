document.getElementById("input-info").addEventListener("submit", submitLocation);

function submitLocation(event) {
    event.preventDefault();

    const street = document.getElementById("street").value;
    const city = document.getElementById("city").value;
    const state = document.getElementById("state").value;
    const autoDetect = document.getElementById("auto").checked;

    clearTooltips();

    if (!autoDetect) {
        if (!street) {
            showTooltip("street", "Fill out this field");
            return;
        }
        if (!city) {
            showTooltip("city", "Fill out this field");
            return;
        }
        if (!state) {
            showTooltip("state", "Select an item in the list");
            return;
        }
        const location = `${street}, ${city}, ${state}`;
        geocode(location);
    } else {
        fetch("https://ipinfo.io/76.91..?token=")
        .then(response => response.json())
        .then(data => {
            sendGeocode(data.latitude, data.longitude);
        })
        .catch(err => console.error("Get location failed: ", err));
    }
}

function showTooltip(elemID, reminder) {
    const inputField = document.getElementById(elemID);
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.innerHTML = reminder;
    inputField.parentNode.appendChild(tooltip);
}

function clearTooltips() {
    const tooltips = document.querySelectorAll(".tooltip");
    tooltips.forEach(tooltip => tooltip.remove());
}

function geocode(location) {
    const GOOGLE_API_KEY = "";
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_API_KEY}`;
    fetch(url)
    .then(response => response.json())
    .then(data => {
        if (data.status === "OK") {
            const lat = data.results[0].geometry.location.lat;
            const lng = data.results[0].geometry.location.lng;
            sendGeocode(lat, lng);
        } else {
            fetch("https://ipinfo.io/76.91..?token=")
            .then(response => response.json())
            .then(data => {
                sendGeocode(data.latitude, data.longitude);
            })
            .catch(err => console.error("Get location failed: ", err));
        }
    });
}

function sendGeocode(lat, lng) {
    const url = `/weather/daily?lat=${lat}&lng=${lng}`;
    fetch(url)
    .then(response => response.json())
    .then(data => {
        if (data.status === "error") {
            showErrorBox();
        } else {
            showWeatherCard(data);
            showWeatherTable(data);
        }
    })
    .catch(err => console.error("Get weather data from web server failed: ", err));
}

document.querySelector(".clear").addEventListener("click", function () {
    document.getElementById("street").innerText = ""; 
    document.getElementById("city").innerText = ""; 
    document.getElementById("state").value = "";
    clearWeatherInfo();
});

function showWeatherCard(data) {
    const currData = data[0];

    document.getElementById("location").innerText = currData.location;
    document.getElementById("temp").innerText = currData.temperature;
    document.getElementById("humidity").innerText = currData.humidity;
    document.getElementById("pressure").innerText = currData.pressure;
    document.getElementById("wind-speed-card").innerText = currData.windSpeed;
    document.getElementById("visibility").innerText = currData.visibility;
    document.getElementById("cloud-cover").innerText = currData.cloudCover;
    document.getElementById("uv-level").innerText = currData.uvIndex;

    document.getElementById("weather-card").classList.remove("hidden");
}

function showWeatherTable(data) {
    for (let index = 0; index < 7; index++) {
        const dayData = data[index];
        const row = document.getElementsByClassName("weather-row")[index];
        
        row.querySelector(".date").innerText = dayData.date;
        row.querySelector(".status img").setAttribute("src", `/static/Images/Weather Symbols for Weather Codes/${dayData.weatherCode[1]}`);
        row.querySelector(".status p").innerText = dayData.weatherCode[0];
        row.querySelector(".temp-high").innerText = dayData.temperatureMax;
        row.querySelector(".temp-low").innerText = dayData.temperatureMin;
        row.querySelector(".wind-speed").innerText = dayData.windSpeed;

        row.querySelector(".status").addEventListener("click", function() {
            showDetailsCard(index, dayData);
            showWeatherCharts(data);
        });
    }
    document.getElementById("weather-table").classList.remove("hidden");
}

function clearWeatherInfo() {
    document.getElementById("weather-card").classList.toggle("hidden");
    document.getElementById("weather-table").classList.toggle("hidden");
}

function showDetailsCard(index, data) {
    const selectedDay = data[index];

    document.querySelector(".text-group .date").innerText = selectedDay.date;
    document.querySelector(".text-group .weather-code").innerText = selectedDay.weatherCode[0];
    document.querySelector(".text-group .temp").innerText = `${selectedDay.temperatureMax}℉/${selectedDay.temperatureMin}℉`;
    document.querySelector(".major-info img").setAttribute("src", `/static/Images/Weather Symbols for Weather Codes/${selectedDay.weatherCode[1]}`);
    document.querySelector("#prec .value").innerText = selectedDay.precipitationType;
    document.querySelector("#cop .item").innerText = `Chance of ${selectedDay.precipitationType}`;
    document.querySelector("#cop .value").innerText = selectedDay.precipitaionProbability;
    document.querySelector("#ws .value").innerText = selectedDay.windSpeed;
    document.querySelector("#humi .value").innerText = selectedDay.humidity;
    document.querySelector("#vis .value").innerText = selectedDay.visibility;
    document.querySelector("#sr-ss .value").innerText = `${selectedDay.sunriseTime}/${selectedDay.sunsetTime}`;

    document.getElementById("weather-card").classList.add("hidden");
    document.getElementById("weather-table").classList.add("hidden");

    document.getElementById("details-card").classList.remove("hidden");
    document.getElementById("weather-charts").classList.remove("hidden");
}

function showWeatherCharts(dailyData) {
    drawTempAreaChart(dailyData);

    const url = `/weather/hourly?lat=${lat}&lng=${lng}`;
    fetch(url)
    .then(response => response.json())
    .then(hourlyData => {
        if (hourlyData.status === "error") {
            showErrorBox();
        } else {
            drawMeteogram(hourlyData);
        }
    })
}

function showErrorBox() {
    document.getElementById("err-message").classList.remove("hidden");
}

function drawTempAreaChart(dailyData) {
    const datetime = dailyData.map(day => parseToTimestamp(day.date));
    const tempMax = dailyData.map(day => day.temperatureMax);
    const tempMin = dailyData.map(day => day.temperatureMin);

    HighCharts.chart("temp-area-chart", {
        chart: {
            type: "arearange",
            zooming: {
                type: "x"
            }
        },
        title: {
            text: "Temperature Ranges (Min, Max)"
        },
        xAxis: {
            categories: datetime,
            crosshair: true
        },
        yAxis: {
            title: { text: null },
            crosshair: false
        },
        tooltip: {
            valueSuffix: "℉",
            xDateFormat: "%A, %b %e",
            shared: true
        },
        legend: {
            enabled: false
        },
        series: [{
            name: "Temperature Ranges (Min, Max)",
            data: tempMax.map((maxTemp, index) => [tempMin[index], maxTemp]),
            color: {
                linearGradient: {
                    x1: 0,
                    x2: 0,
                    y1: 0,
                    y2: 1
                },
                stops: [
                    [0, "#fd9b03"],
                    [1, "#28a5fb"]
                ]
            }
        }]
    });
}

function drawMeteogram(hourlyData) {
    const hours = hourlyData.map(data => parseToTimestamp(data.hour));
    const temp = hourlyData.map(data => data.temperature);
    const windSpeed = hourlyData.map(data => data.windSpeed);
    const windDirection = hourlyData.map(data => data.windDirection);
    const humidity = hourlyData.map(data => data.humidity);
    const pressure = hourlyData.map(data => data.pressure);

    HighCharts.chart(meteogram, {
        chart: {
            type: "spline",
            marginbottom: 30,
            zooming: { type: "x" }
        },
        title: {
            text: "Hourly Weather (For Next 5 Days)"
        },
        xAxis: [{
            type: "datetime",
            tickInterval: 3600 * 1000,
            labels: {
                format: "{value:%H:%M}",
                style: { color: "#2c2c2c" }
            },
            gridLineWidth: 1,
            gridLineColor: "#e0e0e0",
            crosshair: true
        }, {
            linkedTo: 0,
            opposite: true,
            type: "datetime",
            tickInterval: 24 * 3600 * 1000,
            labels: {
                format: "<b>{value:%a}</b> {value:%b %e}",
                align: "center",
                style: { fontSize: "10px" }
            }
        }],
        yAxis: [{
            labels: {
                format: "{value}℉",
                style: { color: "#eb312e"}
            },
            gridLineWidth: 1,
            gridLineColor: "#e0e0e0",
            title: { text: null },
            opposite: false
        }, {
            labels: {
                format: "{value}inHg",
                style: { color: "#fd9a00" }
            },
            gridLineWidth: 0,
            title: { text: null },
            opposite: true
        }, {
            labels: {
                format: "{value}%",
                style: { color: "7bc6fe" }
            },
            min: 0,
            max: 100,
            gridLineWidth: 0,
            title: { text: null }
        }],
        series: [{
            name: "Humidity",
            type: "column",
            yAxis: 2,
            data: humidity,
            color: "7bc6fe",
            dataLabels: {
                enabled: true,
                inside: true,
                format: "{y}%",
                style: { color: "#626261" }
            },
            tooltip: {
                valueSuffix: " %"
            }
        }, {
            name: "Temperature",
            type: "spline",
            yAxis: 0,
            data: temp,
            color: "#eb312e",
            tooltip: {
                valueSuffix: "℉"
            }
        }, {
            name: "Air Pressure",
            type: "line",
            yAxis: 1,
            data: pressure,
            color: "#fd9a00",
            dashStyle: "ShortDash",
            tooltip: { 
                valueSuffix: " inHg"
            }
        }, {
            name: "Wind",
            type: "windbarb",
            data: {
                x: hours,
                value: windSpeed,
                direction: windDirection
            },
            color: "4a46ab",
            showInLegend: false,
            tooltip: {
                valueSuffix: " mph"
            }
        }],
        plotOptions: {
            column: { stacking: "normal" },
            spline: {
                marker: {
                    enabled: true,
                    radius: 2,
                    symbol: "circle"
                }
            }
        },
        tooltip: {
            shared: true,
            xDateFormat: "%A, %e %b %Y, %H:%M",
            valueDecimals: 2
        }
    });
}

function parseToTimestamp(isoTime) {
    return new Date(isoTime).getTime();
}

document.getElementById("fold").addEventListener("click", function () {
    document.getElementById("fold").setAttribute("src", "/static/Images/point-up-512.png");
    document.getElementById("fold").id = "unfold";

    document.getElementById("unfold").addEventListener("click", function () {
        document.getElementById("unfold").setAttribute("src", "/static/Images/point-down-512.png");
        document.getElementById("unfold").id = "fold";
    
        document.getElementById("temp-area-chart").classList.toggle("hidden");
        document.getElementById("temp-area-chart").classList.toggle("hidden");
    });

    document.getElementById("temp-area-chart").classList.toggle("hidden");
    document.getElementById("comb-chart").classList.toggle("hidden");
});
