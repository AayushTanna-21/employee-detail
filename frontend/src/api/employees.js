const BASE = "http://localhost:5000/api/employees";

export async function fetchEmployees(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = qs ? `${BASE}?${qs}` : BASE;
  const res = await fetch(url);
  return res.json(); // { success, data, total, page, limit }
}

export async function createEmployee(formData) {
  const res = await fetch(BASE, { method: "POST", body: formData });
  return res.json();
}

export async function deleteEmployeeById(id) {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
  return res.json();
}

export async function updateEmployeeById(id, payload) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
