#!/usr/bin/env node
import fs from "fs";
import path from "path";
import url from "url";
import admin from "firebase-admin";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function safeLog(...args) {
  // eslint-disable-next-line no-console
  console.log(...args);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { json: false, validate: false, projectId: null, creds: null };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === "--json") out.json = true;
    else if (a === "--validate") out.validate = true;
    else if (a === "--project" && args[i + 1]) { out.projectId = args[i + 1]; i += 1; }
    else if (a === "--creds" && args[i + 1]) { out.creds = args[i + 1]; i += 1; }
  }
  return out;
}

function loadConfig() {
  const configPath = path.join(__dirname, "docs-check.config.json");
  const overridePath = path.join(__dirname, "firebase-check.config.json");
  const base = fs.existsSync(configPath) ? loadJson(configPath) : {};
  const override = fs.existsSync(overridePath) ? loadJson(overridePath) : {};
  return { ...base, ...override };
}

async function initAdmin(projectId, credsPath) {
  if (admin.apps.length) return admin.app();

  const credential = credsPath
    ? admin.credential.cert(loadJson(credsPath))
    : admin.credential.applicationDefault();

  return admin.initializeApp({ credential, projectId });
}

function typeOfValue(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  if (v && typeof v.toDate === "function") return "timestamp";
  return typeof v;
}

function mergeTypeMaps(into, add) {
  for (const [k, t] of Object.entries(add)) {
    into[k] = into[k] ? Array.from(new Set([].concat(into[k]).concat(t))) : t;
  }
  return into;
}

async function sampleCollection(db, collectionPath, sampleSize = 10) {
  const snapshot = await db.collection(collectionPath).limit(sampleSize).get();
  const fieldTypes = {};
  const docIds = [];
  snapshot.forEach((doc) => {
    docIds.push(doc.id);
    const data = doc.data() || {};
    const types = {};
    for (const [key, val] of Object.entries(data)) {
      types[key] = typeOfValue(val);
    }
    mergeTypeMaps(fieldTypes, types);
  });
  return { count: snapshot.size, sampleDocIds: docIds, fieldTypes };
}

async function listSubcollections(docRef) {
  const subs = await docRef.listCollections();
  return subs.map((c) => c.id);
}

async function scanTree(db, roots, sampleSize) {
  const result = {};
  for (const root of roots) {
    const [top, maybeUid, ...rest] = root.split("/");
    if (!maybeUid) {
      // top-level collection
      result[top] = result[top] || {};
      const summary = await sampleCollection(db, top, sampleSize);
      result[top]["__summary__"] = summary;
    } else {
      // specific path
      const collPath = root;
      const key = collPath;
      result[key] = await sampleCollection(db, collPath, sampleSize);
    }
  }

  // Discover subcollections for representative docs under users/*
  if (result.users && result.users.__summary__?.sampleDocIds?.length) {
    const uid = result.users.__summary__.sampleDocIds[0];
    const userDoc = db.collection("users").doc(uid);
    const subcols = await listSubcollections(userDoc);
    result["users/*"] = { subcollections: subcols };
    if (subcols.includes("threads")) {
      const threadsSnapshot = await db.collection(`users/${uid}/threads`).limit(1).get();
      const threadId = threadsSnapshot.docs[0]?.id;
      if (threadId) {
        const messagesSummary = await sampleCollection(db, `users/${uid}/threads/${threadId}/messages`, sampleSize);
        result["users/*/threads/*/messages"] = messagesSummary;
      }
    }
  }
  return result;
}

function formatTree(result) {
  const lines = [];
  function pushLine(s) { lines.push(s); }
  if (result.users) {
    pushLine("users/");
    if (result["users/*"]) {
      const subs = result["users/*"].subcollections || [];
      for (const sub of subs) {
        pushLine(`  {uid}/${sub}/`);
      }
    }
    if (result["users/*/threads/*/messages"]) {
      pushLine("  {uid}/threads/{threadId}/messages/");
    }
  }
  if (result.system) pushLine("system/");
  if (result.server_logs) pushLine("server_logs/");
  return lines.join("\n");
}

function diffAgainstExpected(scanned, expected) {
  const missing = [];
  const extra = [];
  const scannedKeys = new Set(Object.keys(scanned));
  const expectedKeys = new Set(Object.keys(expected));
  for (const k of expectedKeys) if (!scannedKeys.has(k)) missing.push(k);
  for (const k of scannedKeys) if (!expectedKeys.has(k)) extra.push(k);
  return { missing, extra };
}

async function main() {
  const args = parseArgs();
  const cfg = loadConfig();
  const sampleSize = cfg.firebaseSampleSize || 10;
  const roots = cfg.firebaseRoots || ["users", "system", "server_logs"];

  await initAdmin(args.projectId || process.env.GOOGLE_CLOUD_PROJECT, args.creds || process.env.GOOGLE_APPLICATION_CREDENTIALS);
  const db = admin.firestore();

  const scanned = await scanTree(db, roots, sampleSize);

  if (args.json) {
    process.stdout.write(JSON.stringify(scanned, null, 2));
  } else {
    safeLog("Firestore structure (sampled):\n");
    safeLog(formatTree(scanned));
    safeLog("\nSummaries:");
    for (const [k, v] of Object.entries(scanned)) {
      if (k === "users" || k === "system" || k === "server_logs") continue;
      safeLog(`- ${k}:`, JSON.stringify(v.__summary__ || v));
    }
  }

  if (args.validate) {
    const expectedPath = path.join(__dirname, "firebase-expected.json");
    if (!fs.existsSync(expectedPath)) {
      safeLog("(no firebase-expected.json found; skipping validation)");
      process.exit(0);
    }
    const expected = loadJson(expectedPath);
    const { missing, extra } = diffAgainstExpected(scanned, expected);
    if (missing.length || extra.length) {
      safeLog("\nDiff vs expected:");
      if (missing.length) safeLog("  Missing:", missing.join(", "));
      if (extra.length) safeLog("  Extra:", extra.join(", "));
      process.exit(1);
    }
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("firebase-scan failed:", err);
  process.exit(1);
});


