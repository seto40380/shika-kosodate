// ======================
// 志賀町 消防水利マップ
// ======================

// 地図初期表示（志賀町役場付近）
const map = L.map("map").setView([37.006, 136.778], 11);

// OpenStreetMap
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
  iconUrl: "images/hydrant.svg",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32]
});

const tankIcon = L.icon({
  iconUrl: "images/tank.svg",
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

  complete: function (results) {

    console.log("CSV読込完了");

    const data = results.data;

    let markerCount = 0;

    data.forEach(item => {

      // 緯度経度取得
      const lat = parseFloat(item["緯度"]);
      const lng = parseFloat(item["経度"]);

      // 緯度経度がなければスキップ
      if (isNaN(lat) || isNaN(lng)) return;

      markerCount++;

      // 種別取得
      const type = item["種別"] || "不明";

      // アイコン切替
      let icon;

      if (type.includes("防火")) {
        icon = tankIcon;
      } else {
        icon = hydrantIcon;
      }

      // 住所
      const address =
        item["所在地_連結標記"] || "住所情報なし";

      // 口径
      const diameter =
        item["口径"] || "-";

      // 備考
      const note =
        item["備考"] || "-";

      // Googleマップナビ
      const googleUrl =
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      // ポップアップ
      const popupHtml = `
        <div class="popup-content">

          <div class="popup-title">
            ${type}
          </div>

          <div class="popup-info">
            <b>所在地</b><br>
            ${address}
          </div>

          <div class="popup-info">
            <b>口径</b>：${diameter}
          </div>

          <div class="popup-info">
            <b>ID</b>：${item["ID"] || "-"}
          </div>

          <div class="popup-info">
            <b>備考</b>：${note}
          </div>

          <a
            class="nav-button"
            href="${googleUrl}"
            target="_blank">

            📍 ここに行く

          </a>

        </div>
      `;

      // マーカー追加
      L.marker([lat, lng], {
        icon: icon
      })
        .addTo(map)
        .bindPopup(popupHtml);

    });

    console.log(`マーカー数：${markerCount}件`);

  },

  error: function (error) {

    console.error("CSV読込エラー", error);

    alert(
      "消防水利データの読み込みに失敗しました。\n" +
      "data/suiri.csv が存在するか確認してください。"
    );

  }

});
