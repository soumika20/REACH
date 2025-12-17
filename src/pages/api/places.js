export default async function handler(req, res) {
  const { lat, lng, type, radius = 5000 } = req.query;
  
  if (!lat || !lng || !type) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Places API error:', error);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
}
