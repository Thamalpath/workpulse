const http = require("http");
const Api = "127.0.0.1", Port = 5000;
function req(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const headers = { "Content-Type": "application/json" };
    if (cookie) headers["Cookie"] = cookie;
    const r = http.request({ host: Api, port: Port, path, method, headers }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve({ status: res.statusCode, setCookie: res.headers["set-cookie"], body: data }));
    });
    r.on("error", reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}
(async () => {
  const login = await req("POST", "/api/auth/login", { identifier: "admin", password: "1234" });
  const sc = login.setCookie;
  const cookie = sc ? sc.map((c) => c.split(";")[0]).join("; ") : "";
  const rr = await req(
    "POST",
    "/api/ai/chat",
    { messages: [{ role: "user", content: "Hi" }] },
    cookie
  );
  console.log("STATUS:", rr.status);
  console.log(rr.body.slice(0, 1500));
  process.exit(0);
})().catch((e) => { console.error("ERR", e); process.exit(1); });