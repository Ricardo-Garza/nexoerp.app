export type EnterpriseColumnKind = "text" | "number" | "date" | "boolean";
export type EnterpriseSortDirection = "asc" | "desc";
export type EnterpriseFilterOperator =
  | "contains"
  | "equals"
  | "gt"
  | "lt"
  | "between"
  | "dateRange"
  | "relativeDate";

export interface EnterpriseColumnDef<T> {
  key: string;
  header: string;
  kind?: EnterpriseColumnKind;
  accessor: (row: T) => string | number | boolean | Date | null | undefined;
}

export interface EnterpriseColumnFilter {
  operator: EnterpriseFilterOperator;
  value: string | number | boolean | [number, number] | [string, string];
}

export interface EnterpriseTableState {
  globalSearch: string;
  sort: { key: string; direction: EnterpriseSortDirection } | null;
  columnFilters: Record<string, EnterpriseColumnFilter>;
  hiddenColumns: string[];
  columnOrder: string[];
}

export interface EnterpriseTableResult<T> {
  rows: T[];
  visibleColumns: EnterpriseColumnDef<T>[];
  totals: Record<string, number>;
  activeFilterLabels: string[];
}

export function createDefaultTableState<T>(
  columns: EnterpriseColumnDef<T>[],
  overrides: Partial<EnterpriseTableState> = {},
): EnterpriseTableState {
  return {
    globalSearch: "",
    sort: null,
    columnFilters: {},
    hiddenColumns: [],
    columnOrder: columns.map((column) => column.key),
    ...overrides,
  };
}

export function applyEnterpriseTableState<T>(
  rows: T[],
  columns: EnterpriseColumnDef<T>[],
  state: EnterpriseTableState,
): EnterpriseTableResult<T> {
  const visibleColumns = orderColumns(columns, state.columnOrder).filter(
    (column) => !state.hiddenColumns.includes(column.key),
  );
  let nextRows = [...rows];

  if (state.globalSearch.trim()) {
    const query = normalizeText(state.globalSearch);
    nextRows = nextRows.filter((row) =>
      columns.some((column) =>
        normalizeText(formatValue(column.accessor(row))).includes(query),
      ),
    );
  }

  const activeFilterLabels: string[] = [];
  for (const [key, filter] of Object.entries(state.columnFilters)) {
    const column = columns.find((candidate) => candidate.key === key);
    if (!column) continue;
    activeFilterLabels.push(formatFilterLabel(column.header, filter));
    nextRows = nextRows.filter((row) =>
      passesFilter(column.accessor(row), column.kind ?? "text", filter),
    );
  }
  if (state.globalSearch.trim())
    activeFilterLabels.unshift(`Buscar: ${state.globalSearch.trim()}`);

  if (state.sort) {
    const column = columns.find(
      (candidate) => candidate.key === state.sort?.key,
    );
    if (column) {
      nextRows.sort((a, b) =>
        compareValues(
          column.accessor(a),
          column.accessor(b),
          column.kind ?? "text",
          state.sort?.direction ?? "asc",
        ),
      );
    }
  }

  const totals: Record<string, number> = {};
  for (const column of visibleColumns) {
    if (column.kind !== "number") continue;
    totals[column.key] = nextRows.reduce(
      (sum, row) => sum + toNumber(column.accessor(row)),
      0,
    );
  }

  return { rows: nextRows, visibleColumns, totals, activeFilterLabels };
}

export function serializeCsv<T>(
  rows: T[],
  columns: EnterpriseColumnDef<T>[],
): string {
  const lines = [columns.map((column) => escapeCsv(column.header)).join(",")];
  for (const row of rows) {
    lines.push(
      columns
        .map((column) => escapeCsv(formatValue(column.accessor(row))))
        .join(","),
    );
  }
  return lines.join("\n");
}

export function buildExportFilename(
  moduleName: string,
  tenantName: string,
  date: Date,
  extension: "csv" | "xlsx",
): string {
  const datePart = date.toISOString().slice(0, 10);
  return `NEXO_${slugPart(moduleName)}_${slugPart(tenantName)}_${datePart}.${extension}`;
}

function orderColumns<T>(
  columns: EnterpriseColumnDef<T>[],
  order: string[],
): EnterpriseColumnDef<T>[] {
  const byKey = new Map(columns.map((column) => [column.key, column]));
  const ordered = order
    .map((key) => byKey.get(key))
    .filter((column): column is EnterpriseColumnDef<T> => Boolean(column));
  const missing = columns.filter((column) => !order.includes(column.key));
  return [...ordered, ...missing];
}

function compareValues(
  a: string | number | boolean | Date | null | undefined,
  b: string | number | boolean | Date | null | undefined,
  kind: EnterpriseColumnKind,
  direction: EnterpriseSortDirection,
): number {
  const multiplier = direction === "asc" ? 1 : -1;
  if (kind === "number") return (toNumber(a) - toNumber(b)) * multiplier;
  if (kind === "date") return (toTime(a) - toTime(b)) * multiplier;
  return (
    formatValue(a).localeCompare(formatValue(b), "es", { numeric: true }) *
    multiplier
  );
}

function passesFilter(
  value: string | number | boolean | Date | null | undefined,
  kind: EnterpriseColumnKind,
  filter: EnterpriseColumnFilter,
): boolean {
  if (filter.operator === "contains")
    return normalizeText(formatValue(value)).includes(
      normalizeText(String(filter.value)),
    );
  if (filter.operator === "equals")
    return (
      normalizeText(formatValue(value)) === normalizeText(String(filter.value))
    );
  if (filter.operator === "gt") return toNumber(value) > Number(filter.value);
  if (filter.operator === "lt") return toNumber(value) < Number(filter.value);
  if (filter.operator === "between" && Array.isArray(filter.value)) {
    const [min, max] = filter.value as [number, number];
    const number = toNumber(value);
    return number >= min && number <= max;
  }
  if (filter.operator === "dateRange" && Array.isArray(filter.value)) {
    const [from, to] = filter.value as [string, string];
    const time = toTime(value);
    return time >= new Date(from).getTime() && time <= new Date(to).getTime();
  }
  if (filter.operator === "relativeDate" && kind === "date") {
    return isWithinRelativeDate(toTime(value), String(filter.value));
  }
  return true;
}

function isWithinRelativeDate(time: number, value: string): boolean {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (value === "today") return time >= start.getTime();
  if (value === "last30") {
    const thirty = new Date(now);
    thirty.setDate(thirty.getDate() - 30);
    return time >= thirty.getTime();
  }
  if (value === "thisMonth") {
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    return time >= month.getTime();
  }
  if (value === "thisWeek") {
    const week = new Date(start);
    week.setDate(week.getDate() - week.getDay());
    return time >= week.getTime();
  }
  return true;
}

function formatFilterLabel(
  header: string,
  filter: EnterpriseColumnFilter,
): string {
  if (filter.operator === "contains")
    return `${header} contiene ${filter.value}`;
  if (filter.operator === "equals") return `${header} = ${filter.value}`;
  if (filter.operator === "gt") return `${header} > ${filter.value}`;
  if (filter.operator === "lt") return `${header} < ${filter.value}`;
  return `${header}: ${Array.isArray(filter.value) ? filter.value.join(" - ") : filter.value}`;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatValue(
  value: string | number | boolean | Date | null | undefined,
): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function toNumber(
  value: string | number | boolean | Date | null | undefined,
): number {
  if (typeof value === "number") return value;
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toTime(
  value: string | number | boolean | Date | null | undefined,
): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  const time = new Date(String(value ?? "")).getTime();
  return Number.isFinite(time) ? time : 0;
}

function escapeCsv(value: string): string {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function slugPart(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}
