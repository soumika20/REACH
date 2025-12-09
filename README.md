# REACH 

R.E.A.C.H. (Rapid Emergency, Access, Care, and Help Anytime, Anywhere) is a human-centered emergency response system designed to bridge the critical gap before first responders arrive. The platform allows bystanders to report incidents through images, videos and location data while automatically generating AI-based summaries for dispatchers as well as bystanders. It also notifies nearby volunteers, provides routing to emergency services, displays weather and government alerts, and supports communication even in low-connectivity conditions.

This repository contains the complete codebase for the web application and mobile-adapted interface, including frontend components, backend integrations with Firebase, and the AI processing pipeline. The project was developed as part of the Human Factors in Design course (ED3010).

By Team 13 <br>
Karthiga, Soumika, Vibhaa

---

Deployment: https://reach-hfd.vercel.app/ <br>
check the above uploaded files for the Android APK

Vercel and Android deployment - Soumika

---

On Android, every time you open the app, tap the map icon and press “Grant Permission” on the pop-up to allow location access.

---

## 🚨 Important Notice

Please contact emergency services **only in genuine emergency situations**.

This platform is a prototype and has been done as a course project (ED3010 - Human factors in Design).

---

## Instructions to Setup & Run Locally (Step-by-Step)

Follow these instructions to run the project on your laptop.

### Prerequisites
- Node.js (v14 or higher) + npm
- VS Code (recommended)
- Google Account (for Google Maps API Key)

### Step 1: Clone the Repository
```bash
git clone 
cd hfd
```

### Step 2: Open in VS Code

Open VS Code
File → Open Folder → Select the hfd folder

### Step 3: Install Dependencies
In the terminal (Ctrl + `):
```bash
npm install
```
This will install all required packages including:
- `react` - Frontend framework
- `react-dom` - React DOM rendering
- `react-leaflet` - Map components
- `leaflet` - Mapping library
- `lucide-react` - Icon library
- `firebase` - Backend services (Firestore, Storage, Auth)
- `@capacitor/core` - Native app capabilities
- `@capacitor/geolocation` - Location services
- `@capacitor/push-notifications` - Push notifications
- `@capacitor/local-notifications` - Local notifications

### 4. Set Up Environment Variables

Create a `.env.local` file in the root directory:
```bash
touch .env.local
```

Add the following environment variables (replace with your actual API keys):
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
REACT_APP_WEATHER_API_KEY=your_weather_api_key_here
REACT_APP_GEOAPIFY_API_KEY=your_geoapify_api_key_here
```

**How to get API keys:**
- **Google Maps API**: Go to [Google Cloud Console](https://console.cloud.google.com/) → Enable Maps JavaScript API & Directions API
- **Weather API**: Sign up at [OpenWeatherMap](https://openweathermap.org/api) (or the app uses Open-Meteo which requires no key)
- **Geoapify API**: Sign up at [Geoapify](https://www.geoapify.com/)

### 5. Configure Firebase

The app uses Firebase for backend services. Update the Firebase configuration in `src/App.js` (around line 747):
```javascript
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

**To get Firebase credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to Project Settings > General > Your apps
4. Click "Add app" or select existing web app
5. Copy the configuration object

**Set up Firebase services:**
1. **Firestore Database**: Enable in Firebase Console
2. **Storage**: Enable in Firebase Console
3. **Authentication**: Enable Anonymous authentication

### 6. Run the Development Server

Start the app in development mode:
```bash
npm start
```

The app will open automatically in your browser at `http://localhost:3000`

**What you should see:**
- The app splash screen with R.E.A.C.H logo
- Home screen with emergency services options
- Map showing your current location (after granting permission)

### 7. Build for Production

To create an optimized production build:
```bash
npm run build
```

This creates a `build` folder with production-ready files.

### 8. Deploy to Firebase Hosting (Optional)

Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

Login to Firebase:
```bash
firebase login
```


Initialize Firebase in your project:
```bash
firebase init
```

Select:
- **Hosting** (use spacebar to select)
- Choose your Firebase project
- Set `build` as your public directory
- Configure as single-page app: **Yes**
- Don't overwrite `index.html`

Deploy to Firebase:
```bash
npm run build
firebase deploy
```

Your app will be live at `https://your-project.firebaseapp.com`

## Available Scripts

- `npm start` - Runs development server
- `npm run build` - Creates production build
- `npm test` - Runs tests
- `npm run eject` - Ejects from Create React App (irreversible)

## Project Structure
```
reach_emergency_ai_dispatch/
├── android/              # Android native files (Capacitor)
├── public/              # Static files
│   ├── index.html
│   └── emergency procedure images/
├── src/
│   ├── App.js          # Main application component
│   └── index.js        # Entry point
├── .env.local          # Environment variables (create this)
├── .firebaserc         # Firebase project config
├── firebase.json       # Firebase hosting config
├── firestore.rules     # Firestore security rules
├── firestore.indexes.json
└── package.json        # Dependencies and scripts
```


## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
# Kill the process using port 3000
npx kill-port 3000
# Or run on different port
PORT=3001 npm start
```

### Firebase Connection Issues
- Verify your Firebase config is correct
- Check Firebase console for service status
- Ensure Firestore rules allow read/write for development

### Location Not Working
- Grant browser location permissions
- For HTTPS deployment, location APIs require secure context
- Check browser console for geolocation errors

### Map Not Displaying
- Verify Leaflet CSS is imported in `App.js`
- Check that OpenStreetMap tiles are accessible
- Clear browser cache and reload

## Features

-  Real-time location tracking 📍
-  Interactive maps with emergency resources 🗺️
-  Emergency event creation and management 🚨
-  Real-time chat for events 💬 
-  Media upload (photos, videos, audio) 📸
-  Weather alerts 🌤️ 
-  Quick emergency call access 📞
-  Resource request system 🆘
-  Firebase backend integration 🔥

## Technologies Used

- **React 18** - Frontend framework
- **Firebase** - Backend (Firestore, Storage, Auth)
- **Leaflet/React-Leaflet** - Interactive maps
- **Capacitor** - Native mobile capabilities
- **Lucide React** - Icon library
- **OpenStreetMap** - Map tiles
- **OSRM** - Route calculation


---
Thank you for using REACH 

Built with ❤️ for emergency response coordination
