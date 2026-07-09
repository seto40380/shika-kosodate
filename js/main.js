// ======================
// 志賀町 消防水利マップ
// ======================

// 地図初期表示（志賀町役場付近）
const map = L.map("map").setView([37.006, 136.778], 11);

// 地図タイル
L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }
).addTo(map);

// ======================
// アイコン設定
// ======================

const hydrantIcon = L.icon({
  iconUrl: "images/hydrant.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32]
});

const tankIcon = L.icon({
  iconUrl: "images/tank.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32]
});

// ======================
// CSV読み込み
// ======================

Papa.parse("data/suiri.csv", {

  download: true,

  header: true,

  skipEmptyLines: true,

  encoding: "Shift_JIS",

  complete: function (results) {

    console.log("CSV読込完了");

    results.data.forEach(item => {

      const lat = parseFloat(item["緯度"]);
      const lng = parseFloat(item["経度"]);

      // 緯度経度がなければスキップ
      if (isNaN(lat) || isNaN(lng)) return;

      const type = item["種別"] || "不明";

      const icon =
        type === "消火栓"
          ? hydrantIcon
          : tankIcon;

      const address =
        item["所在地_連結標記"] || "住所情報なし";

      const diameter =
        item["口径"] || "-";

      const note =
        item["備考"] || "-";

      const googleUrl =
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      const popupHtml = `
        <div class="popup-content">

          <div class="popup-title">
            ${type}
          </div>

          <div><b>所在地</b><br>${address}</div>

          <div><b>口径</b>：${diameter}</div>

          <div><b>ID</b>：${item["ID"] || "-"}</div>

          <div><b>備考</b>：${note}</div>

          <a class="nav-button"
             href="${googleUrl}"
             target="_blank">

             📍ここに行く

          </a>

        </div>
      `;

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(popupHtml);

    });

  },

  error: function(error) {

    console.error("CSV読込エラー", error);

    alert(
      "CSVの読み込みに失敗しました。\n" +
      "data/suiri.csv を確認してください。"
    );
  }

});
