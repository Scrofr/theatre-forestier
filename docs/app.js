(() => {
  const THEATER = { lat: 46.91930985, lng: 6.36961979 };
  const PARKING = { lat: 46.9193284, lng: 6.3702824 };
  const IMG = { url: "./maps/theatre-forestier.jpg", width: 1424, height: 1996 };
  const ANCHOR = { x: 516, y: 1182 };
  const MPP = 1.16;
  const DECL = 1.55;
  const M_PER_DEG_LAT = 111320;
  const STORAGE = "theatre-forestier.calibration.v1";
  const OFFSITE_M = 2500;

  const LAYERS = {
    "ign-plan": {
      label: "Plan IGN",
      url: "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
      attribution: "© IGN / Geoportail",
      maxZoom: 19,
    },
    "ign-scan": {
      label: "Carte IGN",
      url: "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
      attribution: "© IGN / Geoportail",
      maxZoom: 18,
    },
    osm: {
      label: "OpenStreetMap",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    },
    ortho: {
      label: "Orthophoto IGN",
      url: "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
      attribution: "© IGN / Geoportail",
      maxZoom: 21,
    },
    satellite: {
      label: "Satellite",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "© Esri",
      maxZoom: 19,
    },
  };

  const state = {
    overlayOn: true,
    opacity: 0.92,
    multiply: true,
    base: "ign-plan",
    cal: loadCal(),
    follow: false,
    watchId: null,
  };

  function loadCal() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE) || "null");
      if (!raw) return { shiftEastM: 0, shiftNorthM: 0, extraRotationDeg: 0, scale: 1 };
      return {
        shiftEastM: Number(raw.shiftEastM) || 0,
        shiftNorthM: Number(raw.shiftNorthM) || 0,
        extraRotationDeg: Number(raw.extraRotationDeg) || 0,
        scale: raw.scale > 0.2 ? Number(raw.scale) : 1,
      };
    } catch {
      return { shiftEastM: 0, shiftNorthM: 0, extraRotationDeg: 0, scale: 1 };
    }
  }

  function saveCal() {
    localStorage.setItem(STORAGE, JSON.stringify(state.cal));
  }

  function corners() {
    const mpp = MPP * state.cal.scale;
    const decl = ((DECL + state.cal.extraRotationDeg) * Math.PI) / 180;
    const mLon = M_PER_DEG_LAT * Math.cos((THEATER.lat * Math.PI) / 180);
    const pix = (x, y) => {
      const mx = (x - ANCHOR.x) * mpp;
      const my = (ANCHOR.y - y) * mpp;
      const east = mx * Math.cos(decl) + my * Math.sin(decl) + state.cal.shiftEastM;
      const north = -mx * Math.sin(decl) + my * Math.cos(decl) + state.cal.shiftNorthM;
      return L.latLng(THEATER.lat + north / M_PER_DEG_LAT, THEATER.lng + east / mLon);
    };
    return { tl: pix(0, 0), tr: pix(IMG.width, 0), bl: pix(0, IMG.height) };
  }

  function dist(a, b) {
    const R = 6371000;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  const map = L.map("map", {
    center: [THEATER.lat, THEATER.lng],
    zoom: 16,
    zoomControl: false,
    minZoom: 13,
    maxZoom: 21,
  });
  L.control.zoom({ position: "bottomright" }).addTo(map);
  map.createPane("omap");
  const pane = map.getPane("omap");
  pane.style.zIndex = "350";
  pane.style.pointerEvents = "none";
  pane.style.mixBlendMode = "multiply";

  let tiles = L.tileLayer(LAYERS[state.base].url, LAYERS[state.base]).addTo(map);

  const chip = (label, cls) =>
    L.divIcon({
      className: "poi-icon",
      html: `<div class="poi-chip"><span class="poi-dot ${cls}"></span><span>${label}</span></div>`,
      iconSize: [96, 28],
      iconAnchor: [12, 14],
    });
  L.marker([THEATER.lat, THEATER.lng], { icon: chip("Théâtre", ""), zIndexOffset: 200 }).addTo(map);
  L.marker([PARKING.lat, PARKING.lng], { icon: chip("Parking", "poi-dot-parking"), zIndexOffset: 200 }).addTo(map);

  const img = L.DomUtil.create("img", "omap-img", pane);
  img.alt = "Carte d'orientation Théâtre Forestier";
  img.src = IMG.url;

  function resetOverlay() {
    const c = corners();
    const tl = map.latLngToLayerPoint(c.tl);
    const tr = map.latLngToLayerPoint(c.tr);
    const bl = map.latLngToLayerPoint(c.bl);
    img.style.width = IMG.width + "px";
    img.style.height = IMG.height + "px";
    img.style.transformOrigin = "0 0";
    img.style.transform = `matrix(${(tr.x - tl.x) / IMG.width},${(tr.y - tl.y) / IMG.width},${(bl.x - tl.x) / IMG.height},${(bl.y - tl.y) / IMG.height},${tl.x},${tl.y})`;
    img.style.display = state.overlayOn ? "block" : "none";
    img.style.opacity = String(state.opacity);
    pane.style.mixBlendMode = state.multiply ? "multiply" : "normal";
  }
  img.onload = resetOverlay;
  map.on("move zoom zoomend viewreset", resetOverlay);

  function fitSite() {
    const c = corners();
    map.fitBounds(L.latLngBounds(c.bl, c.tr), { padding: [24, 24], maxZoom: 16 });
  }
  fitSite();

  const grid = document.getElementById("layer-grid");
  Object.entries(LAYERS).forEach(([id, spec]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "layer-card" + (id === state.base ? " is-active" : "");
    b.textContent = spec.label;
    b.addEventListener("click", () => {
      state.base = id;
      tiles.remove();
      tiles = L.tileLayer(spec.url, spec).addTo(map);
      grid.querySelectorAll(".layer-card").forEach((el) => el.classList.remove("is-active"));
      b.classList.add("is-active");
      state.multiply = id === "ign-plan" || id === "ign-scan" || id === "osm";
      document.getElementById("chk-multiply").checked = state.multiply;
      resetOverlay();
    });
    grid.appendChild(b);
  });

  const panels = {
    layers: document.getElementById("panel-layers"),
    cal: document.getElementById("panel-cal"),
    info: document.getElementById("panel-info"),
  };
  function closePanels() {
    Object.values(panels).forEach((p) => p.classList.add("hidden"));
  }
  function toggle(name) {
    const open = !panels[name].classList.contains("hidden");
    closePanels();
    if (!open) panels[name].classList.remove("hidden");
  }
  document.getElementById("btn-layers").onclick = () => toggle("layers");
  document.getElementById("btn-cal").onclick = () => toggle("cal");
  document.getElementById("btn-info").onclick = () => toggle("info");
  document.getElementById("btn-fit").onclick = fitSite;
  document.querySelectorAll("[data-close]").forEach((b) => (b.onclick = closePanels));

  document.getElementById("chk-overlay").onchange = (e) => {
    state.overlayOn = e.target.checked;
    resetOverlay();
  };
  document.getElementById("rng-opacity").oninput = (e) => {
    state.opacity = Number(e.target.value);
    document.getElementById("op-val").textContent = Math.round(state.opacity * 100) + "%";
    resetOverlay();
  };
  document.getElementById("chk-multiply").onchange = (e) => {
    state.multiply = e.target.checked;
    resetOverlay();
  };

  function bindCal(id, key, fmt, el) {
    const rng = document.getElementById(id);
    rng.value = state.cal[key];
    el.textContent = fmt(state.cal[key]);
    rng.oninput = () => {
      state.cal[key] = Number(rng.value);
      el.textContent = fmt(state.cal[key]);
      saveCal();
      resetOverlay();
    };
  }
  bindCal("rng-east", "shiftEastM", (v) => `${v > 0 ? "+" : ""}${Math.round(v)} m`, document.getElementById("v-east"));
  bindCal("rng-north", "shiftNorthM", (v) => `${v > 0 ? "+" : ""}${Math.round(v)} m`, document.getElementById("v-north"));
  bindCal("rng-rot", "extraRotationDeg", (v) => `${v > 0 ? "+" : ""}${Number(v).toFixed(2)}°`, document.getElementById("v-rot"));
  bindCal("rng-scale", "scale", (v) => `${(v * 100).toFixed(1)}%`, document.getElementById("v-scale"));
  document.getElementById("btn-reset").onclick = () => {
    state.cal = { shiftEastM: 0, shiftNorthM: 0, extraRotationDeg: 0, scale: 1 };
    saveCal();
    document.getElementById("rng-east").value = 0;
    document.getElementById("rng-north").value = 0;
    document.getElementById("rng-rot").value = 0;
    document.getElementById("rng-scale").value = 1;
    document.getElementById("v-east").textContent = "0 m";
    document.getElementById("v-north").textContent = "0 m";
    document.getElementById("v-rot").textContent = "0.00°";
    document.getElementById("v-scale").textContent = "100.0%";
    resetOverlay();
  };

  let gpsMarker = null;
  let acc = null;
  const locateBtn = document.getElementById("btn-locate");
  const banner = document.getElementById("gps-banner");

  function gpsIcon() {
    return L.divIcon({
      className: "gps-icon",
      html: `<span class="gps-dot"></span>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
  }

  function onFix(pos) {
    const fix = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const d = dist(fix, THEATER);
    if (!gpsMarker) {
      gpsMarker = L.marker(fix, { icon: gpsIcon(), zIndexOffset: 800, interactive: false }).addTo(map);
      acc = L.circle(fix, {
        radius: pos.coords.accuracy,
        color: "#3d7ea6",
        weight: 1,
        fillColor: "#3d7ea6",
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(map);
    } else {
      gpsMarker.setLatLng(fix);
      acc.setLatLng(fix).setRadius(pos.coords.accuracy);
    }
    if (d > OFFSITE_M) {
      banner.textContent = `Vous êtes à ${(d / 1000).toFixed(1)} km du Théâtre Forestier. La carte reste sur Pontarlier.`;
      banner.classList.remove("hidden");
      locateBtn.textContent = "Hors site";
    } else {
      banner.classList.add("hidden");
      locateBtn.textContent = "Suivi GPS · ±" + Math.round(pos.coords.accuracy) + " m";
      locateBtn.classList.add("is-live");
      if (state.follow) map.panTo(fix);
    }
  }

  locateBtn.onclick = () => {
    if (!navigator.geolocation) {
      locateBtn.textContent = "GPS indisponible";
      return;
    }
    if (state.follow && state.watchId != null) {
      navigator.geolocation.clearWatch(state.watchId);
      state.watchId = null;
      state.follow = false;
      locateBtn.classList.remove("is-live");
      locateBtn.textContent = "Me localiser";
      return;
    }
    state.follow = true;
    locateBtn.textContent = "Recherche…";
    navigator.geolocation.getCurrentPosition(onFix, (err) => {
      locateBtn.textContent = err.code === 1 ? "GPS refusé" : "GPS indisponible";
      state.follow = false;
    }, { enableHighAccuracy: true, timeout: 12000 });
    state.watchId = navigator.geolocation.watchPosition(onFix, () => undefined, {
      enableHighAccuracy: true,
      maximumAge: 1000,
    });
  };
})();
