// ======================
// 志賀町 消防水利マップ
// data/suiri.csv
// CSVの列順で読む確実版
// ======================

const map = L.map("map").setView([37.06, 136.78], 11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// 消火栓アイコン// ======================
// 志賀町 消防水利マップ
// CSV：data/suiri.csv
// ======================

// 初期表示：志賀町役場付近 / zoom=9
const map = L.map("map").setView([37.006, 136.778], 9);

// 地図タイル
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// 消火栓アイコン（透過SVG）
const hydrantIcon = L.icon({
  iconUrl: "images/hydrant.svg",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18]
});

// 防火水槽アイコン（透過SVG）
const tankIcon = L.icon({
  iconUrl: "images/tank.svg",
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18]
});

// HTML特殊文字対策
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
Papa.parse("data/suiri.csv", {
  download: true,
  header: false,
  skipEmptyLines: true,

  complete: function (results) {
    const rows = results.data;

    rows.forEach(function (row, index) {
      // 1行目が見出しなら飛ばす
      if (index === 0 && String(row[12]).includes("緯度")) {
        return;
      }

      // CSVの列順で取得
      const id = row[1];
      const type = row[4];
      const address = row[6];
      const lat = Number(row[12]);
      const lng = Number(row[13]);
      const diameter = row[14];
      const note = row[15];

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
      }

      const icon = String(type).includes("防火")
        ? tankIcon
        : hydrantIcon;

      const googleUrl =
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      const popupHtml = `
        <div class="popup-content">
          <div class="popup-title">${escapeHtml(type)}</div>

          <div>
            <b>所在地</b><br>
            ${escapeHtml(address)}
          </div>

          <div><b>口径</b>：${escapeHtml(diameter || "-")}</div>
          <div><b>ID</b>：${escapeHtml(id || "-")}</div>
          <div><b>備考</b>：${escapeHtml(note || "-")}</div>

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
    });
  },

  error: function (error) {
    console.error("CSV読込エラー", error);
  }
});
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

// 右上の状態表示
const statusBox = L.control({ position: "topright" });

statusBox.onAdd = function () {
  const div = L.DomUtil.create("div", "status-box");
  div.id = "statusBox";
  div.style.background = "white";
  div.style.padding = "10px";
  div.style.borderRadius = "8px";
  div.style.boxShadow = "0 2px 8px rgba(0,0,0,.25)";
  div.style.fontSize = "13px";
  div.style.maxWidth = "300px";
  div.innerHTML = "CSV読込中...";
  return div;
};

statusBox.addTo(map);

function setStatus(message) {
  const box = document.getElementById("statusBox");
  if (box) box.innerHTML = message;
}

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
Papa.parse("data/suiri.csv", {
  download: true,
  header: false,
  skipEmptyLines: true,

  complete: function (results) {
    const rows = results.data;

    let markerCount = 0;
    const bounds = [];

    rows.forEach(function (row, index) {

      // 1行目が見出し行なら飛ばす
      if (index === 0 && row[12] === "緯度") {
        return;
      }

      // CSVの列順で取得
      const code = row[0];
      const id = row[1];
      const type = row[4];
      const address = row[6];
      const lat = Number(row[12]); // 緯度
      const lng = Number(row[13]); // 経度
      const diameter = row[14];
      const note = row[15];

      // 緯度・経度が数字でなければ飛ばす
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return;
      }

      markerCount++;
      bounds.push([lat, lng]);

      const icon = String(type).includes("防火")
        ? tankIcon
        : hydrantIcon;

      const googleUrl =
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      const popupHtml = `
        <div class="popup-content">
          <div class="popup-title">${escapeHtml(type)}</div>

          <div>
            <b>所在地</b><br>
            ${escapeHtml(address)}
          </div>

          <div><b>口径</b>：${escapeHtml(diameter || "-")}</div>
          <div><b>ID</b>：${escapeHtml(id || "-")}</div>
          <div><b>備考</b>：${escapeHtml(note || "-")}</div>

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
    });

    if (markerCount > 0) {
      setStatus(
        `CSV読込成功<br>` +
        `マーカー数：${markerCount}件`
      );

      map.fitBounds(bounds, {
        padding: [30, 30]
      });
    } else {
      setStatus(
        `CSVは読めたけどマーカー0件<br><br>` +
        `12列目：緯度<br>` +
        `13列目：経度<br>` +
        `として読み取り中`
      );
    }

    console.log("CSV行数", rows.length);
    console.log("マーカー数", markerCount);
    console.log("先頭行", rows[0]);
    console.log("2行目", rows[1]);
  },

  error: function (error) {
    console.error("CSV読込エラー", error);
    setStatus("CSV読込エラー");
    alert("data/suiri.csv が読み込めません。");
  }
});
