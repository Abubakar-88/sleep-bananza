import axios from "axios";
import { storeApi } from "./client";

// Same WordPress host as storeApi:  .../wp-json/wc/store/v1  ->  .../wp-json/sleepstore/v1
const menuApi = axios.create({
  baseURL: String(storeApi.defaults.baseURL).replace(/\/wc\/store\/v1\/?$/, "/sleepstore/v1"),
});

// Menu built in WordPress → Appearance → Menus (assigned to a location or by menu slug)
export async function getMenu(location = "primary") {
  const { data } = await menuApi.get(`/menu/${location}`);
  return data;
}
