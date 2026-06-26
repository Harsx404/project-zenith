# Project Zenith: The Celestial Eye

Project Zenith is a full-stack, real-time cosmic radar web application. It allows users to select any geographic coordinate on Earth and visually track celestial objects (like the ISS, satellites, planets, and constellations) currently passing through or near that location's zenith in a highly immersive, interactive dashboard.

## 🚀 Key Features

- **Real-Time Data Integration**: Fetches up-to-date data for the ISS, Satellites (via CelesTrak), Planets, and Constellations.
- **Geospatial Mapping**: Uses an interactive 3D map to select observation coordinates anywhere on Earth.
- **Immersive Zenith Radar**: A 2D/3D circular radar that calculates altitude and azimuth to display objects directly above your chosen location.
- **Dynamic Filtering & Search**: Toggle visibility for different celestial object types and search for specific entities.
- **Interactive UI with Keyboard Shortcuts**: Built with a dark, sleek, space-themed aesthetic featuring glassmorphism, smooth animations, and power-user keyboard controls.

## 🛠 Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Framer Motion (for animations)
- **Mapping & Visualization**: CesiumJS (for 3D Earth), standard Canvas/SVG for radar projection
- **Astronomy Libraries**: `satellite.js` (for TLE orbital calculations)
- **Icons**: Lucide React

---

## 🧭 How to Navigate the Website

The user journey in Project Zenith is divided into three immersive stages. Here is a detailed guide on how to navigate the system:

### 1. Mission Control (Landing Page)
When you first load the application, you arrive at the Mission Control initialization screen.
- **Visuals**: A cinematic, rotating space background with sleek typography.
- **Interaction**: The system will run through a simulated "boot sequence" (Initializing Cosmic Radar -> Locating Celestial Bodies...). Wait for the sequence to complete or click the text to skip ahead.
- **Action**: Once the system is ready, a **"COMMENCE LINK"** button will appear. Click this to proceed to the Target Acquisition phase.

### 2. Target Acquisition (Location Selection)
On this page, you must tell the radar *where* on Earth you are observing from.
- **Interactive 3D Globe**: You can drag, rotate, and zoom the 3D Earth. Clicking anywhere on the globe will automatically extract the Latitude and Longitude.
- **Coordinate Panel (Top Right)**: A floating glass panel where you can manually type in your desired Latitude and Longitude.
- **GPS Locator**: Inside the panel, click the target icon (or "Use Current Location") to allow the browser to fetch your real-world coordinates.
- **Action**: Once your coordinates are locked in, click the glowing **"SCAN ZENITH"** button to establish the uplink and open the cosmic radar.

### 3. Cosmic Radar (Dashboard)
This is the core experience of Project Zenith. The dashboard calculates observer-relative sky positions to show you exactly what is above your chosen location right now.

#### Interface Breakdown:
- **Top Navigation Bar**: 
  - *Left*: Displays your current tracked coordinates and real-time UTC clock.
  - *Center (Filters)*: Toggle buttons for `ISS`, `Satellite`, `Planet`, and `Constellation`. Click them to hide/show specific categories on the radar.
  - *Right (Controls)*: Contains buttons to open the Object List, Refresh Data, and toggle Fullscreen mode.
- **The Radar Display**: 
  - The center of the circle represents the Zenith (90° altitude - directly above you).
  - The outer edge represents the horizon (0° altitude).
  - Glowing dots represent celestial objects. Click any dot to pull up a detailed intelligence panel about that specific object (showing its altitude, azimuth, type, and source).
- **Zenith Alerts**: If an object crosses into the >80° altitude threshold, a temporary alert will slide down from the top of the screen notifying you that an object has entered the "Zenith Zone".
- **Object Drawer**: Clicking the List icon (or pressing `L`) slides out a drawer on the right side. This drawer lists all tracked objects, sorted by altitude, and includes a search bar to find specific satellites or stars.
- **Bottom Stats Bar**: Summarizes the total tracked objects, visible objects (above the horizon), and objects currently at Zenith.

#### Keyboard Shortcuts (Power Users):
- `F`: Toggle Fullscreen mode for maximum immersion.
- `L`: Toggle the Object List drawer.
- `↑ / ↓ (Up/Down Arrows)`: Cycle through the visible celestial objects sequentially.
- `ESC`: Close the currently selected object's detail panel or close the Object Drawer.

---

## 💻 Running the Project Locally

To run this project on your local machine, follow these steps:

1. **Install dependencies**:
   ```bash
   npm install
   # or yarn install
   # or pnpm install
   ```

2. **Set up Environment Variables**:
   Ensure you have a `.env.local` file configured if using restricted APIs. (Currently, the app relies on open APIs like CelesTrak and OpenNotify, so it may run out-of-the-box).

3. **Start the development server**:
   ```bash
   npm run dev
   # or yarn dev
   ```

4. **View the app**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤝 Contributing
Feedback and contributions are welcome. Feel free to open issues or submit pull requests on the repository.
