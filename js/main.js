// ======================
// 志賀町 消防水利マップ
// CSV：data/suiri.csv
// 列名自動判定版
// ======================

const map = L.map("map").setView([37.006, 136.778], 11);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

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

function cleanKey(key) {
  return String(key || "")
    .replace(/^\uFEFF/, "")
    .replace(/\s/g, "")
    .trim();
}

function cleanRow(row) {
  const newRow = {};
  Object.keys(row).forEach(key => {
    newRow[cleanKey(key)] = row[key];
  });
  return newRow;
}

function findColumn(columns, candidates) {
  for (const candidate of candidates) {
    const found = columns.find(col => cleanKey(col).includes(candidate));
    if (found) return cleanKey(found);
  }
  return null;
}

function parseCsvText(text) {
  return Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  });
}

function tryParse(buffer, encoding) {
  const text = new TextDecoder(encoding).decode(buffer);
  const parsed = parseCsvText(text);
  const rows = parsed.data.map(cleanRow);
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { rows, columns, encoding };
}

fetch("data/suiri.csv")
  .then(response => {
    if (!response.ok) {
      throw new Error("data/suiri.csv が見つかりません");
    }
    return response.arrayBuffer();
  })
  .then(buffer => {
    let resultUtf8 = tryParse(buffer, "utf-8");
    let resultSjis = tryParse(buffer, "shift_jis");

    let result;

    const utf8HasLatLng =
      resultUtf8.columns.some(c => c.includes("緯度")) &&
      resultUtf8.columns.some(c => c.includes("経度"));

    const sjisHasLatLng =
      resultSjis.columns.some(c => c.includes("緯度")) &&
      resultSjis.columns.some(c => c.includes("経度"));

    if (utf8HasLatLng) {
      result = resultUtf8;
    } else if (sjisHasLatLng) {
      result = resultSjis;
    } else {
      result = resultUtf8;
    }

    const rows = result.rows;
    const columns = result.columns;

    console.log("使用文字コード:", result.encoding);
    console.log("列名:", columns);
    console.log("先頭データ:", rows[0]);

    const latCol = findColumn(columns, ["緯度", "lat", "latitude"]);
    const lngCol = findColumn(columns, ["経度", "lng", "lon", "longitude"]);

    const typeCol = findColumn(columns, ["種別", "水利種別"]);
    const addressCol = findColumn(columns, ["所在地_連結標記", "所在地", "住所"]);
    const diameterCol = findColumn(columns, ["口径"]);
    const idCol = findColumn(columns, ["ID", "id"]);
    const noteCol = findColumn(columns, ["備考"]);

    if (!latCol || !lngCol) {
      setStatus(
        "緯度・経度の列が見つかりません。<br><br>" +
        "列名：<br>" +
        columns.join("<br>")
      );
      return;
    }

    let markerCount = 0;
    const bounds = [];

    rows.forEach(item => {
      const lat = parseFloat(item[latCol]);
      const lng = parseFloat(item[lngCol]);

      if (isNaN(lat) || isNaN(lng)) return;

      markerCount++;

      const type = typeCol ? item[typeCol] || "不明" : "不明";
      const address = addressCol ? item[addressCol] || "住所情報なし" : "住所情報なし";
      const diameter = diameterCol ? item[diameterCol] || "-" : "-";
      const id = idCol ? item[idCol] || "-" : "-";
      const note = noteCol ? item[noteCol] || "-" : "-";

      const icon = String(type).includes("防火") ? tankIcon : hydrantIcon;

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
        `文字コード：${result.encoding}<br>` +
        `マーカー数：${markerCount}件`
      );

      map.fitBounds(bounds, {
        padding: [30, 30]
      });
    } else {
      setStatus(
        `CSVは読めたけどマーカー0件<br>` +
        `緯度列：${latCol}<br>` +
        `経度列：${lngCol}<br><br>` +
        `列名：<br>${columns.join("<br>")}`
      );
    }
  })
  .catch(error => {
    console.error(error);
    setStatus("エラー：" + error.message);
    alert(error.message);
  });
