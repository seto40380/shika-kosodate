// ==========================
// 志賀町 消防水利マップ
// main.js
// CSVファイル：data/2115.csv
// ==========================

// 地図を表示
const map = L.map("map").setView([37.006, 136.778], 11);

// 地図タイル
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// アイコン：消火栓
const hydrantIcon = L.icon({
  iconUrl: "images/hydrant.svg",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32]
});

// アイコン：防火水槽
const tankIcon = L.icon({
  iconUrl: "images/tank.svg",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32]
});

// CSV読み込み
Papa.parse("data/2115.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,
  encoding: "Shift_JIS",

  complete: function (results) {
    console.log("CSV読み込み完了", results.data);

    results.data.forEach(function (item) {
      const lat = parseFloat(item["緯度"]);
      const lng = parseFloat(item["経度"]);

      if (isNaN(lat) || isNaN(lng)) {
        return;
      }

      const type = item["種別"] || "不明";
      const address = item["所在地_連結標記"] || "所在地不明";
      const diameter = item["口径"] || "-";
      const id = item["ID"] || "-";
      const note = item["備考"] || "-";

      const icon = type.includes("防火") ? tankIcon : hydrantIcon;

      const googleUrl =
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      const popupHtml = `
        <div class="popup-content">
          <div class="popup-title">${type}</div>
          <div><b>所在地</b><br>${address}</div>
          <div><b>口径</b>：${diameter}</div>
          <div><b>ID</b>：${id}</div>
          <div><b>備考</b>：${note}</div>
          <br>
          <a class="nav-button" href="${googleUrl}" target="_blank">
            📍 ここに行く
          </a>
        </div>
      `;

      L.marker([lat, lng], { icon: icon })
        .addTo(map)
        .bindPopup(popupHtml);
    });
  },

  error: function (error) {
    console.error("CSV読み込みエラー:", error);
    alert("CSVの読み込みに失敗しました。data/2115.csv を確認してください。");
  }
});
