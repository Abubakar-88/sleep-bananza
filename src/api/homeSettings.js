import axios from "axios";
import { storeApi } from "./client";

// Same WordPress host as storeApi:  .../wp-json/wc/store/v1  ->  .../wp-json/sleepstore/v1
const settingsApi = axios.create({
  baseURL: String(storeApi.defaults?.baseURL || "").replace(/\/wc\/store\/v1\/?$/, "/sleepstore/v1"),
});

// Home page images & text managed in WP Admin → Home Page
export async function getHomeSettings() {
  const { data } = await settingsApi.get("/home");
  return data;
}
