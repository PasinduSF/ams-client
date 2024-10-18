const getServerError = (err) => {
  let value = "";

  if (typeof err?.response?.data === "string") {
    value = err.response.data;
  } else if (typeof err?.response?.data === "object") {
    if (err.response.data?.message) {
      if (typeof err.response.data.message === "string") {
        value = err.response.data.message;
      } else if (
        Array.isArray(err.response.data.message) &&
        err.response.data.message.length
      ) {
        value = err.response.data.message[0];
      }
    }
  } else if (typeof err?.message === "string") {
    value = err.message;
  }

  return value;
};

const getRpcError = (err) => {
  let value = "";

  if (err?.code === 100) {
    const rpcErrorData = err?.data;

    if (rpcErrorData?.code === 3) {
      value = rpcErrorData?.message || "Access restricted to Users only";
    } else if (rpcErrorData?.message) {
      value = rpcErrorData.message;
    } else {
      value = "Internal JSON-RPC error occurred.";
    }
  }

  return value;
};

export { getServerError, getRpcError };
