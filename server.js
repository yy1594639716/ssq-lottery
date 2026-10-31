/* ============================================================
   双色球联网版 · 后端代理
   - 抓取 500彩票网/中彩网 开奖数据，多源 fallback
   - 输出：静态快照 ssq-data.json + 增量接口 /api/ssq
   - 数据校验：期号/红球6个不重复(1-33)/蓝球(1-16)
   部署：Vercel / Netlify Functions / 任意 Node 环境
   ============================================================ */
'use strict';
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const RED_MAX = 33, BLUE_MAX = 16, RED_CNT = 6;
const DATA_FILE = path.join(__dirname, 'ssq-data.json');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function log(...a){ console.log('[ssq]', new Date().toISOString(), ...a); }

/* ---------- 通用抓取 ---------- */
function fetch(url, opt = {}) {
  return new Promise((res, rej) => {
    const lib = url.startsWith('https') ? https : http;
    const o = { headers: { 'User-Agent': UA, 'Accept': 'application/json,text/html,*/*' }, timeout: 8000, ...opt };
    lib.get(url, o, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        return fetch(new URL(r.headers.location, url).toString(), opt).then(res, rej);
      }
      let b = ''; r.setEncoding('utf8'); r.on('data', c => b += c); r.on('end', () => res(b));
    }).on('error', rej).on('timeout', () => rej(new Error('timeout')));
  });
}

/* ---------- 数据校验 ---------- */
function valid(d) {
  if (!d || typeof d !== 'object') return null;
  const issue = String(d.issue || '').trim();
  if (!/^20\d{5}$/.test(issue)) return null;
  const red = Array.isArray(d.red) ? d.red.map(String) : [];
  const blue = String(d.blue || '').trim();
  if (red.length !== RED_CNT) return null;
  const rn = red.map(Number);
  if ((new Set(rn)).size !== RED_CNT) return null;
  if (rn.some(n => !(n >= 1 && n <= RED_MAX))) return null;
  const bn = +blue;
  if (!(bn >= 1 && bn <= BLUE_MAX)) return null;
  return { issue, date: d.date || '', red: rn.map(n => String(n).padStart(2, '0')), blue: String(bn).padStart(2, '0') };
}

/* ============================================================
   数据源 1：500彩票网 datachart（最稳定，含完整历史）
   ============================================================ */
async function src500() {
  // 每期详情页，按顺序拉取，支持增量
  const out = [];
  // 先拿最新一期列表页确定上限
  const listUrl = 'https://datachart.500.com/ssq/history/newinc/history.php?limit=10&sort=0';
  const html = await fetch(listUrl);
  const issues = [...html.matchAll(/<td><a href="\S+history\S+issue=(\d{7})/g)].map(m => m[1]);
  if (!issues.length) throw new Error('500 list empty');
  log('500彩票 最新期号候选:', issues.slice(0, 3));
  // 拉最近 30 期详情
  for (const issue of issues.slice(0, 30)) {
    try {
      const u = `https://datachart.500.com/ssq/history/history.shtml?issue=${issue}`;
      const h = await fetch(u);
      const m = h.match(/<table class="kj_tablelist02">([\s\S]*?)<\/table>/);
      if (!m) continue;
      const row = m[1];
      const issueM = row.match(/<td(?: class="td_title01")?>(\d{7})</);
      const ballM = row.match(/<li class="ball_red">(\d+)<\/li>/g);
      const blueM = row.match(/<li class="ball_blue">(\d+)<\/li>/);
      if (!issueM || !ballM || ballM.length !== RED_CNT || !blueM) continue;
      out.push(valid({ issue: issueM[1], red: ballM.map(x => x.match(/(\d+)/)[1]), blue: blueM[1] }));
    } catch (e) { /* 跳过单期 */ }
  }
  return out.filter(Boolean);
}

/* ============================================================
   数据源 2：中彩网历史接口（备用）
   ============================================================ */
async function srcZhcw() {
  const out = [];
  try {
    const json = await fetch('https://www.zhcw.com/inc/ssq/ssq_wqhgk.xml', { timeout: 6000 });
    // zhcw 返回 XML，解析期号与红球蓝球
    const rows = [...json.matchAll(/<row\s+([^>]+)\/>/g)].map(m => m[1]);
    for (const r of rows.slice(0, 30)) {
      const issue = (r.match(/issue="(\d{7})"/) || [])[1];
      const red = [...r.matchAll(/r(\d+)="(\d+)"/g)].map(m => m[2]);
      const blue = (r.match(/b1="(\d+)"/) || [])[1];
      const d = valid({ issue, red, blue });
      if (d) out.push(d);
    }
  } catch (e) { log('zhcw failed', e.message); }
  return out;
}

/* ============================================================
   合并入库（幂等，远程优先）
   ============================================================ */
function loadDB() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { return []; }
}
function saveDB(arr) { fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2)); }
async function update(force = false) {
  let list = loadDB();
  const map = new Map(list.map(d => [d.issue, d]));
  let fresh = [];
  const errs = [];
  for (const src of [src500, srcZhcw]) {
    try { const r = await src(); if (r.length) { fresh = r; break; } } catch (e) { errs.push(src.name + ':' + e.message); }
  }
  if (!fresh.length) { log('所有数据源失败:', errs.join(' | ')); return { ok: false, err: errs.join('; '), count: list.length }; }
  let added = 0, updated = 0;
  for (const d of fresh) {
    if (map.has(d.issue)) {
      const old = map.get(d.issue);
      if (JSON.stringify(old) !== JSON.stringify(d)) { map.set(d.issue, d); updated++; }
    } else { map.set(d.issue, d); added++; }
  }
  list = [...map.values()].sort((a, b) => b.issue.localeCompare(a.issue));
  saveDB(list);
  log(`同步完成: 新增${added} 更新${updated} 共${list.length}期`);
  return { ok: true, added, updated, count: list.length };
}

/* ============================================================
   HTTP 服务（本地开发用）
   ============================================================ */
function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.url === '/api/ssq' || req.url.startsWith('/api/ssq?')) {
    const u = new URL(req.url, 'http://localhost');
    const since = u.searchParams.get('since');
    let data = loadDB();
    if (since) data = data.filter(d => d.issue > since);
    res.end(JSON.stringify({ ok: true, updated: new Date().toISOString(), draws: data }));
    return;
  }
  if (req.url === '/api/update') {
    update(true).then(r => res.end(JSON.stringify(r)));
    return;
  }
  if (req.url === '/ssq-data.json') {
    res.end(JSON.stringify(loadDB()));
    return;
  }
  if (req.url === '/' || req.url === '/index.html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(fs.readFileSync(path.join(__dirname, 'ssq.html')));
    return;
  }
  res.statusCode = 404; res.end('Not Found');
}

let app;
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app = http.createServer(handler).listen(port, () => log('server running: http://localhost:' + port));
  // 启动即更新
  update().then(r => log('boot update:', r));
  // 开奖日 21:30 后定时补拉（周二/四/日）
  setInterval(() => {
    const now = new Date();
    if ([2, 4, 0].includes(now.getDay()) && now.getHours() === 22 && now.getMinutes() === 5) update();
  }, 60000);
}
module.exports = { handler, update, valid };
