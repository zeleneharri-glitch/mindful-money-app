const FEISHU_BASE = "https://open.feishu.cn/open-apis";

const fieldNames = {
  username: process.env.FEISHU_FIELD_USERNAME || "用户名",
  localId: process.env.FEISHU_FIELD_LOCAL_ID || "本地ID",
  date: process.env.FEISHU_FIELD_DATE || "日期",
  amount: process.env.FEISHU_FIELD_AMOUNT || "金额",
  category: process.env.FEISHU_FIELD_CATEGORY || "分类",
  note: process.env.FEISHU_FIELD_NOTE || "备注",
  createdAt: process.env.FEISHU_FIELD_CREATED_AT || "创建时间",
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function requireConfig() {
  const required = [
    "FEISHU_APP_ID",
    "FEISHU_APP_SECRET",
    "FEISHU_BITABLE_APP_TOKEN",
    "FEISHU_BITABLE_TABLE_ID",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`缺少飞书环境变量：${missing.join(", ")}`);
  }
}

async function feishuFetch(path, options = {}) {
  const response = await fetch(`${FEISHU_BASE}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.code !== 0) {
    throw new Error(data.msg || data.error?.message || `飞书接口请求失败：${path}`);
  }
  return data.data || {};
}

async function getTenantToken() {
  const response = await fetch(`${FEISHU_BASE}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.code !== 0 || !data.tenant_access_token) {
    throw new Error(data.msg || "获取飞书访问令牌失败");
  }

  return data.tenant_access_token;
}

function recordsPath(suffix = "") {
  const appToken = process.env.FEISHU_BITABLE_APP_TOKEN;
  const tableId = process.env.FEISHU_BITABLE_TABLE_ID;
  return `/bitable/v1/apps/${appToken}/tables/${tableId}/records${suffix}`;
}

async function listAllRecords(token) {
  const records = [];
  let pageToken = "";
  do {
    const params = new URLSearchParams({ page_size: "500" });
    if (pageToken) params.set("page_token", pageToken);
    const data = await feishuFetch(`${recordsPath()}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    records.push(...(data.items || []));
    pageToken = data.page_token || "";
  } while (pageToken);
  return records;
}

function fromFeishuRecord(record) {
  const fields = record.fields || {};
  return {
    id: Number(fields[fieldNames.localId]) || Date.now(),
    amount: Number(fields[fieldNames.amount]) || 0,
    category: String(fields[fieldNames.category] || "food"),
    date: String(fields[fieldNames.date] || "").slice(0, 10),
    note: String(fields[fieldNames.note] || ""),
  };
}

function toFeishuFields(username, transaction) {
  return {
    [fieldNames.username]: username,
    [fieldNames.localId]: String(transaction.id),
    [fieldNames.date]: transaction.date,
    [fieldNames.amount]: Number(transaction.amount) || 0,
    [fieldNames.category]: transaction.category,
    [fieldNames.note]: transaction.note || "",
    [fieldNames.createdAt]: new Date().toISOString(),
  };
}

async function deleteRecords(token, recordIds) {
  for (const recordId of recordIds) {
    await feishuFetch(recordsPath(`/${recordId}`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

async function createRecords(token, username, transactions) {
  for (const transaction of transactions) {
    await feishuFetch(recordsPath(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({ fields: toFeishuFields(username, transaction) }),
    });
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, {});

  try {
    requireConfig();
    const token = await getTenantToken();

    if (event.httpMethod === "GET") {
      const username = (event.queryStringParameters?.username || "").trim();
      if (!username) return json(400, { error: "缺少用户名" });
      const records = await listAllRecords(token);
      const transactions = records
        .filter((record) => record.fields?.[fieldNames.username] === username)
        .map(fromFeishuRecord)
        .filter((item) => item.date)
        .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
      return json(200, { transactions });
    }

    if (event.httpMethod === "POST") {
      const payload = JSON.parse(event.body || "{}");
      const username = String(payload.username || "").trim();
      const transactions = Array.isArray(payload.transactions) ? payload.transactions : [];
      if (!username) return json(400, { error: "缺少用户名" });
      if (payload.action !== "replace") return json(400, { error: "不支持的同步动作" });

      const records = await listAllRecords(token);
      const userRecordIds = records
        .filter((record) => record.fields?.[fieldNames.username] === username)
        .map((record) => record.record_id);
      await deleteRecords(token, userRecordIds);
      await createRecords(token, username, transactions);
      return json(200, { ok: true, count: transactions.length });
    }

    return json(405, { error: "不支持的请求方法" });
  } catch (error) {
    return json(500, { error: error.message || "飞书同步失败" });
  }
};
