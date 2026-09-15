# ApexData — Formula 1 Telemetry Comparison HUD

ApexData is a high-frequency Formula 1 lap telemetry comparison platform inspired by official F1 pit wall data systems and motorsport telemetry suites (e.g. MoTeC i2 Pro, Atlas).

---

## Technical Stack
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS with custom motorsport HUD theme, neon accents (`#FF6A00`, `#00F0FF`, `#00E676`), and typography (`Orbitron`, `Rajdhani`, `Titillium Web`, `Inter`)
- **Charting Engine**: **Apache ECharts** with canvas rendering, synchronized crosshairs via `echarts.connect('apexdata-telemetry-group')`, and ultra high-definition 3x DPI image exports
- **Backend Architecture**: Consumes Python Flask + FastF1 REST API

---

## Getting Started

### 1. Running the Frontend
```bash
cd frontend
npm install
npm run dev
```
The development server will run at `http://localhost:3000` and automatically proxies `/api/*` calls to `http://127.0.0.1:5000`.

To build for production:
```bash
npm run build
npm run preview
```

---

## REST API Specification for Backend (`backend/app.py`)

The frontend expects the Flask backend to implement the following 3 REST endpoints:

### 1. `GET /api/schedule?year={year}`
Returns the calendar schedule for the selected championship year.
- **Query Params**: `year` (number, e.g. `2024`)
- **Response**:
```json
{
  "status": "success",
  "data": [
    {
      "round": 1,
      "name": "Bahrain Grand Prix",
      "location": "Sakhir",
      "country": "Bahrain"
    },
    {
      "round": 8,
      "name": "Monaco Grand Prix",
      "location": "Monte Carlo",
      "country": "Monaco"
    }
  ]
}
```

### 2. `GET /api/drivers?year={year}&gp={gp}&session={session}`
Returns the list of participating drivers for the given session.
- **Query Params**:
  - `year`: e.g. `2024`
  - `gp`: Grand Prix name, e.g. `Monaco Grand Prix`
  - `session`: `FP1` | `FP2` | `FP3` | `Q` | `Sprint` | `R`
- **Response**:
```json
{
  "status": "success",
  "data": [
    {
      "number": "1",
      "code": "VER",
      "first_name": "Max",
      "last_name": "Verstappen",
      "team": "Red Bull Racing",
      "team_color": "#3671C6"
    },
    {
      "number": "16",
      "code": "LEC",
      "first_name": "Charles",
      "last_name": "Leclerc",
      "team": "Ferrari",
      "team_color": "#E80020"
    }
  ]
}
```

### 3. `GET /api/compare?year={year}&gp={gp}&session={session}&driver1={driver1}&driver2={driver2}`
Calculates and returns distance-normalized telemetry for both drivers' fastest laps.
- **Query Params**:
  - `year`: e.g. `2024`
  - `gp`: e.g. `Monaco Grand Prix`
  - `session`: e.g. `Q`
  - `driver1`: Driver 1 code or number, e.g. `VER`
  - `driver2`: Driver 2 code or number, e.g. `LEC`
- **Response**:
```json
{
  "status": "success",
  "data": {
    "driver1": {
      "code": "VER",
      "number": "1",
      "name": "Max Verstappen",
      "team": "Red Bull Racing",
      "team_color": "#3671C6",
      "lap_time": "1:10.270",
      "lap_time_seconds": 70.270,
      "tyre": "SOFT",
      "top_speed": 298.4,
      "s1": "18.841",
      "s2": "33.512",
      "s3": "17.917"
    },
    "driver2": {
      "code": "LEC",
      "number": "16",
      "name": "Charles Leclerc",
      "team": "Ferrari",
      "team_color": "#E80020",
      "lap_time": "1:10.412",
      "lap_time_seconds": 70.412,
      "tyre": "SOFT",
      "top_speed": 296.1,
      "s1": "18.910",
      "s2": "33.620",
      "s3": "17.882"
    },
    "summary": {
      "delta": -0.142,
      "faster_driver": "VER",
      "track_length": 3337,
      "year": 2024,
      "gp": "Monaco Grand Prix",
      "session": "Q"
    },
    "telemetry": [
      {
        "distance": 0.0,
        "speed1": 150.2,
        "speed2": 148.8,
        "throttle1": 100,
        "throttle2": 98,
        "brake1": 0,
        "brake2": 0,
        "gear1": 4,
        "gear2": 4,
        "rpm1": 10500,
        "rpm2": 10400,
        "steering1": -2.1,
        "steering2": -1.8,
        "delta": 0.0
      }
    ]
  }
}
```

---

## Autonomous Simulation & Fallback Mode
If the backend is not running or endpoints are still in progress, ApexData automatically transitions into **High-Fidelity Simulation Mode** (featuring real Monaco Grand Prix corner telemetry, Sainte Dévote, Mirabeau, Fairmont Hairpin, Nouvelle Chicane, and Rascasse). Users can also manually toggle between Live and Simulation modes via the header toggle button.

---

## Graph Export
Each of the 7 plotted telemetry traces includes an **EXPORT** button in its panel header:
- **Save PNG (Ultra HQ 3x DPI)**: Exports a 3x retina-sharp raster image with dark theme styling and driver metadata, ideal for presentations or engineering reports.
- **Save JPEG (3x DPI)**: Exports a compressed high-resolution JPEG.
