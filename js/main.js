// ======================
// 志賀町 消防水利マップ
// CSV：data/suiri.csv
// ======================

// 地図初期表示
const map = L.map("map").setView([37.006, 136.778], 11);

// 地図タイル
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// 消火栓アイコン
const hydrantIcon = L.icon({
  iconUrl: "images/hydrant.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32]
});

// 防火水槽アイコン
const tankIcon = L.icon({
  iconUrl: "images/tank.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32]
});

// マーカー範囲用
const bounds = [];

// HTMLの特殊文字対策
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// CSV読み込み
fetch("data/suiri.csv")
  .then(response => {
    if (!response.ok) {
      throw new Error("CSVファイルが見つかりません");
    }
    return response.arrayBuffer();
  })
  .then(buffer => {
    // Shift-JISのCSVを正しく読む
    const text = new TextDecoder("shift_jis").decode(buffer);

    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,

      complete: function(results) {
        console.log("CSV読込完了");
        console.log(results.data[0]);

        let markerCount = 0;

        results.data.forEach(item => {
          const lat = parseFloat(item["緯度"]);
          const lng = parseFloat(item["経度"]);

          if (isNaN(lat) || isNaN(lng)) return;

          markerCount++;

          const type = item["種別"] || "不明";
          const address = item["所在地_連結標記"] || "住所情報なし";
          const diameter = item["口径"] || "-";
          const id = item["ID"] || "-";
          const note = item["備考"] || "-";

          const icon = type.includes("防火") ? tankIcon : hydrantIcon;

          const googleUrl =
            `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

          const popupHtml = `
            <div class="popup-content">
              <div class="popup-title">${escapeHtml(type)}</div>

              <div><b>所在地</b><br>${escapeHtml(address)}</div>
              <div><b>口径</b>：${escapeHtml(diameter)}</div>
              <div><b>ID</b>：${escapeHtml(id)}</div>
              <div><b>備考</b>：${escapeHtml(note)}</div>

              <a class="nav-button"
                 href="${googleUrl}"
                 target="_blank"
                 rel="noopener">
                📍ここに行く
              </a>
            </div>
          `;

          L.marker([lat, lng], { icon })
            .addTo(map)
            .bindPopup(popupHtml);

          bounds.push([lat, lng]);
        });

        console.log("マーカー数：" + markerCount);

        if (bounds.length > 0) {
          map.fitBounds(bounds, {
            padding: [30, 30]
          });
        } else {
          alert("CSVは読めましたが、緯度・経度が見つかりませんでした。");
        }
      }
    });
  })
  .catch(error => {
    console.error("CSV読込エラー:", error);
    alert("CSVの読み込みに失敗しました。data/suiri.csv を確認してください。");
  });
