/* ==========================================================================
   minmin portfolio — キャラクターカード動的レンダリング
   Google スプレッドシート(CSV公開)からキャラデータを取得してカードを描画します。
   スプレッドシートを編集するだけで、サイト側のコードは触らずに更新できます。
   ========================================================================== */

// ここにスプレッドシートのCSVエクスポートURLを設定してください。
// スプレッドシートは「共有」→「リンクを知っている全員」→「閲覧者」にしてください。
const MANSION_CSV_URL   = "https://docs.google.com/spreadsheets/d/1vXbeThVvmCtfOaPqshAWNO1A7GCvZBjFfhI3nF1dxqc/export?format=csv&gid=1017798713";
const CARDBOARD_CSV_URL = "https://docs.google.com/spreadsheets/d/12LqU1iXwXf0axylBKSJwPSiE-kgMUMsvyxmDP7Mzjgs/export?format=csv&gid=595853336";

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

document.addEventListener("DOMContentLoaded", function () {
  loadSheet(MANSION_CSV_URL, "mansion-grid", renderMansionCard);
  loadSheet(CARDBOARD_CSV_URL, "cardboard-grid", renderCardboardCard);

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
