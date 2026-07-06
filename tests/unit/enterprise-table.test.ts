import { describe, expect, it } from "vitest";
import {
  applyEnterpriseTableState,
  buildExportFilename,
  computeNumberStats,
  createDefaultTableState,
  removeSavedView,
  serializeCsv,
  upsertSavedView,
  type EnterpriseColumnDef,
  type SavedTableView,
} from "@/lib/table/enterprise-table";

interface Row {
  id: string;
  name: string;
  status: string;
  amount: number;
  createdAt: string;
}

const rows: Row[] = [
  {
    id: "1",
    name: "Cliente Norte",
    status: "active",
    amount: 1200,
    createdAt: "2026-07-01T10:00:00.000Z",
  },
  {
    id: "2",
    name: "Cliente Sur",
    status: "blocked",
    amount: 450,
    createdAt: "2026-06-15T10:00:00.000Z",
  },
  {
    id: "3",
    name: "Proveedor Centro",
    status: "active",
    amount: 9800,
    createdAt: "2026-07-03T10:00:00.000Z",
  },
];

const columns: EnterpriseColumnDef<Row>[] = [
  { key: "name", header: "Nombre", kind: "text", accessor: (row) => row.name },
  {
    key: "status",
    header: "Estado",
    kind: "text",
    accessor: (row) => row.status,
  },
  {
    key: "amount",
    header: "Importe",
    kind: "number",
    accessor: (row) => row.amount,
  },
  {
    key: "createdAt",
    header: "Fecha",
    kind: "date",
    accessor: (row) => row.createdAt,
  },
];

describe("enterprise table logic", () => {
  it("filters by global search and exact column filters", () => {
    const state = createDefaultTableState(columns, {
      globalSearch: "cliente",
      columnFilters: { status: { operator: "equals", value: "active" } },
    });

    const result = applyEnterpriseTableState(rows, columns, state);

    expect(result.rows.map((row) => row.id)).toEqual(["1"]);
    expect(result.activeFilterLabels).toEqual([
      "Buscar: cliente",
      "Estado = active",
    ]);
  });

  it("sorts numbers and dates in both directions", () => {
    const byAmount = applyEnterpriseTableState(
      rows,
      columns,
      createDefaultTableState(columns, {
        sort: { key: "amount", direction: "desc" },
      }),
    );
    const byDate = applyEnterpriseTableState(
      rows,
      columns,
      createDefaultTableState(columns, {
        sort: { key: "createdAt", direction: "asc" },
      }),
    );

    expect(byAmount.rows.map((row) => row.id)).toEqual(["3", "1", "2"]);
    expect(byDate.rows.map((row) => row.id)).toEqual(["2", "1", "3"]);
  });

  it("keeps visible columns ordered by the saved variant and totals numeric columns", () => {
    const state = createDefaultTableState(columns, {
      columnOrder: ["amount", "name", "status", "createdAt"],
      hiddenColumns: ["status"],
    });

    const result = applyEnterpriseTableState(rows, columns, state);

    expect(result.visibleColumns.map((column) => column.key)).toEqual([
      "amount",
      "name",
      "createdAt",
    ]);
    expect(result.totals.amount).toBe(11450);
  });

  it("exports only visible filtered columns with a professional filename", () => {
    const state = createDefaultTableState(columns, {
      globalSearch: "cliente",
      hiddenColumns: ["status"],
      columnOrder: ["name", "amount", "createdAt", "status"],
    });
    const result = applyEnterpriseTableState(rows, columns, state);

    expect(serializeCsv(result.rows, result.visibleColumns)).toContain(
      "Nombre,Importe,Fecha",
    );
    expect(serializeCsv(result.rows, result.visibleColumns)).not.toContain(
      "Estado",
    );
    expect(
      buildExportFilename(
        "Clientes",
        "DELAR Foods",
        new Date("2026-07-06T12:00:00.000Z"),
        "csv",
      ),
    ).toBe("NEXO_CLIENTES_DELAR_FOODS_2026-07-06.csv");
  });

  it("filters numeric ranges and date ranges for column filters", () => {
    const result = applyEnterpriseTableState(
      rows,
      columns,
      createDefaultTableState(columns, {
        columnFilters: {
          amount: { operator: "between", value: [1000, 10000] },
          createdAt: {
            operator: "dateRange",
            value: ["2026-07-01", "2026-07-31"],
          },
        },
      }),
    );

    expect(result.rows.map((row) => row.id)).toEqual(["1", "3"]);
    expect(result.totals.amount).toBe(11000);
    expect(result.activeFilterLabels).toEqual([
      "Importe: 1000 - 10000",
      "Fecha: 2026-07-01 - 2026-07-31",
    ]);
  });
});

describe("column stats (Totales)", () => {
  it("computes count, sum, average, min and max ignoring non-numeric values", () => {
    const stats = computeNumberStats([1200, 450, 9800, null, undefined, "x"]);

    expect(stats).toEqual({
      count: 3,
      sum: 11450,
      avg: 11450 / 3,
      min: 450,
      max: 9800,
    });
  });

  it("sums money columns with decimal-safe arithmetic", () => {
    // 0.1 + 0.2 con floats daría 0.30000000000000004
    const stats = computeNumberStats([0.1, 0.2], { money: true });

    expect(stats.sum).toBe(0.3);
    expect(stats.avg).toBe(0.15);
  });

  it("returns zeros for an empty column", () => {
    expect(computeNumberStats([])).toEqual({
      count: 0,
      sum: 0,
      avg: 0,
      min: 0,
      max: 0,
    });
  });
});

describe("saved views (Vistas)", () => {
  const base: SavedTableView = {
    name: "Mi vista",
    hidden: ["status"],
    density: "compact",
    columnFilters: { name: "cliente" },
    sortKey: "amount",
    sortDir: "desc",
    quickFilter: null,
  };

  it("adds a view and replaces an existing one by name, case-insensitive", () => {
    const once = upsertSavedView([], base);
    const twice = upsertSavedView(once, {
      ...base,
      name: "mi vista",
      density: "comfortable",
    });

    expect(twice).toHaveLength(1);
    expect(twice[0].density).toBe("comfortable");
  });

  it("ignores empty names and sorts views alphabetically", () => {
    const views = upsertSavedView(
      upsertSavedView(upsertSavedView([], base), { ...base, name: "Ventas mes" }),
      { ...base, name: "   " },
    );

    expect(views.map((view) => view.name)).toEqual(["Mi vista", "Ventas mes"]);
  });

  it("removes a view by name", () => {
    const views = upsertSavedView([], base);

    expect(removeSavedView(views, "MI VISTA")).toEqual([]);
    expect(removeSavedView(views, "otra")).toHaveLength(1);
  });
});
