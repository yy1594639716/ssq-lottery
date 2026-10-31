# 🎱 双色球选号助手 · 联网版

> 启动自动联网获取最新开奖号码，离线时自动走本地缓存，功能不受影响。
> **免 Token 部署**：全程网页操作，不把任何密钥交给别人。

---

## ✨ 功能一览

| 模块 | 说明 |
|------|------|
| 🎲 随机选号 | 5 种策略：纯随机 / 偏热 / 偏冷 / 三区均衡 / 冷热混合 |
| ✍️ 自选录入 | 实时校验（6 红 + 1 蓝，红球不重复） |
| 📋 历史记录 | 本地保存、导入导出备份 |
| 🏆 开奖查询 | 最新 100 期开奖号码 |
| 🔍 开奖核对 | 自动比对你的号码，判定奖级 |
| 📊 号码统计 | 红球/蓝球出现频次、最热最冷号 |
| 📈 走势图 | 红蓝合并单表，蓝球黑色斜连线，双指缩放 |
| 🌐 联网更新 | 多源 fallback，启动自动拉取 |

---

## 📁 项目结构

```
双色球联网版_部署即用/
├── ssq.html          # 前端单页（可双击离线用）
├── server.js         # Node 后端代理（本地调试 + 云函数复用）
├── api/ssq.js        # Vercel 云函数入口
├── vercel.json       # Vercel 部署配置
├── ssq-data.json     # 数据快照（含 6 期权威基线）
├── package.json
├── README.md         # 本文件
└── DEPLOY.md         # 详细部署教程
```

---

## 🚀 一键部署（免 Token，3 分钟）

> 完整图文教程见 `DEPLOY.md`，这里是最短路径。

### 第 1 步 · 本地准备（电脑终端执行）

```bash
cd 双色球联网版_部署即用

git init
git add .
git commit -m "init: 双色球联网版"

git branch -M main
git remote add origin https://github.com/你的用户名/ssq-lottery.git
git push -u origin main
```

> ⚠️ `git push` 需要 GitHub 凭证，去 https://github.com/settings/tokens
> 生成一个 Token（勾 `repo` 权限），密码处粘贴 Token 即可。**只自己用，不用发给别人。**

### 第 2 步 · Vercel 网页导入

1. 打开 https://vercel.com → 点 **Continue with GitHub** 登录授权
2. 进 Dashboard → **Add New → Project**
3. 在列表里找到 `ssq-lottery` → 点 **Import**
4. 配置如下：

   | 配置项 | 填法 |
   |--------|------|
   | Framework Preset | **Other** |
   | Root Directory | `./`（默认） |
   | Build Command | **留空** |
   | Output Directory | `.`（点号，代表根目录） |
   | Install Command | `npm install` |

5. 点 **Deploy** → 等 30~60 秒 → 拿到域名：
   ```
   https://ssq-lottery.vercel.app
   ```

### 第 3 步 · 把真实域名写回前端

打开本地 `ssq.html`，找到这两行：

```javascript
const REMOTE_JSON='https://ssq-lottery.vercel.app/ssq-data.json';
const REMOTE_API ='https://ssq-lottery.vercel.app/api/ssq';
```

把 `ssq-lottery.vercel.app` 换成你**真实的部署域名**，然后重新提交：

```bash
git add ssq.html
git commit -m "fix: 绑定真实域名"
git push
```

Vercel 会自动重新部署，不用再去网页点任何东西。

---

## ✅ 验证完整链路

部署完成后，打开 `https://你的域名/ssq.html`，检查这 5 项：

| 检查项 | 预期结果 |
|--------|----------|
| 页面顶部状态条 | **绿色圆点** + 「已联网，最新一期：2026xxx」 |
| 打开 `/api/ssq` | 返回 JSON 格式的开奖数据 |
| 打开 `/ssq-data.json` | 返回数据快照数组 |
| 「📈 走势图」 | 自动包含最新一期 |
| 点「立即检查更新」 | 有新版就追加，无新版提示已是最新 |

---

## 🔄 自动更新机制

| 触发时机 | 动作 |
|----------|------|
| 页面启动 | 自动请求 `/api/ssq` 拉取最新开奖 |
| 开奖日（周二/四/日）22:05 | 自动补拉一次 |
| 手动 | 点「立即检查更新」按钮 |
| 联网失败 | 静默走本地缓存，功能不受影响 |

---

## 💻 本地开发（可选）

```bash
cd 双色球联网版_部署即用
npm install
node server.js          # 启动 http://localhost:3000
```

启动时自动抓取最新开奖并写入 `ssq-data.json`。

---

## 📦 纯前端离线用（不部署）

直接双击 `ssq.html` 即可使用，所有功能正常：随机选号、录入、核对、走势图、导入导出。
**唯一区别**：开奖数据用内置的 6 期权威基线，需要联网更新时再部署。

---

## 🔧 数据源

| 源 | 说明 | 角色 |
|----|------|------|
| 500彩票网 datachart | 完整历史、长期稳定 | 主源 |
| 中彩网 zhcw | 备用源 | fallback |
| 内置 6 期基线 | 官方公告口径 | 最终兜底 |

数据经严格校验后入库：期号格式、红球 6 个不重复（1-33）、蓝球 1 个（1-16）、日期合法性。非法数据一律拒绝入库。

---

## 📋 数据格式

```json
{
  "issue": "2026124",
  "date": "2026-10-25",
  "red": ["04", "10", "12", "13", "19", "27"],
  "blue": "04"
}
```

---

## ❓ 常见问题

**Q：页面顶部状态条是灰色/红色？**
域名没填对。检查 `ssq.html` 里 `REMOTE_JSON` / `REMOTE_API` 是否是部署后的**真实域名**。

**Q：走势图还是只显示 6 期？**
数据源有反爬，首次拉取可能几秒。多点几次「立即检查更新」。
持续失败会走内置基线兜底，功能不受影响。

**Q：国内打不开 vercel.app？**
在 Vercel 项目里绑定自定义域名（国内可解析的域名）即可。

**Q：数据真实吗？**
联网版会尝试抓取 500彩票网和中彩网数据，经格式校验后入库。
最终以中国福利彩票官方公告为准。

---

## ⚠️ 理性提示

- 双色球每期独立随机，头奖概率约 **1/1772 万**
- 选号策略（偏热/偏冷/均衡）只改变号码分布倾向，**不提高中奖概率**
- 本工具仅供娱乐参考，请理性投注

---

## 📄 许可

仅供个人学习娱乐使用。开奖数据版权归中国福利彩票发行管理中心所有。
