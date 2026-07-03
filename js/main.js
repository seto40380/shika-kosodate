// 地図初期位置（志賀町役場付近）
const map = L.map("map").setView([37.006, 136.778], 11);

// 地図表示
L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }
).addTo(map);

// 消火栓アイコン
const hydrantIcon = L.icon({
  iconUrl: "images/hydrant.svg",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32]
});

// 防火水槽アイコン
const tankIcon = L.icon({
  iconUrl: "images/tank.svg",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32]
});

// CSV読込
Papa.parse("data/2115.csv", {

  download: true,

  header: true,

  skipEmptyLines: true,

  encoding: "Shift_JIS",

  complete: function(results) {

    console.log("CSV読込完了");

    results.data.forEach(item => {

      const lat = parseFloat(item["緯度"]);
      const lng = parseFloat(item["経度"]);

      // 緯度経度がなければスキップ
      if (isNaN(lat) || isNaN(lng)) return;

      // アイコン切替
      const icon =
        item["種別"] === "消火栓"
          ? hydrantIcon
          : tankIcon;

      // Googleマップナビ
      const googleUrl =
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      // ポップアップ
      const popup = `
        <b>${item["種別"]}</b><br>
        ${item["所在地_連結標記"] || ""}<br>
        口径：${item["口径"] || "-"}<br>
        ID：${item["ID"] || "-"}<br><br>

        <a href="${googleUrl}" target="_blank">
          📍ここに行く
        </a>
      `;

      // マーカー追加
      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(popup);

    });

  },

  error: function(error) {

    console.error(error);

    alert(
      "CSVが読み込めません。\n" +
      "data/2115.csv を確認してください。"
    );
  }

});
