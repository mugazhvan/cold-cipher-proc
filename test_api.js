async function test() {
  try {
    const res = await fetch('https://kisanflow-backend.onrender.com/api/v1/crops');
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("TEXT:", text);
  } catch (e) {
    console.log("ERROR:", e.message);
  }
}

test();
