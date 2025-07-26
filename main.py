from flask import Flask, request, render_template, send_from_directory
from datetime import datetime
import requests
import os

app = Flask(__name__)

TOMORROW_API_KEY = ""
tomorrow_url = "https://api.tomorrow.io/v4/timelines"

weather_code_mapping = {
    1000: ["Clear", "clear_day.svg"],
    1100: ["Mostly Clear", "mostly_clear_day.svg"],
    1101: ["Partly Cloudy", "partly_cloudy_day.svg"],
    1102: ["Mostly Cloudy", "mostly_cloudy.svg"],
    1001: ["Cloudy", "cloudy.svg"],
    2000: ["Fog", "fog.svg"],
    2100: ["Light Fog", "fog_light.svg"],
    4000: ["Drizzle", "drizzle.svg"],
    4001: ["Rain", "rain.svg"],
    4200: ["Light Rain", "rain_light.svg"],
    4201: ["Heavy Rain", "rain_heavy.svg"],
    5000: ["Snow", "snow.svg"],
    5001: ["Flurries", "flurries.svg"],
    5100: ["Light Snow", "snow_light.svg"],
    5101: ["Heavy Snow", "snow_heavy.svg"],
    6000: ["Freezing Drizzle", "freezing_drizzle.svg"],
    6001: ["Freezing Rain", "freezing_rain.svg"],
    6200: ["Light Freezing Rain", "freezing_rain_light.svg"],
    6201: ["Heavy Freezing Rain", "freezing_rain_heavy.svg"],
    7000: ["Ice Pellets", "ice_pellets.svg"],
    7101: ["Heavy Ice Pellets", "ice_pellets_heavy.svg"],
    7102: ["Light Ice Pellets", "ice_pellets_light.svg"],
    8000: ["Thunderstorm", "tstorm.svg"]
}

@app.route("/weather")
def home():
    return render_template("index.html")

@app.route("/weather/daily", methods=["GET"])
def get_next15d_data():
    lat = request.args.get("lat")
    lng = request.args.get("lng")

    query_params = {
        "location": f"{lat}, {lng}",
        "fields": ["temperatue", "temperatureMin", "temperatureMax",
                   "windSpeed", "humidity", "pressureSeaLevel", "uvIndex",
                   "weatherCode", "percipitationProbability", "percipitationType", 
                   "sunriseTime", "sunsetTime", "visibility", "cloudCover"],
        "timesteps": "1d",
        "units": "imperial",
        "startTime": "now",
        "endTime": "nowPlus15d",
        "timezone": "auto",
        "apiKey": TOMORROW_API_KEY
    }

    try:
        response = requests.get(tomorrow_url, params=query_params)
        response_data = response.json()

        weather_15d = []

        if "data" not in response_data or len(response_data["data"]["timelines"]) == 0:
            return weather_15d.append({
                "status": "error"
            })
        if "data" in response_data:
            for index in range(15):
                start_time = response_data["data"]["timelines"][0]["intervals"][index]["startTime"]
                daily_data = response_data["data"]["timelines"][0]["intervals"][index]["values"]
                weather_15d.append({
                    "status": "normal",
                    "date": start_time,
                    "temperature": daily_data["temperature"],
                    "temperatureMin": daily_data["temperatureMin"],
                    "temperatureMax": daily_data["temperatureMax"],
                    "windSpeed": daily_data["windSpeed"],
                    "humidity": daily_data["humidity"],
                    "pressure": daily_data["pressureSeaLevel"],
                    "uvIndex": daily_data["uvIndex"],
                    "weatherCode": weather_code_mapping.get(daily_data["weatherCode"]),
                    "percipitationProbability": daily_data["percipitationProbability"],
                    "percipitationType": daily_data["percipitationType"],
                    "sunriseTime": daily_data["sunriseTime"],
                    "sunsetTime": daily_data["sunsetTime"],
                    "visibility": daily_data["visibility"],
                    "cloudCover": daily_data["cloudCover"]
                })
            return weather_15d
        else:
            return None
    except Exception as e:
        print(f"Error fetching next 15 days' daily weather data from Tomorrow.io API: {e}")
        return None
"""  
def parse_to_date(start_time):
    formatted = datetime.strptime(start_time, "%Y-%m-%dT%H:%M:%S%z")
    return formatted.strftime("%A, %d %B %Y")
"""  
@app.route("/weather/hourly", methods=["GET"])
def get_next5d_data():
    lat = request.args.get("lat")
    lng = request.args.get("lng")

    query_params = {
        "location": f"{lat}, {lng}",
        "fields": ["temperatue", "windSpeed", "windDirection", "humidity", "pressureSeaLevel"],
        "timesteps": "1h",
        "units": "imperial",
        "startTime": "now",
        "endTime": "nowPlus5d",
        "timezone": "auto",
        "apiKey": TOMORROW_API_KEY
    }

    try:
        response = requests.get(tomorrow_url, params=query_params)
        response_data = response.json()

        weather_5d = []

        if "data" not in response_data or len(response_data["data"]["timelines"]) == 0:
            return weather_5d.append({
                "status": "error"
            })
        if "data" in response_data:
            hours = len(response_data["data"]["timelines"][0]["intervals"])
            for index in range(hours):
                start_time = response_data["data"]["timelines"][0]["intervals"][index]["startTime"]
                hourly_data = response_data["data"]["timelines"][0]["intervals"][index]["values"]
                weather_5d.append({
                    "status": "normal",
                    "hour": start_time,
                    "temperature": hourly_data["temperature"],
                    "windSpeed": hourly_data["windSpeed"],
                    "windDirection": hourly_data["windDirection"],
                    "humidity": hourly_data["humidity"],
                    "pressure": hourly_data["pressureSeaLevel"]
                })
            return weather_5d
        else:
            return None
    except Exception as e:
        print(f"Error fetching next 5 days' hourly weather data from Tomorrow.io API: {e}")
        return None
"""   
def parse_to_hour(start_time):
    formatted = datetime.strptime(start_time, "%Y-%m-%dT%H:%M:%S%z")
    return formatted.strftime("%H:%M")
"""   
@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

if __name__ == "__main__":
    app.run(debug=True)
