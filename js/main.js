// ======================
// 志賀町 消防水利マップ
// CSV：data/suiri.csv
// UTF-8 / Shift-JIS 自動対応版
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

// 状態表示
const statusBox = L.control({ position: "topright" });

statusBox.onAdd = function () {
  const div = L.DomUtil.create("div", "status-box");
  div.id = "statusBox";
  div.innerHTML = "CSV読込中...";
  div.style.background = "white";
  div.style.padding = "10px";
  div.style.borderRadius = "8px";
  div.style.boxShadow = "0 2px 8px rgba(0,0,0,.25)";
  div.style.fontSize = "13px";
  div.style.maxWidth = "280px";
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

// CSVを解析する関数
function parseCsvText(text) {
  return Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  });
}

// 必要な列があるか確認
function hasLatLng(parsed) {
  if (!parsed.data || parsed.data.length === 0) return false;

  const first = parsed.data[0];
  const keys = Object.keys(first);

  return keys.includes("緯度") && keys.includes("経度");
}

// CSV読込
fetch("data/suiri.csv")
  .then(response => {
    if (!response.ok) {
      throw new Error("data/suiri.csv が見つかりません");
    }
    return response.arrayBuffer();
  })
  .then(buffer => {
    // まずUTF-8で読む
    const utf8Text = new TextDecoder("utf-8").decode(buffer);
    const utf8Parsed = parseCsvText(utf8Text);

    let parsed;
    let encodingName;

    if (hasLatLng(utf8Parsed)) {
      parsed = utf8Parsed;
      encodingName = "UTF-8";
    } else {
      // ダメならShift-JISで読む
      const sjisText = new TextDecoder("shift_jis").decode(buffer);
      const sjisParsed = parseCsvText(sjisText);

      parsed = sjisParsed;
      encodingName = "Shift-JIS";
    }

    const data = parsed.data;
    const first = data[0] || {};
    const columns = Object.keys(first);

    console.log("使用文字コード:", encodingName);
    console.log("CSV列名:", columns);
    console.log("先頭データ:", first);

    let markerCount = 0;
    const bounds = [];

    data.forEach(item => {
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

    if (markerCount > 0) {
      setStatus(
        `CSV読込成功<br>` +
        `文字コード：${encodingName}<br>` +
        `マーカー数：${markerCount}件`
      );

      map.fitBounds(bounds, {
        padding: [30, 30]
      });
    } else {
      setStatus(
        `CSVは読めたけどマーカー0件<br>` +
        `文字コード：${encodingName}<br><br>` +
        `列名：<br>${columns.join("<br>")}`
      );
    }
  })
  .catch(error => {
    console.error("CSV読込エラー:", error);
    setStatus("エラー：" + error.message);
    alert(error.message);
  });
