import { mkdir, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const baseUrl = process.env.CAPTURE_BASE_URL ?? "http://localhost:3000";
const outputDir = "/home/ubuntu/casal-clean-admin-validation";
const profileDir = "/tmp/casal-clean-browser-profile";
const debugPort = 9231;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForDebugPort() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const targets = await response.json();
      const page = targets.find(target => target.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      // Chromium ainda está inicializando.
    }
    await sleep(250);
  }
  throw new Error("Não foi possível conectar ao navegador de validação.");
}

async function createClient(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let messageId = 0;
  const pending = new Map();
  socket.addEventListener("message", event => {
    const payload = JSON.parse(event.data);
    if (payload.id && pending.has(payload.id)) {
      const { resolve, reject } = pending.get(payload.id);
      pending.delete(payload.id);
      payload.error ? reject(new Error(payload.error.message)) : resolve(payload.result);
    }
  });
  return {
    send(method, params = {}) {
      messageId += 1;
      socket.send(JSON.stringify({ id: messageId, method, params }));
      return new Promise((resolve, reject) => pending.set(messageId, { resolve, reject }));
    },
    close() { socket.close(); },
  };
}

async function screenshot(client, filename, width, height) {
  await client.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  await sleep(200);
  const result = await client.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  await writeFile(`${outputDir}/${filename}`, Buffer.from(result.data, "base64"));
}

async function navigate(client, path) {
  await client.send("Page.navigate", { url: `${baseUrl}${path}` });
  await sleep(700);
}

async function main() {
  if (!process.env.CASAL_CLEAN_HENRIQUE_PASSWORD) throw new Error("Credencial de validação não disponível.");
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  await rm(profileDir, { recursive: true, force: true });
  const chromium = spawn("chromium", [`--remote-debugging-port=${debugPort}`, "--headless=new", "--no-sandbox", "--disable-gpu", `--user-data-dir=${profileDir}`, "about:blank"], { stdio: "ignore" });
  try {
    const page = await waitForDebugPort();
    const client = await createClient(page.webSocketDebuggerUrl);
    await client.send("Page.enable");
    await navigate(client, "/");
    const password = JSON.stringify(process.env.CASAL_CLEAN_HENRIQUE_PASSWORD);
    const fillLoginScript = `(() => {
      const setValue = (selector, value) => {
        const element = document.querySelector(selector);
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        setter.call(element, value);
        element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      };
      setValue("#username", "henrique.carlos");
      setValue("#password", ${password});
    })()`;
    await client.send("Runtime.evaluate", { expression: fillLoginScript, awaitPromise: true });
    await sleep(350);
    await client.send("Runtime.evaluate", { expression: 'document.querySelector("button[type=submit]").click()', awaitPromise: true });
    await sleep(1400);
    await screenshot(client, "dashboard-desktop.png", 1280, 720);
    await navigate(client, "/calculo");
    await screenshot(client, "calculo-desktop.png", 1280, 720);
    await navigate(client, "/produto/sofa");
    await screenshot(client, "especificacoes-desktop.png", 1280, 720);
    await navigate(client, "/historico");
    await screenshot(client, "historico-desktop.png", 1280, 720);
    await navigate(client, "/servicos");
    await screenshot(client, "servicos-desktop.png", 1280, 720);
    await navigate(client, "/configuracoes");
    await screenshot(client, "configuracoes-desktop.png", 1280, 720);
    await navigate(client, "/calculo");
    await screenshot(client, "calculo-mobile.png", 375, 812);
    await navigate(client, "/produto/sofa");
    await screenshot(client, "especificacoes-mobile.png", 375, 812);
    await navigate(client, "/historico");
    await screenshot(client, "historico-mobile.png", 375, 812);
    await client.close();
  } finally {
    chromium.kill("SIGTERM");
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
