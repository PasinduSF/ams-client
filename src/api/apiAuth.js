import api from "./apiHandler";

async function getNonce(address) {
  return await api("get", `auth/nonce?address=${address}`, {}, { auth: false });
}

async function authenticateAdmin(body, tempToken) {
  return await api("post", "auth/verifyAdmin", body, {
    auth: false,
    headers: {
      Authorization: `Bearer ${tempToken}`,
    },
  });
}

async function authenticateEmp(body, tempToken) {
  return await api("post", "auth/verifyEmployee", body, {
    auth: false,
    headers: {
      Authorization: `Bearer ${tempToken}`,
    },
  });
}

async function authenticatePO(body, tempToken) {
  return await api("post", "auth/verifyPo", body, {
    auth: false,
    headers: {
      Authorization: `Bearer ${tempToken}`,
    },
  });
}

export { getNonce, authenticateAdmin, authenticatePO, authenticateEmp };
