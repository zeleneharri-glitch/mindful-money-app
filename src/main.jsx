import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell,
  CalendarDays,
  BookOpen,
  Car,
  Check,
  ChevronDown,
  Cloud,
  CloudOff,
  Coffee,
  Eye,
  EyeOff,
  Home,
  LogOut,
  Moon,
  PieChart,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Settings,
  SmilePlus,
  ShoppingBag,
  Gift,
  Trash2,
  Utensils,
  User,
  WalletCards,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import "./style.css";

const USER_KEY = "mindful_money_users";
const SESSION_KEY = "mindful_money_session";
const CLOUD_SYNC_ENDPOINT = "/.netlify/functions/feishu-transactions";

const categories = [
  { label: "餐饮", value: "food", icon: Utensils, color: "coral" },
  { label: "购物", value: "shopping", icon: ShoppingBag, color: "blue" },
  { label: "交通", value: "transport", icon: Car, color: "green" },
  { label: "学习", value: "study", icon: BookOpen, color: "amber" },
  { label: "日用", value: "daily", icon: WalletCards, color: "violet" },
  { label: "娱乐", value: "fun", icon: SmilePlus, color: "pink" },
  { label: "人情", value: "social", icon: Gift, color: "rose" },
];

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USER_KEY, JSON.stringify(users));
}

async function cloudRequest(payload) {
  const response = await fetch(CLOUD_SYNC_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "云端同步失败");
  }
  return data;
}

async function loadCloudTransactions(username) {
  const params = new URLSearchParams({ username });
  const response = await fetch(`${CLOUD_SYNC_ENDPOINT}?${params.toString()}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "读取云端数据失败");
  }
  return data.transactions || [];
}

function transactionKey(username) {
  return `mindful_money_transactions_${username}`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return todayISO().slice(0, 7);
}

function formatCurrency(value) {
  return `¥${Number(value || 0).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function monthTitle(month) {
  const [year, m] = month.split("-");
  return `${year}年${Number(m)}月`;
}

function getCategory(value) {
  return categories.find((item) => item.value === value) || categories[0];
}

function useTransactions(username) {
  const [transactions, setTransactions] = useState(() => {
    if (!username) return [];
    try {
      return JSON.parse(localStorage.getItem(transactionKey(username))) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!username) return;
    try {
      setTransactions(JSON.parse(localStorage.getItem(transactionKey(username))) || []);
    } catch {
      setTransactions([]);
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      localStorage.setItem(transactionKey(username), JSON.stringify(transactions));
    }
  }, [transactions, username]);

  return [transactions, setTransactions];
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    const name = username.trim();
    if (name.length < 2) {
      setError("用户名至少需要 2 个字符");
      return;
    }
    if (password.length < 6) {
      setError("密码至少需要 6 位");
      return;
    }

    const users = getUsers();
    const existing = users.find((user) => user.username === name);

    if (mode === "register") {
      if (existing) {
        setError("这个用户名已经注册过了");
        return;
      }
      const nextUsers = [...users, { username: name, password }];
      saveUsers(nextUsers);
      localStorage.setItem(SESSION_KEY, name);
      onLogin(name);
      return;
    }

    if (!existing || existing.password !== password) {
      setError("用户名或密码不正确");
      return;
    }
    localStorage.setItem(SESSION_KEY, name);
    onLogin(name);
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-mark">记</div>
        <p className="eyebrow">清醒记账</p>
        <h1>把每天的花费，记得更轻松。</h1>
        <p className="auth-copy">登录后开始记录，你的账单会保存在当前设备里。</p>

        <div className="auth-tabs" aria-label="登录注册切换">
          <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>
            登录
          </button>
          <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>
            注册
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label>
            用户名
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="请输入用户名" />
          </label>
          <label>
            密码
            <span className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="至少 6 位"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="显示或隐藏密码">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-action" type="submit">
            {mode === "login" ? "登录" : "注册并进入"}
          </button>
        </form>
      </section>
    </main>
  );
}

function StatusBar() {
  return (
    <div className="status">
      <span>9:41</span>
      <span className="status-icons">
        <span />
        <span />
        <span className="battery" />
      </span>
    </div>
  );
}

function PageTitle({ eyebrow, title, subtitle, right }) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function CategoryBadge({ categoryValue, compact = false }) {
  const category = getCategory(categoryValue);
  const Icon = category.icon;
  return (
    <span className={`category-badge ${category.color} ${compact ? "compact" : ""}`}>
      <Icon size={compact ? 16 : 20} />
      {!compact && <span>{category.label}</span>}
    </span>
  );
}

function EmptyState({ title = "还没有记录", copy = "点击下方加号，添加第一笔支出。" }) {
  return (
    <section className="empty-state">
      <ReceiptText size={34} />
      <h2>{title}</h2>
      <p>{copy}</p>
    </section>
  );
}

function FlowCard({ transactions }) {
  const total = transactions.reduce((sum, item) => sum + Number(item.amount), 0);
  const tip = total ? `¥${Math.round(total)}` : "¥0";

  return (
    <section className="flow-card">
      <div className="section-title compact">
        <h2>支出曲线</h2>
        <span>本周 <ChevronDown size={15} /></span>
      </div>
      <svg viewBox="0 0 320 108" className="flow-chart" aria-hidden="true">
        <defs>
          <linearGradient id="flowGlow" x1="0" x2="1">
            <stop offset="0" stopColor="#c7d9a5" stopOpacity="0.45" />
            <stop offset="1" stopColor="#f3bdd5" stopOpacity="0.18" />
          </linearGradient>
        </defs>
        <path d="M8 66 C35 76 52 16 86 40 S134 92 168 50 S219 25 244 54 S278 88 314 55" fill="none" stroke="url(#flowGlow)" strokeWidth="18" strokeLinecap="round" />
        <path d="M8 66 C35 76 52 16 86 40 S134 92 168 50 S219 25 244 54 S278 88 314 55" fill="none" stroke="#0b0b0b" strokeWidth="3" strokeLinecap="round" />
        <path d="M10 60 H310" stroke="#0b0b0b" strokeDasharray="4 7" opacity="0.2" />
        <line x1="174" y1="48" x2="174" y2="92" stroke="#0b0b0b" opacity="0.14" strokeDasharray="4 5" />
        <circle cx="174" cy="48" r="6" fill="#0b0b0b" />
        <rect x="150" y="4" width="52" height="28" rx="7" fill="#0b0b0b" />
        <text x="176" y="23" fill="#fff" fontSize="13" textAnchor="middle">{tip}</text>
      </svg>
      <div className="week-row">
        {["一", "二", "三", "四", "五", "六", "日"].map((day, index) => (
          <span className={index === 3 ? "active" : ""} key={day}>周{day}</span>
        ))}
      </div>
    </section>
  );
}

function MonthPicker({ month, setMonth }) {
  return (
    <label className="month-picker">
      <CalendarDays size={18} />
      <input type="month" value={month} onChange={(event) => setMonth(event.target.value || currentMonth())} />
      <ChevronDown size={16} />
    </label>
  );
}

function RecentList({ transactions, onDelete, emptyCopy }) {
  if (!transactions.length) {
    return <EmptyState copy={emptyCopy} />;
  }

  return (
    <section className="recent-list">
      {transactions.map((item) => (
        <article className="transaction-item" key={item.id}>
          <CategoryBadge categoryValue={item.category} compact />
          <div className="transaction-main">
            <div className="transaction-row">
              <strong>{item.note || getCategory(item.category).label}</strong>
              <strong className="amount-negative">-{formatCurrency(item.amount)}</strong>
            </div>
            <div className="transaction-row muted">
              <span>{getCategory(item.category).label}</span>
              <span>{item.date}</span>
            </div>
          </div>
          {onDelete && (
            <button className="icon-button ghost" onClick={() => onDelete(item.id)} aria-label="删除记录">
              <Trash2 size={18} />
            </button>
          )}
        </article>
      ))}
    </section>
  );
}

function HomePage({ username, month, setMonth, transactions, onLogout }) {
  const monthTotal = useMemo(() => transactions.reduce((sum, item) => sum + Number(item.amount), 0), [transactions]);
  const todayTotal = useMemo(
    () => transactions.filter((item) => item.date === todayISO()).reduce((sum, item) => sum + Number(item.amount), 0),
    [transactions]
  );
  const categoryTotals = categories.map((category) => {
    const value = transactions
      .filter((item) => item.category === category.value)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return { ...category, value };
  });
  const categoryShapes = ["circle", "square", "triangle", "hexagon", "soft-square", "pill", "bean"];

  return (
    <>
      <PageTitle
        eyebrow={`你好，${username}`}
        title="今日账本"
        subtitle="少一点负担，多一点清楚。"
        right={
          <button className="icon-button" onClick={onLogout} aria-label="退出登录">
            <LogOut size={20} />
          </button>
        }
      />

      <section className="hero-card">
        <span className="decor-pink" />
        <span className="decor-black" />
        <div className="summary-top">
          <div>
            <span>本月支出</span>
            <strong>{formatCurrency(monthTotal)}</strong>
          </div>
          <MonthPicker month={month} setMonth={setMonth} />
        </div>
        <div className="summary-grid">
          <div>
            <span>今日支出</span>
            <strong>{formatCurrency(todayTotal)}</strong>
          </div>
          <div>
            <span>记录笔数</span>
            <strong>{transactions.length}</strong>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">
          <h2>分类支出</h2>
          <button className="more-button" aria-label="更多"><span /><span /><span /></button>
        </div>
        <div className="category-cloud">
          {categoryTotals.map((category, index) => {
            const pct = monthTotal ? Math.round((category.value / monthTotal) * 100) : 0;
            const Icon = category.icon;
            return (
              <motion.div whileHover={{ scale: 1.04 }} className={`cat-card ${category.color} ${categoryShapes[index]}`} key={category.value}>
                <Icon size={23} />
                <strong>{pct}%</strong>
                <span>{category.label}</span>
              </motion.div>
            );
          })}
        </div>
      </section>

      <FlowCard transactions={transactions} />

      <section>
        <div className="section-title">
          <h2>最近记录</h2>
          <span>{transactions.length ? `共 ${transactions.length} 笔` : "空账本"}</span>
        </div>
        <RecentList transactions={transactions.slice(0, 4)} emptyCopy="现在还没有记账数据，添加后会出现在这里。" />
      </section>
    </>
  );
}

function RecordsPage({ month, setMonth, transactions, onDelete }) {
  const [category, setCategory] = useState("all");
  const filtered = category === "all" ? transactions : transactions.filter((item) => item.category === category);

  return (
    <>
      <PageTitle
        eyebrow="账单"
        title="全部记录"
        subtitle="按月份和分类查看每一笔支出。"
        right={<MonthPicker month={month} setMonth={setMonth} />}
      />

      <div className="filter-row">
        <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>
          全部
        </button>
        {categories.map((item) => (
          <button className={category === item.value ? "active" : ""} key={item.value} onClick={() => setCategory(item.value)}>
            {item.label}
          </button>
        ))}
      </div>

      <RecentList transactions={filtered} onDelete={onDelete} emptyCopy="这个筛选条件下还没有支出记录。" />
    </>
  );
}

function AnalyticsPage({ month, transactions }) {
  const total = transactions.reduce((sum, item) => sum + Number(item.amount), 0);
  const average = transactions.length ? total / transactions.length : 0;
  const top = categories
    .map((category) => ({
      ...category,
      value: transactions.filter((item) => item.category === category.value).reduce((sum, item) => sum + Number(item.amount), 0),
    }))
    .sort((a, b) => b.value - a.value)[0];

  return (
    <>
      <PageTitle title="月度分析" right={<PieChart size={26} />} />
      <section className="metric-grid">
        <div className="metric-card">
          <span>本月总额</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <div className="metric-card">
          <span>单笔平均</span>
          <strong>{formatCurrency(average)}</strong>
        </div>
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>分类排行</h2>
          <span>{top?.value ? `最高：${top.label}` : "暂无数据"}</span>
        </div>
        <div className="rank-list">
          {categories.map((category) => {
            const value = transactions
              .filter((item) => item.category === category.value)
              .reduce((sum, item) => sum + Number(item.amount), 0);
            const pct = total ? Math.round((value / total) * 100) : 0;
            return (
              <div className="rank-item" key={category.value}>
                <CategoryBadge categoryValue={category.value} />
                <div className="bar">
                  <i style={{ width: `${pct}%` }} />
                </div>
                <strong>{formatCurrency(value)}</strong>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function CalendarReportPage({ month, setMonth, transactions }) {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [year, monthIndex] = month.split("-").map(Number);
  const firstDay = new Date(year, monthIndex - 1, 1);
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const leading = (firstDay.getDay() + 6) % 7;
  const cells = [...Array(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const dayMap = transactions.reduce((acc, item) => {
    acc[item.date] = (acc[item.date] || 0) + Number(item.amount);
    return acc;
  }, {});
  const selectedItems = transactions.filter((item) => item.date === selectedDate);
  const selectedTotal = selectedItems.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <>
      <PageTitle
        title="日历"
        right={<MonthPicker month={month} setMonth={setMonth} />}
      />
      <section className="calendar-panel">
        <div className="weekday-row">{["一", "二", "三", "四", "五", "六", "日"].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="calendar-grid">
          {cells.map((day, index) => {
            if (!day) return <span className="calendar-cell blank" key={`blank-${index}`} />;
            const date = `${month}-${String(day).padStart(2, "0")}`;
            const total = dayMap[date] || 0;
            return (
              <button className={`calendar-cell ${date === selectedDate ? "selected" : ""}`} key={date} onClick={() => setSelectedDate(date)}>
                <strong>{day}</strong>
                {total > 0 && <span>{formatCurrency(total)}</span>}
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <div className="section-title">
          <h2>{selectedDate} 明细</h2>
          <span>{formatCurrency(selectedTotal)}</span>
        </div>
        <RecentList transactions={selectedItems} emptyCopy="这一天还没有支出记录。" />
      </section>
    </>
  );
}

function ProfilePage({ username, onLogout, syncState, onPushCloud, onPullCloud }) {
  return (
    <>
      <PageTitle title="账户设置" right={<div className="avatar">{username.slice(0, 1).toUpperCase()}</div>} />
      <section className="profile-card">
        <div>
          <span>当前账号</span>
          <strong>{username}</strong>
        </div>
      </section>
      <section className="cloud-card">
        <div className="cloud-head">
          <span className={`cloud-icon ${syncState.ok ? "ok" : ""}`}>
            {syncState.ok ? <Cloud size={22} /> : <CloudOff size={22} />}
          </span>
          <div>
            <h2>飞书云同步</h2>
            <p>{syncState.message}</p>
          </div>
        </div>
        <div className="cloud-actions">
          <button onClick={onPushCloud} disabled={syncState.loading}>
            <RefreshCw size={17} />
            上传到飞书
          </button>
          <button onClick={onPullCloud} disabled={syncState.loading}>
            <Cloud size={17} />
            从飞书拉取
          </button>
        </div>
      </section>
      <div className="settings-list">
        <button>
          <Bell size={20} />
          记账提醒
        </button>
        <button>
          <Moon size={20} />
          显示偏好
        </button>
        <button>
          <Settings size={20} />
          分类设置
        </button>
        <button className="danger" onClick={onLogout}>
          <LogOut size={20} />
          退出登录
        </button>
      </div>
    </>
  );
}

function AddExpenseSheet({ open, onClose, onSave }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0].value);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount("");
      setCategory(categories[0].value);
      setDate(todayISO());
      setNote("");
      setError("");
    }
  }, [open]);

  function save() {
    const value = Number(amount);
    if (!amount || Number.isNaN(value) || value <= 0) {
      setError("请输入大于 0 的金额");
      return;
    }
    if (value > 999999) {
      setError("单笔金额不能超过 999999");
      return;
    }
    if (!note.trim()) {
      setError("请填写备注，方便以后查看");
      return;
    }
    onSave({
      id: Date.now(),
      amount: Math.round(value * 100) / 100,
      category,
      date,
      note: note.trim(),
    });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.section className="sheet" initial={{ y: 520 }} animate={{ y: 0 }} exit={{ y: 520 }} transition={{ type: "spring", damping: 28, stiffness: 260 }}>
            <div className="sheet-head">
              <h2>新增支出</h2>
              <button className="icon-button ghost" onClick={onClose} aria-label="关闭">
                <X size={20} />
              </button>
            </div>
            <label className="field">
              金额
              <input
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ""))}
                placeholder="0.00"
              />
            </label>
            <div className="field">
              分类
              <div className="category-select">
                {categories.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button className={category === item.value ? "active" : ""} key={item.value} onClick={() => setCategory(item.value)}>
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="field">
              日期
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label className="field">
              备注
              <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：午餐、地铁、超市采购" rows={3} />
            </label>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-action" onClick={save}>
              <Check size={20} />
              保存支出
            </button>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BottomNav({ active, setActive, onAdd }) {
  const items = [
    { id: "home", label: "首页", icon: Home },
    { id: "analytics", label: "统计", icon: PieChart },
    { id: "calendar", label: "日历", icon: CalendarDays },
    { id: "profile", label: "我的", icon: User },
  ];
  return (
    <nav className="bottom-nav">
      {items.slice(0, 2).map((item) => <NavButton active={active} item={item} key={item.id} setActive={setActive} />)}
      <button className="add-button" onClick={onAdd} aria-label="新增支出">
        <Plus size={30} />
      </button>
      {items.slice(2).map((item) => <NavButton active={active} item={item} key={item.id} setActive={setActive} />)}
    </nav>
  );
}

function NavButton({ item, active, setActive }) {
  const Icon = item.icon;
  return (
    <button className={`nav-button ${active === item.id ? "active" : ""}`} onClick={() => setActive(item.id)}>
      <Icon size={21} />
      <span>{item.label}</span>
    </button>
  );
}

function App() {
  const [username, setUsername] = useState(() => localStorage.getItem(SESSION_KEY) || "");
  const [active, setActive] = useState("home");
  const [month, setMonth] = useState(currentMonth());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [transactions, setTransactions] = useTransactions(username);
  const [syncState, setSyncState] = useState({
    loading: false,
    ok: false,
    message: "未连接飞书，当前使用本地账本。",
  });

  const monthTransactions = useMemo(
    () => transactions.filter((item) => item.date?.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
    [month, transactions]
  );

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUsername("");
    setActive("home");
    setSyncState({ loading: false, ok: false, message: "未连接飞书，当前使用本地账本。" });
  }

  async function pushCloud() {
    setSyncState({ loading: true, ok: false, message: "正在上传到飞书..." });
    try {
      const result = await cloudRequest({ action: "replace", username, transactions });
      setSyncState({ loading: false, ok: true, message: `已同步 ${result.count || transactions.length} 笔到飞书。` });
    } catch (error) {
      setSyncState({ loading: false, ok: false, message: error.message || "上传失败，请检查飞书配置。" });
    }
  }

  async function pullCloud() {
    setSyncState({ loading: true, ok: false, message: "正在从飞书读取..." });
    try {
      const cloudTransactions = await loadCloudTransactions(username);
      setTransactions(cloudTransactions);
      setSyncState({ loading: false, ok: true, message: `已从飞书拉取 ${cloudTransactions.length} 笔记录。` });
    } catch (error) {
      setSyncState({ loading: false, ok: false, message: error.message || "读取失败，请检查飞书配置。" });
    }
  }

  if (!username) {
    return <AuthScreen onLogin={setUsername} />;
  }

  const page =
    active === "analytics" ? (
      <AnalyticsPage month={month} transactions={monthTransactions} />
    ) : active === "calendar" ? (
      <CalendarReportPage month={month} setMonth={setMonth} transactions={monthTransactions} />
    ) : active === "profile" ? (
      <ProfilePage username={username} onLogout={logout} syncState={syncState} onPushCloud={pushCloud} onPullCloud={pullCloud} />
    ) : active === "records" ? (
      <RecordsPage month={month} setMonth={setMonth} transactions={monthTransactions} onDelete={(id) => setTransactions((items) => items.filter((item) => item.id !== id))} />
    ) : (
      <HomePage username={username} month={month} setMonth={setMonth} transactions={monthTransactions} onLogout={logout} />
    );

  return (
    <div className="app-bg">
      <div className="phone">
        <main className="content">
          <StatusBar />
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22 }}>
              {page}
            </motion.div>
          </AnimatePresence>
        </main>
        <button className="records-button" onClick={() => setActive("records")}>
          <Search size={17} />
          账单
        </button>
        <BottomNav active={active} setActive={setActive} onAdd={() => setSheetOpen(true)} />
        <AddExpenseSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSave={(item) => setTransactions((items) => [item, ...items])} />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
