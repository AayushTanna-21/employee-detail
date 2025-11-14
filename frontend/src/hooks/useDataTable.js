import { useEffect, useRef } from "react";
import debounce from "../utils/debounce";
import $ from "jquery";
import "datatables.net";

export default function useDataTable(tableRef, rows, options = {}) {
  const dtRef = useRef(null);

  const {
    pageLength = 5,
    lengthChange = true,
    info = true,
    lengthMenu = [
      [5, 10, 25, -1],
      [5, 10, 25, "All"],
    ],
    nameColIndex = 2,
  } = options;

  useEffect(() => {
    if (!window.$ || !tableRef.current || !window.$.fn.dataTable) return;

    const $table = window.$(tableRef.current);
    let $globalSearchInput = null;
    const transformRow = (r) => [
      r.Id,
      r.Image
        ? `<img src="${
            r.Image.startsWith("http")
              ? r.Image
              : `http://localhost:5000${r.Image}`
          }" style="width:50px;height:40px;" />`
        : "—",
      r.Name,
      r.Age,
      r.Designation,
      r.Details,
      `<button onclick="window.handleTableEdit(${r.Id}, '${r.Name}', ${
        r.Age
      }, '${r.Details || ""}')">Edit</button>`,
      `<button onclick="window.handleTableRemove(${r.Id})">Remove</button>`,
    ];
    if ($table.hasClass("dataTable")) {
      try {
        $table.DataTable().destroy();
      } catch (e) {}
    }

    const dt = $table.DataTable({
      data: rows.map(transformRow),
      columns: [
        { title: "ID", data: 0 },
        { title: "Image", data: 1 },
        { title: "Name", data: 2 },
        { title: "Age", data: 3 },
        { title: "Designation", data: 4 },
        { title: "Details", data: 5 },
        { title: "Edit", data: 6, orderable: false },
        { title: "Remove", data: 7, orderable: false },
      ],
      pageLength: pageLength,
      lengthChange: lengthChange,
      info: info,
      lengthMenu: lengthMenu,
      columnDefs: [{ targets: [1, 6, 7], searchable: false, orderable: false }],
    });

    dtRef.current = dt;
    const $dtWrapper = $table.closest(".dataTables_wrapper");
    $globalSearchInput = $dtWrapper.find("div.dataTables_filter input");

    if ($globalSearchInput.length) {
      $globalSearchInput.off();

      const handleSearch = debounce(() => {
        const val = $globalSearchInput.val() || "";
        dt.column(nameColIndex).search(val, false, true).draw();
      }, 250);

      $globalSearchInput.on("keyup input", handleSearch);
    }
    return () => {
      if ($globalSearchInput && $globalSearchInput.length) {
        $globalSearchInput.off();
      }
      try {
        if (dtRef.current) {
          dtRef.current.destroy();
        }
      } catch (e) {}
      dtRef.current = null;
    };
  }, [
    tableRef,
    rows,
    pageLength,
    lengthChange,
    info,
    lengthMenu,
    nameColIndex,
  ]);

  return dtRef;
}
