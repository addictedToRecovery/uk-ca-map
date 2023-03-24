# Map widget for CA Areas in the UK

## Creating the GeoJSON file

- Select desired features from a layer in QGIS
- Use the Vector geometry `Simplify` tool in QGIS with a tolerance of 0.001. (Not Geo Simplification)
- Export the new layer to a GeoJSON file
- Replace the [GeoJSON file](src/assets/ukca-area-boundaries-simple.geojson)

## Development

```bash
export GOOGLE_API_KEY=YOUR_KEY
export MAPBOX_API_KEY=YOUR_KEY
npm start
```