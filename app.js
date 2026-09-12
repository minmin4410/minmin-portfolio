/* ==========================================================================
   minmin portfolio — キャラクターカード動的レンダリング
   Google スプレッドシート(CSV公開)からキャラデータを取得してカードを描画します。
   スプレッドシートを編集するだけで、サイト側のコードは触らずに更新できます。
   ========================================================================== */

// ここにスプレッドシートのCSVエクスポートURLを設定してください。
// スプレッドシートは「共有」→「リンクを知っている全員」→「閲覧者」にしてください。
const MANSION_CSV_URL   = "https://docs.google.com/spreadsheets/d/1KFMQ2Wv7swnI_HQjVnb-ksLniNAE3HRUCz0yhNjQj38/export?format=csv&gid=1202227494";
const CARDBOARD_CSV_URL = "https://docs.google.com/spreadsheets/d/1dJ6bEnD_sJxv84rOCOv9qhjszs9I6tal0veM1pIZ3-0/export?format=csv&gid=1352463638";

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function padNum(n) {
  return String(n).padStart(3, "0");
}

function renderMansionCard(row) {
  const idx = parseInt(row["表示順"], 10);
  const num = padNum(idx);
  const img = (row["画像ファイル名"] || (num + ".jpg")).trim();
  const name = (row["キャラ名"] || "").trim();
  const account = (row["Xアカウント"] || "").trim();
  const status = (row["権利ステータス"] || "").trim();
  const url = (row["ダウンロードURL"] || "").trim();

  let tags = "";
  if (status === "NSFW") {
    tags = '<div class="cs-tags"><span class="cs-tag nsfw">NSFW</span></div>';
  } else if (url) {
    tags = `<div class="cs-tags"><a class="cs-tag cs-download" href="${escapeHtml(url)}" target="_blank" rel="noopener">⬇ ダウンロード</a></div>`;
  }
  const accountHtml = account ? `<div class="cs-account">${escapeHtml(account)}</div>` : "";

  return `<div class="charsheet-card"><img src="images/mansion/${encodeURIComponent(img)}" alt="${escapeHtml(name)}" loading="lazy"><div class="cs-name"><span class="cs-num">${num}号室</span>${escapeHtml(name)}</div>${accountHtml}${tags}</div>`;
}

function renderCardboardCard(row) {
  const idx = parseInt(row["表示順"], 10);
  const num = padNum(idx);
  const img = (row["画像ファイル名"] || (num + ".jpg")).trim();
  const name = (row["キャラ名"] || "").trim();
  const account = (row["Xアカウント"] || "").trim();
  const status = (row["権利ステータス"] || "").trim();
  const url = (row["ダウンロードURL"] || "").trim();

  let tag = "";
  if (status === "NSFW") {
    tag = '<span class="resident-tag nsfw">NSFW</span>';
  } else if (url) {
    tag = `<a class="resident-tag cb-download" href="${escapeHtml(url)}" target="_blank" rel="noopener">⬇ ダウンロード</a>`;
  }
  const accountHtml = account ? `<div class="cb-account">${escapeHtml(account)}</div>` : "";

  return `<div class="cardboard-card"><div class="cb-media"><img src="images/cardboard/${encodeURIComponent(img)}" alt="${escapeHtml(name)}" loading="lazy"></div><div class="cb-name"><span class="cb-num">No.${num}</span>${escapeHtml(name)}</div>${accountHtml}${tag}</div>`;
}

function loadSheet(url, containerId, renderFn) {
  const container = document.getElementById(containerId);
  if (!container) return;

  Papa.parse(url, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const rows = (results.data || []).filter((r) => r["表示順"] && String(r["表示順"]).trim() !== "");
      rows.sort((a, b) => parseInt(a["表示順"], 10) - parseInt(b["表示順"], 10));
      if (rows.length === 0) {
        container.innerHTML = '<p class="cs-loading">キャラクターデータが見つかりませんでした。スプレッドシートの共有設定をご確認ください。</p>';
        return;
      }
      container.innerHTML = rows.map(renderFn).join("");
    },
    error: function (err) {
      console.error("シート読み込みエラー:", err);
      container.innerHTML = '<p class="cs-loading">キャラクターデータの読み込みに失敗しました。しばらくしてから再度お試しください。</p>';
    },
  });
}

function loadAnnouncement() {
  var banner = document.getElementById("announcementBanner");
  var textEl = document.getElementById("announcementText");
  var closeBtn = document.getElementById("announcementClose");
  if (!banner || !textEl) return;

  fetch("announcement.json", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("announcement.json not found");
      return res.json();
    })
    .then(function (data) {
      if (!data || !data.enabled || !data.text) return;

      var dismissKey = "minmin_announcement_dismissed_" + (data.text + "|" + (data.linkUrl || "")).length + "_" + encodeURIComponent(data.text).slice(0, 40);
      if (sessionStorage.getItem(dismissKey) === "1") return;

      var html = escapeHtml(data.text);
      if (data.linkUrl) {
        html += ' <a href="' + escapeHtml(data.linkUrl) + '" target="_blank" rel="noopener">' + escapeHtml(data.linkLabel || "詳しくはこちら") + "</a>";
      }
      textEl.innerHTML = html;
      banner.style.display = "block";

      if (closeBtn) {
        closeBtn.addEventListener("click", function () {
          banner.style.display = "none";
          sessionStorage.setItem(dismissKey, "1");
        });
      }
    })
    .catch(function () {
      /* announcement.json がない/読み込めない場合は何もしない */
    });
}

function setupCursorPicker() {
  var picks = document.querySelectorAll(".cursor-pick");
  if (!picks.length) return;

  // ページ内のクリック可能要素(リンク/ボタンなど)。ここに乗ったらカーソルの縁を光らせる。
  var CLICKABLE_SELECTOR = 'a, button, [role="button"], input[type="submit"], input[type="button"], label, summary';

  var follower = document.createElement("img");
  follower.className = "custom-cursor-follower";
  follower.alt = "";
  document.body.appendChild(follower);

  var hotspot = { x: 0, y: 0 };
  var hasFinePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  var tracking = false;
  var sizeMultiplier = 1;

  function updateFollowerSize() {
    if (follower.naturalWidth) {
      follower.style.width = follower.naturalWidth * sizeMultiplier + "px";
      follower.style.height = follower.naturalHeight * sizeMultiplier + "px";
    }
  }
  follower.addEventListener("load", updateFollowerSize);

  function moveFollower(e) {
    follower.style.transform =
      "translate(" + (e.clientX - hotspot.x * sizeMultiplier) + "px," + (e.clientY - hotspot.y * sizeMultiplier) + "px)";
  }

  function isHoverable(target) {
    if (!target || !target.closest) return false;
    var el = target.closest(CLICKABLE_SELECTOR);
    return !!(el && !el.closest(".cursor-picker"));
  }

  function onOver(e) {
    if (isHoverable(e.target)) follower.classList.add("hovering");
  }
  function onOut(e) {
    if (isHoverable(e.target)) follower.classList.remove("hovering");
  }

  function startTracking() {
    if (tracking) return;
    document.addEventListener("mousemove", moveFollower);
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    tracking = true;
  }
  function stopTracking() {
    if (!tracking) return;
    document.removeEventListener("mousemove", moveFollower);
    document.removeEventListener("mouseover", onOver);
    document.removeEventListener("mouseout", onOut);
    tracking = false;
  }

  function applyCursor(btn) {
    picks.forEach(function (b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");
    var url = btn.getAttribute("data-cursor");
    if (!url || url === "none") {
      document.documentElement.classList.remove("custom-cursor-active");
      follower.style.display = "none";
      follower.classList.remove("hovering");
      stopTracking();
    } else {
      hotspot.x = parseInt(btn.getAttribute("data-hx") || "0", 10);
      hotspot.y = parseInt(btn.getAttribute("data-hy") || "0", 10);
      follower.src = url;
      follower.style.display = "block";
      document.documentElement.classList.add("custom-cursor-active");
      startTracking();
    }
  }

  picks.forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyCursor(btn);
    });
  });

  // カーソルサイズ切替(小/大)
  var sizeButtons = document.querySelectorAll(".cursor-size-btn");
  sizeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      sizeButtons.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      sizeMultiplier = btn.getAttribute("data-size") === "large" ? 2 : 1;
      updateFollowerSize();
    });
  });

  // 初期表示: マウス操作の環境でのみキャラクターの中からランダムに選択(見つからなければメロモンタ、それも無ければ「なし」)
  var charPicks = Array.prototype.filter.call(picks, function (b) {
    var c = b.getAttribute("data-cursor");
    return c && c !== "none";
  });
  var initial = null;
  if (hasFinePointer) {
    if (charPicks.length > 0) {
      initial = charPicks[Math.floor(Math.random() * charPicks.length)];
    }
    if (!initial) {
      initial = document.querySelector('.cursor-pick[data-cursor*="meromonta"]');
    }
  }
  if (!initial) {
    initial = picks[0];
  }
  applyCursor(initial);
}

document.addEventListener("DOMContentLoaded", function () {
  loadAnnouncement();
  loadSheet(MANSION_CSV_URL, "mansion-grid", renderMansionCard);
  loadSheet(CARDBOARD_CSV_URL, "cardboard-grid", renderCardboardCard);
  setupCursorPicker();

  // スクロールプログレスバー
  var bar = document.getElementById("scrollProgressBar");
  if (bar) {
    function updateProgress() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + "%";
    }
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }
});
