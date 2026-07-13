import { useState, useEffect, useRef } from "react";

const LOGO_SRC = "";

const C = {
  sidebar: '#0a4a47', sideAct: '#0f6b66', gold: '#C9A84C', goldHov: '#e0bc5c',
  pageBg: '#f4efe3', cardBg: '#fffefb', text: '#123a37', textMid: '#3f5b58', textMuted: '#7d8f8c',
  border: '#ded7c8', red: '#c0392b', green: '#2f8f4a', blue: '#1a6fa8',
  orange: '#c0703a', purple: '#6b2fa0', teal: '#0e7c79', copper: '#c0703a',
};
const G_HEADER = 'linear-gradient(135deg,#0a4a47,#0f6b66)';
const G_LOGIN = 'radial-gradient(ellipse at 30% 40%, #0f6b66 0%, #0a4a47 45%, #052c2a 100%)';

const COURSE_TAG = { 'Qurani Qaida': '#1a6fa8', 'Quran Reading': '#2f8f4a', 'Tajweed': '#6b2fa0', 'Hifz': '#c0703a', 'Translation': '#c0392b', 'Tafseer': '#0e7c79', 'Islamic Studies': '#a37a00' };
const MAT_TAG = { 'Qurani Qaida': '#1a6fa8', 'Quran PDFs': '#2f8f4a', 'Tajweed Material': '#6b2fa0', 'Islamic Studies PDFs': '#a37a00', 'Worksheets': '#0e7c79' };
const COURSES = ['Qurani Qaida', 'Quran Reading', 'Tajweed', 'Hifz', 'Translation', 'Tafseer', 'Islamic Studies'];
const COUNTRIES = ['United Kingdom', 'United States', 'Canada', 'Australia', 'Germany', 'UAE', 'Saudi Arabia', 'Pakistan', 'India', 'Malaysia', 'South Africa', 'France'];
const CURRENCIES = ['$', '£', '€', 'C$', 'A$', 'AED', 'SAR', '₨', '₹', 'RM', 'R'];
const COUNTRY_CCY = { 'United Kingdom': '£', 'United States': '$', 'Canada': 'C$', 'Australia': 'A$', 'Germany': '€', 'UAE': 'AED', 'Saudi Arabia': 'SAR', 'Pakistan': '₨', 'India': '₹', 'Malaysia': 'RM', 'South Africa': 'R', 'France': '€' };
const CURRENCY = '$';
const money = n => CURRENCY + (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const fee = (cur, n) => (cur || '$') + ' ' + (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const fmtBytes = b => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';

function slugUsername(name) { return (name || '').toLowerCase().trim().replace(/[^a-z0-9\s.]/g, '').replace(/\s+/g, '.').replace(/\.+/g, '.').replace(/^\.|\.$/g, ''); }
function genUsername(name, existing) { let base = slugUsername(name) || 'teacher'; const taken = new Set((existing || []).map(u => u.un)); if (!taken.has(base)) return base; let i = 1; while (taken.has(base + i)) i++; return base + i; }
function genPassword() { const U = 'ABCDEFGHJKLMNPQRSTUVWXYZ', L = 'abcdefghijkmnpqrstuvwxyz', D = '23456789'; const pick = s => s[Math.floor(Math.random() * s.length)]; return pick(U) + pick(L) + pick(L) + pick(L) + pick(L) + pick(D) + pick(D); }

function AcademyLogo({ size = 48, ring = true }) {
  if (LOGO_SRC) return <img src={LOGO_SRC} alt="Ain ul Quran" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', display: 'block' }} />;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
      <defs><linearGradient id="aulqArc" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#2f8f4a" /><stop offset="55%" stopColor="#C9A84C" /><stop offset="100%" stopColor="#c0703a" /></linearGradient></defs>
      <circle cx="50" cy="50" r="48" fill="#f4efe3" stroke="#C9A84C" strokeWidth="2.4" />
      {ring && <circle cx="50" cy="50" r="43.5" fill="none" stroke="#0e7c79" strokeWidth="1.3" />}
      <path d="M 41 24 A 21 21 0 1 0 41 68" fill="none" stroke="url(#aulqArc)" strokeWidth="4.5" strokeLinecap="round" />
      <text x="38" y="53" fontSize="27" fill="#C9A84C" fontFamily="'Amiri', serif" fontWeight="700" textAnchor="middle">ع</text>
      <text x="66" y="43" fontSize="12.5" fill="#0e7c79" fontFamily="'Amiri', serif" fontWeight="700" textAnchor="middle">القرآن</text>
      <g transform="translate(48 63)"><path d="M -15 0 Q -7.5 -4 0 -1 L 0 7 Q -7.5 4 -15 4 Z" fill="#C9A84C" /><path d="M 15 0 Q 7.5 -4 0 -1 L 0 7 Q 7.5 4 15 4 Z" fill="#dcbb63" /><line x1="0" y1="-1" x2="0" y2="7" stroke="#9c7e2e" strokeWidth="1" /><path d="M -5 7 L 0 12 L 5 7" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round" /></g>
      <path d="M 73 48 q 7 -1 8 6 q 0 11 -8 14 q -7 3 -11 -3 q 6 2 10 -2 q 3 -4 -1 -7 q -2 -1 -2 -4 q 0 -3 4 -4 z" fill="#c0703a" />
    </svg>
  );
}

const USERS_INIT = [
  { id: 'admin', un: 'admin', pw: 'admin123', role: 'admin', name: 'Administrator', init: 'AD', photo: '' },
  { id: 'ceo', un: 'ceo', pw: 'ceo12345', role: 'ceo', name: 'Sh. Abdur Rahman', init: 'AR', photo: '' },
  { id: 'ops', un: 'operations', pw: 'ops12345', role: 'operations', name: 'Br. Hamza Sheikh', init: 'HS', photo: '' },
  { id: 'hr', un: 'hr', pw: 'hr12345', role: 'hr', name: 'Sr. Khadija Saleem', init: 'KS', photo: '' },
  { id: 'mgr', un: 'manager', pw: 'manager123', role: 'manager', name: 'Br. Yusuf Iqbal', init: 'YI', photo: '' },
  { id: 'sup1', un: 'supervisor', pw: 'super123', role: 'supervisor', name: 'Sr. Fatima Noor', init: 'FN', photo: '' },
  { id: 't1', un: 'ustadh.ahmad', pw: 'pass123', role: 'teacher', name: 'Ustadh Ahmad Ali', subject: 'Quran & Tajweed', init: 'AA', joined: '15 Jan 2023', email: 'ahmad@ainulquran.edu', phone: '+92 300 1234567', guarantor1: '+92 333 4455661', guarantor2: '+92 345 7788991', country: 'Pakistan', photo: '', rate: 5 },
  { id: 't2', un: 'ustadha.maryam', pw: 'pass123', role: 'teacher', name: 'Ustadha Maryam Khan', subject: 'Hifz & Translation', init: 'MK', joined: '20 Mar 2023', email: 'maryam@ainulquran.edu', phone: '+92 301 7654321', guarantor1: '+92 333 2211009', guarantor2: '+92 321 9988776', country: 'Pakistan', photo: '', rate: 6 },
  { id: 't3', un: 'ustadh.ibrahim', pw: 'pass123', role: 'teacher', name: 'Ustadh Ibrahim Malik', subject: 'Islamic Studies', init: 'IM', joined: '01 Sep 2022', email: 'ibrahim@ainulquran.edu', phone: '+92 302 1112233', guarantor1: '+92 300 5566778', guarantor2: '+92 312 1122334', country: 'Pakistan', photo: '', rate: 4.5 },
];

const STUDENTS_INIT = [
  { id: 's1', name: 'Abdullah Hassan', relation: 'Son', age: 12, country: 'United Kingdom', tid: 't1', course: 'Tajweed', enrolled: '10 Jan 2024', total: 48, attended: 44, parent: 'Mr. Tariq Hassan', parentPhone: '+44 7700 900123', parentEmail: 'tariq.hassan@email.com', currency: '£', feeTotal: 60, feePaid: 60, classTime: '17:00', scheduleDays: [], photo: '' },
  { id: 's2', name: 'Aisha Rahman', relation: 'Daughter', age: 10, country: 'United States', tid: 't1', course: 'Qurani Qaida', enrolled: '15 Feb 2024', total: 32, attended: 30, parent: 'Mrs. Sana Rahman', parentPhone: '+1 (312) 555-0148', parentEmail: 'sana.r@email.com', currency: '$', feeTotal: 80, feePaid: 40, classTime: '15:30', scheduleDays: [], photo: '' },
  { id: 's3', name: 'Yusuf Ahmed', relation: 'Son', age: 15, country: 'Canada', tid: 't1', course: 'Hifz', enrolled: '01 Nov 2023', total: 80, attended: 76, parent: 'Mr. Bilal Ahmed', parentPhone: '+1 (416) 555-0192', parentEmail: 'bilal.ahmed@email.com', currency: 'C$', feeTotal: 100, feePaid: 0, classTime: '18:00', scheduleDays: [], photo: '' },
  { id: 's4', name: 'Fatima Malik', relation: 'Daughter', age: 8, country: 'Australia', tid: 't2', course: 'Quran Reading', enrolled: '05 Mar 2024', total: 24, attended: 22, parent: 'Mrs. Hira Malik', parentPhone: '+61 412 345 678', parentEmail: 'hira.malik@email.com', currency: 'A$', feeTotal: 90, feePaid: 90, classTime: '14:00', scheduleDays: [], photo: '' },
  { id: 's5', name: 'Omar Siddiqui', relation: 'Son', age: 14, country: 'Germany', tid: 't2', course: 'Translation', enrolled: '20 Dec 2023', total: 60, attended: 55, parent: 'Mr. Adeel Siddiqui', parentPhone: '+49 1512 3456789', parentEmail: 'adeel.s@email.com', currency: '€', feeTotal: 70, feePaid: 35, classTime: '16:30', scheduleDays: [], photo: '' },
  { id: 's6', name: 'Zainab Ali', relation: 'Daughter', age: 11, country: 'UAE', tid: 't3', course: 'Islamic Studies', enrolled: '25 Jan 2024', total: 40, attended: 38, parent: 'Mrs. Nadia Ali', parentPhone: '+971 50 123 4567', parentEmail: 'nadia.ali@email.com', currency: 'AED', feeTotal: 300, feePaid: 300, classTime: '19:00', scheduleDays: [], photo: '' },
  { id: 's7', name: 'Hamza Qureshi', relation: 'Son', age: 13, country: 'United Kingdom', tid: 't3', course: 'Tafseer', enrolled: '15 Oct 2023', total: 88, attended: 82, parent: 'Mr. Kamran Qureshi', parentPhone: '+44 7700 900456', parentEmail: 'kamran.q@email.com', currency: '£', feeTotal: 65, feePaid: 30, classTime: '17:30', scheduleDays: [], photo: '' },
];

const N = Date.now();
const m = (n) => N + n * 60000;
const CLASSES_INIT = [
  { id: 'cp1', sid: 's1', tid: 't1', time: m(-1440), status: 'completed', course: 'Tajweed' },
  { id: 'cp2', sid: 's2', tid: 't1', time: m(-1380), status: 'completed', course: 'Qurani Qaida' },
  { id: 'cp3', sid: 's3', tid: 't1', time: m(-1320), status: 'completed', course: 'Hifz' },
  { id: 'cp4', sid: 's4', tid: 't2', time: m(-1260), status: 'absent', course: 'Quran Reading' },
  { id: 'cp5', sid: 's5', tid: 't2', time: m(-1200), status: 'leave', course: 'Translation' },
  { id: 'cp6', sid: 's6', tid: 't3', time: m(-1440), status: 'completed', course: 'Islamic Studies' },
  { id: 'cp7', sid: 's7', tid: 't3', time: m(-1380), status: 'completed', course: 'Tafseer' },
  { id: 'c1', sid: 's1', tid: 't1', time: m(-15), status: 'active', course: 'Tajweed' },
  { id: 'c2', sid: 's2', tid: 't1', time: m(8), status: 'scheduled', course: 'Qurani Qaida' },
  { id: 'c3', sid: 's3', tid: 't1', time: m(120), status: 'scheduled', course: 'Hifz' },
  { id: 'c4', sid: 's4', tid: 't2', time: m(-5), status: 'active', course: 'Quran Reading' },
  { id: 'c5', sid: 's5', tid: 't2', time: m(180), status: 'leave', course: 'Translation' },
  { id: 'c6', sid: 's6', tid: 't3', time: m(60), status: 'scheduled', course: 'Islamic Studies' },
  { id: 'c7', sid: 's7', tid: 't3', time: m(240), status: 'scheduled', course: 'Tafseer' },
  { id: 'w1', sid: 's1', tid: 't1', time: m(2 * 1440 + 30), status: 'scheduled', course: 'Tajweed' },
  { id: 'w2', sid: 's2', tid: 't1', time: m(2 * 1440 + 90), status: 'scheduled', course: 'Qurani Qaida' },
  { id: 'w3', sid: 's3', tid: 't1', time: m(3 * 1440), status: 'scheduled', course: 'Hifz' },
  { id: 'w4', sid: 's1', tid: 't1', time: m(-2 * 1440), status: 'completed', course: 'Tajweed' },
  { id: 'w5', sid: 's4', tid: 't2', time: m(2 * 1440), status: 'scheduled', course: 'Quran Reading' },
  { id: 'w6', sid: 's6', tid: 't3', time: m(3 * 1440 + 60), status: 'scheduled', course: 'Islamic Studies' },
];

const REPORTS_INIT = [
  { id: 'r1', cid: 'cp1', sid: 's1', tid: 't1', date: '01 Dec 2024', lesson: 'Surah Al-Baqarah – Verses 1-10', quantity: '10 verses (½ page)', mistakes: "Makhraj of ض and ظ inconsistent.", homework: 'Revise vv.1-10 daily.', remarks: 'Good concentration, improving steadily.', nextLesson: 'Surah Al-Baqarah – Verses 11-20' },
  { id: 'r2', cid: 'cp2', sid: 's2', tid: 't1', date: '01 Dec 2024', lesson: 'Noorani Qaida – Chapter 3', quantity: 'Full Chapter 3', mistakes: 'Confusion between ب and ت at speed.', homework: 'Write each compound letter 5 times.', remarks: 'Very enthusiastic.', nextLesson: 'Noorani Qaida – Chapter 4' },
  { id: 'r3', cid: 'cp3', sid: 's3', tid: 't1', date: '01 Dec 2024', lesson: 'Surah Al-Kahf – Verses 20-35', quantity: '15 new verses memorized', mistakes: 'Qalqalah missed in v.28.', homework: 'Full revision each morning.', remarks: 'Excellent memory retention.', nextLesson: 'Surah Al-Kahf – Verses 36-50' },
  { id: 'r4', cid: 'cp6', sid: 's6', tid: 't3', date: '01 Dec 2024', lesson: 'Pillars of Islam – Zakat', quantity: 'Full chapter', mistakes: 'Confused on Nisab amounts.', homework: 'Memorize Nisab values.', remarks: 'Strong understanding.', nextLesson: 'Pillars of Islam – Sawm' },
  { id: 'r5', cid: 'cp7', sid: 's7', tid: 't3', date: '01 Dec 2024', lesson: 'Tafseer Surah Al-Fatihah', quantity: 'All 7 verses', mistakes: 'Build Arabic vocabulary.', homework: 'Learn 10 new words.', remarks: 'Mature understanding.', nextLesson: 'Tafseer Al-Baqarah 1-5' },
];

const NOTIFICATIONS_INIT = [
  { id: 'n1', type: 'absent', sid: 's4', tid: 't2', title: 'Absence Alert', message: "Dear Mrs. Hira Malik, Fatima Malik was marked ABSENT from today's Quran Reading class with Ustadha Maryam Khan.", parent: 'Mrs. Hira Malik', contact: '+61 412 345 678', time: N - 1260 * 60000 },
  { id: 'n2', type: 'completed', sid: 's1', tid: 't1', title: "Today's Class Completed", message: "Dear Mr. Tariq Hassan, today's Tajweed class with Ustadh Ahmad Ali has been completed.", parent: 'Mr. Tariq Hassan', contact: '+44 7700 900123', time: N - 1440 * 60000 },
];

const MATERIALS_INIT = [
  { id: 'm1', title: 'Noorani Qaida – Complete Edition', cat: 'Qurani Qaida', size: '2.4 MB', date: '15 Jan 2024', dl: 145 },
  { id: 'm2', title: 'Holy Quran – Para 1', cat: 'Quran PDFs', size: '4.2 MB', date: '20 Jan 2024', dl: 98 },
  { id: 'm4', title: 'Tajweed – Makhaarij Chart', cat: 'Tajweed Material', size: '1.8 MB', date: '01 Feb 2024', dl: 203 },
  { id: 'm5', title: 'Tajweed – Madd Types Guide', cat: 'Tajweed Material', size: '2.2 MB', date: '05 Feb 2024', dl: 176 },
  { id: 'm7', title: 'Islamic Studies – Grade 1', cat: 'Islamic Studies PDFs', size: '3.8 MB', date: '15 Feb 2024', dl: 89 },
  { id: 'm9', title: 'Arabic Letters Writing Practice', cat: 'Worksheets', size: '1.2 MB', date: '01 Mar 2024', dl: 167 },
];

const PKT_TZ = 'Asia/Karachi';
const fmtTime = ts => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: PKT_TZ });
const fmtDate = ts => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: PKT_TZ });
const fmtDateTime = ts => fmtDate(ts) + ' · ' + fmtTime(ts);
function pktInputParts(ts) { const dtf = new Intl.DateTimeFormat('en-CA', { timeZone: PKT_TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }); const p = dtf.formatToParts(new Date(ts)).reduce((a, x) => (a[x.type] = x.value, a), {}); const hour = p.hour === '24' ? '00' : p.hour; return { date: `${p.year}-${p.month}-${p.day}`, time: `${hour}:${p.minute}` }; }
const pktToTs = (date, time) => Date.parse(`${date}T${time}:00+05:00`);
function pktWeekInfo() { const now = new Date(); const wd = new Intl.DateTimeFormat('en-US', { timeZone: PKT_TZ, weekday: 'short' }).format(now); const idx = Math.max(0, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd)); const { date } = pktInputParts(Date.now()); const todayStart = pktToTs(date, '00:00'); return { startTs: todayStart - idx * 86400000, todayIdx: idx }; }
function currentMonthInfo() { const { date } = pktInputParts(Date.now()); const [y, mo, d] = date.split('-').map(Number); const daysInMonth = new Date(y, mo, 0).getDate(); const firstWeekday = new Date(y, mo - 1, 1).getDay(); const monthName = new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); return { y, mo, today: d, daysInMonth, firstWeekday, monthName }; }
const dateStr = (y, mo, d) => `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const DAY = 86400000;
const SUSP_DAYS = 30, NOTICE_DAYS = 90;
const initials = name => (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const shortName = name => (name || '').split(' ').slice(0, 2).join(' ');
const pct = (a, t) => t ? Math.round(a / t * 100) : 0;
const rateColor = p => p >= 90 ? C.green : p >= 75 ? C.orange : C.red;
const ACTIVATE_LEAD = 10 * 60000;
const NOTIF_META = { absent: { icon: '⚠️', color: C.red, bg: '#fdecea' }, completed: { icon: '✅', color: C.green, bg: '#e8f6ec' }, rescheduled: { icon: '🗓', color: C.blue, bg: '#e9f3fb' }, termination: { icon: '📜', color: C.red, bg: '#fdecea' } };
const STAGE_LABEL = { sup: 'Supervisor', mgr: 'Manager', hr: 'HR', adm: 'Admin', ops: 'Operations Head', ceo: 'CEO' };

function weekStartTs() { return pktWeekInfo().startTs; }
function teacherPay(teacher, classes) { const done = classes.filter(c => c.tid === teacher.id && c.status === 'completed'); const ws = weekStartTs(); const week = done.filter(c => c.time >= ws && c.time < ws + 7 * DAY); const rate = Number(teacher.rate) || 0; return { rate, completed: done.length, weekCount: week.length, total: done.length * rate, weekTotal: week.length * rate }; }
function compStats(tid, complaints) { const all = complaints.filter(c => c.tid === tid && !c.resolved); const pre = all.filter(c => c.phase === 'pre'); const post = all.filter(c => c.phase === 'post'); const cnt = (arr, st) => arr.filter(c => c.stage === st).length; return { all, total: all.length, supPre: cnt(pre, 'sup'), mgr: cnt(pre, 'mgr'), hr: cnt(pre, 'hr'), supPost: cnt(post, 'sup'), adm: cnt(post, 'adm'), ops: cnt(post, 'ops'), ceo: cnt(post, 'ceo') }; }
const teacherPhase = t => (t && t.susp) ? 'post' : 'pre';
const isSuspended = t => t && t.susp && Date.now() < t.susp.endTs;
function genClassesForStudent(s) { const time = s.classTime || '17:00'; return (s.scheduleDays || []).map(ds => ({ id: `gen_${s.id}_${ds}`, sid: s.id, tid: s.tid, course: s.course, time: pktToTs(ds, time), status: 'scheduled', gen: true })); }
function buildLetter(name) { const d = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); return `Assalamu Alaikum wa Rahmatullahi wa Barakatuh,\n\nThis is to formally notify all concerned that, effective today (${d}), ${name} is no longer associated with Ain ul Quran International Online Institute in any teaching or staff capacity.\n\nAll outstanding dues — including salary, entitlements and any pending settlements — have been fully cleared. Alternative qualified teachers have already been arranged for every affected student so that no child's learning is interrupted, in shaa Allah.\n\nWe thank ${name} for the time served at the institute and pray that Allah (SWT) grants them khayr, and that He helps us all complete the journey of His Qur'an's knowledge with sincerity.\n\nWassalam,\nCEO — Ain ul Quran International Online Institute`; }

function Badge({ label, color }) { return <span style={{ background: (color || '#888') + '18', color: color || '#888', padding: '4px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>; }
function Btn({ children, onClick, variant = 'primary', size = 'md', disabled }) {
  const sz = { sm: { p: '5px 10px', f: 12 }, md: { p: '8px 15px', f: 13 }, lg: { p: '11px 22px', f: 14 } }[size];
  const v = { primary: { bg: C.gold, c: '#1a1200' }, success: { bg: C.green, c: '#fff' }, danger: { bg: C.red, c: '#fff' }, warning: { bg: C.orange, c: '#fff' }, ghost: { bg: 'transparent', c: C.textMid, border: `1px solid ${C.border}` }, dark: { bg: C.sidebar, c: C.gold }, teal: { bg: C.teal, c: '#fff' }, purple: { bg: C.purple, c: '#fff' } }[variant];
  return <button onClick={disabled ? undefined : onClick} style={{ padding: sz.p, fontSize: sz.f, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', border: v.border || 'none', borderRadius: 6, background: v.bg, color: v.c, fontFamily: "'DM Sans', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 5, opacity: disabled ? 0.45 : 1, whiteSpace: 'nowrap' }}>{children}</button>;
}
function Card({ children, style }) { return <div style={{ background: C.cardBg, borderRadius: 12, border: `1px solid ${C.border}`, ...style }}>{children}</div>; }
function CardHeader({ title, subtitle, right }) { return <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><div><h3 style={{ fontFamily: "'Amiri', serif", fontSize: 18, color: C.text, margin: 0, fontWeight: 700 }}>{title}</h3>{subtitle && <p style={{ fontSize: 12, color: C.textMuted, margin: '3px 0 0' }}>{subtitle}</p>}</div>{right}</div>; }
function StatCard({ label, value, icon, color }) { return <div style={{ background: C.cardBg, borderRadius: 12, padding: 20, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 14 }}><div style={{ width: 50, height: 50, borderRadius: 12, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{icon}</div><div><div style={{ fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1 }}>{value}</div><div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{label}</div></div></div>; }
function Avatar({ name, color, size = 38, photo }) { if (photo) return <img src={photo} alt={name || ''} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block', border: `1.5px solid ${(color || '#888') + '55'}` }} />; return <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: (color || '#888') + '22', color: color || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.3, fontWeight: 700 }}>{initials(name)}</div>; }
function Progress({ value, color }) { return <div style={{ height: 5, background: C.border, borderRadius: 3, marginTop: 4 }}><div style={{ height: 5, borderRadius: 3, background: color || C.green, width: Math.min(100, value) + '%' }} /></div>; }
function Scroll({ children, min }) { return <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}><div style={{ minWidth: min }}>{children}</div></div>; }

function DesktopOnly({ width, role }) {
  return <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0a4a47,#0f6b66)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}><div style={{ fontSize: 56, marginBottom: 18 }}>🖥️</div><h2 style={{ color: C.gold, fontFamily: "'Amiri', serif", fontSize: 24, margin: '0 0 14px' }}>Desktop Access Required</h2><p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 1.7, maxWidth: 320, margin: 0 }}>{role === 'supervisor' ? 'Supervisor monitoring' : 'Teaching'} from mobile phones is not permitted. Please sign in from a laptop or desktop.</p><div style={{ marginTop: 26, padding: '14px 22px', background: 'rgba(201,168,76,0.14)', border: `1px solid ${C.gold}`, borderRadius: 10, color: C.gold, fontSize: 13 }}>📏 Current width: {width}px · Minimum required: 1024px</div></div>;
}

const inputStyle = { width: '100%', padding: '9px 12px', border: `1.5px solid ${C.border}`, borderRadius: 7, fontSize: 13, fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', outline: 'none', color: C.text, background: '#fdfcf8' };
function Field({ label, children, hint }) { return <div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 5 }}>{label}</label>{children}{hint && <div style={{ fontSize: 10.5, color: C.red, marginTop: 4 }}>{hint}</div>}</div>; }
function ModalShell({ title, subtitle, onClose, children, width = 460 }) {
  return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}><div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 40px 120px rgba(0,0,0,0.4)' }}><div style={{ background: G_HEADER, borderRadius: '16px 16px 0 0', padding: '22px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><div style={{ fontFamily: "'Amiri', serif", fontSize: 21, color: C.gold, fontWeight: 700 }}>{title}</div>{subtitle && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>{subtitle}</div>}</div><button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20 }}>×</button></div><div style={{ padding: '24px 28px' }}>{children}</div></div></div>;
}

function TeacherFormModal({ teacher, existingUsers, onSave, onClose }) {
  const isNew = !teacher;
  const others = (existingUsers || []).filter(u => !teacher || u.id !== teacher.id);
  const blank = () => ({ name: '', un: '', pw: genPassword(), subject: '', email: '', phone: '', guarantor1: '', guarantor2: '', country: COUNTRIES[7], photo: '', rate: '' });
  const [f, setF] = useState(() => teacher ? { name: '', un: '', pw: '', subject: '', email: '', phone: '', guarantor1: '', guarantor2: '', country: COUNTRIES[7], photo: '', rate: '', ...teacher } : blank());
  const [unTouched, setUnTouched] = useState(!isNew);
  const set = (k, v) => setF(o => ({ ...o, [k]: v }));
  const onName = v => setF(o => ({ ...o, name: v, un: (isNew && !unTouched) ? genUsername(v, others) : o.un }));
  const valid = f.name.trim() && f.un.trim() && f.pw.trim() && f.subject.trim();
  const onPhoto = e => { const file = e.target.files && e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => set('photo', r.result); r.readAsDataURL(file); };
  const build = () => ({ ...f, role: 'teacher', name: f.name.trim(), un: f.un.trim(), subject: f.subject.trim(), email: (f.email || '').trim(), phone: (f.phone || '').trim(), guarantor1: (f.guarantor1 || '').trim(), guarantor2: (f.guarantor2 || '').trim(), rate: Number(f.rate) || 0, init: initials(f.name), joined: teacher?.joined || new Date().toLocaleDateString('en-GB'), id: teacher?.id || 't' + Date.now() + Math.random().toString(36).slice(2, 5) });
  const save = (again) => { if (!valid) return; onSave(build(), again); if (again) { setF(blank()); setUnTouched(false); } };
  const rb = { width: 42, flexShrink: 0, border: `1.5px solid ${C.border}`, borderRadius: 7, background: '#fdfcf8', cursor: 'pointer', fontSize: 15 };
  return (
    <ModalShell title={teacher ? 'Edit Teacher' : 'Add Teacher'} subtitle={teacher ? teacher.name : 'Credentials auto-generated'} onClose={onClose} width={560}>
      <Field label="Profile Picture"><div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>{f.photo ? <img src={f.photo} alt="" style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.gold}` }} /> : <div style={{ width: 70, height: 70, borderRadius: '50%', background: C.gold + '22', color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, border: `2px dashed ${C.border}` }}>{initials(f.name) || '?'}</div>}<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={{ padding: '8px 15px', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 6, background: C.gold, color: '#1a1200' }}>📷 Upload<input type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} /></label>{f.photo && <button onClick={() => set('photo', '')} style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.red }}>Remove</button>}</div></div></Field>
      <Field label="Full Name"><input style={inputStyle} value={f.name} onChange={e => onName(e.target.value)} placeholder="e.g. Ustadh Bilal Ahmed" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Username"><div style={{ display: 'flex', gap: 6 }}><input style={{ ...inputStyle, fontFamily: 'monospace' }} value={f.un} onChange={e => { setUnTouched(true); set('un', e.target.value); }} />{isNew && <button type="button" onClick={() => { setUnTouched(false); setF(o => ({ ...o, un: genUsername(o.name, others) })); }} style={rb}>🔄</button>}</div></Field>
        <Field label="Password"><div style={{ display: 'flex', gap: 6 }}><input style={{ ...inputStyle, fontFamily: 'monospace' }} value={f.pw} onChange={e => set('pw', e.target.value)} />{isNew && <button type="button" onClick={() => set('pw', genPassword())} style={rb}>🔄</button>}</div></Field>
      </div>
      <Field label="Subject / Specialty"><input style={inputStyle} value={f.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. Quran & Tajweed" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><Field label="Email"><input style={inputStyle} value={f.email} onChange={e => set('email', e.target.value)} /></Field><Field label="Phone"><input style={inputStyle} value={f.phone} onChange={e => set('phone', e.target.value)} /></Field></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><Field label="Guarantor 1"><input style={inputStyle} value={f.guarantor1} onChange={e => set('guarantor1', e.target.value)} /></Field><Field label="Guarantor 2"><input style={inputStyle} value={f.guarantor2} onChange={e => set('guarantor2', e.target.value)} /></Field></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><Field label="Country"><select style={inputStyle} value={f.country} onChange={e => set('country', e.target.value)}>{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></Field><Field label={`Rate (${CURRENCY}/class)`}><input type="number" min="0" step="0.5" style={inputStyle} value={f.rate} onChange={e => set('rate', e.target.value)} /></Field></div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, flexWrap: 'wrap' }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn>{isNew && <Btn variant="dark" disabled={!valid} onClick={() => save(true)}>+ Save &amp; Add Another</Btn>}<Btn variant="primary" disabled={!valid} onClick={() => save(false)}>{teacher ? '✓ Save' : '+ Add Teacher'}</Btn></div>
    </ModalShell>
  );
}

function MonthDayPicker({ selected, onToggle }) {
  const { y, mo, today, daysInMonth, firstWeekday, monthName } = currentMonthInfo();
  const sel = new Set(selected || []);
  const cells = []; for (let i = 0; i < firstWeekday; i++) cells.push(null); for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const wd = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; const selCount = (selected || []).length;
  return (
    <div style={{ border: `1.5px solid ${C.border}`, borderRadius: 10, padding: 14, background: '#fdfcf8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}><span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>📅 {monthName}</span><span style={{ fontSize: 11, fontWeight: 700, color: selCount ? C.teal : C.textMuted, background: (selCount ? C.teal : C.textMuted) + '15', padding: '3px 10px', borderRadius: 20 }}>{selCount} class day{selCount !== 1 ? 's' : ''}</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5, marginBottom: 4 }}>{wd.map((w, i) => <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.textMuted }}>{w}</div>)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 }}>{cells.map((d, i) => { if (d === null) return <div key={i} />; const ds = dateStr(y, mo, d); const on = sel.has(ds); const isT = d === today; return <button key={i} type="button" onClick={() => onToggle(ds)} style={{ aspectRatio: '1', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: on ? 800 : 500, fontFamily: "'DM Sans', sans-serif", border: `1.5px solid ${on ? C.teal : isT ? C.gold : C.border}`, background: on ? C.teal : '#fff', color: on ? '#fff' : C.text }}>{d}</button>; })}</div>
      <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 9, lineHeight: 1.5 }}>Tap each day this student has class — different days every week are fine (e.g. Mon/Tue one week, Thu/Fri the next). Ticked days auto-schedule at the class time below.</div>
    </div>
  );
}

function StudentFormModal({ student, teachers, onSave, onClose }) {
  const [f, setF] = useState(() => student ? { relation: 'Son', currency: '£', feeTotal: '', feePaid: '', parentPhone: '', parentEmail: '', classTime: '17:00', scheduleDays: [], photo: '', ...student } : { name: '', relation: 'Son', age: '', country: COUNTRIES[0], course: COURSES[0], tid: teachers[0]?.id || '', parent: '', parentPhone: '', parentEmail: '', currency: COUNTRY_CCY[COUNTRIES[0]] || '£', feeTotal: '', feePaid: '', classTime: '17:00', scheduleDays: [], photo: '', attended: 0 });
  const set = (k, v) => setF(o => ({ ...o, [k]: v }));
  const onCountry = v => setF(o => ({ ...o, country: v, currency: COUNTRY_CCY[v] || o.currency }));
  const toggleDay = ds => setF(o => { const has = (o.scheduleDays || []).includes(ds); return { ...o, scheduleDays: has ? o.scheduleDays.filter(x => x !== ds) : [...(o.scheduleDays || []), ds].sort() }; });
  const onPhoto = e => { const file = e.target.files && e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => set('photo', r.result); r.readAsDataURL(file); };
  const nameLabel = f.relation === 'Daughter' ? "Daughter's Name" : "Son's Name";
  const total = Number(f.feeTotal) || 0, paid = Number(f.feePaid) || 0, remaining = Math.max(0, total - paid);
  const phoneOk = (f.parentPhone || '').trim().length > 4;
  const emailOk = /\S+@\S+\.\S+/.test((f.parentEmail || '').trim());
  const valid = (f.name || '').trim() && f.age !== '' && f.tid && phoneOk && emailOk;
  const save = () => valid && onSave({ ...f, name: f.name.trim(), age: Number(f.age) || 0, parent: (f.parent || '').trim(), parentPhone: (f.parentPhone || '').trim(), parentEmail: (f.parentEmail || '').trim(), feeTotal: total, feePaid: paid, total: (f.scheduleDays || []).length || student?.total || 0, attended: Number(f.attended) || student?.attended || 0, enrolled: student?.enrolled || new Date().toLocaleDateString('en-GB'), id: student?.id || 's' + Date.now() });
  const relBtn = a => ({ flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, border: `1.5px solid ${a ? C.teal : C.border}`, background: a ? '#eafaf7' : '#fff', color: a ? C.teal : C.textMid, fontFamily: "'DM Sans', sans-serif" });
  const sect = t => <div style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1, margin: '6px 0 10px', borderTop: `1px dashed ${C.border}`, paddingTop: 14 }}>{t}</div>;
  return (
    <ModalShell title={student ? 'Edit Student' : 'Add Student'} subtitle={student ? student.name : 'Enroll a new student'} onClose={onClose} width={620}>
      <Field label="Profile Picture"><div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>{f.photo ? <img src={f.photo} alt="" style={{ width: 66, height: 66, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.gold}` }} /> : <div style={{ width: 66, height: 66, borderRadius: '50%', background: C.gold + '22', color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, border: `2px dashed ${C.border}` }}>{initials(f.name) || '?'}</div>}<div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}><label style={{ padding: '8px 15px', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 6, background: C.gold, color: '#1a1200' }}>📷 Upload Photo<input type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }} /></label>{f.photo && <button onClick={() => set('photo', '')} style={{ padding: '5px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.red }}>Remove</button>}</div></div></Field>
      <Field label="The child is a"><div style={{ display: 'flex', gap: 10 }}><div style={relBtn(f.relation === 'Son')} onClick={() => set('relation', 'Son')}>👦 Son</div><div style={relBtn(f.relation === 'Daughter')} onClick={() => set('relation', 'Daughter')}>👧 Daughter</div></div></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}><Field label={nameLabel}><input style={inputStyle} value={f.name} onChange={e => set('name', e.target.value)} placeholder={f.relation === 'Daughter' ? 'e.g. Sara Ahmed' : 'e.g. Bilal Ahmed'} /></Field><Field label="Age"><input type="number" style={inputStyle} value={f.age} onChange={e => set('age', e.target.value)} placeholder="10" /></Field></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><Field label="Country"><select style={inputStyle} value={f.country} onChange={e => onCountry(e.target.value)}>{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></Field><Field label="Course"><select style={inputStyle} value={f.course} onChange={e => set('course', e.target.value)}>{COURSES.map(c => <option key={c}>{c}</option>)}</select></Field></div>
      <Field label="Assigned Teacher"><select style={inputStyle} value={f.tid} onChange={e => set('tid', e.target.value)}>{teachers.length === 0 && <option value="">No teachers</option>}{teachers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>)}</select></Field>
      {sect('👨‍👩‍👧 Parent / Guardian Contact')}
      <Field label="Parent / Guardian Name"><input style={inputStyle} value={f.parent} onChange={e => set('parent', e.target.value)} placeholder="e.g. Mr. Ahmed" /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Parent Phone (required)" hint={(f.parentPhone && !phoneOk) ? '⚠ Enter a valid phone' : ''}><input style={{ ...inputStyle, borderColor: (f.parentPhone && !phoneOk) ? C.red : C.border }} value={f.parentPhone} onChange={e => set('parentPhone', e.target.value)} placeholder="+1 234 567 8900" /></Field>
        <Field label="Parent Email (required)" hint={(f.parentEmail && !emailOk) ? '⚠ Enter a valid email' : ''}><input style={{ ...inputStyle, borderColor: (f.parentEmail && !emailOk) ? C.red : C.border }} value={f.parentEmail} onChange={e => set('parentEmail', e.target.value)} placeholder="parent@email.com" /></Field>
      </div>
      {sect('💳 Fee Collection')}
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr', gap: 12 }}><Field label="Currency"><select style={inputStyle} value={f.currency} onChange={e => set('currency', e.target.value)}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></Field><Field label="Monthly Fee"><input type="number" min="0" style={inputStyle} value={f.feeTotal} onChange={e => set('feeTotal', e.target.value)} placeholder="60" /></Field><Field label="Amount Paid"><input type="number" min="0" style={inputStyle} value={f.feePaid} onChange={e => set('feePaid', e.target.value)} placeholder="30" /></Field></div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}><div style={{ flex: 1, background: '#e8f6ec', border: '1px solid #9ad3ab', borderRadius: 8, padding: '9px 13px', minWidth: 130 }}><div style={{ fontSize: 10.5, color: C.textMuted, fontWeight: 700 }}>PAID</div><div style={{ fontSize: 16, fontWeight: 800, color: C.green }}>{fee(f.currency, paid)}</div></div><div style={{ flex: 1, background: remaining > 0 ? '#fdecea' : '#e8f6ec', border: `1px solid ${remaining > 0 ? '#f3d4d0' : '#9ad3ab'}`, borderRadius: 8, padding: '9px 13px', minWidth: 130 }}><div style={{ fontSize: 10.5, color: C.textMuted, fontWeight: 700 }}>REMAINING</div><div style={{ fontSize: 16, fontWeight: 800, color: remaining > 0 ? C.red : C.green }}>{fee(f.currency, remaining)}</div></div></div>
      {sect('🕔 Class Schedule (PKT)')}
      <Field label="Class Time (PKT)"><input type="time" style={{ ...inputStyle, maxWidth: 160 }} value={f.classTime} onChange={e => set('classTime', e.target.value)} /></Field>
      <Field label="Class Days This Month"><MonthDayPicker selected={f.scheduleDays} onToggle={toggleDay} /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" disabled={!valid} onClick={save}>{student ? '✓ Save Changes' : '+ Enroll Student'}</Btn></div>
    </ModalShell>
  );
}

function FeeModal({ student, onSave, onClose }) {
  const [f, setF] = useState({ currency: student.currency || '£', feeTotal: student.feeTotal || '', feePaid: student.feePaid || '' });
  const set = (k, v) => setF(o => ({ ...o, [k]: v }));
  const total = Number(f.feeTotal) || 0, paid = Number(f.feePaid) || 0, remaining = Math.max(0, total - paid);
  return (
    <ModalShell title="Edit Fee" subtitle={`${student.name} · ${student.parent || 'Guardian'}`} onClose={onClose} width={460}>
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr', gap: 12 }}><Field label="Currency"><select style={inputStyle} value={f.currency} onChange={e => set('currency', e.target.value)}>{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></Field><Field label="Monthly Fee"><input type="number" min="0" style={inputStyle} value={f.feeTotal} onChange={e => set('feeTotal', e.target.value)} /></Field><Field label="Paid"><input type="number" min="0" style={inputStyle} value={f.feePaid} onChange={e => set('feePaid', e.target.value)} /></Field></div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}><div style={{ flex: 1, background: '#e8f6ec', border: '1px solid #9ad3ab', borderRadius: 8, padding: '9px 13px' }}><div style={{ fontSize: 10.5, color: C.textMuted, fontWeight: 700 }}>PAID</div><div style={{ fontSize: 16, fontWeight: 800, color: C.green }}>{fee(f.currency, paid)}</div></div><div style={{ flex: 1, background: remaining > 0 ? '#fdecea' : '#e8f6ec', border: `1px solid ${remaining > 0 ? '#f3d4d0' : '#9ad3ab'}`, borderRadius: 8, padding: '9px 13px' }}><div style={{ fontSize: 10.5, color: C.textMuted, fontWeight: 700 }}>REMAINING</div><div style={{ fontSize: 16, fontWeight: 800, color: remaining > 0 ? C.red : C.green }}>{fee(f.currency, remaining)}</div></div></div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" onClick={() => onSave(student.id, { currency: f.currency, feeTotal: total, feePaid: paid })}>✓ Save Fee</Btn></div>
    </ModalShell>
  );
}

function AssignModal({ student, teachers, onAssign, onClose }) {
  const [tid, setTid] = useState(student.tid || (teachers[0]?.id || ''));
  return <ModalShell title="Assign Teacher" subtitle={`Reassign ${student.name}`} onClose={onClose} width={430}><Field label="Select Teacher"><select style={inputStyle} value={tid} onChange={e => setTid(e.target.value)}>{teachers.length === 0 && <option value="">No teachers</option>}{teachers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>)}</select></Field><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" disabled={!tid} onClick={() => onAssign(student.id, tid)}>✓ Assign</Btn></div></ModalShell>;
}

function ConfirmModal({ title, message, onConfirm, onClose, confirmLabel = '🗑 Delete', variant = 'danger' }) {
  return <ModalShell title={title} onClose={onClose} width={440}><p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.6, margin: '0 0 8px', whiteSpace: 'pre-line' }}>{message}</p><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant={variant} onClick={onConfirm}>{confirmLabel}</Btn></div></ModalShell>;
}

function TooEarlyModal({ cls, student, onClose }) {
  const u = Math.max(0, (cls.time - ACTIVATE_LEAD) - Date.now());
  const fd = ms => { const mn = Math.ceil(ms / 60000); if (mn <= 0) return 'now'; if (mn < 60) return mn + ' minute' + (mn !== 1 ? 's' : ''); const h = Math.floor(mn / 60), mm = mn % 60; return h + ' hour' + (h !== 1 ? 's' : '') + (mm ? ' ' + mm + ' min' : ''); };
  return <ModalShell title="Class Time Not Started Yet" subtitle={student ? student.name : ''} onClose={onClose} width={460}><div style={{ textAlign: 'center', marginBottom: 14 }}><div style={{ fontSize: 48 }}>⏳</div></div><p style={{ fontSize: 14, color: C.text, lineHeight: 1.6, margin: '0 0 14px', textAlign: 'center' }}>You can't make this class <strong>Active</strong> yet.</p><div style={{ background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '13px 16px', marginBottom: 14, fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>{student ? <><strong>{student.name}</strong>'s </> : null}<strong>{cls.course}</strong> class is scheduled for <span style={{ color: C.text, fontWeight: 700 }}>{fmtTime(cls.time)} PKT</span> on <span style={{ color: C.text, fontWeight: 700 }}>{fmtDate(cls.time)}</span>.</div><div style={{ background: '#fff8e6', border: '1px solid #ffd980', borderRadius: 10, padding: '11px 15px', fontSize: 12.5, color: C.textMid, lineHeight: 1.6 }}>⏰ The <strong>Active</strong> button unlocks ~10 min before class — roughly <strong>{fd(u)}</strong>.</div><div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}><Btn variant="primary" onClick={onClose}>Got it</Btn></div></ModalShell>;
}

function RescheduleModal({ cls, student, teacher, teachers, onReschedule, onClose }) {
  const def = pktInputParts(cls.time + DAY);
  const [date, setDate] = useState(def.date); const [time, setTime] = useState(def.time);
  const others = (teachers || []).filter(t => t.id !== cls.tid);
  const [mode, setMode] = useState('same'); const [otherTid, setOtherTid] = useState(others[0]?.id || '');
  const newTid = mode === 'same' ? cls.tid : otherTid;
  const newTeacher = (teachers || []).find(t => t.id === newTid);
  const newTs = date && time ? pktToTs(date, time) : NaN;
  const valid = !isNaN(newTs) && (mode === 'same' || otherTid);
  const clr = COURSE_TAG[cls.course] || '#555'; const isLeave = cls.status === 'leave'; const tch = newTid !== cls.tid;
  const seg = a => ({ flex: 1, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'center', fontSize: 12.5, fontWeight: 700, border: `1.5px solid ${a ? C.teal : C.border}`, background: a ? '#eafaf7' : '#fff', color: a ? C.teal : C.textMid, fontFamily: "'DM Sans', sans-serif" });
  return (
    <ModalShell title="Reschedule Class" subtitle="New class time (Pakistan Standard Time)" onClose={onClose} width={560}>
      <div style={{ background: isLeave ? '#f2ebfa' : '#e9f3fb', border: `1px solid ${isLeave ? '#d9c7f0' : '#c5e0f0'}`, borderRadius: 8, padding: '9px 13px', marginBottom: 16, fontSize: 12, color: C.textMid }}>🗓 {isLeave ? <span>Student is <strong style={{ color: C.purple }}>On Leave</strong>. Pick a new date/time/teacher.</span> : <span>Admin reschedule — pick a new date/time/teacher.</span>}</div>
      <div style={{ background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}><Avatar name={student.name} color={clr} size={44} photo={student.photo} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{student.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{student.country} · with {teacher ? teacher.name : 'Unassigned'}</div></div><div style={{ textAlign: 'right' }}><Badge label={cls.course} color={clr} /><div style={{ fontSize: 11, color: C.textMuted, marginTop: 5, textDecoration: 'line-through' }}>{fmtTime(cls.time)} · {fmtDate(cls.time)}</div></div></div>
      <Field label="Teacher for this class"><div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><div style={seg(mode === 'same')} onClick={() => setMode('same')}>👨‍🏫 Same teacher</div><div style={others.length ? seg(mode === 'other') : { ...seg(false), opacity: 0.45, cursor: 'not-allowed' }} onClick={() => others.length && setMode('other')}>🔁 Assign another</div></div>{mode === 'same' ? <div style={{ fontSize: 13, color: C.text, background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 7, padding: '10px 12px' }}>Keeping <strong>{teacher ? teacher.name : 'current teacher'}</strong>.</div> : others.length ? <select style={inputStyle} value={otherTid} onChange={e => setOtherTid(e.target.value)}>{others.map(t => <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>)}</select> : <div style={{ fontSize: 12, color: C.textMuted }}>No other teachers.</div>}</Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><Field label="New Date (PKT)"><input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} /></Field><Field label="New Time (PKT)"><input type="time" style={inputStyle} value={time} onChange={e => setTime(e.target.value)} /></Field></div>
      {valid && <div style={{ background: '#e8f6ec', border: '1px solid #9ad3ab', borderRadius: 8, padding: '11px 14px', marginBottom: 14, fontSize: 13, color: C.text }}>✓ New time: <strong>{fmtTime(newTs)} PKT</strong> on <strong>{fmtDate(newTs)}</strong>{tch && <> · with <strong>{newTeacher ? newTeacher.name : ''}</strong></>}</div>}
      <div style={{ background: '#fff8e6', border: '1px solid #ffd980', borderRadius: 8, padding: '10px 14px', marginBottom: 6, fontSize: 12, color: C.textMid }}>📩 {student.parent || 'Parent'} will be notified at <strong>{student.parentPhone || student.parentEmail || 'registered contact'}</strong>.</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="primary" disabled={!valid} onClick={() => onReschedule(cls.id, newTs, newTid)}>✓ Confirm &amp; Notify</Btn></div>
    </ModalShell>
  );
}

function FileComplaintModal({ teachers, complaints, defaultTid, onFile, onClose }) {
  const [tid, setTid] = useState(defaultTid || teachers[0]?.id || '');
  const [text, setText] = useState('');
  const t = teachers.find(x => x.id === tid); const phase = teacherPhase(t); const s = t ? compStats(tid, complaints) : null;
  const valid = tid && text.trim().length > 4;
  return (
    <ModalShell title="File a Complaint" subtitle="Lodge a complaint regarding a teacher" onClose={onClose} width={520}>
      <Field label="Teacher"><select style={inputStyle} value={tid} onChange={e => setTid(e.target.value)}>{teachers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.subject}</option>)}</select></Field>
      {t && <div style={{ background: phase === 'post' ? '#fdf3f2' : '#fff8e6', border: `1px solid ${phase === 'post' ? '#f3d4d0' : '#ffd980'}`, borderRadius: 8, padding: '9px 13px', marginBottom: 14, fontSize: 11.5, color: C.textMid, lineHeight: 1.55 }}>{phase === 'post' ? <>⚠️ This teacher has a prior suspension. New complaints go <strong>directly to the Administrator</strong>. ({s.supPost} pending with you)</> : <>This complaint stays with the Supervisor. Once <strong>3 complaints</strong> are gathered, you can forward the case to the Manager. (Currently {s.supPre}/3)</>}</div>}
      <Field label="Complaint Details"><textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={text} onChange={e => setText(e.target.value)} placeholder="Describe the issue — punctuality, conduct, missed classes, parent feedback…" /></Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn variant="danger" disabled={!valid} onClick={() => onFile(tid, text.trim())}>📝 Submit Complaint</Btn></div>
    </ModalShell>
  );
}

function ComplaintListModal({ teacher, complaints, onClose }) {
  const list = complaints.filter(c => c.tid === teacher.id).sort((a, b) => b.time - a.time);
  return <ModalShell title="Complaints On File" subtitle={teacher.name} onClose={onClose} width={560}>{list.length === 0 ? <p style={{ color: C.textMuted }}>No complaints recorded.</p> : list.map(c => <div key={c.id} style={{ background: c.resolved ? C.pageBg : '#fdf3f2', border: `1px solid ${c.resolved ? C.border : '#f3d4d0'}`, borderRadius: 9, padding: '12px 15px', marginBottom: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, flexWrap: 'wrap', gap: 6 }}><span style={{ fontSize: 11, fontWeight: 700, color: c.resolved ? C.textMuted : C.red }}>{c.resolved ? '✓ Resolved' : (c.phase === 'post' ? 'Post-suspension' : 'Active')}</span><span style={{ fontSize: 11, color: C.textMuted }}>{fmtDateTime(c.time)}</span></div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.55 }}>{c.text}</div><div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 5 }}>Filed by {c.byName} · at: {STAGE_LABEL[c.stage]}</div></div>)}<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}><Btn variant="ghost" onClick={onClose}>Close</Btn></div></ModalShell>;
}

function LoginPage({ users, onLogin }) {
  const [un, setUn] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [loading, setLoading] = useState(false); const [more, setMore] = useState(false);
  const submit = () => { setLoading(true); setErr(''); setTimeout(() => { const u = users.find(x => x.un === un && x.pw === pw); if (u) onLogin(u); else setErr('Invalid credentials. Please try again.'); setLoading(false); }, 450); };
  const inp = { width: '100%', padding: '11px 14px', border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box', color: C.text, background: '#fefdfb' };
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 5 };
  const basic = [{ role: 'Admin', un: 'admin', pw: 'admin123' }, { role: 'Supervisor', un: 'supervisor', pw: 'super123' }, { role: 'Teacher (Ahmad)', un: 'ustadh.ahmad', pw: 'pass123' }];
  const exec = [{ role: 'Manager', un: 'manager', pw: 'manager123' }, { role: 'HR', un: 'hr', pw: 'hr12345' }, { role: 'Operations Head', un: 'operations', pw: 'ops12345' }, { role: 'CEO', un: 'ceo', pw: 'ceo12345' }];
  const row = d => <div key={d.un} onClick={() => { setUn(d.un); setPw(d.pw); }} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', borderRadius: 6, cursor: 'pointer' }}><span style={{ fontSize: 12, fontWeight: 600, color: C.textMid }}>{d.role}</span><span style={{ fontSize: 11, color: C.textMuted, fontFamily: 'monospace' }}>{d.un}</span></div>;
  return (
    <div style={{ minHeight: '100vh', background: G_LOGIN, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden', padding: 16 }}>
      <svg style={{ position: 'absolute', inset: 0, opacity: 0.06, width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg"><defs><pattern id="star" patternUnits="userSpaceOnUse" width="90" height="90"><polygon points="45,6 53,33 82,33 58,52 67,80 45,63 23,80 32,52 8,33 37,33" fill="none" stroke="#C9A84C" strokeWidth="0.6" /></pattern></defs><rect width="100%" height="100%" fill="url(#star)" /></svg>
      <div style={{ background: '#fff', borderRadius: 18, padding: '40px 36px', width: '100%', maxWidth: 420, boxShadow: '0 40px 100px rgba(0,0,0,0.5)', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}><div style={{ width: 88, height: 88, margin: '0 auto 14px', filter: 'drop-shadow(0 8px 20px rgba(10,74,71,0.35))' }}><AcademyLogo size={88} /></div><h1 style={{ fontFamily: "'Amiri', serif", fontSize: 25, color: C.sidebar, margin: 0, fontWeight: 700 }}>Ain ul Quran</h1><p style={{ fontSize: 11, color: C.copper, margin: '4px 0 0', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>International Online Academy</p><div style={{ width: 50, height: 2, background: C.gold, borderRadius: 1, margin: '14px auto 0' }} /><p style={{ fontSize: 12, color: C.textMuted, marginTop: 12 }}>Staff Management Portal</p></div>
        <div style={{ marginBottom: 14 }}><label style={lbl}>Username</label><input value={un} onChange={e => setUn(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Your username" style={inp} /></div>
        <div style={{ marginBottom: 20 }}><label style={lbl}>Password</label><input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Your password" style={inp} /></div>
        {err && <div style={{ background: '#fdecea', border: '1px solid #f5c6c6', borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: C.red, fontSize: 13 }}>{err}</div>}
        <button onClick={submit} disabled={loading} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: 9, cursor: 'pointer', background: G_HEADER, color: C.gold, fontSize: 15, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1 }}>{loading ? 'Signing In…' : 'Sign In to Portal'}</button>
        <div style={{ marginTop: 22, background: '#f4efe3', borderRadius: 10, padding: 16 }}><p style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Demo Accounts — tap to fill</p><div style={{ display: 'grid', gap: 2 }}>{basic.map(row)}{more && exec.map(row)}</div><button onClick={() => setMore(!more)} style={{ marginTop: 6, background: 'none', border: 'none', color: C.teal, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{more ? '− Hide executive accounts' : '+ Show executive accounts (Manager, HR, Ops, CEO)'}</button></div>
      </div>
    </div>
  );
}

function Sidebar({ user, page, setPage, onLogout, narrow, open, alertCount, complaintCount, teacherFlag }) {
  const navByRole = {
    teacher: [{ id: 'dashboard', icon: '▦', label: 'Dashboard' }, { id: 'week', icon: '◷', label: 'This Week' }, { id: 'students', icon: '◑', label: 'My Students' }, { id: 'history', icon: '◨', label: 'Lesson History' }, { id: 'materials', icon: '◫', label: 'Materials' }, { id: 'mycomplaints', icon: '🔔', label: 'Notices', badge: teacherFlag }],
    admin: [{ id: 'dashboard', icon: '▦', label: 'Dashboard' }, { id: 'teachers', icon: '◑', label: 'Teachers' }, { id: 'records', icon: '◰', label: 'Teacher Records' }, { id: 'students', icon: '◒', label: 'Students' }, { id: 'fees', icon: '◍', label: 'Fee Collection' }, { id: 'schedule', icon: '◫', label: 'Schedule' }, { id: 'leave', icon: '◔', label: 'Leave & Reschedule' }, { id: 'attendance', icon: '◧', label: 'Attendance' }, { id: 'payroll', icon: '◉', label: 'Payroll' }, { id: 'complaints', icon: '⚖', label: 'Discipline', badge: complaintCount }, { id: 'alerts', icon: '◕', label: 'Parent Alerts', badge: alertCount }, { id: 'reports', icon: '◨', label: 'Reports' }, { id: 'materials', icon: '◩', label: 'Materials' }],
    supervisor: [{ id: 'dashboard', icon: '▦', label: 'Dashboard' }, { id: 'monitor', icon: '◐', label: 'Live Monitor' }, { id: 'complaints', icon: '⚖', label: 'Teacher Complaints', badge: complaintCount }, { id: 'reports', icon: '◨', label: 'Reports' }, { id: 'materials', icon: '◫', label: 'Materials' }],
    manager: [{ id: 'dashboard', icon: '⚖', label: 'Teacher Complaints', badge: complaintCount }, { id: 'messages', icon: '✉', label: 'Notices' }],
    hr: [{ id: 'dashboard', icon: '⚖', label: 'Disciplinary Cases', badge: complaintCount }, { id: 'messages', icon: '✉', label: 'Notices' }],
    operations: [{ id: 'dashboard', icon: '⚖', label: 'Escalated Cases', badge: complaintCount }, { id: 'messages', icon: '✉', label: 'Notices' }],
    ceo: [{ id: 'dashboard', icon: '⚖', label: 'Final Decisions', badge: complaintCount }, { id: 'messages', icon: '✉', label: 'Notices' }],
  };
  const nav = navByRole[user.role] || navByRole.teacher;
  const roleLabel = { operations: 'Operations Head', ceo: 'CEO', hr: 'HR Officer', manager: 'Manager' }[user.role] || user.role;
  return (
    <div style={{ width: 224, background: C.sidebar, height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 100, display: 'flex', flexDirection: 'column', boxShadow: '4px 0 24px rgba(0,0,0,0.25)', transform: narrow && !open ? 'translateX(-100%)' : 'translateX(0)', transition: 'transform 0.25s ease' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 11 }}><AcademyLogo size={44} /><div><div style={{ fontFamily: "'Amiri', serif", fontSize: 15, color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>Ain ul Quran</div><div style={{ fontSize: 9, color: C.gold, textTransform: 'uppercase', letterSpacing: 1.2 }}>Online Academy</div></div></div></div>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{user.photo ? <img src={user.photo} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${C.gold}` }} /> : <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.gold, color: '#1a1200', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{user.init}</div>}<div style={{ overflow: 'hidden' }}><div style={{ fontSize: 12, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortName(user.name)}</div><div style={{ fontSize: 10, color: C.gold, textTransform: 'capitalize' }}>{roleLabel}</div></div></div></div>
      <nav style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>{nav.map(item => { const active = page === item.id; return <div key={item.id} onClick={() => setPage(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, marginBottom: 2, cursor: 'pointer', background: active ? 'rgba(201,168,76,0.16)' : 'transparent', borderLeft: active ? `3px solid ${C.gold}` : '3px solid transparent', color: active ? C.gold : 'rgba(255,255,255,0.62)' }}><span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span><span style={{ fontSize: 13, fontWeight: active ? 600 : 400, flex: 1 }}>{item.label}</span>{item.badge ? <span style={{ background: C.red, color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 10, padding: '1px 7px', minWidth: 16, textAlign: 'center' }}>{item.badge}</span> : null}</div>; })}</nav>
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}><div onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.45)' }}><span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>⏻</span><span style={{ fontSize: 13 }}>Sign Out</span></div></div>
    </div>
  );
}

function TopBar({ title, user, narrow, onMenu }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return <div style={{ height: 62, background: '#fff', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: narrow ? '0 16px' : '0 28px', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}><div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>{narrow && <button onClick={onMenu} style={{ width: 38, height: 38, borderRadius: 8, border: `1px solid ${C.border}`, background: C.pageBg, color: C.text, fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>☰</button>}<h2 style={{ fontFamily: "'Amiri', serif", fontSize: narrow ? 17 : 20, color: C.text, margin: 0, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h2></div><div style={{ display: 'flex', alignItems: 'center', gap: narrow ? 10 : 20, flexShrink: 0 }}>{!narrow && <div style={{ textAlign: 'right' }}><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: PKT_TZ })} <span style={{ fontSize: 10, fontWeight: 700, color: C.copper }}>PKT</span></div><div style={{ fontSize: 11, color: C.textMuted }}>{now.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: PKT_TZ })}</div></div>}{user.photo ? <img src={user.photo} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.gold}` }} /> : <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.sidebar, color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>{user.init}</div>}</div></div>;
}

function ReportModal({ cls, student, onSave, onClose, readOnly, existingReport }) {
  const [form, setForm] = useState(existingReport || { lesson: '', quantity: '', mistakes: '', homework: '', remarks: '', nextLesson: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fields = [{ k: 'lesson', label: 'Lesson Taught', rows: 1, ph: 'e.g. Surah Al-Baqarah – Verses 1-10' }, { k: 'quantity', label: 'Quantity Covered', rows: 1, ph: 'e.g. 10 verses' }, { k: 'mistakes', label: 'Mistakes & Corrections', rows: 3, ph: 'Errors and corrections…' }, { k: 'homework', label: 'Homework Assigned', rows: 2, ph: 'Homework…' }, { k: 'remarks', label: 'Teacher Remarks', rows: 2, ph: 'Performance, progress…' }, { k: 'nextLesson', label: 'Next Lesson Plan', rows: 1, ph: 'e.g. Verses 11-20' }];
  const canSave = !readOnly && fields.every(f => (form[f.k] || '').trim());
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 40px 120px rgba(0,0,0,0.4)' }}>
        <div style={{ background: G_HEADER, borderRadius: '16px 16px 0 0', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><div style={{ fontFamily: "'Amiri', serif", fontSize: 22, color: C.gold, fontWeight: 700 }}>{readOnly ? 'Lesson Report' : 'Post-Class Report'}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{student.name} · {cls.course} · {fmtTime(cls.time)} · {fmtDate(cls.time)}</div></div><button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20 }}>×</button></div>
        <div style={{ padding: '28px 28px 24px' }}>{!readOnly && <div style={{ background: '#fff8e6', border: '1px solid #ffd980', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: 12, color: C.textMid }}>📌 Mandatory. On saving, the parent is notified.</div>}<div style={{ display: 'grid', gap: 16 }}>{fields.map(f => <div key={f.k}><label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: C.textMid, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 5 }}>{f.label}{!readOnly && <span style={{ color: C.red }}> *</span>}</label>{f.rows === 1 ? <input value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} readOnly={readOnly} style={{ ...inputStyle, background: readOnly ? C.pageBg : '#fdfcf8' }} /> : <textarea value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder={f.ph} rows={f.rows} readOnly={readOnly} style={{ ...inputStyle, resize: 'vertical', background: readOnly ? C.pageBg : '#fdfcf8' }} />}</div>)}</div><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}><Btn variant="ghost" onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Btn>{!readOnly && <Btn variant="primary" onClick={() => canSave && onSave(form)} disabled={!canSave}>✓ Save &amp; Notify</Btn>}</div></div>
      </div>
    </div>
  );
}

function ClassRow({ cls, students, onStatus, onReport, onTooEarly, reports }) {
  const student = students.find(s => s.id === cls.sid);
  if (!student) return null;
  const clr = COURSE_TAG[cls.course] || '#555';
  const report = reports.find(r => r.cid === cls.id);
  const reachedTime = cls.time <= Date.now() + ACTIVATE_LEAD;
  const CFG = { scheduled: { label: 'Scheduled', bg: '#e9f3fb', c: '#1a6fa8' }, active: { label: 'Active', bg: '#fff8e6', c: '#c0703a' }, started: { label: 'In Progress', bg: '#e8f6ec', c: '#2f8f4a' }, completed: { label: 'Completed', bg: '#e8f6ec', c: '#2f8f4a' }, absent: { label: 'Absent', bg: '#fdecea', c: C.red }, leave: { label: 'On Leave', bg: '#f2ebfa', c: C.purple } };
  const sc = CFG[cls.status] || CFG.scheduled;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 130px 130px 110px 1.1fr', alignItems: 'center', gap: 12, padding: '14px 18px', background: cls.status === 'active' ? '#fffdf4' : cls.status === 'started' ? '#f4fbf6' : C.pageBg, borderRadius: 9, border: `1px solid ${cls.status === 'active' ? '#ffd980' : cls.status === 'started' ? '#9ad3ab' : C.border}`, marginBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={student.name} color={clr} size={38} photo={student.photo} /><div><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{student.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{student.country}</div></div></div>
      <Badge label={cls.course} color={clr} />
      <div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{fmtTime(cls.time)} <span style={{ fontSize: 9, color: C.copper, fontWeight: 700 }}>PKT</span></div><div style={{ fontSize: 11, color: C.textMuted }}>{fmtDate(cls.time)}</div></div>
      <span style={{ background: sc.bg, color: sc.c, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, textAlign: 'center' }}>{sc.label}</span>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {cls.status === 'scheduled' && (<><Btn size="sm" variant="ghost" onClick={() => onStatus(cls.id, 'leave')}>✗ Leave</Btn><Btn size="sm" variant="warning" onClick={() => reachedTime ? onStatus(cls.id, 'active') : onTooEarly(cls)}>● Active</Btn></>)}
        {cls.status === 'active' && (<><Btn size="sm" variant="success" onClick={() => onStatus(cls.id, 'started')}>▶ Start</Btn><Btn size="sm" variant="ghost" onClick={() => onStatus(cls.id, 'leave')}>✗ Leave</Btn></>)}
        {cls.status === 'started' && (<><Btn size="sm" variant="danger" onClick={() => onStatus(cls.id, 'end')}>⏹ End</Btn><Btn size="sm" variant="ghost" onClick={() => onStatus(cls.id, 'absent')}>✗ Absent</Btn></>)}
        {cls.status === 'completed' && <Btn size="sm" variant="teal" onClick={() => onReport(cls.id, !!report)}>📋 {report ? 'View Report' : 'Add Report'}</Btn>}
        {cls.status === 'absent' && <span style={{ fontSize: 11, color: C.red, fontStyle: 'italic', textAlign: 'right' }}>Absent · parent notified</span>}
        {cls.status === 'leave' && <span style={{ fontSize: 11, color: C.purple, fontStyle: 'italic', textAlign: 'right' }}>Leave · admin reschedules</span>}
      </div>
    </div>
  );
}

function TeacherDashboard({ user, students, classes, setClasses, reports, setReports, onNotify }) {
  const [modal, setModal] = useState(null); const [early, setEarly] = useState(null);
  const stu = id => students.find(s => s.id === id);
  const now = Date.now();
  const window24 = classes.filter(c => c.tid === user.id && c.time > now - DAY && c.time < now + DAY).sort((a, b) => a.time - b.time);
  const completed = window24.filter(c => c.status === 'completed').length;
  const upcoming = window24.filter(c => ['scheduled', 'active'].includes(c.status)).length;
  const absent = window24.filter(c => c.status === 'absent').length;
  const handleStatus = (cid, ns) => { if (ns === 'end') { setModal({ classId: cid, readOnly: false }); return; } setClasses(p => p.map(c => c.id === cid ? { ...c, status: ns } : c)); if (ns === 'absent') onNotify && onNotify('absent', cid); };
  const handleReport = (cid, has) => setModal({ classId: cid, readOnly: has, report: reports.find(x => x.cid === cid) || null });
  const saveReport = (cid, data) => { const cls = classes.find(c => c.id === cid); setReports(p => [...p.filter(r => r.cid !== cid), { id: 'r' + Date.now(), cid, sid: cls.sid, tid: cls.tid, date: new Date().toLocaleDateString('en-GB'), ...data }]); setClasses(p => p.map(c => c.id === cid ? { ...c, status: 'completed' } : c)); onNotify && onNotify('completed', cid); setModal(null); };
  const mc = modal ? classes.find(c => c.id === modal.classId) : null; const ms = mc ? stu(mc.sid) : null;
  return (
    <div>
      <div style={{ background: '#eef7f1', border: '1px solid #b6dcc4', borderRadius: 10, padding: '10px 18px', marginBottom: 18, fontSize: 12.5, color: C.textMid }}>🕔 All class times are in <strong>Pakistan Standard Time (PKT)</strong>.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 26 }}><StatCard label="Classes (24h)" value={window24.length} icon="📅" color={C.blue} /><StatCard label="Completed" value={completed} icon="✅" color={C.green} /><StatCard label="Upcoming" value={upcoming} icon="⏰" color={C.orange} /><StatCard label="Absent" value={absent} icon="⚠️" color={C.red} /></div>
      <Card><CardHeader title="24-Hour Class Schedule" subtitle="Your classes within the last & next 24 hours (PKT)" right={<Badge label={`${window24.length} classes`} color={C.blue} />} /><Scroll min={640}><div style={{ display: 'grid', gridTemplateColumns: '1.4fr 130px 130px 110px 1.1fr', padding: '10px 18px', background: '#f7f3ea', borderBottom: `1px solid ${C.border}`, fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}><span>Student</span><span>Course</span><span>Time (PKT)</span><span>Status</span><span style={{ textAlign: 'right' }}>Actions</span></div><div style={{ padding: 12 }}>{window24.length === 0 ? <div style={{ padding: '40px 20px', textAlign: 'center', color: C.textMuted }}>No classes in the next 24 hours.</div> : window24.map(cls => <ClassRow key={cls.id} cls={cls} students={students} onStatus={handleStatus} onReport={handleReport} onTooEarly={c => setEarly(c)} reports={reports} />)}</div></Scroll></Card>
      {modal && mc && ms && <ReportModal cls={mc} student={ms} onSave={(d) => saveReport(modal.classId, d)} onClose={() => setModal(null)} readOnly={modal.readOnly} existingReport={modal.report} />}
      {early && <TooEarlyModal cls={early} student={stu(early.sid)} onClose={() => setEarly(null)} />}
    </div>
  );
}

function WeeklySchedule({ user, students, classes }) {
  const stu = id => students.find(s => s.id === id);
  const { startTs, todayIdx } = pktWeekInfo(); const endTs = startTs + 7 * DAY;
  const week = classes.filter(c => c.tid === user.id && c.time >= startTs && c.time < endTs).sort((a, b) => a.time - b.time);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const completed = week.filter(c => c.status === 'completed').length;
  const upcoming = week.filter(c => ['scheduled', 'active', 'started'].includes(c.status)).length;
  const daysWith = new Set(week.map(c => Math.floor((c.time - startTs) / DAY))).size;
  const STAT = { scheduled: C.blue, active: C.orange, started: C.green, completed: C.green, absent: C.red, leave: C.purple };
  const SL = { scheduled: 'Scheduled', active: 'Active', started: 'In Progress', completed: 'Completed', absent: 'Absent', leave: 'On Leave' };
  const dayLabel = ts => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: PKT_TZ });
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 22 }}><StatCard label="Classes This Week" value={week.length} icon="🗓" color={C.teal} /><StatCard label="Completed" value={completed} icon="✅" color={C.green} /><StatCard label="Upcoming" value={upcoming} icon="⏰" color={C.orange} /><StatCard label="Days with Classes" value={`${daysWith}/7`} icon="📆" color={C.blue} /></div>
      <Card><CardHeader title="My Weekly Schedule" subtitle={`Week of ${fmtDate(startTs)} – ${fmtDate(endTs - DAY)} · PKT`} right={<Badge label={`${week.length} classes`} color={C.teal} />} /><div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>{[...Array(7)].map((_, i) => { const dayStart = startTs + i * DAY; const dc = week.filter(c => c.time >= dayStart && c.time < dayStart + DAY); const isT = i === todayIdx; return <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 14, background: isT ? '#f0fbf8' : C.pageBg, border: `1px solid ${isT ? C.teal : C.border}`, borderRadius: 10, padding: '14px 16px', alignItems: 'flex-start' }}><div><div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ fontFamily: "'Amiri', serif", fontSize: 16, fontWeight: 700, color: isT ? C.teal : C.text }}>{dayNames[i]}</span>{isT && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: C.teal, padding: '2px 7px', borderRadius: 10 }}>TODAY</span>}</div><div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>{dayLabel(dayStart)}</div><div style={{ fontSize: 11, fontWeight: 700, color: dc.length ? C.teal : C.textMuted, marginTop: 6 }}>{dc.length} class{dc.length !== 1 ? 'es' : ''}</div></div><div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{dc.length === 0 ? <div style={{ fontSize: 12, color: C.textMuted, fontStyle: 'italic', padding: '6px 0' }}>No classes scheduled</div> : dc.map(c => { const s = stu(c.sid); const clr = COURSE_TAG[c.course] || '#555'; return <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px' }}><div style={{ width: 58, fontSize: 12, fontWeight: 700, color: C.text }}>{fmtTime(c.time)}</div><Avatar name={s?.name} color={clr} size={30} photo={s?.photo} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s?.name || '—'}</div><div style={{ fontSize: 11, color: C.textMuted }}>{s?.country}</div></div><Badge label={c.course} color={clr} /><span style={{ fontSize: 10.5, fontWeight: 700, color: STAT[c.status] || C.blue, background: (STAT[c.status] || C.blue) + '15', padding: '3px 9px', borderRadius: 20 }}>{SL[c.status] || c.status}</span></div>; })}</div></div>; })}</div></Card>
    </div>
  );
}

function MyStudents({ user, students, reports, onViewHistory }) {
  const list = user.role === 'teacher' ? students.filter(s => s.tid === user.id) : students;
  return (
    <Card><CardHeader title="My Students" subtitle={`${list.length} students assigned`} /><div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>{list.map(s => { const rate = pct(s.attended, s.total); const clr = COURSE_TAG[s.course] || '#555'; const rc = reports.filter(r => r.sid === s.id).length; return <Scroll min={620} key={s.id}><div style={{ display: 'grid', gridTemplateColumns: '1.4fr 130px 190px 70px 160px', alignItems: 'center', gap: 14, padding: '14px 18px', background: C.pageBg, borderRadius: 10, border: `1px solid ${C.border}` }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Avatar name={s.name} color={clr} size={42} photo={s.photo} /><div><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{s.country} · Age {s.age}</div></div></div><Badge label={s.course} color={clr} /><div><div style={{ fontSize: 12, color: C.text }}>{s.attended}/{s.total} attended</div><Progress value={rate} color={rateColor(rate)} /></div><div style={{ fontSize: 14, fontWeight: 700, color: rateColor(rate) }}>{rate}%</div><div><Btn size="sm" variant="teal" onClick={() => onViewHistory(s.id)}>📋 History ({rc})</Btn></div></div></Scroll>; })}</div></Card>
  );
}

function LessonHistory({ user, students, reports, initStudentId }) {
  const [selId, setSelId] = useState(initStudentId || null);
  const list = user.role === 'teacher' ? students.filter(s => s.tid === user.id) : students;
  const selReports = selId ? [...reports.filter(r => r.sid === selId)].reverse() : [];
  const selStudent = students.find(s => s.id === selId);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 20 }}>
      <Card><div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}` }}><div style={{ fontFamily: "'Amiri', serif", fontSize: 16, fontWeight: 700, color: C.text }}>Students</div></div><div>{list.map(s => { const rc = reports.filter(r => r.sid === s.id).length; const active = selId === s.id; return <div key={s.id} onClick={() => setSelId(s.id)} style={{ padding: '13px 18px', cursor: 'pointer', background: active ? C.sidebar : 'transparent', borderLeft: active ? `3px solid ${C.gold}` : '3px solid transparent' }}><div style={{ fontSize: 13, fontWeight: 600, color: active ? '#fff' : C.text }}>{s.name}</div><div style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.6)' : C.textMuted }}>{s.course} · {rc} report{rc !== 1 ? 's' : ''}</div></div>; })}</div></Card>
      <div>{!selId || !selStudent ? <Card style={{ padding: 48, textAlign: 'center' }}><div style={{ fontSize: 52, marginBottom: 12 }}>📋</div><p style={{ color: C.textMuted, fontSize: 14 }}>Select a student to view their lesson history</p></Card> : <><Card style={{ padding: '18px 24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}><Avatar name={selStudent.name} color={COURSE_TAG[selStudent.course] || '#555'} size={52} photo={selStudent.photo} /><div><div style={{ fontFamily: "'Amiri', serif", fontSize: 20, fontWeight: 700, color: C.text }}>{selStudent.name}</div><div style={{ fontSize: 12, color: C.textMuted }}>{selStudent.course} · {selStudent.country} · Age {selStudent.age} · {selReports.length} records</div></div></Card>{selReports.length === 0 ? <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ color: C.textMuted }}>No lesson reports yet.</p></Card> : selReports.map(r => <Card key={r.id} style={{ marginBottom: 12, overflow: 'hidden' }}><div style={{ background: C.pageBg, padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{r.lesson}</div><span style={{ fontSize: 11, color: C.textMuted, background: '#fff', padding: '3px 10px', borderRadius: 20, border: `1px solid ${C.border}` }}>{r.date}</span></div><div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>{[{ l: 'Quantity Covered', v: r.quantity }, { l: 'Next Lesson Plan', v: r.nextLesson }, { l: 'Mistakes & Corrections', v: r.mistakes, full: true }, { l: 'Homework', v: r.homework, full: true }, { l: 'Remarks', v: r.remarks, full: true }].map(item => <div key={item.l} style={{ gridColumn: item.full ? 'span 2' : 'auto' }}><div style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 4 }}>{item.l}</div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{item.v}</div></div>)}</div></Card>)}</>}</div>
    </div>
  );
}

function MaterialViewer({ mat, icon, onClose }) {
  const [zoom, setZoom] = useState(1); const [page, setPage] = useState(1); const [fs, setFs] = useState(false); const ref = useRef(null);
  const isPdf = !!mat.pdfData; const PAGES = 6, W = 700, H = 990;
  useEffect(() => { const onFs = () => setFs(!!document.fullscreenElement); document.addEventListener('fullscreenchange', onFs); const onKey = e => { if (e.key === 'Escape' && !document.fullscreenElement) onClose(); if (!isPdf && e.key === 'ArrowRight') setPage(p => Math.min(PAGES, p + 1)); if (!isPdf && e.key === 'ArrowLeft') setPage(p => Math.max(1, p - 1)); }; window.addEventListener('keydown', onKey); return () => { document.removeEventListener('fullscreenchange', onFs); window.removeEventListener('keydown', onKey); }; }, [onClose, isPdf]);
  const toggleFs = () => { try { if (!document.fullscreenElement) ref.current?.requestFullscreen?.(); else document.exitFullscreen?.(); } catch (e) {} };
  const setZ = d => setZoom(z => Math.min(3, Math.max(0.5, +(z + d).toFixed(2))));
  const tb = { padding: '6px 11px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' };
  const nb = on => ({ ...tb, opacity: on ? 1 : 0.35, cursor: on ? 'pointer' : 'not-allowed' });
  return (
    <div ref={ref} onContextMenu={e => e.preventDefault()} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#2f3331', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: G_HEADER, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}><span style={{ fontSize: 22 }}>{icon}</span><div style={{ minWidth: 0 }}><div style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 260 }}>{mat.title}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{mat.cat} · {mat.size}{isPdf ? ' · PDF' : ''}</div></div><span style={{ background: 'rgba(201,168,76,0.18)', color: C.gold, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🔒 View Only</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>{!isPdf && <><button style={nb(page > 1)} onClick={() => setPage(p => Math.max(1, p - 1))}>‹ Prev</button><span style={{ color: '#fff', fontSize: 12, minWidth: 80, textAlign: 'center' }}>Page {page} / {PAGES}</span><button style={nb(page < PAGES)} onClick={() => setPage(p => Math.min(PAGES, p + 1))}>Next ›</button><span style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.2)' }} /><button style={nb(zoom > 0.5)} onClick={() => setZ(-0.25)}>−</button><span style={{ color: '#fff', fontSize: 12, minWidth: 46, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span><button style={nb(zoom < 3)} onClick={() => setZ(0.25)}>+</button><button style={tb} onClick={() => setZoom(1)}>Fit</button></>}<button style={tb} onClick={toggleFs}>{fs ? '⤡ Exit' : '⤢ Fullscreen'}</button><button style={{ ...tb, background: C.gold, color: '#1a1200', border: 'none' }} onClick={onClose}>✕ Close</button></div>
      </div>
      {isPdf ? <div style={{ flex: 1, background: '#525659' }}><iframe src={mat.pdfData + '#toolbar=0&navpanes=0&view=FitH'} title={mat.title} style={{ width: '100%', height: '100%', border: 'none', background: '#fff', display: 'block' }} /></div> : <div style={{ flex: 1, overflow: 'auto', padding: 24, userSelect: 'none', textAlign: 'center' }}><div style={{ width: W * zoom, height: H * zoom, display: 'inline-block', textAlign: 'left' }}><div style={{ width: W, height: H, transform: `scale(${zoom})`, transformOrigin: 'top left', background: '#fff', boxShadow: '0 8px 36px rgba(0,0,0,0.45)', borderRadius: 2, padding: '60px 64px', boxSizing: 'border-box', overflow: 'hidden', position: 'relative' }}>{page === 1 && <div style={{ textAlign: 'center', marginBottom: 44 }}><div style={{ width: 70, height: 70, margin: '0 auto' }}><AcademyLogo size={70} /></div><div style={{ fontFamily: "'Amiri', serif", fontSize: 30, fontWeight: 700, color: C.text, marginTop: 12 }}>{mat.title}</div><div style={{ width: 80, height: 3, background: C.gold, margin: '16px auto' }} /><div style={{ fontSize: 14, color: C.textMuted }}>Ain ul Quran International Online Academy</div><div style={{ marginTop: 16 }}><Badge label={mat.cat} color={MAT_TAG[mat.cat] || '#555'} /></div></div>}{[...Array(page === 1 ? 9 : 14)].map((_, i) => <div key={i} style={{ height: 12, borderRadius: 5, background: '#e9e5da', marginBottom: 18, width: (i % 4 === 3 ? 55 : i % 2 === 0 ? 100 : 84) + '%' }} />)}<div style={{ position: 'absolute', bottom: 28, left: 0, right: 0, textAlign: 'center', fontSize: 13, color: C.textMuted }}>— Page {page} —</div></div></div></div>}
      <div style={{ background: '#fff8e6', padding: '9px 16px', textAlign: 'center', fontSize: 12, color: C.textMid, flexShrink: 0 }}>🔒 View-only — downloading, printing &amp; saving are disabled.</div>
    </div>
  );
}

function Materials({ user, materials, setMaterials }) {
  const [tab, setTab] = useState('All'); const [showAdd, setShowAdd] = useState(false); const [viewing, setViewing] = useState(null);
  const [newM, setNewM] = useState({ title: '', cat: 'Qurani Qaida', size: '', pdfData: '', fileName: '' }); const fileRef = useRef(null);
  const cats = ['All', 'Qurani Qaida', 'Quran PDFs', 'Tajweed Material', 'Islamic Studies PDFs', 'Worksheets'];
  const icons = { 'Qurani Qaida': '📖', 'Quran PDFs': '📕', 'Tajweed Material': '🎵', 'Islamic Studies PDFs': '🕌', 'Worksheets': '📝' };
  const filtered = tab === 'All' ? materials : materials.filter(x => x.cat === tab);
  const openViewer = mat => { setViewing(mat); setMaterials(p => p.map(x => x.id === mat.id ? { ...x, dl: (x.dl || 0) + 1 } : x)); };
  const resetNew = () => setNewM({ title: '', cat: 'Qurani Qaida', size: '', pdfData: '', fileName: '' });
  const onPickFile = e => { const file = e.target.files && e.target.files[0]; if (!file) return; if (file.type && file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) { alert('Please choose a PDF file.'); e.target.value = ''; return; } const r = new FileReader(); r.onload = () => setNewM(o => ({ ...o, pdfData: r.result, size: fmtBytes(file.size), fileName: file.name, title: o.title || file.name.replace(/\.[^.]+$/, '') })); r.readAsDataURL(file); };
  const canUpload = newM.title.trim() && (newM.pdfData || newM.size);
  const doUpload = () => { if (!canUpload) return; setMaterials(p => [...p, { id: 'm' + Date.now(), title: newM.title.trim(), cat: newM.cat, size: newM.size || '—', date: new Date().toLocaleDateString('en-GB'), dl: 0, pdfData: newM.pdfData || '', fileName: newM.fileName || '' }]); setShowAdd(false); resetNew(); };
  return (
    <div>
      <Card>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><div><h3 style={{ fontFamily: "'Amiri', serif", fontSize: 20, color: C.text, margin: 0 }}>Ain ul Quran Material</h3><p style={{ fontSize: 12, color: C.textMuted, margin: '3px 0 0' }}>Shared across the whole academy</p></div>{user.role === 'admin' && <Btn variant="primary" onClick={() => { resetNew(); setShowAdd(true); }}>+ Upload Material</Btn>}</div>
        <div style={{ background: '#fff8e6', borderBottom: `1px solid ${C.border}`, padding: '10px 24px', fontSize: 12, color: C.textMid }}>🔒 All materials are <strong>view-only</strong> and shared with every teacher &amp; supervisor.</div>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>{cats.map(c => <button key={c} onClick={() => setTab(c)} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', background: tab === c ? C.sidebar : C.pageBg, color: tab === c ? C.gold : C.textMid, fontSize: 12, fontWeight: tab === c ? 700 : 400, fontFamily: "'DM Sans', sans-serif" }}>{c !== 'All' ? icons[c] + ' ' : ''}{c}</button>)}</div>
        <div style={{ padding: 16 }}><Scroll min={620}><div style={{ display: 'grid', gridTemplateColumns: '1fr 170px 70px 70px 150px', padding: '8px 14px', fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}><span>File</span><span>Category</span><span>Size</span><span>Views</span><span>Action</span></div>{filtered.map(mat => <div key={mat.id} style={{ display: 'grid', gridTemplateColumns: '1fr 170px 70px 70px 150px', alignItems: 'center', gap: 12, padding: '12px 14px', background: C.pageBg, borderRadius: 8, marginBottom: 6, border: `1px solid ${C.border}` }}><div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => openViewer(mat)}><span style={{ fontSize: 22 }}>{icons[mat.cat] || '📄'}</span><div><div style={{ fontSize: 13, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 7 }}>{mat.title}{mat.pdfData && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: C.green, padding: '1px 6px', borderRadius: 9 }}>UPLOADED</span>}</div><div style={{ fontSize: 11, color: C.textMuted }}>Added {mat.date}</div></div></div><Badge label={mat.cat} color={MAT_TAG[mat.cat] || '#555'} /><span style={{ fontSize: 12, color: C.textMid }}>{mat.size}</span><span style={{ fontSize: 12, color: C.textMid }}>{mat.dl || 0}×</span><div style={{ display: 'flex', gap: 6 }}><Btn size="sm" variant="teal" onClick={() => openViewer(mat)}>Open</Btn>{user.role === 'admin' && <Btn size="sm" variant="ghost" onClick={() => setMaterials(p => p.filter(x => x.id !== mat.id))}>🗑</Btn>}</div></div>)}</Scroll></div>
      </Card>
      {viewing && <MaterialViewer mat={viewing} icon={icons[viewing.cat] || '📄'} onClose={() => setViewing(null)} />}
      {showAdd && <ModalShell title="Upload New Material" subtitle="Choose a PDF" onClose={() => { setShowAdd(false); resetNew(); }} width={520}><Field label="PDF File"><input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={onPickFile} style={{ display: 'none' }} /><div onClick={() => fileRef.current && fileRef.current.click()} style={{ cursor: 'pointer', border: `2px dashed ${newM.pdfData ? C.green : C.border}`, borderRadius: 12, padding: '22px 18px', textAlign: 'center', background: newM.pdfData ? '#f1faf3' : '#fdfcf8' }}>{newM.pdfData ? <><div style={{ fontSize: 34 }}>📄</div><div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, marginTop: 6, wordBreak: 'break-all' }}>{newM.fileName}</div><div style={{ fontSize: 11.5, color: C.green, marginTop: 3, fontWeight: 700 }}>✓ Selected · {newM.size}</div></> : <><div style={{ fontSize: 34 }}>⬆️</div><div style={{ fontSize: 14, fontWeight: 700, color: C.sidebar, marginTop: 6 }}>📂 Choose PDF File</div></>}</div></Field><Field label="Title"><input style={inputStyle} value={newM.title} onChange={e => setNewM(o => ({ ...o, title: e.target.value }))} /></Field><Field label="Category"><select style={inputStyle} value={newM.cat} onChange={e => setNewM(o => ({ ...o, cat: e.target.value }))}>{cats.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select></Field><div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}><Btn variant="ghost" onClick={() => { setShowAdd(false); resetNew(); }}>Cancel</Btn><Btn variant="primary" disabled={!canUpload} onClick={doUpload}>+ Upload for Everyone</Btn></div></ModalShell>}
    </div>
  );
}

function NotificationList({ notifications, students, compact, hideContact }) {
  if (!notifications.length) return <p style={{ color: C.textMuted, textAlign: 'center', padding: 24 }}>No notifications yet.</p>;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{notifications.map(n => { const meta = NOTIF_META[n.type] || { icon: '📩', color: C.textMid, bg: C.pageBg }; const s = students.find(x => x.id === n.sid); return <div key={n.id} style={{ display: 'flex', gap: 12, padding: '13px 16px', background: meta.bg, borderRadius: 9, border: `1px solid ${meta.color}33` }}><div style={{ width: 36, height: 36, borderRadius: 9, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{meta.icon}</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}><span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{n.title}</span><span style={{ fontSize: 11, color: C.textMuted, whiteSpace: 'nowrap' }}>{fmtDate(n.time)} · {fmtTime(n.time)}</span></div>{!compact && <div style={{ fontSize: 12.5, color: C.textMid, lineHeight: 1.5, margin: '4px 0' }}>{n.message}</div>}<div style={{ fontSize: 11, color: C.textMuted }}>📨 To: {n.parent || (s ? 'Parent of ' + s.name : 'Parent')}{!hideContact && <> · {n.contact || 'registered contact'}</>}</div></div></div>; })}</div>;
}

// ── Escalation pipeline visual ──
function Pipeline({ teacher, complaints }) {
  const s = compStats(teacher.id, complaints);
  const phase = teacherPhase(teacher);
  const steps = phase === 'pre'
    ? [{ k: 'Supervisor', n: s.supPre, need: 3 }, { k: 'Manager', n: s.mgr, need: 2 }, { k: 'HR', n: s.hr, need: 2 }, { k: isSuspended(teacher) ? 'Suspended' : 'Suspend', n: isSuspended(teacher) ? 1 : 0 }]
    : [{ k: 'Supervisor', n: s.supPost, need: 1 }, { k: 'Admin', n: s.adm, need: 2 }, { k: 'Operations', n: s.ops, need: 2 }, { k: 'CEO', n: s.ceo, need: 1 }];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {steps.map((st, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: st.n > 0 ? C.red + '18' : C.border + '40', color: st.n > 0 ? C.red : C.textMuted, whiteSpace: 'nowrap' }}>{st.k}{st.need ? ` ${st.n}/${st.need}` : (st.n ? ' ✓' : '')}</span>
          {i < steps.length - 1 && <span style={{ color: C.textMuted, fontSize: 11 }}>→</span>}
        </span>
      ))}
    </div>
  );
}

function ComplaintsView({ role, users, complaints, students, onFile, onEscalate, onDismissNotice, onReinstate }) {
  const [fileOpen, setFileOpen] = useState(false); const [fileTid, setFileTid] = useState(null);
  const [listFor, setListFor] = useState(null); const [confirm, setConfirm] = useState(null);
  const teachers = users.filter(u => u.role === 'teacher' && !u.terminated);
  const roleSees = (t, s) => { switch (role) { case 'supervisor': return true; case 'manager': return s.mgr > 0; case 'hr': return s.hr > 0; case 'admin': return s.adm > 0; case 'operations': return s.ops > 0; case 'ceo': return s.ceo > 0; default: return false; } };
  const roleAction = (t, s) => {
    const phase = teacherPhase(t);
    switch (role) {
      case 'supervisor': return phase === 'post' ? { label: `Send ${s.supPost} to Admin →`, variant: 'warning', action: 'sup2adm', enabled: s.supPost >= 1 } : { label: 'Forward to Manager →', variant: 'warning', action: 'sup2mgr', enabled: s.supPre >= 3, prog: `${s.supPre}/3` };
      case 'manager': return { label: 'Send to HR →', variant: 'warning', action: 'mgr2hr', enabled: s.mgr >= 2, prog: `${s.mgr}/2` };
      case 'hr': return { label: '⛔ Suspend Teacher (30 days)', variant: 'danger', action: 'hrSuspend', enabled: s.hr >= 2, prog: `${s.hr}/2`, confirm: 'suspend' };
      case 'admin': return { label: 'Send to Operations Head →', variant: 'warning', action: 'adm2ops', enabled: s.adm >= 2, prog: `${s.adm}/2` };
      case 'operations': return { label: 'Send to CEO →', variant: 'warning', action: 'ops2ceo', enabled: s.ops >= 2, prog: `${s.ops}/2` };
      case 'ceo': return { label: '📜 Issue Termination Letter', variant: 'danger', action: 'ceoTerminate', enabled: s.ceo >= 1, confirm: 'terminate' };
      default: return null;
    }
  };
  const visible = teachers.filter(t => roleSees(t, compStats(t.id, complaints)));
  const suspendedTeachers = teachers.filter(t => t.susp);
  const intro = {
    supervisor: 'File complaints about any teacher. After 3 complaints you can forward the case up to the Manager. (After a suspension, new complaints go straight to Admin.)',
    manager: 'Cases forwarded by the Supervisor. Once a teacher reaches 2 complaints here, you can escalate to HR.',
    hr: 'Cases escalated by the Manager. Once a teacher reaches 2 complaints here, you may suspend the teacher for 30 days.',
    admin: 'Post-suspension complaints sent directly to you. Once a teacher reaches 2, escalate to the Operations Head.',
    operations: 'Cases escalated by the Admin. Once a teacher reaches 2, escalate to the CEO for a final decision.',
    ceo: 'Final-stage cases. You may issue the formal termination letter — it notifies the teacher, parents, students and all staff.',
  }[role];
  return (
    <div>
      <div style={{ background: '#fff8e6', border: '1px solid #ffd980', borderRadius: 10, padding: '12px 18px', marginBottom: 18, fontSize: 12.5, color: C.textMid, lineHeight: 1.6 }}>⚖️ {intro}</div>
      {role === 'supervisor' && <div style={{ marginBottom: 16 }}><Btn variant="danger" onClick={() => { setFileTid(null); setFileOpen(true); }}>📝 File a Complaint</Btn></div>}
      {role === 'admin' && suspendedTeachers.length > 0 && (
        <Card style={{ marginBottom: 18, border: `2px solid ${C.red}` }}>
          <CardHeader title="🔴 Active Suspensions" subtitle="HR-issued 30-day suspensions — teacher's classes are hidden from their portal" right={<Badge label={`${suspendedTeachers.length}`} color={C.red} />} />
          <div style={{ padding: 16 }}>{suspendedTeachers.map(t => { const left = Math.max(0, Math.ceil((t.susp.endTs - Date.now()) / DAY)); const active = isSuspended(t); return <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: '#fdf3f2', borderRadius: 9, border: '1px solid #f3d4d0', marginBottom: 6, flexWrap: 'wrap' }}><Avatar name={t.name} color={C.red} size={40} photo={t.photo} /><div style={{ flex: 1, minWidth: 160 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{t.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>Suspended {fmtDate(t.susp.startTs)} · {active ? `${left} day${left !== 1 ? 's' : ''} remaining` : 'Reinstated (notice persists)'}</div></div><span style={{ fontSize: 10.5, fontWeight: 700, color: active ? C.red : C.green, background: (active ? C.red : C.green) + '15', padding: '4px 11px', borderRadius: 20, animation: active && !t.susp.adminDismissed ? 'aulqBlink 1s infinite' : 'none' }}>{active ? '⛔ SUSPENDED' : '✓ Reinstated'}</span>{active && <Btn size="sm" variant="success" onClick={() => onReinstate(t.id)}>↩ Reinstate early</Btn>}{active && !t.susp.adminDismissed && <Btn size="sm" variant="ghost" onClick={() => onDismissNotice(t.id)}>Dismiss alert</Btn>}</div>; })}</div>
        </Card>
      )}
      <Card>
        <CardHeader title={role === 'supervisor' ? 'All Teachers' : 'Cases Requiring Your Action'} subtitle={role === 'supervisor' ? 'Complaint status & escalation' : `${visible.length} teacher(s) at your stage`} />
        <div style={{ padding: 16 }}>
          {visible.length === 0 ? <div style={{ padding: '34px 20px', textAlign: 'center', color: C.textMuted }}>✅ No cases at your stage right now.</div> : visible.map(t => {
            const s = compStats(t.id, complaints); const act = roleAction(t, s); const phase = teacherPhase(t);
            return (
              <div key={t.id} style={{ background: C.pageBg, borderRadius: 10, border: `1px solid ${C.border}`, padding: '14px 16px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Avatar name={t.name} color={C.red} size={42} photo={t.photo} />
                  <div style={{ flex: 1, minWidth: 160 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>{t.name}{phase === 'post' && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: C.purple, padding: '2px 7px', borderRadius: 9 }}>POST-SUSPENSION</span>}</div><div style={{ fontSize: 11, color: C.textMuted }}>{t.subject} · {s.total} active complaint{s.total !== 1 ? 's' : ''}</div></div>
                  <Btn size="sm" variant="ghost" onClick={() => setListFor(t)}>👁 View {complaints.filter(c => c.tid === t.id).length}</Btn>
                  {role === 'supervisor' && <Btn size="sm" variant="danger" onClick={() => { setFileTid(t.id); setFileOpen(true); }}>+ Complaint</Btn>}
                  {act && <Btn size="sm" variant={act.variant} disabled={!act.enabled} onClick={() => act.confirm ? setConfirm({ t, act }) : onEscalate(act.action, t.id)}>{act.label}{act.prog && !act.enabled ? ` (${act.prog})` : ''}</Btn>}
                </div>
                <div style={{ marginTop: 10 }}><Pipeline teacher={t} complaints={complaints} /></div>
              </div>
            );
          })}
        </div>
      </Card>
      {fileOpen && <FileComplaintModal teachers={teachers} complaints={complaints} defaultTid={fileTid} onFile={(tid, text) => { onFile(tid, text); setFileOpen(false); }} onClose={() => setFileOpen(false)} />}
      {listFor && <ComplaintListModal teacher={listFor} complaints={complaints} onClose={() => setListFor(null)} />}
      {confirm && <ConfirmModal title={confirm.act.confirm === 'suspend' ? 'Suspend Teacher' : 'Issue Termination Letter'} variant="danger" confirmLabel={confirm.act.confirm === 'suspend' ? '⛔ Suspend 30 Days' : '📜 Issue Letter'} message={confirm.act.confirm === 'suspend' ? `Suspend ${confirm.t.name} for 30 days?\n\nThe teacher and admin will be notified, the teacher's classes will be hidden from their portal, and the admin will receive a 30-day red alert.` : `Issue the final CEO termination letter for ${confirm.t.name}?\n\nThis notifies the teacher, parents, students and all staff (Supervisor, Manager, HR, Admin, Operations Head). The teacher will be removed from the academy.`} onConfirm={() => { onEscalate(confirm.act.action, confirm.t.id); setConfirm(null); }} onClose={() => setConfirm(null)} />}
    </div>
  );
}

function MessagesView({ user, msgs }) {
  const mine = msgs.filter(m => m.audience.includes(user.role) || m.audience.includes(user.id)).sort((a, b) => b.time - a.time);
  const meta = { suspend: { icon: '⛔', color: C.red }, escalation: { icon: '⚖️', color: C.orange }, termination: { icon: '📜', color: C.red } };
  return (
    <Card><CardHeader title="Notices & Messages" subtitle={`${mine.length} message(s)`} />
      <div style={{ padding: 16 }}>{mine.length === 0 ? <p style={{ color: C.textMuted, textAlign: 'center', padding: 24 }}>No notices yet.</p> : mine.map(msg => { const mt = meta[msg.kind] || { icon: '✉️', color: C.blue }; return <div key={msg.id} style={{ display: 'flex', gap: 12, padding: '14px 16px', background: mt.color + '0d', borderRadius: 9, border: `1px solid ${mt.color}33`, marginBottom: 8 }}><div style={{ width: 38, height: 38, borderRadius: 9, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>{mt.icon}</div><div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ fontSize: 13.5, fontWeight: 700, color: mt.color }}>{msg.title}</span><span style={{ fontSize: 11, color: C.textMuted, whiteSpace: 'nowrap' }}>{fmtDateTime(msg.time)}</span></div><div style={{ fontSize: 12.5, color: C.textMid, lineHeight: 1.6, marginTop: 5, whiteSpace: 'pre-line' }}>{msg.body}</div></div></div>; })}</div>
    </Card>
  );
}

function TeacherComplaintsView({ user, complaints, msgs }) {
  const mine = complaints.filter(c => c.tid === user.id).sort((a, b) => b.time - a.time);
  const myMsgs = msgs.filter(m => m.audience.includes(user.id)).sort((a, b) => b.time - a.time);
  return (
    <div>
      <div style={{ background: '#fdecea', border: '1px solid #f5c6c6', borderRadius: 10, padding: '12px 18px', marginBottom: 18, fontSize: 12.5, color: C.textMid, lineHeight: 1.6 }}>🔔 This page shows official notices and any complaints filed regarding you. These records are <strong>read-only</strong> — you cannot edit or reply to them. If you have concerns, please contact your supervisor.</div>
      {myMsgs.length > 0 && <Card style={{ marginBottom: 18 }}><CardHeader title="Official Notices" /><div style={{ padding: 16 }}>{myMsgs.map(msg => <div key={msg.id} style={{ background: msg.kind === 'termination' ? '#fdecea' : '#fff8e6', border: `1px solid ${msg.kind === 'termination' ? '#f5c6c6' : '#ffd980'}`, borderRadius: 9, padding: '14px 16px', marginBottom: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ fontSize: 14, fontWeight: 700, color: msg.kind === 'termination' ? C.red : C.orange }}>{msg.kind === 'termination' ? '📜 ' : '⛔ '}{msg.title}</span><span style={{ fontSize: 11, color: C.textMuted }}>{fmtDateTime(msg.time)}</span></div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.65, marginTop: 6, whiteSpace: 'pre-line' }}>{msg.body}</div></div>)}</div></Card>}
      <Card><CardHeader title="Complaints On Record" subtitle={`${mine.length} complaint(s) regarding you`} right={mine.length ? <Badge label={`${mine.length}`} color={C.red} /> : null} />
        <div style={{ padding: 16 }}>{mine.length === 0 ? <div style={{ padding: '34px 20px', textAlign: 'center', color: C.textMuted }}>✅ No complaints on record. Keep up the good work, baarakAllahu feek.</div> : mine.map(c => <div key={c.id} style={{ background: c.resolved ? C.pageBg : '#fdf3f2', border: `1px solid ${c.resolved ? C.border : '#f3d4d0'}`, borderRadius: 9, padding: '13px 16px', marginBottom: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 5 }}><span style={{ fontSize: 11.5, fontWeight: 700, color: c.resolved ? C.textMuted : C.red }}>{c.resolved ? '✓ Closed' : '⚠️ Under review'}</span><span style={{ fontSize: 11, color: C.textMuted }}>{fmtDateTime(c.time)}</span></div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{c.text}</div></div>)}</div>
      </Card>
    </div>
  );
}

function SuspensionScreen({ user }) {
  const left = Math.max(0, Math.ceil((user.susp.endTs - Date.now()) / DAY));
  return (
    <Card style={{ padding: '40px 30px', textAlign: 'center', border: `2px solid ${C.red}` }}>
      <div style={{ fontSize: 60, marginBottom: 16 }}>⛔</div>
      <h2 style={{ fontFamily: "'Amiri', serif", fontSize: 24, color: C.red, margin: '0 0 12px' }}>Account Suspended</h2>
      <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7, maxWidth: 460, margin: '0 auto 18px' }}>As per the academy disciplinary process, your teaching account has been suspended for <strong>30 days</strong>. During this period your class schedule is unavailable and you may not conduct classes.</p>
      <div style={{ display: 'inline-block', background: '#fdf3f2', border: '1px solid #f3d4d0', borderRadius: 10, padding: '14px 24px', color: C.red, fontSize: 15, fontWeight: 700 }}>⏳ {left} day{left !== 1 ? 's' : ''} remaining</div>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 18 }}>For details, see the <strong>Notices</strong> tab. Please contact your supervisor with any questions.</p>
    </Card>
  );
}

function TerminationScreen({ user }) {
  const letter = user.terminated.letter;
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ maxWidth: 620, padding: '34px 36px', textAlign: 'center', border: `2px solid ${C.red}` }}>
        <div style={{ width: 70, height: 70, margin: '0 auto 14px' }}><AcademyLogo size={70} /></div>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📜</div>
        <h2 style={{ fontFamily: "'Amiri', serif", fontSize: 22, color: C.red, margin: '0 0 16px' }}>Termination of Association</h2>
        <div style={{ background: C.pageBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 22px', textAlign: 'left', fontSize: 13.5, color: C.text, lineHeight: 1.75, whiteSpace: 'pre-line' }}>{letter}</div>
        <p style={{ fontSize: 11.5, color: C.textMuted, marginTop: 16 }}>Issued {fmtDateTime(user.terminated.ts)}. This account is now closed.</p>
      </Card>
    </div>
  );
}

function AdminPanel({ users, setUsers, students, setStudents, classes, setClasses, reports, setReports, notifications, msgs, complaints, onReschedule, onFee, escalateProps, initialTab = 'overview' }) {
  const [tab, setTab] = useState(initialTab);
  const [viewRep, setViewRep] = useState(null); const [modal, setModal] = useState(null); const [reschedCls, setReschedCls] = useState(null); const [showPw, setShowPw] = useState(false);
  const stu = id => students.find(s => s.id === id); const usr = id => users.find(u => u.id === id);
  const teachers = users.filter(u => u.role === 'teacher');
  const leaveClasses = [...classes].filter(c => c.status === 'leave').sort((a, b) => a.time - b.time);
  const absentClasses = [...classes].filter(c => c.status === 'absent').sort((a, b) => b.time - a.time);
  const susTeachers = teachers.filter(t => t.susp && isSuspended(t) && !t.susp.adminDismissed);
  const complaintBadge = teachers.filter(t => compStats(t.id, complaints).adm > 0).length + susTeachers.length;
  const tabs = [{ id: 'overview', label: '📊 Overview' }, { id: 'teachers', label: '👨‍🏫 Teachers' }, { id: 'records', label: '📇 Records' }, { id: 'students', label: '👧 Students' }, { id: 'fees', label: '💳 Fees' }, { id: 'schedule', label: '📅 Schedule' }, { id: 'leave', label: `🗓 Leave${leaveClasses.length ? ' (' + leaveClasses.length + ')' : ''}` }, { id: 'payroll', label: '💰 Payroll' }, { id: 'complaints', label: `⚖ Discipline${complaintBadge ? ' (' + complaintBadge + ')' : ''}` }, { id: 'reports', label: '📋 Reports' }, { id: 'attendance', label: '✅ Attendance' }, { id: 'alerts', label: `📢 Alerts${notifications.length ? ' (' + notifications.length + ')' : ''}` }];
  const totalC = classes.length, completedC = classes.filter(c => c.status === 'completed').length, absentC = classes.filter(c => c.status === 'absent').length, leaveC = classes.filter(c => c.status === 'leave').length;
  const rateC = (completedC + absentC) > 0 ? Math.round(completedC / (completedC + absentC) * 100) : 0;
  const payrollRows = teachers.map(t => ({ t, ...teacherPay(t, classes) }));
  const totalPayroll = payrollRows.reduce((s, r) => s + r.total, 0); const weekPayroll = payrollRows.reduce((s, r) => s + r.weekTotal, 0); const billedClasses = payrollRows.reduce((s, r) => s + r.completed, 0);
  const duesCount = students.filter(s => (Number(s.feeTotal) || 0) - (Number(s.feePaid) || 0) > 0).length;
  const saveTeacher = (t, again) => { setUsers(p => p.some(u => u.id === t.id) ? p.map(u => u.id === t.id ? t : u) : [...p, t]); if (!again) setModal(null); };
  const saveStudent = s => { setStudents(p => p.some(x => x.id === s.id) ? p.map(x => x.id === s.id ? s : x) : [...p, s]); setClasses(p => [...p.filter(c => !(c.gen && c.sid === s.id)), ...genClassesForStudent(s)]); setModal(null); };
  const assignStudent = (sid, tid) => { setStudents(p => p.map(s => s.id === sid ? { ...s, tid } : s)); setClasses(p => p.map(c => (c.gen && c.sid === sid) ? { ...c, tid } : c)); setModal(null); };
  const deleteTeacher = id => { setUsers(p => p.filter(u => u.id !== id)); setStudents(p => p.map(s => s.tid === id ? { ...s, tid: '' } : s)); setClasses(p => p.filter(c => c.tid !== id)); setReports(p => p.filter(r => r.tid !== id)); setModal(null); };
  const deleteStudent = id => { setStudents(p => p.filter(s => s.id !== id)); setClasses(p => p.filter(c => c.sid !== id)); setReports(p => p.filter(r => r.sid !== id)); setModal(null); };
  const reschedulable = ['scheduled', 'active', 'leave'];
  const AttentionCard = ({ icon, count, label, sub, color, onClick }) => <button onClick={onClick} style={{ textAlign: 'left', cursor: 'pointer', background: '#fff', border: `1.5px solid ${count ? color : C.border}`, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, fontFamily: "'DM Sans', sans-serif", boxShadow: count ? `0 0 0 4px ${color}12` : 'none' }}><div style={{ width: 46, height: 46, borderRadius: 11, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div><div style={{ flex: 1 }}><div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}><span style={{ fontSize: 24, fontWeight: 800, color }}>{count}</span><span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{label}</span></div><div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>{sub}</div></div><span style={{ fontSize: 13, color, fontWeight: 700, whiteSpace: 'nowrap' }}>View →</span></button>;
  const feeStatus = s => { const rem = (Number(s.feeTotal) || 0) - (Number(s.feePaid) || 0); if ((Number(s.feeTotal) || 0) === 0) return { l: 'No fee set', c: C.textMuted }; if (rem <= 0) return { l: 'Paid', c: C.green }; if ((Number(s.feePaid) || 0) > 0) return { l: 'Partial', c: C.orange }; return { l: 'Unpaid', c: C.red }; };
  const upcoming = [...classes].filter(c => ['scheduled', 'active', 'started'].includes(c.status) && c.time > Date.now() - DAY).sort((a, b) => a.time - b.time).slice(0, 50);
  const allReports = [...reports].sort((a, b) => (b.id > a.id ? 1 : -1));
  const clsStats = sid => { const cs = classes.filter(c => c.sid === sid); const done = cs.filter(c => c.status === 'completed').length; const abs = cs.filter(c => c.status === 'absent').length; return { done, abs, total: done + abs }; };
  const tabBtn = id => ({ padding: '8px 14px', borderRadius: 8, cursor: 'pointer', background: tab === id ? C.sidebar : '#fff', color: tab === id ? C.gold : C.textMid, fontSize: 12.5, fontWeight: tab === id ? 700 : 500, fontFamily: "'DM Sans', sans-serif", border: `1px solid ${tab === id ? C.sidebar : C.border}` });
  const rowCard = { background: C.pageBg, borderRadius: 10, border: `1px solid ${C.border}`, padding: '13px 16px', marginBottom: 8 };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>{tabs.map(tb => <button key={tb.id} onClick={() => setTab(tb.id)} style={tabBtn(tb.id)}>{tb.label}</button>)}</div>

      {tab === 'overview' && <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 16, marginBottom: 18 }}>
          <StatCard label="Teachers" value={teachers.filter(t => !t.terminated).length} icon="👨‍🏫" color={C.teal} />
          <StatCard label="Students" value={students.length} icon="👧" color={C.blue} />
          <StatCard label="Classes Completed" value={completedC} icon="✅" color={C.green} />
          <StatCard label="Attendance Rate" value={rateC + '%'} icon="📈" color={rateColor(rateC)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px,1fr))', gap: 14 }}>
          <AttentionCard icon="🗓" count={leaveClasses.length} label="On Leave" sub="Classes awaiting reschedule" color={C.purple} onClick={() => setTab('leave')} />
          <AttentionCard icon="💳" count={duesCount} label="Fee Dues" sub="Students with outstanding fees" color={C.red} onClick={() => setTab('fees')} />
          <AttentionCard icon="⚖" count={complaintBadge} label="Discipline" sub="Cases / suspensions needing action" color={C.orange} onClick={() => setTab('complaints')} />
          <AttentionCard icon="📢" count={notifications.length} label="Parent Alerts" sub="Notifications sent to parents" color={C.blue} onClick={() => setTab('alerts')} />
        </div>
      </div>}

      {tab === 'teachers' && <Card>
        <CardHeader title="Teachers" subtitle={`${teachers.length} on staff`} right={<Btn variant="primary" onClick={() => setModal({ kind: 'teacher', teacher: null })}>+ Add Teacher</Btn>} />
        <div style={{ padding: 16 }}>{teachers.map(t => { const cnt = students.filter(s => s.tid === t.id).length; const pay = teacherPay(t, classes); const rev = showPw === t.id; const susp = isSuspended(t); return <div key={t.id} style={rowCard}><div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><Avatar name={t.name} color={C.teal} size={44} photo={t.photo} /><div style={{ flex: 1, minWidth: 160 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>{t.name}{t.terminated && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: C.red, padding: '2px 7px', borderRadius: 9 }}>TERMINATED</span>}{susp && <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: C.purple, padding: '2px 7px', borderRadius: 9 }}>SUSPENDED</span>}</div><div style={{ fontSize: 11, color: C.textMuted }}>{t.subject} · {cnt} student{cnt !== 1 ? 's' : ''} · {money(pay.total)} earned</div></div><Btn size="sm" variant="ghost" onClick={() => setShowPw(rev ? false : t.id)}>{rev ? '🙈 Hide' : '🔑 Login'}</Btn><Btn size="sm" variant="teal" onClick={() => setModal({ kind: 'teacher', teacher: t })}>✎ Edit</Btn><Btn size="sm" variant="ghost" onClick={() => setModal({ kind: 'delT', id: t.id, name: t.name })}>🗑</Btn></div>{rev && <div style={{ marginTop: 10, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: C.textMid, fontFamily: 'monospace', display: 'flex', gap: 24, flexWrap: 'wrap' }}><span>👤 {t.un}</span><span>🔒 {t.pw}</span></div>}</div>; })}</div>
      </Card>}

      {tab === 'records' && <Card>
        <CardHeader title="Teacher Records" subtitle="Full contact & guarantor details" />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>{teachers.map(t => <div key={t.id} style={{ ...rowCard, marginBottom: 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}><Avatar name={t.name} color={C.copper} size={42} photo={t.photo} /><div><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{t.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{t.subject} · Joined {t.joined || '—'}</div></div></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 10 }}>{[['Email', t.email], ['Phone', t.phone], ['Country', t.country], ['Rate', money(t.rate)], ['Guarantor 1', t.guarantor1], ['Guarantor 2', t.guarantor2]].map(([l, v]) => <div key={l}><div style={{ fontSize: 9.5, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{l}</div><div style={{ fontSize: 12.5, color: C.text }}>{v || '—'}</div></div>)}</div></div>)}</div>
      </Card>}

      {tab === 'students' && <Card>
        <CardHeader title="Students" subtitle={`${students.length} enrolled`} right={<Btn variant="primary" onClick={() => setModal({ kind: 'student', student: null })}>+ Add Student</Btn>} />
        <div style={{ padding: 16 }}>{students.map(s => { const t = usr(s.tid); const rate = pct(s.attended, s.total); const clr = COURSE_TAG[s.course] || '#555'; return <div key={s.id} style={rowCard}><div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><Avatar name={s.name} color={clr} size={44} photo={s.photo} /><div style={{ flex: 1, minWidth: 160 }}><div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.name} <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 400 }}>· {s.relation}</span></div><div style={{ fontSize: 11, color: C.textMuted }}>{s.country} · Age {s.age} · {t ? t.name : 'Unassigned'}</div></div><Badge label={s.course} color={clr} /><div style={{ width: 120 }}><div style={{ fontSize: 11, color: C.text }}>{s.attended}/{s.total}</div><Progress value={rate} color={rateColor(rate)} /></div><Btn size="sm" variant="ghost" onClick={() => setModal({ kind: 'assign', student: s })}>↻ Assign</Btn><Btn size="sm" variant="teal" onClick={() => setModal({ kind: 'student', student: s })}>✎ Edit</Btn><Btn size="sm" variant="ghost" onClick={() => setModal({ kind: 'delS', id: s.id, name: s.name })}>🗑</Btn></div></div>; })}</div>
      </Card>}

      {tab === 'fees' && <Card>
        <CardHeader title="Fee Collection" subtitle="Per-student fees in their own currency" right={<Badge label={`${duesCount} with dues`} color={duesCount ? C.red : C.green} />} />
        <div style={{ padding: 16 }}>{students.map(s => { const total = Number(s.feeTotal) || 0, paid = Number(s.feePaid) || 0, rem = Math.max(0, total - paid); const st = feeStatus(s); return <div key={s.id} style={rowCard}><div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><Avatar name={s.name} color={C.gold} size={40} photo={s.photo} /><div style={{ flex: 1, minWidth: 150 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{s.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{s.parent || 'Guardian'} · {s.country}</div></div><div style={{ textAlign: 'right', minWidth: 90 }}><div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700 }}>FEE</div><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{fee(s.currency, total)}</div></div><div style={{ textAlign: 'right', minWidth: 90 }}><div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700 }}>PAID</div><div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>{fee(s.currency, paid)}</div></div><div style={{ textAlign: 'right', minWidth: 90 }}><div style={{ fontSize: 10, color: C.textMuted, fontWeight: 700 }}>REMAINING</div><div style={{ fontSize: 13, fontWeight: 700, color: rem > 0 ? C.red : C.green }}>{fee(s.currency, rem)}</div></div><span style={{ fontSize: 11, fontWeight: 700, color: st.c, background: st.c + '18', padding: '4px 11px', borderRadius: 20 }}>{st.l}</span><Btn size="sm" variant="teal" onClick={() => setModal({ kind: 'fee', student: s })}>✎ Edit Fee</Btn></div></div>; })}</div>
      </Card>}

      {tab === 'schedule' && <Card>
        <CardHeader title="Class Schedule" subtitle="Upcoming classes (PKT) · reschedule any below" right={<Badge label={`${upcoming.length}`} color={C.blue} />} />
        <div style={{ padding: 16 }}>{upcoming.length === 0 ? <div style={{ padding: 30, textAlign: 'center', color: C.textMuted }}>No upcoming classes.</div> : upcoming.map(c => { const s = stu(c.sid); const t = usr(c.tid); const clr = COURSE_TAG[c.course] || '#555'; return <div key={c.id} style={{ ...rowCard, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><Avatar name={s?.name} color={clr} size={38} photo={s?.photo} /><div style={{ flex: 1, minWidth: 150 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{s?.name || '—'}</div><div style={{ fontSize: 11, color: C.textMuted }}>{t ? t.name : 'Unassigned'} · {s?.country}</div></div><Badge label={c.course} color={clr} /><div style={{ textAlign: 'right' }}><div style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{fmtTime(c.time)} <span style={{ fontSize: 9, color: C.copper }}>PKT</span></div><div style={{ fontSize: 11, color: C.textMuted }}>{fmtDate(c.time)}</div></div>{reschedulable.includes(c.status) && <Btn size="sm" variant="ghost" onClick={() => setReschedCls(c)}>🗓 Reschedule</Btn>}</div>; })}</div>
      </Card>}

      {tab === 'leave' && <Card>
        <CardHeader title="Leave & Reschedule" subtitle="Students on leave — pick a new time/teacher" right={<Badge label={`${leaveClasses.length}`} color={leaveClasses.length ? C.purple : C.green} />} />
        <div style={{ padding: 16 }}>{leaveClasses.length === 0 ? <div style={{ padding: 30, textAlign: 'center', color: C.textMuted }}>✅ No classes awaiting reschedule.</div> : leaveClasses.map(c => { const s = stu(c.sid); const t = usr(c.tid); const clr = COURSE_TAG[c.course] || '#555'; return <div key={c.id} style={{ ...rowCard, background: '#f7f2fc', borderColor: '#e0d2f0', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><Avatar name={s?.name} color={C.purple} size={40} photo={s?.photo} /><div style={{ flex: 1, minWidth: 150 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{s?.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{c.course} · was {fmtTime(c.time)} {fmtDate(c.time)} · {t ? t.name : '—'}</div></div><Btn size="sm" variant="purple" onClick={() => setReschedCls(c)}>🗓 Reschedule &amp; Notify</Btn></div>; })}</div>
      </Card>}

      {tab === 'payroll' && <Card>
        <CardHeader title="Payroll" subtitle="Per-completed-class earnings" right={<div style={{ display: 'flex', gap: 8 }}><Badge label={`Total ${money(totalPayroll)}`} color={C.green} /><Badge label={`This week ${money(weekPayroll)}`} color={C.teal} /></div>} />
        <div style={{ padding: 16 }}><Scroll min={560}><div style={{ display: 'grid', gridTemplateColumns: '1.6fr 90px 110px 120px 120px', padding: '8px 14px', fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}><span>Teacher</span><span>Rate</span><span>Completed</span><span>This Week</span><span>Total</span></div>{payrollRows.map(r => <div key={r.t.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 90px 110px 120px 120px', alignItems: 'center', gap: 10, padding: '12px 14px', background: C.pageBg, borderRadius: 8, marginBottom: 6, border: `1px solid ${C.border}` }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Avatar name={r.t.name} color={C.green} size={34} photo={r.t.photo} /><span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.t.name}</span></div><span style={{ fontSize: 12.5, color: C.textMid }}>{money(r.rate)}</span><span style={{ fontSize: 12.5, color: C.textMid }}>{r.completed}</span><span style={{ fontSize: 12.5, color: C.teal, fontWeight: 700 }}>{money(r.weekTotal)} <span style={{ fontWeight: 400, color: C.textMuted }}>({r.weekCount})</span></span><span style={{ fontSize: 13.5, fontWeight: 800, color: C.green }}>{money(r.total)}</span></div>)}<div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', marginTop: 4, borderTop: `2px solid ${C.border}`, fontSize: 13, fontWeight: 700, color: C.text }}><span>{billedClasses} classes billed</span><span style={{ color: C.green }}>Total payroll: {money(totalPayroll)}</span></div></Scroll></div>
      </Card>}

      {tab === 'complaints' && <ComplaintsView role="admin" users={users} complaints={complaints} students={students} onFile={escalateProps.onFile} onEscalate={escalateProps.onEscalate} onDismissNotice={escalateProps.onDismissNotice} onReinstate={escalateProps.onReinstate} />}

      {tab === 'reports' && <div>{viewRep ? <div><Btn variant="ghost" onClick={() => setViewRep(null)}>← Back to all reports</Btn><div style={{ height: 12 }} /><LessonHistory user={{ role: 'admin' }} students={students} reports={reports} initStudentId={viewRep} /></div> : <Card><CardHeader title="Lesson Reports" subtitle={`${allReports.length} report(s) across all teachers`} /><div style={{ padding: 16 }}>{allReports.length === 0 ? <div style={{ padding: 30, textAlign: 'center', color: C.textMuted }}>No reports yet.</div> : allReports.map(r => { const s = stu(r.sid); const t = usr(r.tid); return <div key={r.id} style={{ ...rowCard, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', cursor: 'pointer' }} onClick={() => setViewRep(r.sid)}><Avatar name={s?.name} color={C.teal} size={38} photo={s?.photo} /><div style={{ flex: 1, minWidth: 160 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{r.lesson}</div><div style={{ fontSize: 11, color: C.textMuted }}>{s?.name} · {t ? t.name : '—'} · {r.date}</div></div><Btn size="sm" variant="teal" onClick={() => setViewRep(r.sid)}>View →</Btn></div>; })}</div></Card>}</div>}

      {tab === 'attendance' && <Card>
        <CardHeader title="Attendance" subtitle="Completed vs absent per student" />
        <div style={{ padding: 16 }}>{students.map(s => { const cs = clsStats(s.id); const rate = pct(s.attended, s.total); return <div key={s.id} style={{ ...rowCard, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><Avatar name={s.name} color={rateColor(rate)} size={40} photo={s.photo} /><div style={{ flex: 1, minWidth: 150 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{s.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{s.course} · {s.attended}/{s.total} sessions</div><Progress value={rate} color={rateColor(rate)} /></div><div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 800, color: rateColor(rate) }}>{rate}%</div></div><div style={{ display: 'flex', gap: 8 }}><span style={{ fontSize: 11, color: C.green }}>✅ {cs.done}</span><span style={{ fontSize: 11, color: C.red }}>⚠ {cs.abs}</span></div></div>; })}</div>
      </Card>}

      {tab === 'alerts' && <Card>
        <CardHeader title="Parent Alerts" subtitle="Notifications sent to parents/guardians" right={<Badge label={`${notifications.length}`} color={C.blue} />} />
        <div style={{ padding: 16 }}><NotificationList notifications={[...notifications].sort((a, b) => b.time - a.time)} students={students} /></div>
      </Card>}

      {modal && modal.kind === 'teacher' && <TeacherFormModal teacher={modal.teacher} existingUsers={users} onSave={saveTeacher} onClose={() => setModal(null)} />}
      {modal && modal.kind === 'student' && <StudentFormModal student={modal.student} teachers={teachers.filter(t => !t.terminated)} onSave={saveStudent} onClose={() => setModal(null)} />}
      {modal && modal.kind === 'assign' && <AssignModal student={modal.student} teachers={teachers.filter(t => !t.terminated)} onAssign={assignStudent} onClose={() => setModal(null)} />}
      {modal && modal.kind === 'fee' && <FeeModal student={modal.student} onSave={(sid, data) => { onFee(sid, data); setModal(null); }} onClose={() => setModal(null)} />}
      {modal && modal.kind === 'delT' && <ConfirmModal title="Delete Teacher" message={`Delete ${modal.name}? Their classes & reports will be removed and students unassigned.`} onConfirm={() => deleteTeacher(modal.id)} onClose={() => setModal(null)} />}
      {modal && modal.kind === 'delS' && <ConfirmModal title="Delete Student" message={`Delete ${modal.name}? Their classes & reports will be removed.`} onConfirm={() => deleteStudent(modal.id)} onClose={() => setModal(null)} />}
      {reschedCls && <RescheduleModal cls={reschedCls} student={stu(reschedCls.sid)} teacher={usr(reschedCls.tid)} teachers={teachers.filter(t => !t.terminated)} onReschedule={(cid, ts, tid) => { onReschedule(cid, ts, tid); setReschedCls(null); }} onClose={() => setReschedCls(null)} />}
    </div>
  );
}

function SupervisorDashboard({ users, students, classes, complaints }) {
  const teachers = users.filter(u => u.role === 'teacher' && !u.terminated);
  const live = classes.filter(c => ['active', 'started'].includes(c.status)).length;
  const open = teachers.filter(t => { const s = compStats(t.id, complaints); return s.supPre > 0 || s.supPost > 0; }).length;
  return <div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 16, marginBottom: 18 }}>
      <StatCard label="Teachers" value={teachers.length} icon="👨‍🏫" color={C.teal} />
      <StatCard label="Students" value={students.length} icon="👧" color={C.blue} />
      <StatCard label="Live Classes" value={live} icon="🔴" color={C.red} />
      <StatCard label="Open Complaints" value={open} icon="⚖" color={C.orange} />
    </div>
    <Card style={{ padding: '20px 24px' }}><p style={{ fontSize: 13.5, color: C.textMid, lineHeight: 1.7, margin: 0 }}>As supervisor you can monitor live classes and file complaints about any teacher. Once a teacher reaches <strong>3 complaints</strong>, the case can be forwarded up the chain. Open the <strong>Teacher Complaints</strong> tab to manage cases.</p></Card>
  </div>;
}

function LiveMonitor({ users, students, classes }) {
  const stu = id => students.find(s => s.id === id); const tch = id => users.find(u => u.id === id);
  const live = classes.filter(c => ['active', 'started'].includes(c.status)).sort((a, b) => a.time - b.time);
  const SL = { active: { l: 'Active', c: C.orange }, started: { l: 'In Progress', c: C.green } };
  return <Card>
    <CardHeader title="Live Class Monitor" subtitle="Classes happening right now (PKT)" right={<Badge label={`${live.length} live`} color={live.length ? C.red : C.textMuted} />} />
    <div style={{ padding: 16 }}>{live.length === 0 ? <div style={{ padding: 34, textAlign: 'center', color: C.textMuted }}>No classes are live at the moment.</div> : live.map(c => { const s = stu(c.sid); const t = tch(c.tid); const clr = COURSE_TAG[c.course] || '#555'; const sc = SL[c.status]; return <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', background: '#fff', border: `1px solid ${sc.c}55`, borderRadius: 9, marginBottom: 8, flexWrap: 'wrap' }}><Avatar name={s?.name} color={clr} size={40} photo={s?.photo} /><div style={{ flex: 1, minWidth: 150 }}><div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{s?.name}</div><div style={{ fontSize: 11, color: C.textMuted }}>{t ? t.name : '—'} · {c.course} · {s?.country}</div></div><span style={{ fontSize: 11, fontWeight: 700, color: sc.c, background: sc.c + '18', padding: '4px 12px', borderRadius: 20, animation: 'aulqBlink 1.2s infinite' }}>● {sc.l}</span></div>; })}</div>
  </Card>;
}

function App() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => { const onR = () => setWidth(window.innerWidth); window.addEventListener('resize', onR); return () => window.removeEventListener('resize', onR); }, []);
  const narrow = width < 980;

  const [users, setUsers] = useState(USERS_INIT);
  const [students, setStudents] = useState(STUDENTS_INIT);
  const [classes, setClasses] = useState(CLASSES_INIT);
  const [reports, setReports] = useState(REPORTS_INIT);
  const [notifications, setNotifications] = useState(NOTIFICATIONS_INIT);
  const [materials, setMaterials] = useState(MATERIALS_INIT);
  const [complaints, setComplaints] = useState([]);
  const [msgs, setMsgs] = useState([]);

  const [authId, setAuthId] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = users.find(u => u.id === authId) || null;

  const onNotify = (type, cid) => {
    const cls = classes.find(c => c.id === cid); if (!cls) return;
    const s = students.find(x => x.id === cls.sid); if (!s) return;
    const t = users.find(u => u.id === cls.tid);
    const title = { absent: 'Absence Alert', completed: "Today's Class Completed", rescheduled: 'Class Rescheduled' }[type];
    const message = type === 'absent'
      ? `Dear ${s.parent || 'Parent'}, ${s.name} was marked ABSENT from today's ${cls.course} class with ${t ? t.name : 'the teacher'}.`
      : `Dear ${s.parent || 'Parent'}, today's ${cls.course} class with ${t ? t.name : 'the teacher'} has been completed. A lesson report is available.`;
    setNotifications(p => [{ id: 'n' + Date.now() + Math.random().toString(36).slice(2, 5), type, sid: s.id, tid: cls.tid, title, message, parent: s.parent, contact: s.parentPhone || s.parentEmail, time: Date.now() }, ...p]);
  };

  const onReschedule = (cid, newTs, newTid) => {
    const cls = classes.find(c => c.id === cid); const s = cls && students.find(x => x.id === cls.sid); const t = users.find(u => u.id === newTid);
    setClasses(p => p.map(c => c.id === cid ? { ...c, time: newTs, tid: newTid, status: 'scheduled' } : c));
    if (s) setNotifications(p => [{ id: 'n' + Date.now() + Math.random().toString(36).slice(2, 5), type: 'rescheduled', sid: s.id, tid: newTid, title: 'Class Rescheduled', message: `Dear ${s.parent || 'Parent'}, ${s.name}'s ${cls.course} class has been rescheduled to ${fmtDateTime(newTs)} (PKT) with ${t ? t.name : 'the assigned teacher'}.`, parent: s.parent, contact: s.parentPhone || s.parentEmail, time: Date.now() }, ...p]);
  };

  const onFee = (sid, data) => setStudents(p => p.map(s => s.id === sid ? { ...s, ...data } : s));

  const onFileComplaint = (tid, text) => {
    const t = users.find(u => u.id === tid); const phase = teacherPhase(t);
    setComplaints(p => [...p, { id: 'cmp' + Date.now() + Math.random().toString(36).slice(2, 5), tid, text, byName: user ? user.name : 'Supervisor', time: Date.now(), phase, stage: 'sup', resolved: false }]);
  };

  const moveStage = (tid, phase, from, to) => setComplaints(p => p.map(c => (c.tid === tid && c.phase === phase && c.stage === from && !c.resolved) ? { ...c, stage: to } : c));

  const onEscalate = (action, tid) => {
    const t = users.find(u => u.id === tid); if (!t) return;
    switch (action) {
      case 'sup2mgr': moveStage(tid, 'pre', 'sup', 'mgr'); setMsgs(p => [...p, { id: 'msg' + Date.now(), audience: ['manager'], kind: 'escalation', title: 'Case Forwarded', body: `Supervisor has forwarded the complaints regarding ${t.name} to the Manager for review.`, time: Date.now() }]); break;
      case 'mgr2hr': moveStage(tid, 'pre', 'mgr', 'hr'); setMsgs(p => [...p, { id: 'msg' + Date.now(), audience: ['hr'], kind: 'escalation', title: 'Case Escalated to HR', body: `Manager has escalated the case regarding ${t.name} to HR.`, time: Date.now() }]); break;
      case 'sup2adm': moveStage(tid, 'post', 'sup', 'adm'); setMsgs(p => [...p, { id: 'msg' + Date.now(), audience: ['admin'], kind: 'escalation', title: 'Post-Suspension Complaint', body: `A new complaint regarding ${t.name} (previously suspended) has been sent directly to the Admin.`, time: Date.now() }]); break;
      case 'adm2ops': moveStage(tid, 'post', 'adm', 'ops'); setMsgs(p => [...p, { id: 'msg' + Date.now(), audience: ['operations'], kind: 'escalation', title: 'Case Escalated', body: `Admin has escalated the case regarding ${t.name} to the Operations Head.`, time: Date.now() }]); break;
      case 'ops2ceo': moveStage(tid, 'post', 'ops', 'ceo'); setMsgs(p => [...p, { id: 'msg' + Date.now(), audience: ['ceo'], kind: 'escalation', title: 'Final Decision Required', body: `Operations Head has escalated the case regarding ${t.name} to the CEO for a final decision.`, time: Date.now() }]); break;
      case 'hrSuspend': {
        const startTs = Date.now(), endTs = startTs + SUSP_DAYS * DAY;
        setUsers(p => p.map(u => u.id === tid ? { ...u, susp: { startTs, endTs, adminDismissed: false } } : u));
        setComplaints(p => p.map(c => (c.tid === tid && c.phase === 'pre' && !c.resolved) ? { ...c, resolved: true } : c));
        setMsgs(p => [...p, { id: 'msg' + Date.now(), audience: ['admin', tid], kind: 'suspend', title: 'Teacher Suspended (30 Days)', body: `Following repeated complaints, ${t.name} has been suspended for ${SUSP_DAYS} days, effective ${fmtDate(startTs)} until ${fmtDate(endTs)}. The teacher's class schedule is withdrawn during this period and their classes will not be visible on their portal.`, time: Date.now() }]);
        break;
      }
      case 'ceoTerminate': {
        const letter = buildLetter(t.name);
        setUsers(p => p.map(u => u.id === tid ? { ...u, terminated: { letter, ts: Date.now() } } : u));
        setComplaints(p => p.map(c => c.tid === tid ? { ...c, resolved: true } : c));
        setMsgs(p => [...p, { id: 'msg' + Date.now(), audience: ['supervisor', 'manager', 'hr', 'admin', 'operations', 'ceo', tid], kind: 'termination', title: 'Termination of Association', body: letter, time: Date.now() }]);
        const affected = students.filter(s => s.tid === tid);
        if (affected.length) setNotifications(p => [...affected.map((s, i) => ({ id: 'n' + Date.now() + i, type: 'termination', sid: s.id, tid, title: 'Teacher Change Notice', message: `Dear ${s.parent || 'Parent'}, please note that ${t.name} is no longer associated with the academy. A new qualified teacher will be arranged for ${s.name}'s ${s.course} classes, in shaa Allah.`, parent: s.parent, contact: s.parentPhone || s.parentEmail, time: Date.now() })), ...p]);
        break;
      }
      default: break;
    }
  };

  const onDismissNotice = tid => setUsers(p => p.map(u => u.id === tid && u.susp ? { ...u, susp: { ...u.susp, adminDismissed: true } } : u));
  const onReinstate = tid => setUsers(p => p.map(u => u.id === tid && u.susp ? { ...u, susp: { ...u.susp, endTs: Date.now(), reinstated: true } } : u));

  const login = u => { setAuthId(u.id); setPage('dashboard'); };
  const logout = () => { setAuthId(null); setSidebarOpen(false); };

  const teachersList = users.filter(u => u.role === 'teacher' && !u.terminated);
  const complaintCountFor = role => {
    const cnt = pred => teachersList.filter(t => pred(compStats(t.id, complaints), t)).length;
    switch (role) {
      case 'supervisor': return cnt(s => s.supPre > 0 || s.supPost > 0);
      case 'manager': return cnt(s => s.mgr > 0);
      case 'hr': return cnt(s => s.hr > 0);
      case 'admin': return cnt(s => s.adm > 0) + teachersList.filter(t => t.susp && isSuspended(t) && !t.susp.adminDismissed).length;
      case 'operations': return cnt(s => s.ops > 0);
      case 'ceo': return cnt(s => s.ceo > 0);
      default: return 0;
    }
  };

  const fonts = <style>{`@import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');@keyframes aulqBlink{0%,100%{opacity:1}50%{opacity:0.35}}*{box-sizing:border-box}`}</style>;

  if (!user) return <>{fonts}<LoginPage users={users} onLogin={login} /></>;

  if ((user.role === 'teacher' || user.role === 'supervisor') && width < 1024) return <>{fonts}<DesktopOnly width={width} role={user.role} /></>;

  const titleByPage = {
    dashboard: { teacher: 'Dashboard', admin: 'Admin Dashboard', supervisor: 'Supervisor Dashboard', manager: 'Teacher Complaints', hr: 'Disciplinary Cases', operations: 'Escalated Cases', ceo: 'Final Decisions' }[user.role] || 'Dashboard',
    week: 'This Week', students: user.role === 'teacher' ? 'My Students' : 'Students', history: 'Lesson History', materials: 'Materials', mycomplaints: 'Notices',
    teachers: 'Teachers', records: 'Teacher Records', fees: 'Fee Collection', schedule: 'Schedule', leave: 'Leave & Reschedule', attendance: 'Attendance', payroll: 'Payroll', complaints: 'Discipline', alerts: 'Parent Alerts', reports: 'Reports',
    monitor: 'Live Monitor', messages: 'Notices',
  };
  const title = titleByPage[page] || 'Dashboard';

  const teacherFlag = user.role === 'teacher' ? complaints.filter(c => c.tid === user.id && !c.resolved).length + msgs.filter(m => m.audience.includes(user.id)).length : 0;

  let content = null;
  if (user.role === 'teacher') {
    if (user.terminated) content = <TerminationScreen user={user} />;
    else if (isSuspended(user) && ['dashboard', 'week', 'students', 'history'].includes(page)) content = <SuspensionScreen user={user} />;
    else if (page === 'dashboard') content = <TeacherDashboard user={user} students={students} classes={classes} setClasses={setClasses} reports={reports} setReports={setReports} onNotify={onNotify} />;
    else if (page === 'week') content = <WeeklySchedule user={user} students={students} classes={classes} />;
    else if (page === 'students') content = <MyStudents user={user} students={students} reports={reports} onViewHistory={() => setPage('history')} />;
    else if (page === 'history') content = <LessonHistory user={user} students={students} reports={reports} />;
    else if (page === 'materials') content = <Materials user={user} materials={materials} setMaterials={setMaterials} />;
    else if (page === 'mycomplaints') content = <TeacherComplaintsView user={user} complaints={complaints} msgs={msgs} />;
  } else if (user.role === 'admin') {
    if (page === 'materials') content = <Materials user={user} materials={materials} setMaterials={setMaterials} />;
    else content = <AdminPanel key={page} users={users} setUsers={setUsers} students={students} setStudents={setStudents} classes={classes} setClasses={setClasses} reports={reports} setReports={setReports} notifications={notifications} msgs={msgs} complaints={complaints} onReschedule={onReschedule} onFee={onFee} escalateProps={{ onFile: onFileComplaint, onEscalate, onDismissNotice, onReinstate }} initialTab={page === 'dashboard' ? 'overview' : page} />;
  } else if (user.role === 'supervisor') {
    if (page === 'dashboard') content = <SupervisorDashboard users={users} students={students} classes={classes} complaints={complaints} />;
    else if (page === 'monitor') content = <LiveMonitor users={users} students={students} classes={classes} />;
    else if (page === 'complaints') content = <ComplaintsView role="supervisor" users={users} complaints={complaints} students={students} onFile={onFileComplaint} onEscalate={onEscalate} onDismissNotice={onDismissNotice} onReinstate={onReinstate} />;
    else if (page === 'reports') content = <LessonHistory user={{ role: 'admin' }} students={students} reports={reports} />;
    else if (page === 'materials') content = <Materials user={user} materials={materials} setMaterials={setMaterials} />;
  } else {
    if (page === 'dashboard') content = <ComplaintsView role={user.role} users={users} complaints={complaints} students={students} onFile={onFileComplaint} onEscalate={onEscalate} onDismissNotice={onDismissNotice} onReinstate={onReinstate} />;
    else if (page === 'messages') content = <MessagesView user={user} msgs={msgs} />;
  }

  return (
    <>{fonts}
      <div style={{ minHeight: '100vh', background: C.pageBg, fontFamily: "'DM Sans', sans-serif", color: C.text }}>
        {narrow && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 99 }} />}
        <Sidebar user={user} page={page} setPage={p => { setPage(p); setSidebarOpen(false); }} onLogout={logout} narrow={narrow} open={sidebarOpen} alertCount={user.role === 'admin' ? notifications.length : 0} complaintCount={complaintCountFor(user.role)} teacherFlag={teacherFlag} />
        <div style={{ marginLeft: narrow ? 0 : 224, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <TopBar title={title} user={user} narrow={narrow} onMenu={() => setSidebarOpen(true)} />
          <div style={{ flex: 1, padding: narrow ? '18px 14px' : '26px 30px', maxWidth: 1320, width: '100%' }}>{content || <Card style={{ padding: 40, textAlign: 'center' }}><p style={{ color: C.textMuted }}>Select an option from the menu.</p></Card>}</div>
        </div>
      </div>
    </>
  );
}

export default App;