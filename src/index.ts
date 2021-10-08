import { FeatureCollection } from 'geojson';
import palette from 'google-palette';
import * as $ from 'jquery';
import * as L from 'leaflet';

import closeIcon from './assets/close-icon.svg';
import mapIcon from './assets/map.svg';
import './assets/style.css';

export {};

declare global {
  interface Window {
    UKCA: any;
  }
}

const defaultColor = 'rgb(255, 255, 255)';
// const colorMap = {
//   'CAUK Area': 'rgba(0, 255, 0)',
//   'Central UK Area': 'rgba(255, 255, 0)',
//   'Ireland Area': 'rgb(0, 128, 0)',
//   'London Area': 'rgba(0, 0, 255)',
//   'Scotland Area': 'rgba(0, 0, 64)',
//   'Wales Area': 'rgba(255, 0, 0)',
//   'West Country Area': 'rgb(255, 0, 255)',
// };

const classSuffix = 'ukca';
let mapAdded = false;

const addMap = async (el: HTMLElement, googleApiKey: string, mapboxApiKey: string) => {
  const geojson = await import(
    './assets/ukca-area-boundaries-simple.geojson'
    /* webpackChunkName: "map-data" */
    /* webpackMode: "lazy" */) as any as FeatureCollection;

  const colorMap = {};
  for (const feature of geojson.features) {
    if (!colorMap[feature.properties.area]) {
      colorMap[feature.properties.area] = "";
    }
  }

  const colors = palette('cb-Set1', Object.keys(colorMap).length);

  for (let i =0; i < colors.length; i++) {
    colorMap[Object.keys(colorMap)[i]] = `#${colors[i]}`;
  }

  const map = L.map(el, {
    crs: L.CRS.EPSG3857,
    // minZoom: 5,
  }).setView([54.093409058179, -4.855957], 6);

  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: mapboxApiKey,
  }).addTo(map);

  const highlightStyle: L.PathOptions = {
    weight: 2,
    color: '#3B555C',
    dashArray: '',
    fillOpacity: 0.4,
    // fillColor: '#c3c3c3',
    // fill: true,
  };

  const highlightFeature = (evt) => {
    const feature = (evt.target as L.FeatureGroup);
    feature.setStyle(highlightStyle);
    if (!L.Browser.ie && !L.Browser.opera) {
        feature.bringToFront();
    }
  };

  const resetHighlight = (evt) => {
    L.DomEvent.stop(evt);
    areasLayer.resetStyle(evt.target);
  };

  const areasLayer = L.geoJSON(geojson as any, {
    style: (feature) => {
      return {
        color: 'rgba(0,0,0,0)',
        fillColor: feature.properties.area in colorMap ? colorMap[feature.properties.area] : defaultColor,
        weight: 2,
        opacity: 0.5,
        fillOpacity: 0.6,
        fill: true,
      };
    },
    coordsToLatLng: (coords) => {
      return L.Projection.SphericalMercator.unproject(new L.Point(coords[0], coords[1]));
    },
    onEachFeature: (feature, layer) => {
      const popupText = `<b>${feature.properties.area}</b><br/><a href="${feature.properties.url}?ukca_redirect">${feature.properties.url}</a>`;
      layer.bindPopup(popupText);
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
      });
    },
  }).addTo(map);

  const inputEl = document.createElement('input');
  inputEl.id = 'formatted_address';
  inputEl.placeholder = "I'm looking for meetings in...";
  el.appendChild(inputEl);

  $('input#formatted_address')
  .change(function() {
    const inputVal = $(this)
      .val()
      .trim();

    $.getJSON(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        key: googleApiKey,
        address: inputVal,
        region: 'uk',
      },
      (geocoded) => {
        const result = geocoded.results[0];
        $(this).val(result.formatted_address);
        const {lat, lng} = result.geometry.location;
        const latlng = L.latLng(lat, lng);

        const point = map.latLngToContainerPoint(latlng);
        const mapPos = map.getContainer().getBoundingClientRect();
        const viewportPoint = L.point(mapPos.left, mapPos.top).add(point);
        const featureEl = document.elementFromPoint(viewportPoint.x, viewportPoint.y);

        areasLayer.resetStyle();

        for (const layer of areasLayer.getLayers()) {
          if ((layer as any)._path === featureEl) {
            (layer as any).setStyle(highlightStyle);
            layer.openPopup(latlng);
          } else if (layer.isPopupOpen()) {
            layer.closePopup();
          }
        }
      },
    );
  })
  .keypress(event => {
    if (event.keyCode === 10 || event.keyCode === 13) {
        event.preventDefault();
        $('input#formatted_address').trigger('change');
    }
  });
};

window.UKCA = {
  init: async (googleApiKey: string, mapboxApiKey: string) => {
    const mapIconEl = document.createElement('div');
    mapIconEl.innerHTML = `${mapIcon}`;
    mapIconEl.classList.add(`${classSuffix}_map-icon`);
    document.body.appendChild(mapIconEl);

    const overlay = document.createElement('div');
    overlay.classList.add(`${classSuffix}_overlay`);

    const modal = document.createElement('div');
    modal.classList.add(`${classSuffix}_modal`);

    const overflow = document.body.style.overflow;

    const hideModal = (delay = true) => {
      document.body.style.overflow = overflow;
      overlay.classList.add('hide');
      modal.classList.remove('show');
      modal.classList.add('hide');

      if (delay) {
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 500);
      } else {
        overlay.style.display = 'none';
      }
    };

    const showModal = () => {
      document.body.style.overflow = 'hidden';
      overlay.style.display = 'block';
      overlay.classList.remove('hide');
      modal.classList.remove('hide');
      modal.classList.add('show');
    };

    const closeIconEl = document.createElement('div');
    closeIconEl.innerHTML = `${closeIcon}`;
    closeIconEl.classList.add('close');
    $(closeIconEl).on('click', () => {
      window.localStorage.setItem('ukca_closed', '1');
      hideModal();
    });

    $(mapIconEl).on('click', async () => {
      showModal();
      if (!mapAdded) {
        await addMap(map, googleApiKey, mapboxApiKey);
      }
    });

    const map = document.createElement('div');
    map.classList.add(`${classSuffix}_map`);

    $(overlay).append(modal);
    $(modal).append(closeIconEl);
    $(modal).append(map);
    $(document.body).append(overlay);

    const text = document.createElement('div');
    text.classList.add(`${classSuffix}_trad-6`);
    text.innerHTML = 'In the spirit of Tradition Six, C.A. is not allied with any sect, denomination, politics, organisation or institution.';
    modal.appendChild(text);
    hideModal(false);

    const params = new URLSearchParams(window.location.search);
    if (params.has('ukca_redirect')) {
      window.localStorage.setItem('ukca_chosen', '1');
      return;
    }

    if (window.localStorage.getItem('ukca_chosen') || window.localStorage.getItem('ukca_closed')) {
      return;
    }

    showModal();
    await addMap(map, googleApiKey, mapboxApiKey);
  },
};
