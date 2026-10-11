import axios from "axios";
import { storeApi } from "./client";

// Same WordPress host as storeApi:  .../wp-json/wc/store/v1  ->  .../wp-json/sleepstore/v1
const api = axios.create({
  baseURL: String(storeApi.defaults?.baseURL || "").replace(/\/wc\/store\/v1\/?$/, "/sleepstore/v1"),
});

// Newsletter sign-up (stored in WP Admin → Subscribers)
export async function subscribe(email, { source = "footer", website = "" } = {}) {
  const { data } = await api.post("/subscribe", { email, source, website });
  return data;
}