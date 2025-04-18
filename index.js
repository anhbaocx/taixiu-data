const WebSocket = require("ws");
const { initializeApp, cert } = require("firebase-admin/app");
const { getDatabase, ref, push } = require("firebase-admin/database");

// Khởi tạo Firebase từ biến môi trường FIREBASE_KEY
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://taixiu-data-default-rtdb.firebaseio.com"
});


const db = getDatabase();

// Kết nối WebSocket đến game tài xỉu
const ws = new WebSocket("wss://l8dar9je9bnsou0p.cq.hk8jk.com/");
ws.binaryType = "arraybuffer";

ws.on("open", () => {
  console.log("✅ Đã kết nối WebSocket");
});

ws.on("message", (data) => {
  try {
    if (!(data instanceof Buffer)) return;

    const firstByte = data[0];
    if (firstByte < 0x70 || firstByte > 0x79) return; // Chỉ bắt từ 0x70 đến 0x79

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
      time: Date.now(),
    });

    console.log(`🎲 Gửi dữ liệu: ${kq.join("-")} → ${result}`);
  } catch (e) {
    console.error("❌ Lỗi xử lý:", e.message);
  }
});
