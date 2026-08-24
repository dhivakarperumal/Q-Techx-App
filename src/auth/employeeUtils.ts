const INACTIVE_STATUSES = new Set([
  "inactive",
  "in active",
  "terminated",
  "resigned",
  "retired",
  "deactivated",
  "deleted",
]);

const normalizeStatus = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");

export const isActiveEmployee = (employee: any) => {
  if (!employee || typeof employee !== "object") return false;

  const nestedEmployee = employee.employee || employee.user || employee.profile;
  if (nestedEmployee && typeof nestedEmployee === "object") {
    return isActiveEmployee(nestedEmployee);
  }

  const statusValues = [
    employee.status,
    employee.employment_status,
    employee.employee_status,
    employee.account_status,
  ];
  const normalizedStatuses = statusValues.map(normalizeStatus);
  if (normalizedStatuses.some((status) => INACTIVE_STATUSES.has(status))) {
    return false;
  }

  const activeFlag = employee.is_active ?? employee.isActive ?? employee.active;
  if (activeFlag !== undefined && activeFlag !== null) {
    if (activeFlag === false || activeFlag === 0) return false;
    if (typeof activeFlag === "string" && ["false", "0", "no", "inactive"].includes(normalizeStatus(activeFlag))) {
      return false;
    }
  }

  return true;
};

export const activeEmployeesOnly = <T,>(employees: T[]) =>
  employees.filter(isActiveEmployee);
