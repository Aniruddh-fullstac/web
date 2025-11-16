(function () {
  const dscc = window.dscc;

  const PLATFORM_ORDER = ["Facebook", "Instagram", "Youtube"];

  function formatNumber(value) {
    if (value == null || isNaN(value)) return "-";
    const num = Number(value);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  }

  function buildRoot() {
    const root = document.createElement("div");
    root.id = "fevicryl-dashboard-root";
    root.style.fontFamily =
      'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    root.style.background = "#020617";
    root.style.color = "#e5e7eb";
    root.style.padding = "12px";
    root.style.boxSizing = "border-box";
    root.style.height = "100%";
    root.style.display = "flex";
    root.style.flexDirection = "column";
    root.style.gap = "12px";
    document.body.innerHTML = "";
    document.body.appendChild(root);
    return root;
  }

  function render(data, config) {
    const root =
      document.getElementById("fevicryl-dashboard-root") || buildRoot();
    root.innerHTML = "";

    const table = data.tables.main;
    if (!table || !table.rows || !table.rows.length) {
      root.innerHTML =
        "<div style='font-size:12px;color:#9ca3af'>No data.</div>";
      return;
    }

    const fields = {};
    table.fields.forEach((f) => {
      fields[f.id] = f.name;
    });

    const dimPlatform = fields.platform;
    const dimDate = fields.date;
    const mFollowers = fields.followers;
    const mImpressions = fields.impressions;
    const mReach = fields.reach;
    const mEngagementRate = fields.engagementRate;
    const mVideoViews = fields.videoViews;
    const mLikes = fields.likes;
    const mComments = fields.comments;
    const mShares = fields.shares;
    const mSaves = fields.saves;

    const agg = {};
    table.rows.forEach((row) => {
      const r = row;
      const platform = (r[dimPlatform] || "Unknown").toString();
      if (!agg[platform]) {
        agg[platform] = {
          platform,
          followers: 0,
          impressions: 0,
          reach: 0,
          engagementRateSum: 0,
          engagementRateCount: 0,
          videoViews: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          saves: 0,
        };
      }
      const target = agg[platform];

      function addMetric(fieldName, key) {
        if (!fieldName) return;
        const v = parseFloat(r[fieldName]);
        if (!isNaN(v)) target[key] += v;
      }

      addMetric(mFollowers, "followers");
      addMetric(mImpressions, "impressions");
      addMetric(mReach, "reach");
      addMetric(mVideoViews, "videoViews");
      addMetric(mLikes, "likes");
      addMetric(mComments, "comments");
      addMetric(mShares, "shares");
      addMetric(mSaves, "saves");

      if (mEngagementRate) {
        const er = parseFloat(r[mEngagementRate]);
        if (!isNaN(er)) {
          target.engagementRateSum += er;
          target.engagementRateCount += 1;
        }
      }
    });

    Object.values(agg).forEach((p) => {
      if (p.engagementRateCount > 0) {
        p.engagementRate =
          p.engagementRateSum / Math.max(1, p.engagementRateCount);
      } else {
        p.engagementRate = null;
      }
    });

    const platforms = PLATFORM_ORDER.filter((p) => agg[p]).map(
      (p) => agg[p],
    );
    if (!platforms.length) {
      platforms.push(
        ...Object.values(agg).sort((a, b) =>
          a.platform.localeCompare(b.platform),
        ),
      );
    }

    let activePlatform = platforms[0]?.platform || "Facebook";

    const colors = {
      Facebook:
        (config.style?.tabColors_facebookColor &&
          config.style.tabColors_facebookColor.value) ||
        "#1877F2",
      Instagram:
        (config.style?.tabColors_instagramColor &&
          config.style.tabColors_instagramColor.value) ||
        "#E1306C",
      Youtube:
        (config.style?.tabColors_youtubeColor &&
          config.style.tabColors_youtubeColor.value) ||
        "#FF0000",
    };

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.gap = "12px";

    const title = document.createElement("div");
    title.innerHTML =
      "<div style='font-size:14px;font-weight:600;color:#f9fafb'>Fevicryl Social Dashboard</div><div style='font-size:11px;color:#9ca3af'>Click a platform to see its view. Below is a combined comparison.</div>";
    header.appendChild(title);

    const tabs = document.createElement("div");
    tabs.style.display = "flex";
    tabs.style.gap = "8px";

    function renderTabs() {
      tabs.innerHTML = "";
      PLATFORM_ORDER.forEach((p) => {
        if (!agg[p]) return;
        const btn = document.createElement("button");
        btn.textContent = p;
        btn.style.borderRadius = "999px";
        btn.style.fontSize = "11px";
        btn.style.padding = "6px 12px";
        btn.style.border = "1px solid #27272a";
        btn.style.cursor = "pointer";
        btn.style.background =
          activePlatform === p ? colors[p] || "#22c55e" : "transparent";
        btn.style.color = activePlatform === p ? "#020617" : "#e5e7eb";
        btn.onclick = () => {
          activePlatform = p;
          renderBody();
          renderTabs();
        };
        tabs.appendChild(btn);
      });
    }

    renderTabs();
    header.appendChild(tabs);
    root.appendChild(header);

    const body = document.createElement("div");
    body.style.display = "flex";
    body.style.flexDirection = "column";
    body.style.gap = "12px";
    root.appendChild(body);

    function renderBody() {
      body.innerHTML = "";

      const activeData = agg[activePlatform];

      const cardRow = document.createElement("div");
      cardRow.style.display = "grid";
      cardRow.style.gridTemplateColumns = "repeat(5, minmax(0, 1fr))";
      cardRow.style.gap = "8px";

      function addCard(label, value) {
        const card = document.createElement("div");
        card.style.border = "1px solid #27272a";
        card.style.borderRadius = "10px";
        card.style.padding = "6px 8px";
        card.style.background = "#020617";
        const l = document.createElement("div");
        l.textContent = label;
        l.style.fontSize = "10px";
        l.style.color = "#9ca3af";
        const v = document.createElement("div");
        v.textContent = formatNumber(value);
        v.style.fontSize = "14px";
        v.style.fontWeight = "600";
        v.style.color = "#f9fafb";
        card.appendChild(l);
        card.appendChild(v);
        cardRow.appendChild(card);
      }

      if (activeData) {
        addCard("Followers", activeData.followers);
        addCard("Impressions", activeData.impressions);
        addCard("Reach", activeData.reach);
        addCard("Engagement Rate", activeData.engagementRate);
        addCard("Video Views", activeData.videoViews);
      }

      body.appendChild(cardRow);

      const comparison = document.createElement("div");
      comparison.style.border = "1px solid #27272a";
      comparison.style.borderRadius = "10px";
      comparison.style.padding = "8px";
      comparison.style.background = "#020617";

      const compTitle = document.createElement("div");
      compTitle.textContent = "Platform comparison (all 3)";
      compTitle.style.fontSize = "11px";
      compTitle.style.fontWeight = "600";
      compTitle.style.marginBottom = "6px";
      comparison.appendChild(compTitle);

      const metrics = ["followers", "impressions", "reach", "videoViews"];
      const metricLabels = {
        followers: "Followers",
        impressions: "Impressions",
        reach: "Reach",
        videoViews: "Video Views",
      };

      metrics.forEach((metric) => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.flexDirection = "column";
        row.style.marginBottom = "6px";

        const label = document.createElement("div");
        label.textContent = metricLabels[metric];
        label.style.fontSize = "10px";
        label.style.color = "#9ca3af";
        label.style.marginBottom = "2px";
        row.appendChild(label);

        const maxVal = Math.max(
          ...platforms.map((p) => Math.max(1, p[metric] || 0)),
        );

        platforms.forEach((p) => {
          const barRow = document.createElement("div");
          barRow.style.display = "flex";
          barRow.style.alignItems = "center";
          barRow.style.gap = "6px";
          barRow.style.marginBottom = "2px";

          const name = document.createElement("div");
          name.textContent = p.platform;
          name.style.fontSize = "10px";
          name.style.width = "60px";

          const barOuter = document.createElement("div");
          barOuter.style.flex = "1";
          barOuter.style.height = "6px";
          barOuter.style.borderRadius = "999px";
          barOuter.style.background = "#111827";

          const barInner = document.createElement("div");
          barInner.style.height = "100%";
          barInner.style.borderRadius = "999px";
          const color =
            colors[p.platform] || "#22c55e";
          barInner.style.background = color;
          const ratio = Math.max(0, Math.min(1, (p[metric] || 0) / maxVal));
          barInner.style.width = `${ratio * 100}%`;
          barOuter.appendChild(barInner);

          const val = document.createElement("div");
          val.textContent = formatNumber(p[metric]);
          val.style.fontSize = "10px";
          val.style.width = "60px";
          val.style.textAlign = "right";

          barRow.appendChild(name);
          barRow.appendChild(barOuter);
          barRow.appendChild(val);
          row.appendChild(barRow);
        });

        comparison.appendChild(row);
      });

      body.appendChild(comparison);
    }

    renderBody();
  }

  dscc.subscribeToData(render, { transform: dscc.tableTransform });
})();


