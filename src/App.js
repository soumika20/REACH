import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Home, Edit, Menu, User, ChevronRight, MapPin, Phone, Video, Camera, Image, AlertCircle, Navigation, Heart, Cloud, CloudRain, Wind, Thermometer, Activity, Wifi, WifiOff, Radio, Users } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('action');
  const [userLocation, setUserLocation] = useState({ lat: 12.9716, lng: 77.5946 }); // Default: Bangalore
  const [weather, setWeather] = useState(null);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [meshStatus, setMeshStatus] = useState('disconnected'); // 'connected', 'disconnected', 'connecting'
  const [meshPeers, setMeshPeers] = useState([]);
  const [meshMessages, setMeshMessages] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [meshNode, setMeshNode] = useState(null);

  // Replace with your OpenWeatherMap API key
  const WEATHER_API_KEY = 'YOUR_API_KEY_HERE';

  // Mesh Network Manager
  const MeshNetworkManager = useCallback(() => {
    let ws = null;
    let reconnectTimer = null;
    let heartbeatTimer = null;

    const connect = () => {
      try {
        // Try to connect to local Yggdrasil node
        // In production, this would connect to your Yggdrasil service
        ws = new WebSocket('ws://localhost:9001'); // Local Yggdrasil WebSocket
        
        ws.onopen = () => {
          console.log('Mesh network connected');
          setMeshStatus('connected');
          
          // Send initial handshake
          const handshake = {
            type: 'handshake',
            peerId: generatePeerId(),
            location: userLocation,
            timestamp: Date.now()
          };
          ws.send(JSON.stringify(handshake));
          
          // Start heartbeat
          heartbeatTimer = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'heartbeat' }));
            }
          }, 30000);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            handleMeshMessage(message);
          } catch (e) {
            console.error('Failed to parse mesh message:', e);
          }
        };

        ws.onerror = (error) => {
          console.error('Mesh network error:', error);
          setMeshStatus('disconnected');
        };

        ws.onclose = () => {
          console.log('Mesh network disconnected');
          setMeshStatus('disconnected');
          clearInterval(heartbeatTimer);
          
          // Attempt to reconnect
          reconnectTimer = setTimeout(() => {
            if (!isOnline) { // Only reconnect if still offline
              setMeshStatus('connecting');
              connect();
            }
          }, 5000);
        };
      } catch (error) {
        console.error('Failed to connect to mesh network:', error);
        setMeshStatus('disconnected');
        
        // Simulate mesh network for demo purposes
        simulateMeshNetwork();
      }
    };

    const disconnect = () => {
      if (ws) {
        clearInterval(heartbeatTimer);
        clearTimeout(reconnectTimer);
        ws.close();
      }
    };

    return { connect, disconnect };
  }, [userLocation, isOnline]);

  // Generate unique peer ID
  const generatePeerId = () => {
    return 'peer_' + Math.random().toString(36).substr(2, 9);
  };

  // Handle incoming mesh messages
  const handleMeshMessage = (message) => {
    switch (message.type) {
      case 'peer_list':
        setMeshPeers(message.peers || []);
        break;
      case 'emergency_broadcast':
        setMeshMessages(prev => [...prev, message]);
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('Emergency Alert via Mesh', {
            body: message.content,
            icon: '/emergency-icon.png'
          });
        }
        break;
      case 'resource_share':
        // Update local resource list
        console.log('Resource shared:', message.resource);
        break;
      case 'location_update':
        // Update peer locations on map
        setMeshPeers(prev => 
          prev.map(p => p.id === message.peerId ? { ...p, location: message.location } : p)
        );
        break;
      default:
        console.log('Unknown mesh message type:', message.type);
    }
  };

  // Simulate mesh network for demo
  const simulateMeshNetwork = () => {
    setMeshStatus('connected');
    
    // Simulate some nearby peers
    const mockPeers = [
      { id: 'peer_1', name: 'Emergency Responder 1', distance: 0.5, type: 'responder' },
      { id: 'peer_2', name: 'Medical Team', distance: 1.2, type: 'medical' },
      { id: 'peer_3', name: 'Volunteer', distance: 0.8, type: 'volunteer' }
    ];
    setMeshPeers(mockPeers);
  };

  // Broadcast emergency message over mesh
  const broadcastEmergencyMesh = (message) => {
    if (meshNode && meshNode.connect) {
      const broadcast = {
        type: 'emergency_broadcast',
        content: message,
        location: userLocation,
        timestamp: Date.now(),
        sender: generatePeerId()
      };
      
      try {
        // In production, this would send through Yggdrasil
        console.log('Broadcasting via mesh:', broadcast);
        setMeshMessages(prev => [...prev, broadcast]);
        return true;
      } catch (error) {
        console.error('Failed to broadcast on mesh:', error);
        return false;
      }
    }
    return false;
  };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setMeshStatus('disconnected');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setMeshStatus('connecting');
      // Try to connect to mesh network
      const network = MeshNetworkManager();
      network.connect();
      setMeshNode(network);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check if offline on load
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (meshNode) {
        meshNode.disconnect();
      }
    };
  }, [MeshNetworkManager]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied, using default location');
        }
      );
    }
  }, []);

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      if (!WEATHER_API_KEY || WEATHER_API_KEY === 'YOUR_API_KEY_HERE') {
        // Mock weather data if no API key
        setWeather({
          temp: 28,
          condition: 'Partly Cloudy',
          humidity: 65,
          windSpeed: 12,
          feelsLike: 30
        });
        setWeatherAlerts([
          { type: 'Heavy Rainfall', severity: 'high', intensity: '50+ mm/hr', duration: '+2 hours' }
        ]);
        return;
      }

      try {
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${userLocation.lat}&lon=${userLocation.lng}&appid=${WEATHER_API_KEY}&units=metric`
        );
        const weatherData = await weatherRes.json();
        
        setWeather({
          temp: Math.round(weatherData.main.temp),
          condition: weatherData.weather[0].main,
          humidity: weatherData.main.humidity,
          windSpeed: Math.round(weatherData.wind.speed * 3.6), // Convert to km/h
          feelsLike: Math.round(weatherData.main.feels_like)
        });

        // Fetch weather alerts
        const alertsRes = await fetch(
          `https://api.openweathermap.org/data/2.5/onecall?lat=${userLocation.lat}&lon=${userLocation.lng}&appid=${WEATHER_API_KEY}&exclude=minutely,hourly,daily`
        );
        const alertsData = await alertsRes.json();
        
        if (alertsData.alerts) {
          setWeatherAlerts(alertsData.alerts.map(alert => ({
            type: alert.event,
            severity: 'high',
            description: alert.description
          })));
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
        // Use mock data on error
        setWeather({
          temp: 28,
          condition: 'Partly Cloudy',
          humidity: 65,
          windSpeed: 12,
          feelsLike: 30
        });
      }
    };

    if (isOnline) {
      fetchWeather();
      const interval = setInterval(fetchWeather, 600000); // Update every 10 minutes
      return () => clearInterval(interval);
    } else {
      // Use cached/mock data when offline
      setWeather({
        temp: 28,
        condition: 'Offline Mode',
        humidity: 65,
        windSpeed: 12,
        feelsLike: 30
      });
    }
  }, [userLocation, isOnline]);

  useEffect(() => {
    if (currentScreen === 'splash') {
      setTimeout(() => setCurrentScreen('home'), 2500);
    }
  }, [currentScreen]);

  const eventCodes = {
    action: [
      { code: 'V', subtype: 'Volunteer Needed', useCase: 'Immediate volunteer required' },
      { code: 'E', subtype: 'Equipment Needed', useCase: 'Will call you later' },
      { code: 'S', subtype: 'Specialized Help Needed', useCase: 'Expert Response like Medic etc.' },
      { code: 'R', subtype: 'Responders Needed', useCase: 'Police, Fire or Official Responders' }
    ],
    resource: [
      { code: 'M', subtype: 'Medical Needed', useCase: 'Standard Hospital or clinic' },
      { code: 'T', subtype: 'Transport Needed', useCase: 'Ambulance, Evacuation' },
      { code: 'X', subtype: 'Extended Support', useCase: 'Backup team or Additional resources' },
      { code: 'F', subtype: 'Food/Water Needed', useCase: 'Food, Water or Basic Supplies' }
    ],
    medical: [
      { code: 'M1', resource: 'Basic Medical', description: 'First Aid Box or basic medical injury' },
      { code: 'M2', resource: 'Enhanced Medical', description: 'Includes defibrillator, stretcher, oxygen' },
      { code: 'M3', resource: 'Full Medical Cluster', description: 'Complete medical setup' }
    ],
    fire: [
      { code: 'F1', resource: 'Fire Extinguisher', description: 'Basic fire equipment' },
      { code: 'F2', resource: 'Hydrant Available', description: 'Includes hydrant and hoses' },
      { code: 'F3', resource: 'Full Fire Cluster', description: 'Complete fire response setup' }
    ],
    hospital: [
      { code: 'H1', resource: 'Standard Hospital', description: 'Full operational hospital' },
      { code: 'H2', resource: 'Emergency Ready', description: 'Critical care ready' },
      { code: 'H3', resource: 'Full Critical Care', description: 'Complete emergency facilities' }
    ],
    subtype: [
      { code: 'C', subtype: 'Cardiac', useCase: 'Heart related' },
      { code: 'A', subtype: 'Assault', useCase: 'Violence or Physical Assault' },
      { code: 'B', subtype: 'Blood Loss', useCase: 'Severe Bleeding' },
      { code: 'F', subtype: 'Fracture', useCase: 'Bone Fractures' },
      { code: 'U', subtype: 'Unconscious', useCase: 'Person Unconscious' },
      { code: 'I', subtype: 'Injury', useCase: 'Severe Injuries' }
    ]
  };

  const events = [
    { id: 1, type: 'CVX - Cardiac Event', time: '2:00 - 3:00 PM', location: 'Greater Kailash, New Delhi', color: '#DC2626', lat: 28.5494, lng: 77.2381 },
    { id: 2, type: 'MVA - Motor Vehicle Accident', time: '1:30 - 2:30 PM', location: 'MG Road, Bangalore', color: '#EA580C', lat: 12.9756, lng: 77.6069 },
    { id: 3, type: 'Fall Injury', time: '1:00 - 2:00 PM', location: 'Andheri West, Mumbai', color: '#F59E0B', lat: 19.1136, lng: 72.8697 },
    { id: 4, type: 'Respiratory Distress', time: '12:15 PM', location: 'Park Street, Kolkata', color: '#0891B2', lat: 22.5544, lng: 88.3516 },
    { id: 5, type: 'Stroke - CVA', time: '11:45 AM', location: 'Jubilee Hills, Hyderabad', color: '#DC2626', lat: 17.4305, lng: 78.4078 }
  ];

  const nearbyResources = [
    { id: 1, name: 'Apollo Hospital', distance: 1.2, type: 'hospital', lat: userLocation.lat + 0.01, lng: userLocation.lng + 0.01, status: 'Available' },
    { id: 2, name: 'Police Station', distance: 0.8, type: 'police', lat: userLocation.lat - 0.008, lng: userLocation.lng + 0.008, status: 'Available' },
    { id: 3, name: 'First Aid Center', distance: 0.3, type: 'firstaid', lat: userLocation.lat + 0.003, lng: userLocation.lng - 0.003, status: 'Available' },
    { id: 4, name: 'Ambulance Service', distance: 2.1, type: 'ambulance', lat: userLocation.lat + 0.02, lng: userLocation.lng - 0.015, status: 'En-route' }
  ];

  const activities = [
    { id: 1, type: 'CVX', desc: 'Kannankudy Block, Varkala Jamath, Masjid...', time: 'Attended at 2:22 PM', date: '12.08.2024' },
    { id: 2, type: 'MVA', desc: 'Miyakanda Road, Rasool Pallikat, 4...Media', time: 'Attended at 1:30 PM', date: '10.08.2024' }
  ];

  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  // Map component to handle view changes
  const MapViewController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
  };

  if (currentScreen === 'splash') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-gray-700 to-gray-800 rounded-3xl flex items-center justify-center">
            <div className="text-center">
              <Heart className="w-12 h-12 text-red-500 mx-auto mb-2 animate-pulse" strokeWidth={2.5} />
              <div className="text-cyan-400 text-xs font-bold">REACH</div>
            </div>
          </div>
          <h1 className="text-white text-3xl font-bold mb-2">R.E.A.C.H</h1>
          <p className="text-gray-400 text-sm italic px-8">
            Rapid Emergency<br />Access, Care, and Help<br />Anytime, Anywhere.
          </p>
        </div>
      </div>
    );
  }

  if (currentScreen === 'home') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white px-4 py-3 flex items-center justify-between border-b">
          <span className="text-sm font-medium">9:41</span>
          <span className="text-xs text-gray-500">Emergency Services</span>
          <div className="flex items-center gap-2">
            {/* Network Status Indicator */}
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : meshStatus === 'connected' ? (
              <Radio className="w-4 h-4 text-blue-500 animate-pulse" title="Mesh Network Active" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <div className="w-4 h-3 border border-black rounded-sm"></div>
          </div>
        </div>

        {/* Mesh Network Status Banner */}
        {!isOnline && meshStatus === 'connected' && (
          <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">Mesh Network Active</span>
            </div>
            <button 
              onClick={() => setCurrentScreen('meshNetwork')}
              className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded"
            >
              {meshPeers.length} Peers
            </button>
          </div>
        )}

        {weather && weatherAlerts.length > 0 && (
          <div onClick={() => setCurrentScreen('weatherAlert')} className="bg-red-700 text-white px-4 py-3 cursor-pointer hover:bg-red-800 transition-colors">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Weather Alert: {weatherAlerts[0].type}</p>
                <p className="text-xs opacity-90">Severity: {weatherAlerts[0].severity}</p>
                {weatherAlerts[0].intensity && <p className="text-xs opacity-90">Intensity: {weatherAlerts[0].intensity}</p>}
              </div>
            </div>
            <button className="mt-2 bg-white text-red-700 px-3 py-1 rounded text-xs font-medium">▶ View Details</button>
          </div>
        )}

        {weather && (
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5" />
                  <span className="text-3xl font-bold">{weather.temp}°C</span>
                </div>
                <p className="text-sm opacity-90 mt-1">{weather.condition}</p>
                <p className="text-xs opacity-75">Feels like {weather.feelsLike}°C</p>
              </div>
              <div className="text-right text-sm">
                <div className="flex items-center gap-1 justify-end mb-1">
                  <Wind className="w-4 h-4" />
                  <span>{weather.windSpeed} km/h</span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <CloudRain className="w-4 h-4" />
                  <span>{weather.humidity}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="h-64 relative">
          <MapContainer 
            center={[userLocation.lat, userLocation.lng]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={createCustomIcon('#3B82F6')}>
              <Popup>Your Location</Popup>
            </Marker>
            <Circle center={[userLocation.lat, userLocation.lng]} radius={500} color="#3B82F6" fillOpacity={0.1} />
          </MapContainer>
          <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg z-[1000]">
            <p className="text-xs text-gray-600">Your Location</p>
            <p className="text-sm font-semibold">Lat: {userLocation.lat.toFixed(4)}</p>
            <p className="text-sm font-semibold">Lng: {userLocation.lng.toFixed(4)}</p>
          </div>
        </div>

        <div className="p-4 space-y-4 pb-24">
          <button onClick={() => document.getElementById('mediaInput').click()} className="w-full bg-gray-900 text-white rounded-2xl p-4 flex items-center justify-between hover:bg-gray-800 transition-colors">
            <div className="flex items-center gap-3">
              <Image className="w-5 h-5" />
              <span className="font-medium">Add media</span>
            </div>
          </button>
          <input id="mediaInput" type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => {
            const files = Array.from(e.target.files);
            setMediaFiles(prev => [...prev, ...files]);
            alert(`${files.length} file(s) added successfully!`);
          }} />

          <button onClick={() => setCurrentScreen('requestForm')} className="w-full bg-gray-900 text-white rounded-2xl p-4 flex items-center justify-between hover:bg-gray-800 transition-colors">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Request Resources</span>
            </div>
          </button>

          <button className="w-full bg-gray-900 text-white rounded-2xl p-4 flex items-center justify-between hover:bg-gray-800 transition-colors">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5" />
              <span className="font-medium">Audio Call</span>
            </div>
          </button>

          <button className="w-full bg-green-600 text-white rounded-2xl p-4 flex items-center justify-between hover:bg-green-700 transition-colors">
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5" />
              <span className="font-medium">Video Call</span>
            </div>
          </button>

          {mediaFiles.length > 0 && (
            <div className="bg-white rounded-2xl p-4">
              <h3 className="font-semibold mb-2">Uploaded Media ({mediaFiles.length})</h3>
              <div className="grid grid-cols-3 gap-2">
                {mediaFiles.map((file, idx) => (
                  <div key={idx} className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <Camera className="w-6 h-6 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <BottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'weatherAlert') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Weather Alert" onBack={() => setCurrentScreen('home')} />
        <div className="relative h-screen pb-24">
          <div className="h-96">
            <MapContainer 
              center={[userLocation.lat, userLocation.lng]} 
              zoom={10} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              <TileLayer
                url="https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid={WEATHER_API_KEY}"
                attribution='Weather data © OpenWeatherMap'
              />
              <Marker position={[userLocation.lat, userLocation.lng]} icon={createCustomIcon('#3B82F6')}>
                <Popup>Your Location</Popup>
              </Marker>
              <Circle center={[userLocation.lat, userLocation.lng]} radius={5000} color="#DC2626" fillOpacity={0.2} />
            </MapContainer>
          </div>
          <div className="p-4 space-y-4">
            {weatherAlerts.map((alert, idx) => (
              <div key={idx} className="bg-red-700 text-white rounded-2xl p-4 shadow-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-lg">{alert.type}</p>
                    <p className="text-sm mt-1">Severity: {alert.severity}</p>
                    {alert.intensity && <p className="text-sm">Intensity: {alert.intensity}</p>}
                    {alert.duration && <p className="text-sm">Duration: {alert.duration}</p>}
                    {alert.description && <p className="text-xs mt-2 opacity-90">{alert.description}</p>}
                  </div>
                </div>
              </div>
            ))}
            {weather && (
              <div className="bg-white rounded-2xl p-4">
                <h3 className="font-bold mb-3">Current Conditions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Thermometer className="w-5 h-5 text-blue-600 mb-1" />
                    <p className="text-sm text-gray-600">Temperature</p>
                    <p className="text-xl font-bold">{weather.temp}°C</p>
                  </div>
                  <div className="bg-cyan-50 p-3 rounded-lg">
                    <Wind className="w-5 h-5 text-cyan-600 mb-1" />
                    <p className="text-sm text-gray-600">Wind Speed</p>
                    <p className="text-xl font-bold">{weather.windSpeed} km/h</p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <CloudRain className="w-5 h-5 text-indigo-600 mb-1" />
                    <p className="text-sm text-gray-600">Humidity</p>
                    <p className="text-xl font-bold">{weather.humidity}%</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <Cloud className="w-5 h-5 text-purple-600 mb-1" />
                    <p className="text-sm text-gray-600">Condition</p>
                    <p className="text-lg font-bold">{weather.condition}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <BottomNav currentScreen="home" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'requestForm') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Request Form" onBack={() => setCurrentScreen('home')} />
        <div className="p-4 space-y-4 pb-24">
          <div className="bg-white rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Name</label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter your name" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Location</label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter location" value={`${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`} readOnly />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Contact</label>
              <input type="tel" className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Enter contact number" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Type</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Description</span>
                  <button className="text-gray-400">×</button>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-gray-300 text-gray-700 text-xs rounded mb-1">Medical</span>
                    <p className="text-sm">Description</p>
                  </div>
                  <button className="text-gray-400">×</button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">*Please provide details of assistance needed</p>
            </div>
            <button className="w-full bg-gray-900 text-white rounded-lg py-3 font-semibold hover:bg-gray-800">Request</button>
          </div>
        </div>
        <BottomNav currentScreen="home" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'navigation') {
    const destination = nearbyResources[0];
    const routePath = [
      [userLocation.lat, userLocation.lng],
      [userLocation.lat + 0.003, userLocation.lng + 0.005],
      [userLocation.lat + 0.007, userLocation.lng + 0.009],
      [destination.lat, destination.lng]
    ];
    
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="" onBack={() => setCurrentScreen('map')} />
        <div className="relative h-screen pb-24">
          <div className="h-full">
            <MapContainer 
              center={[userLocation.lat + 0.005, userLocation.lng + 0.005]} 
              zoom={14} 
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[userLocation.lat, userLocation.lng]} icon={createCustomIcon('#3B82F6')}>
                <Popup>Your Location</Popup>
              </Marker>
              <Marker position={[destination.lat, destination.lng]} icon={createCustomIcon('#9333EA')}>
                <Popup>{destination.name}</Popup>
              </Marker>
              <Polyline positions={routePath} color="#FF6B35" weight={4} />
            </MapContainer>
          </div>
          <div className="absolute top-4 left-4 right-4 bg-white rounded-2xl p-4 shadow-lg z-[1000]">
            <div className="flex items-center justify-between">
              <button className="p-2" onClick={() => setCurrentScreen('map')}><ChevronRight className="w-5 h-5 rotate-180" /></button>
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold text-orange-500">ETA - {Math.round(destination.distance * 5)} min</p>
                <p className="text-xs text-gray-500">{destination.distance} km via Main Route</p>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 bg-green-50 rounded-lg px-3 py-2 flex items-center justify-center gap-2">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 font-medium">En Route to {destination.name}</span>
            </div>
          </div>
        </div>
        <BottomNav currentScreen="map" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'activityHistory') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Activity History" onBack={() => setCurrentScreen('profile')} />
        <div className="p-4">
          <div className="mb-4">
            <div className="relative">
              <input type="text" placeholder="Search" className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg" />
              <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
            </div>
          </div>
          <div className="space-y-3 pb-24">
            {activities.map(activity => (
              <div key={activity.id} className="bg-red-500 text-white rounded-2xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{activity.type}</h3>
                  <span className="bg-blue-500 px-3 py-1 rounded-full text-xs">See more</span>
                </div>
                <p className="text-sm opacity-90 mb-2">{activity.desc}</p>
                <div className="flex justify-between items-center text-xs">
                  <span>{activity.time}</span>
                  <span>{activity.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <BottomNav currentScreen="profile" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'eventCodes') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Event Codes" onBack={() => setCurrentScreen('profile')} />
        <div className="p-4 pb-24">
          <div className="mb-4">
            <div className="relative">
              <input type="text" placeholder="Search" className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg" />
              <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
            </div>
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {['action', 'resource', 'medical', 'fire', 'hospital', 'subtype'].map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${selectedCategory === cat ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {eventCodes[selectedCategory].map((item, idx) => (
                  <tr key={idx} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-sm font-medium">{item.code}</td>
                    <td className="px-4 py-3 text-sm">{item.subtype || item.resource}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.useCase || item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <BottomNav currentScreen="profile" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'events') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Active Events" />
        <div className="h-64">
          <MapContainer 
            center={[userLocation.lat, userLocation.lng]} 
            zoom={6} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={createCustomIcon('#3B82F6')}>
              <Popup>Your Location</Popup>
            </Marker>
            {events.map(event => (
              <Marker 
                key={event.id} 
                position={[event.lat, event.lng]} 
                icon={createCustomIcon(event.color)}
                eventHandlers={{
                  click: () => {
                    setSelectedEvent(event);
                    setCurrentScreen('eventDetail');
                  }
                }}
              >
                <Popup>
                  <strong>{event.type}</strong><br />
                  {event.location}<br />
                  {event.time}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div className="p-4 space-y-3 pb-24">
          <h3 className="font-bold text-lg">All Active Events</h3>
          {events.map(event => (
            <div key={event.id} onClick={() => { setSelectedEvent(event); setCurrentScreen('eventDetail'); }} className="rounded-2xl p-4 text-white cursor-pointer hover:opacity-90 transition-opacity" style={{ backgroundColor: event.color }}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{event.type}</h3>
                <button className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs">View Details</button>
              </div>
              <p className="text-sm opacity-90 mb-1">{event.time}</p>
              <p className="text-sm opacity-90 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.location}
              </p>
              <p className="text-xs opacity-75 mt-1">
                {calculateDistance(userLocation.lat, userLocation.lng, event.lat, event.lng)} km away
              </p>
            </div>
          ))}
        </div>
        <BottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'eventDetail' && selectedEvent) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Event Details" onBack={() => setCurrentScreen('events')} />
        <div className="h-64">
          <MapContainer 
            center={[selectedEvent.lat, selectedEvent.lng]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={createCustomIcon('#3B82F6')}>
              <Popup>Your Location</Popup>
            </Marker>
            <Marker position={[selectedEvent.lat, selectedEvent.lng]} icon={createCustomIcon(selectedEvent.color)}>
              <Popup>{selectedEvent.type}</Popup>
            </Marker>
            <Polyline 
              positions={[
                [userLocation.lat, userLocation.lng],
                [selectedEvent.lat, selectedEvent.lng]
              ]} 
              color="#6366F1" 
              dashArray="10, 10"
            />
          </MapContainer>
        </div>
        <div className="p-4 space-y-4 pb-24">
          <div className="bg-red-600 text-white rounded-2xl p-4">
            <h2 className="font-bold text-xl mb-2">{selectedEvent.type}</h2>
            <p className="text-sm mb-1">Start Time: {selectedEvent.time.split(' - ')[0]}</p>
            <p className="text-sm mb-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {selectedEvent.location}
            </p>
            <p className="text-sm mb-3">
              Distance: {calculateDistance(userLocation.lat, userLocation.lng, selectedEvent.lat, selectedEvent.lng)} km away
            </p>
            <div className="flex gap-2">
              <button className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium flex-1">I am responding</button>
              <button 
                className="bg-white bg-opacity-20 p-2 rounded-lg"
                onClick={() => {
                  setCurrentScreen('navigation');
                }}
              >
                <Navigation className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Updates</h3>
              <button className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm">See more</button>
            </div>
            <div className="space-y-2">
              {['Volunteer Arrived at Scene', 'ETA confirmed for Ambulance', 'Paramedic en route'].map((update, idx) => (
                <div key={idx} className="bg-red-50 rounded-lg p-3 text-sm">
                  <p className="text-red-800">{update}</p>
                  <p className="text-gray-500 text-xs mt-1">{5 + idx * 3} mins ago</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <BottomNav currentScreen="events" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'map') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Nearby Resources" />
        <div className="h-96">
          <MapContainer 
            center={[userLocation.lat, userLocation.lng]} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={createCustomIcon('#3B82F6')}>
              <Popup>Your Location</Popup>
            </Marker>
            {nearbyResources.map(resource => (
              <Marker 
                key={resource.id} 
                position={[resource.lat, resource.lng]} 
                icon={createCustomIcon(
                  resource.type === 'hospital' ? '#DC2626' :
                  resource.type === 'police' ? '#2563EB' :
                  resource.type === 'ambulance' ? '#16A34A' :
                  '#F59E0B'
                )}
              >
                <Popup>
                  <strong>{resource.name}</strong><br />
                  {resource.distance} km away<br />
                  Status: {resource.status}
                </Popup>
              </Marker>
            ))}
            <Circle center={[userLocation.lat, userLocation.lng]} radius={2000} color="#3B82F6" fillOpacity={0.05} />
          </MapContainer>
        </div>
        <div className="p-4 space-y-3 pb-24">
          <h3 className="font-bold text-lg">Nearby Emergency Resources</h3>
          {nearbyResources.map(resource => (
            <div key={resource.id} className="bg-white rounded-xl p-4 flex justify-between items-center shadow-sm">
              <div className="flex-1">
                <h4 className="font-semibold">{resource.name}</h4>
                <p className="text-sm text-gray-500">{resource.distance} km away</p>
                {resource.status && (
                  <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                    resource.status === 'En-route' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {resource.status}
                  </span>
                )}
              </div>
              <button 
                onClick={() => setCurrentScreen('navigation')} 
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors ml-3"
              >
                <Navigation className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
        <BottomNav currentScreen="map" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'cpr') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="CPR for Adults" onBack={() => setCurrentScreen('profile')} />
        <div className="p-4 space-y-6 pb-24">
          <div className="bg-white rounded-2xl p-6">
            <h2 className="font-bold text-xl mb-4">CPR Instructions</h2>
            <div className="space-y-4">
              {[
                'CHECK the scene for safety and use PPE',
                'CHECK for responsiveness and breathing',
                'CALL 9-1-1 and get equipment',
                'Place person on back on firm surface',
                'Deliver chest compressions at 100-120/min',
                'Open airway, pinch nose, give rescue breaths'
              ].map((text, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">{i + 1}</div>
                  <p className="text-gray-700 pt-1">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6">
            <h3 className="font-semibold mb-3">Hand Position</h3>
            <div className="bg-blue-50 rounded-xl h-48 flex items-center justify-center">
              <p className="text-gray-500">CPR Illustration</p>
            </div>
            <p className="text-sm text-gray-600 mt-3">Body position: Shoulders over hands, elbows locked. Rate: 100-120/min. Depth: At least 2 inches.</p>
          </div>
        </div>
        <BottomNav currentScreen="profile" setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  if (currentScreen === 'profile') {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header title="" />
        <div className="p-4 pb-24">
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3 px-2">User</h3>
            <div className="bg-white rounded-2xl overflow-hidden">
              {[
                { label: 'Activity History', screen: 'activityHistory' },
                { label: 'Event Codes', screen: 'eventCodes' },
                { label: 'Feedback & Community', screen: null },
                { label: 'Redeem Gifts', screen: null }
              ].map((item, i) => (
                <button key={i} onClick={() => item.screen && setCurrentScreen(item.screen)} className="w-full px-4 py-4 flex justify-between items-center border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                  <span className="text-gray-700">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3 px-2">Settings</h3>
            <div className="bg-white rounded-2xl overflow-hidden">
              {['Notification', 'App Customization', 'Device Integration', 'Account Management', 'Legal and Policies'].map((item, i) => (
                <button key={i} className="w-full px-4 py-4 flex justify-between items-center border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                  <span className="text-gray-700">{item}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => setCurrentScreen('cpr')} className="w-full bg-red-500 text-white rounded-2xl py-4 font-semibold hover:bg-red-600 transition-colors">
            View Emergency Procedures
          </button>
        </div>
        <BottomNav currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} />
      </div>
    );
  }

  return null;
};

const Header = ({ title, onBack }) => (
  <div className="bg-white px-4 py-3 border-b sticky top-0 z-10">
    <div className="flex items-center justify-between">
      {onBack ? <button onClick={onBack} className="text-blue-500">← Back</button> : <span className="text-sm">9:41</span>}
      <span className="font-semibold">{title}</span>
      <div className="w-12"></div>
    </div>
  </div>
);

const BottomNav = ({ currentScreen, setCurrentScreen }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-3 flex justify-between items-center z-10">
    <button onClick={() => setCurrentScreen('home')} className={`flex flex-col items-center ${currentScreen === 'home' ? 'text-blue-500' : 'text-gray-400'}`}>
      <Home className="w-6 h-6" />
    </button>
    <button onClick={() => setCurrentScreen('events')} className={`flex flex-col items-center ${currentScreen === 'events' || currentScreen === 'eventDetail' ? 'text-blue-500' : 'text-gray-400'}`}>
      <Edit className="w-6 h-6" />
    </button>
    <button onClick={() => setCurrentScreen('map')} className={`flex flex-col items-center ${currentScreen === 'map' || currentScreen === 'navigation' ? 'text-blue-500' : 'text-gray-400'}`}>
      <Menu className="w-6 h-6" />
    </button>
    <button onClick={() => setCurrentScreen('profile')} className={`flex flex-col items-center ${currentScreen === 'profile' || currentScreen === 'cpr' || currentScreen === 'activityHistory' || currentScreen === 'eventCodes' ? 'text-blue-500' : 'text-gray-400'}`}>
      <User className="w-6 h-6" />
    </button>
  </div>
);

export default App;