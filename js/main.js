const map = L.map("map").setView([37.006, 136.778], 11);

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    attribution: "© OpenStreetMap contributors"
  }
).addTo(map);

const hydrantIcon = L.icon({
  iconUrl: "images/hydrant.png",
  iconSize: [35, 35]
});

const tankIcon = L.icon({
  iconUrl: "images/tank.png",
  iconSize: [35, 35]
});

Papa.parse("data/2115.csv", {

  download: true,

  header: true,

  complete: function(results) {

    results.data.forEach(item => {

      const lat = Number(item["緯度"]);
      const lng = Number(item["経度"]);

      if (!lat || !lng) return;

      let icon;

      if (item["種別"] === "消火栓") {
        icon = hydrantIcon;
      } else {
        icon = tankIcon;
      }

      const googleUrl =
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

      L.marker([lat, lng], { icon: icon })
        .addTo(map)
        .bindPopup(`
          <b>${item["種別"]}</b><br>
          ${item["所在地_連結標記"]}<br>
          口径：${item["口径"] || "-"}<br><br>

          <a href="${googleUrl}"
             target="_blank">
             ここに行く
          </a>
        `);
    });
  }
});
