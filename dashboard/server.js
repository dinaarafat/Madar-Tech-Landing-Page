const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");
const CONTENT_FILE = path.join(__dirname, "data", "site-content.json");
const MEDIA_DIRECTORY = path.join(ROOT, "assets", "images");
const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT) || 4173;
const MAX_JSON_BYTES = 7 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".otf": "font/otf",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};
const IMAGE_TYPES = {
  "image/jpeg": { extension: ".jpg", matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": { extension: ".png", matches: (bytes) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  "image/webp": { extension: ".webp", matches: (bytes) => bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP" },
  "image/gif": { extension: ".gif", matches: (bytes) => bytes.toString("ascii", 0, 3) === "GIF" }
};

function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(value));
}

function isAllowedBrowserRequest(request) {
  const origin = request.headers.origin;
  const host = request.headers.host;
  return (host === `${HOST}:${PORT}` || host === `localhost:${PORT}`)
    && (!origin || origin === `http://${HOST}:${PORT}` || origin === `http://localhost:${PORT}`);
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_JSON_BYTES) {
      throw Object.assign(new Error("حجم الطلب أكبر من الحد المسموح."), { status: 413 });
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("تعذر قراءة بيانات JSON."), { status: 400 });
  }
}

function isValidLocaleContent(content) {
  return content
    && typeof content === "object"
    && typeof content.siteTitle === "string"
    && Array.isArray(content.navigation)
    && Array.isArray(content.heroSlides)
    && Array.isArray(content.sections)
    && content.footer
    && typeof content.footer === "object";
}

function isValidContent(content) {
  return isValidLocaleContent(content)
    && content.appearance
    && typeof content.appearance === "object"
    && content.translations
    && typeof content.translations === "object"
    && Object.keys(content.translations).length > 0
    && Object.entries(content.translations).every(([language, locale]) =>
      /^[a-z]{2}(?:-[A-Z]{2})?$/.test(language) && isValidLocaleContent(locale));
}

async function handleApi(request, response, pathname) {
  if (!isAllowedBrowserRequest(request)) {
    sendJson(response, 403, { error: "الطلب غير مسموح." });
    return;
  }

  if (pathname === "/api/content" && request.method === "GET") {
    const content = await fs.promises.readFile(CONTENT_FILE, "utf8");
    response.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    });
    response.end(content);
    return;
  }

  if (pathname === "/api/content" && request.method === "PUT") {
    const content = await readJson(request);
    if (!isValidContent(content)) {
      sendJson(response, 400, { error: "بنية محتوى الموقع غير صالحة." });
      return;
    }
    const serialized = `${JSON.stringify(content, null, 2)}\n`;
    const temporaryFile = `${CONTENT_FILE}.${crypto.randomBytes(6).toString("hex")}.tmp`;
    await fs.promises.writeFile(temporaryFile, serialized, { encoding: "utf8", flag: "wx" });
    await fs.promises.rename(temporaryFile, CONTENT_FILE);
    sendJson(response, 200, { message: "تم نشر التغييرات.", savedAt: new Date().toISOString() });
    return;
  }

  if (pathname === "/api/media" && request.method === "GET") {
    const names = await fs.promises.readdir(MEDIA_DIRECTORY);
    const files = names
      .filter((name) => [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(path.extname(name).toLowerCase()))
      .sort((left, right) => left.localeCompare(right, "ar"))
      .map((name) => ({ name, url: `assets/images/${encodeURIComponent(name)}` }));
    sendJson(response, 200, { files });
    return;
  }

  if (pathname === "/api/media" && request.method === "POST") {
    const payload = await readJson(request);
    const imageType = IMAGE_TYPES[payload && payload.type];
    if (!imageType || typeof payload.data !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(payload.data)) {
      sendJson(response, 400, { error: "نوع الصورة أو بياناتها غير صالحة." });
      return;
    }
    const bytes = Buffer.from(payload.data, "base64");
    if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES || !imageType.matches(bytes)) {
      sendJson(response, 400, { error: "الصورة فارغة أو تتجاوز 5 ميغابايت أو أن صيغة الملف غير مطابقة." });
      return;
    }
    const filename = `${crypto.randomBytes(12).toString("hex")}${imageType.extension}`;
    await fs.promises.writeFile(path.join(MEDIA_DIRECTORY, filename), bytes, { flag: "wx" });
    sendJson(response, 201, { name: filename, url: `assets/images/${filename}` });
    return;
  }

  sendJson(response, 404, { error: "المسار المطلوب غير موجود." });
}

async function handleStatic(request, response, pathname) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "طريقة الطلب غير مدعومة." });
    return;
  }

  const requestedPath = pathname === "/" ? "/index.html" : pathname === "/dashboard" ? "/dashboard/" : pathname;
  const relativePath = requestedPath === "/dashboard/" ? "dashboard/index.html" : requestedPath.replace(/^[/\\]+/, "");
  const filePath = path.resolve(ROOT, relativePath);
  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
    sendJson(response, 403, { error: "المسار غير مسموح." });
    return;
  }

  try {
    const details = await fs.promises.stat(filePath);
    if (!details.isFile()) {
      sendJson(response, 404, { error: "الملف غير موجود." });
      return;
    }
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Content-Length": details.size
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    fs.createReadStream(filePath).pipe(response);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") {
      sendJson(response, 404, { error: "الملف غير موجود." });
      return;
    }
    throw error;
  }
}

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  } catch {
    sendJson(response, 400, { error: "عنوان الطلب غير صالح." });
    return;
  }

  const operation = pathname.startsWith("/api/")
    ? handleApi(request, response, pathname)
    : handleStatic(request, response, pathname);
  operation.catch((error) => {
    console.error(error);
    if (!response.headersSent) {
      sendJson(response, error.status || 500, { error: error.status ? error.message : "حدث خطأ أثناء تنفيذ الطلب." });
    } else {
      response.destroy(error);
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Madar Tech CMS running at http://${HOST}:${PORT}`);
  console.log(`Dashboard: http://${HOST}:${PORT}/dashboard/`);
});
