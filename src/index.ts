import * as $ from 'jquery';
import * as L from 'leaflet';

import * as closeIcon from './assets/close-icon.svg';
import * as mapIcon from './assets/map.svg';
import * as geojson from './assets/ukca-area-boundaries-simple.geojson';
import './assets/style.css';

export {};

declare global {
  interface Window {
    UKCA: any;
  }
}

const defaultColor = 'rgb(255, 255, 255)';
const colorMap = {
  'CAUK Area': 'rgba(0, 255, 0)',
  'Central UK Area': 'rgba(255, 255, 0)',
  'Ireland Area': 'rgb(0, 128, 0)',
  'London Area': 'rgba(0, 0, 255)',
  'Scotland Area': 'rgba(0, 0, 64)',
  'Wales Area': 'rgba(255, 0, 0)',
  'West Country Area': 'rgb(255, 0, 255)',
};

const classSuffix = 'ukca';
const accessToken = 'pk.eyJ1IjoiY2F1ay1pdC1jb21tIiwiYSI6ImNqbGFxeGMzMzBiZXoza3FpZHVyZDkyNWEifQ.SScIx3L9iahy060GEGkR9w';

const addMap = (el: HTMLElement) => {
  // let marker: L.Marker;

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
    accessToken,
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
    // console.log(evt);
    L.DomEvent.stop(evt);
    areasLayer.resetStyle(evt.target);
  };

  const featureClickEventBuilder = (url) => {
    return () => {
      window.location.assign(url);
    };
  };

  const areasLayer = L.geoJSON(geojson as any, {
    style: (feature) => {
      return {
        color: 'rgba(0,0,0,0)',
        fillColor: feature.properties.area in colorMap ? colorMap[feature.properties.area] : defaultColor,
        weight: 2,
        opacity: 0.5,
        fillOpacity: 0.5,
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
        // click: featureClickEventBuilder('https://centralukca.org'),
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
        key: 'AIzaSyA_ZOgRvq1KZxbPyX1316vFbWUykdnXYmo',
        address: inputVal,
        region: 'uk',
        // language: $tspiv_language,
      },
      (geocoded) => {
        // console.log(geocoded);
        const result = geocoded.results[0];
        $(this).val(result.formatted_address);
        const {lat, lng} = result.geometry.location;
        const latlng = L.latLng(lat, lng);

        // if (marker) {
        //   marker.setLatLng(latlng);
        // } else {
        //   marker = L.marker(latlng).addTo(map);
        // }

        const point = map.latLngToContainerPoint(latlng);
        const mapPos = map.getContainer().getBoundingClientRect();
        const viewportPoint = L.point(mapPos.left, mapPos.top).add(point);
        const featureEl = document.elementFromPoint(viewportPoint.x, viewportPoint.y);
        // console.log(featureEl);

        areasLayer.resetStyle();

        for (const layer of areasLayer.getLayers()) {
          // console.log(layer);
          if ((layer as any)._path === featureEl) {
            // console.log('found!!');
            (layer as any).setStyle(highlightStyle);
            layer.openPopup(latlng);
          } else if (layer.isPopupOpen()) {
            layer.closePopup();
          }
        }

        // map.flyTo(
        //   latlng,
        //   8,
        //   {
        //     animate: false,
        //     // duration: 1,
        //   },
        // );
        // map.panTo(latlng);
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
  init: () => {
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

    $(mapIconEl).on('click', () => {
      showModal();
    });

    const map = document.createElement('div');
    map.classList.add(`${classSuffix}_map`);

    $(overlay).append(modal);
    $(modal).append(closeIconEl);
    $(modal).append(map);
    $(document.body).append(overlay);
    addMap(map);

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
  },
};
