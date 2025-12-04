export default async function handler(req, res) {
  const { startLat, startLng, endLat, endLng } = req.query;
  
  if (!startLat || !startLng || !endLat || !endLng) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&mode=driving&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch route' });
  }
}
