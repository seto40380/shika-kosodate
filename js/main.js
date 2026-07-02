const map = L.map("map", { zoomControl: false }).setView([37.06, 136.78], 12);
L.control.zoom({ position: "bottomright" }).addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

const icons = {
  hydrant: L.icon({ iconUrl: "images/hydrant.svg", iconSize: [34,34], iconAnchor: [17,17], popupAnchor: [0,-12] }),
  tank: L.icon({ iconUrl: "images/tank.svg", iconSize: [34,34], iconAnchor: [17,17], popupAnchor: [0,-12] })
};

const markers = L.layerGroup().addTo(map);
let allData = [];

const searchBox = document.getElementById("searchBox");
const typeFilter = document.getElementById("typeFilter");
const countBox = document.getElementById("countBox");
const locateBtn = document.getElementById("locateBtn");

function value(item, keys, fallback = "") {
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null && item[key] !== "") return item[key];
  }
  return fallback;
}

// 完全版JSON（日本語キー）でも、前のJSON（英語キー）でも表示できる形にそろえる
function normalize(item) {
  return {
    raw: item,
    id: value(item, ["ID", "id", "管理番号"]),
    type: value(item, ["種別", "type", "水利種別"]),
    address: value(item, ["所在地_連結標記", "所在地", "address"]),
    pref: value(item, ["所在地_都道府県", "都道府県名"]),
    city: value(item, ["所在地_市区町村", "市区町村名"]),
    town: value(item, ["所在地_町字", "town"]),
    block: value(item, ["所在地_番地以下"]),
    building: value(item, ["建物名等(方書)"]),
    lat: Number(value(item, ["緯度", "lat", "latitude"])),
    lng: Number(value(item, ["経度", "lng", "lon", "longitude"])),
    diameter: value(item, ["口径", "diameter"]),
    note: value(item, ["備考", "note"])
  };
}

function isTank(type) {
  return String(type).includes("水そう") || String(type).includes("水槽");
}

function safeText(v) {
  return (v === null || v === undefined || v === "") ? "-" : String(v);
}

function popupHtml(item) {
  const icon = isTank(item.type) ? "images/tank.svg" : "images/hydrant.svg";
  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`;
  return `
    <div class="popup-title"><img src="${icon}" alt="">${safeText(item.type)}</div>
    <div class="popup-info">
      <div><b>所在地</b>：${safeText(item.address)}</div>
      <div><b>ID</b>：${safeText(item.id)}</div>
      <div><b>町字</b>：${safeText(item.town)}</div>
      <div><b>番地以下</b>：${safeText(item.block)}</div>
      <div><b>口径</b>：${item.diameter ? item.diameter + "mm" : "-"}</div>
      <div><b>備考</b>：${safeText(item.note)}</div>
    </div>
    <a class="nav-button" href="${navUrl}" target="_blank" rel="noopener">ここに行く（Googleマップ）</a>
  `;
}

function render() {
  markers.clearLayers();
  const keyword = searchBox.value.trim().toLowerCase();
  const filter = typeFilter.value;
  let shown = 0;
  const bounds = [];

  allData.forEach(item => {
    if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) return;

    if (filter !== "all") {
      if (filter === "防火水そう" && !isTank(item.type)) return;
      if (filter === "消火栓" && isTank(item.type)) return;
    }

    const text = [item.id, item.type, item.address, item.pref, item.city, item.town, item.block, item.building, item.diameter, item.note]
      .join(" ")
      .toLowerCase();
    if (keyword && !text.includes(keyword)) return;

    const marker = L.marker([item.lat, item.lng], { icon: isTank(item.type) ? icons.tank : icons.hydrant })
      .bindPopup(popupHtml(item));
    markers.addLayer(marker);
    bounds.push([item.lat, item.lng]);
    shown++;
  });

  countBox.textContent = `表示：${shown.toLocaleString()}件 / 全${allData.length.toLocaleString()}件`;
}

fetch("data/shika_suiri_complete.json")
  .then(res => {
    if (!res.ok) throw new Error("JSONを読み込めません");
    return res.json();
  })
  .then(data => {
    allData = data.map(normalize);
    render();
  })
  .catch(err => {
    console.error(err);
    countBox.textContent = "データ読込エラー";
    alert("data/shika_suiri_complete.json を読み込めませんでした。GitHub Pages上、または簡易サーバーで開いてください。");
  });

searchBox.addEventListener("input", render);
typeFilter.addEventListener("change", render);

locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) return alert("この端末では現在地を取得できません。 ");
  navigator.geolocation.getCurrentPosition(pos => {
    const here = [pos.coords.latitude, pos.coords.longitude];
    L.circleMarker(here, { radius: 8 }).addTo(map).bindPopup("現在地").openPopup();
    map.setView(here, 16);
  }, () => alert("現在地を取得できませんでした。"), { enableHighAccuracy: true, timeout: 10000 });
});
