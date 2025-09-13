/api/pocketbaseClient.js
import PocketBase from "pocketbase";

const PB_URL = import.meta.env.VITE_PB_URL || "http://127.0.0.1:8090";

/**
 * Prefer the PocketBase UMD already loaded on window (from index.html).
 * If not present, provide a minimal fetch-based fallback for create/getList.
 */
const PocketBaseCtor = (typeof PocketBase !== "undefined")
  ? PocketBase
  : (typeof window !== "undefined" && window.PocketBase) ? window.PocketBase : null;

let pb;

if (PocketBaseCtor) {
  pb = new PocketBaseCtor(PB_URL);
} else {
  console.warn("PocketBase SDK not found on window. Falling back to minimal REST helper.");
  pb = {
    collection: (name) => ({
      create: async (payload) => {
        const res = await fetch(`${PB_URL}/api/collections/${name}/records`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`Create failed ${res.status}`);
        return res.json();
      },
      getList: async (page = 1, perPage = 20, opts = {}) => {
        const q = new URLSearchParams({ page: String(page), perPage: String(perPage) });
        if (opts.sort) q.set("sort", opts.sort);
        const res = await fetch(`${PB_URL}/api/collections/${name}/records?${q.toString()}`);
        if (!res.ok) throw new Error(`List failed ${res.status}`);
        const json = await res.json();
        return { items: json?.items || [], totalItems: json?.totalItems || 0 };
      },
    }),
  };
}

export default pb;