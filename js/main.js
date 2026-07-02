const map = L.map("map").setView([37.006, 136.778], 12);

// 地図タイル
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// アイコン設定
const hydrantIcon = L.icon({
  iconUrl: "images/hydrant.png",
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -32]
});

const tankIcon = L.icon({
  iconUrl: "images/tank.png",
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -32]
});

// データ読み込み
fetch("data/suiri.json")
  .then(response => response.json())
  .then(data => {
    data.forEach(item => {
      const lat = Number(item.lat);
      const lng = Number(item.lng);

      if (!lat || !lng) return;

      const icon = item.type.includes("防火水槽") ? tankIcon : hydrantIcon;

      const googleNavUrl =
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      const popup = `
        <div class="popup-title">${item.type}</div>
        <div class="popup-info">
          <div>所在地：${item.address || "不明"}</div>
          <div>容量：${item.capacity || "-"}</div>
          <div>備考：${item.note || "-"}</div>
        </div>
        <a class="nav-button" href="${googleNavUrl}" target="_blank">
          ここに行く
        </a>
      `;

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(popup);
    });
  });
