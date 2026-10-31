/* ============================================================
   Vercel / Netlify 无服务器函数版
   每次请求触发：多源抓取 → 合并 → 返回增量
   ============================================================ */
'use strict';
const lib = require('../server.js'); // 复用抓取与校验逻辑

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const { handler } = lib;
  // 让 server.js 的路由处理
  return new Promise(resolve => {
    const fakeRes = {
      setHeader: (k, v) => res.setHeader(k, v),
      end: (b) => { res.end(b); resolve(); },
      statusCode: 200
    };
    handler(req, fakeRes);
  });
};
