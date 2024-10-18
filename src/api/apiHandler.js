import axios from "axios";

export default async function request(
  method,
  url,
  params,
  { responseType, auth, authToken, token, headers = {} }
) {
  const body = method === "get" ? "params" : "data";

  const config = {
    method,
    url,
    baseURL: "http://localhost:4000/",
    [body]: params || {},
    responseType,
    headers: {
      ...headers,
    },
  };

  if (auth) {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return await axios.request(config);
}
