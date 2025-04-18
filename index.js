const WebSocket = require("ws");
const { initializeApp, applicationDefault, cert } = require("firebase-admin/app");
const { getDatabase, ref, push } = require("firebase-admin/database");
const admin = require("firebase-admin");

// Đọc FIREBASE_KEY từ biến môi trường
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://taixiu-data-default-rtdb.firebaseio.com"
});

const db = getDatabase();

const ws = new WebSocket("wss://l8dar9je9bnsou0p.cq.hk8jk.com/", {
  headers: {
    "Origin": "https://68gbvn25.site",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
    "Referer": "https://68gbvn25.site/"
  }
});

ws.binaryType = "arraybuffer";

ws.on("open", () => {
  console.log("✅ Đã kết nối WebSocket thành công");
});

ws.on("message", (data) => {
  try {
    if (!(data instanceof Buffer)) return;
    const hexHeader = data.slice(0, 1).toString("hex");
    const code = parseInt(hexHeader, 16);

    // Chỉ xử lý nếu gói nằm trong khoảng 0x70 đến 0x79
    if (code < 0x70 || code > 0x79) return;

    const text = new TextDecoder("utf-8").decode(data);
    const match = text.match(/\{(\d+)-(\d+)-(\d+)\}/);
    if (!match) return;

    const kq = match.slice(1).map(Number);
    const sum = kq.reduce((a, b) => a + b, 0);
    const result = sum >= 11 ? "Tài" : "Xỉu";

    push(ref(db, "taixiu/"), {
      kq,
      sum,
      result,
      time: Date.now()
    });

    console.log(`🎲 ${kq.join("-")} = ${sum} → ${result}`);
  } catch (e) {
    console.error("❌ Lỗi xử lý:", e.message);
  }
});

ws.on("error", (err) => {
  console.error("❌ Lỗi WebSocket:", err);
});

ws.on("close", () => {
  console.log("🔌 Kết nối WebSocket đã đóng");
});
