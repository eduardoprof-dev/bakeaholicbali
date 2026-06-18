(function initializeLocationPicker(global) {
  const formatRupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  });
  let googleMapsLoaderPromise;

  function estimateGoSendFee(distanceKm) {
    if (!distanceKm || distanceKm <= 0) {
      return {
        distanceKm: 0,
        bikeFare: 0,
        serviceFee: 0,
        total: 0
      };
    }

    const bikeFare = Math.max(10000, Math.round(distanceKm * 2000));
    const serviceFee = 5500;
    return {
      distanceKm: Number(distanceKm.toFixed(1)),
      bikeFare,
      serviceFee,
      total: bikeFare + serviceFee
    };
  }

  function haversineDistanceKm(origin, destination) {
    const toRadians = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const latDelta = toRadians(destination.lat - origin.lat);
    const lngDelta = toRadians(destination.lng - origin.lng);
    const a = Math.sin(latDelta / 2) ** 2
      + Math.cos(toRadians(origin.lat))
        * Math.cos(toRadians(destination.lat))
        * Math.sin(lngDelta / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  async function fetchRouteDistanceKm(origin, destination) {
    const url =
      `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Unable to calculate route distance");
    }
    const payload = await response.json();
    const routeMeters = payload.routes?.[0]?.distance;
    if (!routeMeters) {
      throw new Error("No route returned");
    }
    return routeMeters / 1000;
  }

  async function geocode(query) {
    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=id&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error("Search failed");
    }
    return response.json();
  }

  async function reverseGeocode(lat, lng) {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      throw new Error("Reverse geocode failed");
    }
    return response.json();
  }

  function loadGoogleMaps(apiKey) {
    if (!apiKey) {
      return Promise.resolve(null);
    }

    if (global.google?.maps) {
      return Promise.resolve(global.google.maps);
    }

    if (googleMapsLoaderPromise) {
      return googleMapsLoaderPromise;
    }

    googleMapsLoaderPromise = new Promise((resolve, reject) => {
      const callbackName = "__bakeaholicInitGoogleMaps";
      global[callbackName] = () => {
        resolve(global.google.maps);
        delete global[callbackName];
      };

      const script = document.createElement("script");
      script.async = true;
      script.defer = true;
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,marker&loading=async&callback=${callbackName}`;
      script.onerror = () => {
        reject(new Error("Unable to load Google Maps"));
        delete global[callbackName];
      };
      document.head.appendChild(script);
    });

    return googleMapsLoaderPromise;
  }

  function createLocationPicker(options) {
    const {
      rootId,
      kitchen,
      initialValue,
      onSave,
      googleMapsApiKey
    } = options;

    const root = document.getElementById(rootId);
    if (!root) {
      return {
        open() {},
        close() {},
        setValue() {},
        getValue() {
          return initialValue || null;
        }
      };
    }

    const closeButton = root.querySelector("#closeLocationModal");
    const searchInput = root.querySelector("#locationSearchInput");
    const searchButton = root.querySelector("#searchLocationButton");
    const mapElement = root.querySelector("#locationMap");
    const selectedLabel = root.querySelector("#selectedLocationLabel");
    const selectedAddress = root.querySelector("#selectedLocationAddress");
    const selectedFee = root.querySelector("#selectedLocationFee");
    const notesInput = root.querySelector("#locationNotesInput");
    const notesToggle = root.querySelector("#locationNotesToggle");
    const currentLocationButton = root.querySelector("#useCurrentLocationButton");
    const saveButton = root.querySelector("#saveLocationButton");

    let map = null;
    let mapApi = null;
    let selectedMarker = null;
    let value = initialValue || null;
    let googleGeocoder = null;

    function hasConfirmedLocation(nextValue = value) {
      if (!nextValue) {
        return false;
      }

      const lat = Number(nextValue.lat);
      const lng = Number(nextValue.lng);
      const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng);
      const addressText = String(nextValue.formattedAddress || "").trim();
      const labelText = String(nextValue.label || "").trim();
      const isPlaceholderAddress =
        !addressText
        || /^Pinned/i.test(addressText)
        || /^Pinned/i.test(labelText);
      return hasCoordinates && nextValue.locationConfirmed !== false && !isPlaceholderAddress;
    }

    function canUseGoogleMap() {
      return mapApi === "google" && map;
    }

    function canUseLeafletMap() {
      return mapApi === "leaflet" && map;
    }

    function currentMapCenter() {
      if (canUseGoogleMap()) {
        const center = map.getCenter();
        return {
          lat: typeof center.lat === "function" ? center.lat() : center.lat,
          lng: typeof center.lng === "function" ? center.lng() : center.lng
        };
      }
      if (canUseLeafletMap()) {
        const center = map.getCenter();
        return {
          lat: center.lat,
          lng: center.lng
        };
      }
      return {
        lat: kitchen.lat,
        lng: kitchen.lng
      };
    }

    async function useTypedAddressFallback() {
      const query = searchInput.value.trim();
      if (!query) {
        return false;
      }
      const center = currentMapCenter();
      await setSelectedLocation({
        lat: center.lat,
        lng: center.lng,
        label: query,
        formattedAddress: query,
        locationConfirmed: true,
        locationNotes: notesInput.value.trim()
      });
      selectedFee.textContent = "Address saved from typed text. Please confirm the pin if the map becomes available.";
      return true;
    }

    function initializeLeafletMap() {
      if (!global.L) {
        selectedFee.textContent = "Map could not load. Please check your Google Maps key or internet connection.";
        return;
      }

      mapApi = "leaflet";
      map = global.L.map(mapElement, {
        zoomControl: true
      }).setView([kitchen.lat, kitchen.lng], 12);

      global.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }).addTo(map);

      const kitchenMarker = global.L.marker([kitchen.lat, kitchen.lng]).addTo(map);
      kitchenMarker.bindPopup("Bakeaholic kitchen");

      map.on("click", async (event) => {
        await chooseLatLng(event.latlng.lat, event.latlng.lng);
      });
    }

    function initializeGoogleMap(mapsApi) {
      mapApi = "google";
      googleGeocoder = new mapsApi.Geocoder();
      map = new mapsApi.Map(mapElement, {
        center: { lat: kitchen.lat, lng: kitchen.lng },
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      new mapsApi.Marker({
        map,
        position: { lat: kitchen.lat, lng: kitchen.lng },
        title: "Bakeaholic kitchen"
      });

      map.addListener("click", async (event) => {
        await chooseLatLng(event.latLng.lat(), event.latLng.lng());
      });
    }

    loadGoogleMaps(googleMapsApiKey)
      .then((mapsApi) => {
        if (!mapsApi) {
          initializeLeafletMap();
          return;
        }

        initializeGoogleMap(mapsApi);

        const autocomplete = new mapsApi.places.Autocomplete(searchInput, {
          componentRestrictions: { country: "id" },
          fields: ["formatted_address", "geometry", "name"],
          types: ["geocode"]
        });

        autocomplete.addListener("place_changed", async () => {
          const place = autocomplete.getPlace();
          const location = place?.geometry?.location;
          if (!location) {
            return;
          }

          await setSelectedLocation({
            lat: typeof location.lat === "function" ? location.lat() : location.lat,
            lng: typeof location.lng === "function" ? location.lng() : location.lng,
            label: place.name || place.formatted_address,
            formattedAddress: place.formatted_address || place.name || "",
            locationConfirmed: true,
            locationNotes: notesInput.value.trim()
          });
        });

        if (hasConfirmedLocation()) {
          setSelectedLocation(value).catch(() => {
            renderSelectedLocation();
          });
        }
      })
      .catch(() => {
        selectedFee.textContent = "Google Maps is unavailable. Falling back to OpenStreetMap.";
        initializeLeafletMap();
        if (hasConfirmedLocation()) {
          setSelectedLocation(value).catch(() => {
            renderSelectedLocation();
          });
        }
      });

    function renderSelectedLocation() {
      if (!value) {
        selectedLabel.textContent = "No location selected yet";
        selectedAddress.textContent = "Search or tap the map to pin a delivery location.";
        selectedFee.textContent = "Delivery fee will be calculated after you pin the address.";
        notesInput.value = "";
        notesInput.hidden = true;
        return;
      }

      selectedLabel.textContent = value.label || value.formattedAddress || "Pinned location";
      selectedAddress.textContent = value.formattedAddress || "Pinned map location";
      if (!hasConfirmedLocation(value)) {
        selectedFee.textContent = `Estimated delivery fee: ${formatRupiah.format(0)} for 0 km`;
        notesInput.value = value.locationNotes || "";
        notesInput.hidden = !value.locationNotes;
        return;
      }

      const feeLabel = value.quoteSource === "biteship"
        ? `Live ${value.courierName || "courier"} quote`
        : "Estimated delivery fee";
      selectedFee.textContent = `${feeLabel}: ${formatRupiah.format(value.deliveryFee || 0)} for ${value.routeDistanceKm || 0} km`;
      notesInput.value = value.locationNotes || "";
      notesInput.hidden = !value.locationNotes;
    }

    async function setSelectedLocation(nextValue) {
      const routeDistanceKm = await fetchRouteDistanceKm(kitchen, nextValue)
        .catch(() => haversineDistanceKm(kitchen, nextValue) * 1.18);
      const fee = estimateGoSendFee(routeDistanceKm);

      value = {
        ...nextValue,
        routeDistanceKm: Number(routeDistanceKm.toFixed(1)),
        deliveryFee: fee.total
      };

      if (canUseGoogleMap()) {
        const position = { lat: value.lat, lng: value.lng };
        if (selectedMarker) {
          selectedMarker.setPosition(position);
        } else {
          selectedMarker = new global.google.maps.Marker({
            map,
            position,
            title: value.label || "Delivery location"
          });
        }
        map.setCenter(position);
        map.setZoom(16);
      }

      if (canUseLeafletMap()) {
        if (selectedMarker) {
          selectedMarker.setLatLng([value.lat, value.lng]);
        } else {
          selectedMarker = global.L.marker([value.lat, value.lng]).addTo(map);
        }
        map.setView([value.lat, value.lng], 15);
      }

      renderSelectedLocation();
    }

    async function googleReverseGeocode(lat, lng) {
      if (!googleGeocoder) {
        throw new Error("Google geocoder is unavailable");
      }

      const response = await googleGeocoder.geocode({
        location: { lat, lng }
      });
      const bestMatch = response.results?.[0];
      if (!bestMatch) {
        throw new Error("No Google address returned");
      }
      return {
        label: bestMatch.address_components?.[0]?.long_name || bestMatch.formatted_address,
        formattedAddress: bestMatch.formatted_address
      };
    }

    async function chooseLatLng(lat, lng) {
      try {
        const reverse = canUseGoogleMap()
          ? await googleReverseGeocode(lat, lng)
          : await reverseGeocode(lat, lng);
        await setSelectedLocation({
          lat,
          lng,
          label: reverse.label || reverse.name || reverse.display_name,
          formattedAddress: reverse.formattedAddress || reverse.display_name,
          locationConfirmed: true,
          locationNotes: notesInput.value.trim()
        });
      } catch (_error) {
        await setSelectedLocation({
          lat,
          lng,
          label: "Pinned map location",
          formattedAddress: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          locationConfirmed: true,
          locationNotes: notesInput.value.trim()
        });
      }
    }

    searchButton.addEventListener("click", async () => {
      const query = searchInput.value.trim();
      if (!query) return;
      searchButton.disabled = true;
      searchButton.textContent = "Finding...";
      try {
        if (googleGeocoder) {
          const response = await googleGeocoder.geocode({
            address: query,
            componentRestrictions: { country: "ID" }
          });
          const bestMatch = response.results?.[0];
          const location = bestMatch?.geometry?.location;
          if (location) {
            await setSelectedLocation({
              lat: location.lat(),
              lng: location.lng(),
              label: bestMatch.address_components?.[0]?.long_name || bestMatch.formatted_address,
              formattedAddress: bestMatch.formatted_address,
              locationConfirmed: true,
              locationNotes: notesInput.value.trim()
            });
            return;
          }
        }

        const results = await geocode(query);
        const bestMatch = results[0];
        if (!bestMatch) {
          await useTypedAddressFallback();
          return;
        }

        await setSelectedLocation({
          lat: Number(bestMatch.lat),
          lng: Number(bestMatch.lon),
          label: bestMatch.name || bestMatch.display_name,
          formattedAddress: bestMatch.display_name,
          locationConfirmed: true,
          locationNotes: notesInput.value.trim()
        });
      } catch (_error) {
        await useTypedAddressFallback();
      } finally {
        searchButton.disabled = false;
        searchButton.textContent = "Find";
      }
    });

    searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        searchButton.click();
      }
    });

    notesToggle?.addEventListener("click", () => {
      notesInput.hidden = !notesInput.hidden;
      if (!notesInput.hidden) {
        notesInput.focus();
      }
    });

    currentLocationButton.addEventListener("click", () => {
      if (!navigator.geolocation) {
        selectedFee.textContent = "Current location is not available in this browser.";
        return;
      }

      currentLocationButton.disabled = true;
      currentLocationButton.textContent = "Locating...";
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const reverse = await reverseGeocode(position.coords.latitude, position.coords.longitude);
            await setSelectedLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              label: reverse.name || reverse.display_name,
              formattedAddress: reverse.display_name,
              locationConfirmed: true,
              locationNotes: notesInput.value.trim()
            });
          } finally {
            currentLocationButton.disabled = false;
            currentLocationButton.textContent = "Use Current Location";
          }
        },
        () => {
          selectedFee.textContent = "We could not access your current location.";
          currentLocationButton.disabled = false;
          currentLocationButton.textContent = "Use Current Location";
        }
      );
    });

    saveButton.addEventListener("click", () => {
      if (!hasConfirmedLocation()) {
        useTypedAddressFallback()
          .then((usedFallback) => {
            if (!usedFallback || !hasConfirmedLocation()) {
              selectedFee.textContent = "Please pin an address on the map before saving.";
              return;
            }
            value.locationNotes = notesInput.value.trim();
            renderSelectedLocation();
            onSave?.(value);
          });
        return;
      }

      value.locationNotes = notesInput.value.trim();
      renderSelectedLocation();
      onSave?.(value);
    });

    closeButton?.addEventListener("click", () => {
      root.hidden = true;
    });

    renderSelectedLocation();

    return {
      open() {
        root.hidden = false;
        setTimeout(() => {
          if (canUseLeafletMap()) {
            map.invalidateSize();
          }
          if (canUseGoogleMap()) {
            global.google.maps.event.trigger(map, "resize");
            if (hasConfirmedLocation()) {
              map.setCenter({ lat: value.lat, lng: value.lng });
            }
          }
        }, 30);
      },
      close() {
        root.hidden = true;
      },
      setValue(nextValue) {
        value = nextValue;
        renderSelectedLocation();
        if (hasConfirmedLocation(value)) {
          setSelectedLocation(value).catch(() => {
            renderSelectedLocation();
          });
        }
      },
      getValue() {
        return value;
      }
    };
  }

  global.BakeaholicLocationPicker = {
    createLocationPicker,
    estimateGoSendFee
  };
})(window);
