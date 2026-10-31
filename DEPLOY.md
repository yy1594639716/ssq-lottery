# 🚀 双色球联网版 · 一键部署指南

## 一、部署到 Vercel（免费、永久在线、零服务器）

### 方式 A：GitHub 导入（推荐，最省事，3分钟）

1. 打开 https://github.com 注册/登录
2. 点右上角 `+` → `New repository` → 名字填 `ssq-lottery` → 选 `Private` → `Create`
3. 创建后点 `uploading an existing file`，把本文件夹所有文件拖进去 → `Commit changes`
4. 打开 https://vercel.com 用 GitHub 账号登录
5. 点 `Import Project` → 选 `ssq-lottery` → `Deploy`
6. 约1分钟完成，得到域名如 `https://ssq-lottery-abc123.vercel.app`

### 方式 B：命令行部署（不用 GitHub）

```bash
npm install -g vercel
cd /path/to/双色球联网版_部署即用
vercel login     # 按提示登录
vercel --prod    # 部署上线
```

### 方式 C：Netlify 拖拽（最简单，30秒）

1. 打开 https://app.netlify.com/drop
2. 把整个 `双色球联网版_部署即用` 文件夹拖进网页
3. 等待部署完成，得到域名

## 二、把域名填进前端（部署后必做）

部署完成拿到域名后，打开 `ssq.html`，找到这两行（文件靠前的位置）：

```javascript
const REMOTE_JSON='https://ssq-lottery.vercel.app/ssq-data.json';
const REMOTE_API ='https://ssq-lottery.vercel.app/api/ssq';
```

把 `ssq-lottery.vercel.app` **换成你真实的域名**，例如：

```javascript
const REMOTE_JSON='https://ssq-lottery-abc123.vercel.app/ssq-data.json';
const REMOTE_API ='https://ssq-lottery-abc123.vercel.app/api/ssq';
```

改完重新部署一次即可。

> GitHub方式：改完 `ssq.html` 重新上传到仓库，Vercel 会自动重新部署。
> Netlify方式：改完重新拖拽整个文件夹即可。

## 三、验证联网成功

1. 打开部署后的网址
2. 看页面顶部状态条：
   - **绿色圆点** + "已联网，最新一期：2026xxx" ✅ 成功
   - 灰色/红色 = 域名没填对或数据源临时不可用
3. 点「立即检查更新」按钮，数据自动追加
4. 切到「📈 走势图」页，号码自动变长

## 四、日常使用

| 场景 | 操作 |
|------|------|
| 电脑 | 收藏网址，打开即自动联网 |
| 手机 | 打开网址 → 分享 → 添加到主屏幕（PWA） |
| 启动 | 自动拉取最新开奖 |
| 手动更新 | 点「立即检查更新」 |

## 五、常见问题

**Q：状态条一直是灰色/红色？**
域名没填对。检查 `ssq.html` 里的 REMOTE_JSON / REMOTE_API 是否是真实域名。

**Q：还是显示内置6期数据？**
数据源（500彩票网/中彩网）有反爬，首次拉取可能几秒。多点几次「立即检查更新」。
持续失败会走内置基线兜底，功能不受影响。

**Q：数据真实吗？**
联网版会尝试抓取 500彩票网和中彩网数据，经格式校验后入库。
最终以中国福利彩票官方公告为准。仅供娱乐，理性投注。

## 六、文件清单

- ssq.html      前端主页面（双击可离线用）
- server.js     Node.js 后端代理（本地调试）
- api/ssq.js    Vercel/Netlify 云函数
- vercel.json   部署配置
- ssq-data.json 数据快照
- package.json  依赖声明
- README.md     功能说明
- DEPLOY.md     本部署指南
