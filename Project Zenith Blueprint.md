Build a full-stack web application titled “Project Zenith: The Celestial Eye”.

The application should function as a real-time cosmic radar. It should allow a user to select any geographic coordinate on Earth and display celestial objects that are currently passing through or near that location’s zenith. The app should focus on real-time data integration, astronomy calculations, geospatial mapping, and interactive visualization.

Core Goal:
Create a working prototype where users can:
1. Select a location on Earth using a map or by entering latitude and longitude manually.
2. Capture the current UTC date and time.
3. Fetch real-time or near-real-time celestial data from APIs and datasets.
4. Calculate which objects are visible from the selected location.
5. Identify objects close to the zenith using altitude and azimuth calculations.
6. Display the results in an interactive dashboard.

Use the following tech stack:
- Next.js with App Router
- React
- TypeScript
- Tailwind CSS for basic layout only
- Leaflet or React Leaflet for 2D map location selection
- CesiumJS for optional 3D Earth/satellite visualization
- satellite.js for satellite orbit propagation from TLE or OMM data
- Next.js API routes for backend data fetching and caching
- Local storage or simple server-side cache for temporary API results
- Vercel-compatible deployment structure

Pages and Features:

1. Landing Page
Create a simple landing page with:
- Project title: “Project Zenith: The Celestial Eye”
- Short description explaining that the platform shows celestial bodies near the user’s zenith
- Button: “Start Exploring”
- Button should navigate to the location selection page
- Include simple feature sections:
  - ISS Tracking
  - Satellite Detection
  - Planet Positioning
  - Zenith Radar

2. Location Selection Page
Create a page where users can choose their observation point.

Required features:
- Interactive world map using Leaflet
- User can click anywhere on the map
- Store selected latitude and longitude
- Manual input fields for latitude and longitude
- Button: “Use My Current Location” using browser geolocation
- Button: “Scan Zenith”
- Show selected coordinates clearly
- Show current UTC time
- On clicking “Scan Zenith”, navigate to the dashboard page with selected coordinates passed through URL params or state

Example route:
`/dashboard?lat=13.0827&lng=80.2707`

3. Dashboard Page
Create a dashboard that receives latitude and longitude from the selected location.

Dashboard should include:
- Selected location card
- Current UTC time card
- Refresh data button
- Object filters:
  - ISS
  - Satellites
  - Planets
  - Constellations
- 2D Zenith Radar View
- Optional 3D Earth View
- Object list table
- Object details panel

The object list should include:
- Object name
- Object type
- Altitude
- Azimuth
- Distance if available
- Visibility status
- Data source
- Last updated time

4. Zenith Radar View
Create a circular radar-style sky view.

Radar logic:
- Center of radar represents zenith, altitude = 90°
- Outer edge represents horizon, altitude = 0°
- Use azimuth to place objects around the circle:
  - North = 0°
  - East = 90°
  - South = 180°
  - West = 270°
- Use altitude to determine distance from center:
  - Higher altitude means closer to center
  - Lower altitude means closer to outer edge

Formula for radar radius:
`radius = maxRadius * (1 - altitude / 90)`

Only show objects with altitude greater than 0° as visible.
Mark objects with altitude between 80° and 90° as “Near Zenith”.

5. Data Strategy

Use the following sources:

A. ISS Data
Fetch current ISS location from OpenNotify or WhereTheISS.at.
Create an API route:
`/api/iss`

The route should return:
- name: “International Space Station”
- type: “ISS”
- latitude
- longitude
- altitude if available
- timestamp
- data source

Convert ISS subpoint location into observer-relative altitude and azimuth using the selected user location.

B. Satellite Data
Fetch active satellite TLE or OMM data from CelesTrak.

Create API route:
`/api/satellites`

Use CelesTrak active satellites group.
Limit the number of satellites in the MVP to avoid performance issues. For example, process only the first 100–300 satellites or allow category filters.

Use satellite.js to:
- Parse TLE or OMM data
- Propagate satellite position to current UTC time
- Convert ECI position to geodetic coordinates
- Convert satellite position into observer-relative look angles
- Calculate altitude and azimuth from selected location

Each satellite object should return:
- name
- type: “Satellite”
- NORAD catalog ID if available
- altitude angle
- azimuth angle
- latitude
- longitude
- height
- visibility status
- data source: “CelesTrak”

C. Planet Data
Use NASA/JPL Horizons API for planet positions, or create an MVP fallback using simplified astronomy calculations through a JavaScript astronomy library.

Create API route:
`/api/planets`

Track at least:
- Mercury
- Venus
- Mars
- Jupiter
- Saturn

For each planet, calculate or retrieve:
- right ascension
- declination
- distance if available
- altitude
- azimuth
- visibility status
- data source

If NASA Horizons integration is difficult during prototype development, build a mock-compatible adapter layer so the app can later switch from mock data to real API data without changing the frontend.

D. Constellation Data
For MVP, use a small static dataset of major constellations.

Include:
- Orion
- Ursa Major
- Cassiopeia
- Scorpius
- Leo
- Cygnus
- Taurus
- Gemini

Each constellation entry should include approximate right ascension and declination.
Convert RA/Dec into altitude and azimuth for the selected location and current time.
Return only constellations above the horizon.

6. Core Calculation Requirements

Implement utility functions in a separate folder:

`/lib/astronomy/`

Required files:
- `coordinates.ts`
- `satelliteUtils.ts`
- `zenithFilter.ts`
- `radarProjection.ts`
- `timeUtils.ts`

Required functions:

A. Convert degrees to radians:
`degToRad(value)`

B. Convert radians to degrees:
`radToDeg(value)`

C. Normalize angle:
`normalizeAngle(angle)`

D. Calculate object visibility:
Input:
- altitude
Output:
- “Below Horizon” if altitude < 0
- “Visible” if altitude >= 0 and altitude < 80
- “Near Zenith” if altitude >= 80 and altitude <= 90

E. Zenith filter:
Input:
- list of celestial objects
- minAltitude threshold, default 80
Output:
- objects with altitude >= minAltitude

F. Radar projection:
Input:
- altitude
- azimuth
- maxRadius
Output:
- x coordinate
- y coordinate

Use:
`radius = maxRadius * (1 - altitude / 90)`
`x = radius * sin(azimuthRadians)`
`y = -radius * cos(azimuthRadians)`

7. Backend API Structure

Create the following API routes:

`GET /api/iss?lat={lat}&lng={lng}`
Returns current ISS data and local sky position.

`GET /api/satellites?lat={lat}&lng={lng}&limit={limit}`
Returns processed satellite objects visible from the selected location.

`GET /api/planets?lat={lat}&lng={lng}`
Returns planet sky positions.

`GET /api/constellations?lat={lat}&lng={lng}`
Returns constellation sky positions.

`GET /api/scan?lat={lat}&lng={lng}`
Combines ISS, satellites, planets, and constellations into one response.

The `/api/scan` response should follow this structure:

{
  "observer": {
    "latitude": 13.0827,
    "longitude": 80.2707,
    "timeUTC": "2026-06-10T12:00:00Z"
  },
  "summary": {
    "totalObjects": 20,
    "visibleObjects": 12,
    "nearZenithObjects": 3
  },
  "objects": [
    {
      "id": "iss",
      "name": "International Space Station",
      "type": "ISS",
      "altitude": 88.2,
      "azimuth": 120.4,
      "visibilityStatus": "Near Zenith",
      "source": "OpenNotify"
    }
  ]
}

8. Frontend Components

Create reusable components:

`LocationMap.tsx`
- Displays Leaflet map
- Handles map click
- Returns latitude and longitude

`CoordinateInput.tsx`
- Manual latitude and longitude inputs
- Validation for valid coordinate range

`TimeCard.tsx`
- Shows current UTC time
- Updates every second or every minute

`ZenithRadar.tsx`
- Circular radar display
- Places celestial objects using altitude and azimuth
- Shows labels for objects
- Shows compass directions

`ObjectList.tsx`
- Table or list of detected objects
- Sort by altitude descending
- Highlight near-zenith objects using status labels, not color instructions

`ObjectDetails.tsx`
- Shows details of selected object
- Shows data source
- Shows altitude, azimuth, type, and last updated time

`FilterPanel.tsx`
- Allows toggling ISS, satellites, planets, and constellations

`EarthView.tsx`
- Optional component for 3D Earth or satellite path visualization
- If CesiumJS is too heavy for the first version, create a placeholder component and keep the code modular

9. State Management

Use React state or Zustand.

Store:
- selected latitude
- selected longitude
- current UTC time
- fetched celestial objects
- selected filters
- selected object
- loading state
- error state

10. Error Handling

Handle these cases:
- No location selected
- Invalid latitude or longitude
- API request failure
- CelesTrak unavailable
- NASA Horizons unavailable
- Browser geolocation denied
- No objects near zenith
- Object below horizon

Display helpful messages instead of crashing.

11. Performance Requirements

- Cache CelesTrak satellite data because it does not need to be fetched every second
- Do not process thousands of satellites on the client
- Process satellite calculations server-side or limit client-side calculations
- Add loading indicators while scanning
- Add refresh button instead of continuous heavy API calls
- Use dynamic imports for heavy visualization libraries like CesiumJS

12. MVP Scope

Build the MVP in this priority order:

Priority 1:
- Landing page
- Location selection using map and manual coordinates
- Dashboard route
- UTC time capture
- Zenith radar component
- Mock celestial data

Priority 2:
- Real ISS API integration
- CelesTrak satellite data integration
- satellite.js calculations
- Object filtering and near-zenith detection

Priority 3:
- Planet data integration
- Constellation static dataset
- Object details panel
- Refresh and filters

Priority 4:
- Optional 3D Earth view using CesiumJS
- Satellite orbit paths
- Improved accuracy and additional object categories

13. Important Scientific Logic

The app should not simply show all objects. It must calculate observer-relative sky position.

Use this logic:
- User location gives observer latitude and longitude
- Current UTC time gives observation time
- Celestial data gives object position
- Convert object position into local horizontal coordinates
- Local horizontal coordinates are altitude and azimuth
- If altitude is close to 90°, the object is near zenith

Zenith rule:
- altitude < 0° means below horizon
- altitude 0°–79.99° means visible but not zenith
- altitude 80°–90° means near zenith

14. Folder Structure

Use this structure:

/app
  /page.tsx
  /location/page.tsx
  /dashboard/page.tsx
  /api
    /iss/route.ts
    /satellites/route.ts
    /planets/route.ts
    /constellations/route.ts
    /scan/route.ts

/components
  LocationMap.tsx
  CoordinateInput.tsx
  TimeCard.tsx
  ZenithRadar.tsx
  ObjectList.tsx
  ObjectDetails.tsx
  FilterPanel.tsx
  EarthView.tsx
  LoadingState.tsx
  ErrorState.tsx

/lib
  /astronomy
    coordinates.ts
    satelliteUtils.ts
    zenithFilter.ts
    radarProjection.ts
    timeUtils.ts
  /api
    issClient.ts
    celestrakClient.ts
    horizonsClient.ts
    constellationClient.ts
  /types
    celestial.ts

15. Data Types

Create TypeScript types:

type CelestialObject = {
  id: string;
  name: string;
  type: "ISS" | "Satellite" | "Planet" | "Constellation";
  altitude: number;
  azimuth: number;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  visibilityStatus: "Below Horizon" | "Visible" | "Near Zenith";
  source: string;
  lastUpdated: string;
};

type ObserverLocation = {
  latitude: number;
  longitude: number;
  timeUTC: string;
};

type ScanResult = {
  observer: ObserverLocation;
  summary: {
    totalObjects: number;
    visibleObjects: number;
    nearZenithObjects: number;
  };
  objects: CelestialObject[];
};

16. Testing

Add basic tests or validation for:
- Coordinate input validation
- Altitude-based visibility status
- Radar projection
- Zenith filtering
- API response formatting

17. Final Deliverable

The final app should allow a user to:
- Open the website
- Select a location
- Scan the sky above that location
- See a list of celestial objects
- Understand which objects are near the zenith
- View object details
- Refresh the scan

Make the app modular, maintainable, and ready for future improvements.
Do not hard-code everything into one page.
Use clean component structure and reusable utility functions.
Use mock data only where real API integration is not yet complete, and clearly separate mock data from real API clients.