# 清醒记账

一个 React + Vite 记账 App，支持本地账本，也支持通过 Netlify Function 同步到飞书多维表格。

## 本地运行

```bash
npm install
npm run dev
```

普通 Vite 本地运行时，账本会保存在浏览器本地。飞书同步按钮会显示未连接，属于正常情况。

## 使用飞书云同步

### 1. 创建飞书多维表格

建议字段如下：

| 字段名 | 类型 |
| --- | --- |
| 用户名 | 文本 |
| 本地ID | 文本 |
| 日期 | 日期或文本 |
| 金额 | 数字 |
| 分类 | 文本或单选 |
| 备注 | 文本 |
| 创建时间 | 日期时间或文本 |

### 2. 创建飞书自建应用

在飞书开放平台创建企业自建应用，拿到：

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`

给应用开通多维表格读写权限，并把应用添加到目标多维表格里。

### 3. 配置环境变量

复制 `.env.example`，填入你的飞书配置：

```bash
FEISHU_APP_ID=cli_xxxxxxxxxxxxx
FEISHU_APP_SECRET=xxxxxxxxxxxxxxxx
FEISHU_BITABLE_APP_TOKEN=bascnxxxxxxxxxxxx
FEISHU_BITABLE_TABLE_ID=tblxxxxxxxxxxxx
```

部署到 Netlify 时，也需要在 Netlify 的环境变量里配置同样的值。

### 4. 本地调试云函数

如果要在本地调试飞书同步，请使用 Netlify Dev：

```bash
netlify dev
```

然后打开 Netlify Dev 给出的地址，一般是：

```text
http://localhost:8888
```

### 5. 同步方式

进入 App 的“我的”页面：

- “上传到飞书”：把当前登录用户的本地账本覆盖同步到飞书。
- “从飞书拉取”：把飞书里当前用户的账本拉回本地。

同步按用户名隔离，不同账号的数据不会混在一起。
