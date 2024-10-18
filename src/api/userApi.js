import api from "./apiHandler";

async function addOrganization(body) {
  return await api("post", "api/organization", body, { auth: false });
}

async function rollBackOrganization(orgId) {
  return await api("delete", `api/organization/${orgId}`, {}, { auth: false });
}

async function getAllOrganizations() {
  return await api("get", "api/organization", {}, { auth: false });
}

async function addOrganizationAdmin(orgId, values) {
  return await api("post", `/api/addAdmin/${orgId}`, values, { auth: false });
}

async function rollBackOrganizationAdmin(orgId) {
  return await api("delete", `api/admin/${orgId}`, {}, { auth: false });
}

async function getEmployee(orgID) {
  return await api(
    "get",
    `/api/organization/employees/${orgID}`,
    {},
    { auth: false }
  );
}

async function addEmployee(orgID, body) {
  return await api("post", `/api/addEmployee/${orgID}`, body, {
    auth: false,
  });
}

async function rollBackOrganizationEmployee(empId) {
  return await api("delete", `api/employee/${empId}`, {}, { auth: false });
}

async function updateOrgBlockchainStatus(orgID, body) {
  return await api(
    "patch",
    `/api/organization/blockchain-status/${orgID}`,
    body,
    {
      auth: false,
    }
  );
}

async function dailyAttendanceMark(empId, body) {
  return await api("post", `/api/employee/mark-attendance/${empId}`, body, {
    auth: false,
  });
}

async function getDailyAttendance(empId) {
  return await api(
    "get",
    `/api/employee/attendance/${empId}`,
    {},
    { auth: false }
  );
}

export {
  getAllOrganizations,
  addOrganization,
  addOrganizationAdmin,
  getEmployee,
  addEmployee,
  updateOrgBlockchainStatus,
  rollBackOrganization,
  rollBackOrganizationAdmin,
  rollBackOrganizationEmployee,
  dailyAttendanceMark,
  getDailyAttendance,
};
