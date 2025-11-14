import { useState, useCallback, useEffect } from "react";
import * as api from "../api/employees";
export default function useEmployees(
  initial = { page: 1, limit: 5, sortBy: "Id", order: "asc" }
) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initial.page || 1);
  const [limit, setLimit] = useState(initial.limit || 5);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState(initial.sortBy || "Id");
  const [order, setOrder] = useState((initial.order || "asc").toLowerCase());
  const [search, setSearch] = useState("");
  const [designation, setDesignation] = useState(null);
  const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;

  const load = useCallback(
    async (overrides = {}) => {
      const p = overrides.page ?? page;
      const l = overrides.limit ?? limit;
      const sBy = overrides.sortBy ?? sortBy;
      const ord = (overrides.order ?? order).toLowerCase();
      const s = overrides.search ?? search;
      const desg =
        overrides.designation === undefined
          ? designation
          : overrides.designation;

      setLoading(true);
      try {
        const params = {
          page: p,
          limit: l,
          sortBy: sBy,
          order: ord,
        };

        if (s && String(s).trim() !== "") params.search = s;
        if (desg && String(desg).trim() !== "") params.designation = desg;

        const json = await api.fetchEmployees(params);
        if (json && json.success) {
          setRows(json.data || []);
          setTotal(json.total || 0);
          setPage(json.page || p);
          setLimit(json.limit !== undefined ? json.limit : l);
        } else {
          console.error("Failed to load employees", json);
        }
      } catch (err) {
        console.error("Network error while loading employees", err);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, sortBy, order, search, designation]
  );
  const changePage = async (p) => {
    setPage(p);
    await load({ page: p });
  };

  const changeLimit = async (l) => {
    setLimit(l);
    setPage(1);
    await load({ page: 1, limit: l });
  };

  const changeSort = async (newSortBy) => {
    const newOrder =
      sortBy === newSortBy ? (order === "asc" ? "desc" : "asc") : "asc";
    setSortBy(newSortBy);
    setOrder(newOrder);
    await load({ sortBy: newSortBy, order: newOrder, page: 1 });
  };

  const changeSearch = async (q) => {
    setSearch(q);
    setPage(1);
    await load({ page: 1, search: q });
  };
  const changeDesignation = async (desg) => {
    const normalized = desg && String(desg).trim() ? String(desg).trim() : null;
    setDesignation(normalized);
    setPage(1);
    await load({ page: 1, designation: normalized });
  };

  const refresh = () => load();

  const addRow = (newEmployee) => {
    if (!newEmployee) return;
    setRows((r) => [...r, newEmployee]);
  };

  const remove = async (id) => {
    const json = await api.deleteEmployeeById(id);
    if (json && json.success) {
      await load();
      return { ok: true };
    }
    return { ok: false, error: json?.message };
  };

  const update = async (id, payload) => {
    const json = await api.updateEmployeeById(id, payload);
    if (json && json.success) {
      await load();
      return { ok: true, data: json.data };
    }
    return { ok: false, error: json?.message };
  };
  useEffect(() => {
    load();
  }, []);

  return {
    rows,
    loading,
    page,
    limit,
    total,
    totalPages,
    sortBy,
    order,
    search,
    designation,
    changePage,
    changeLimit,
    changeSort,
    changeSearch,
    changeDesignation,
    refresh,
    remove,
    update,
    addRow,
  };
}
