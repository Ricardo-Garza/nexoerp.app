/** RBAC granular (docs/07_RBAC_APPROVALS.md). La UI oculta; el servidor autoriza. */
export type Role =
  | "super_admin"
  | "org_admin"
  | "director"
  | "sales_manager"
  | "sales_rep"
  | "cashier"
  | "purchasing_manager"
  | "warehouse_manager"
  | "warehouse_operator"
  | "production_manager"
  | "quality_manager"
  | "finance_manager"
  | "auditor"

export type Permission =
  | "catalog.view"
  | "catalog.edit"
  | "price.view"
  | "price.edit"
  | "price.margin.view"
  | "price.override"
  | "inventory.view"
  | "inventory.receive"
  | "inventory.transfer"
  | "stock.adjust.request"
  | "stock.adjust.approve"
  | "lot.release"
  | "lot.reject"
  | "fefo.override"
  | "sales.create"
  | "purchase.approve"
  | "audit.view"
  | "user.manage"

const ALL_VIEW: Permission[] = ["catalog.view", "price.view", "inventory.view"]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    ...ALL_VIEW,
    "catalog.edit",
    "price.edit",
    "price.margin.view",
    "price.override",
    "inventory.receive",
    "inventory.transfer",
    "stock.adjust.request",
    "stock.adjust.approve",
    "lot.release",
    "lot.reject",
    "fefo.override",
    "sales.create",
    "purchase.approve",
    "audit.view",
    "user.manage",
  ],
  org_admin: [
    ...ALL_VIEW,
    "catalog.edit",
    "price.edit",
    "price.margin.view",
    "inventory.receive",
    "inventory.transfer",
    "stock.adjust.approve",
    "audit.view",
    "user.manage",
  ],
  director: [...ALL_VIEW, "price.margin.view", "audit.view", "purchase.approve", "stock.adjust.approve"],
  sales_manager: [...ALL_VIEW, "sales.create", "price.override", "price.margin.view"],
  sales_rep: [...ALL_VIEW, "sales.create"],
  cashier: ["catalog.view", "price.view", "sales.create"],
  purchasing_manager: [...ALL_VIEW, "purchase.approve", "inventory.receive"],
  warehouse_manager: [
    ...ALL_VIEW,
    "inventory.receive",
    "inventory.transfer",
    "stock.adjust.request",
    "fefo.override",
  ],
  warehouse_operator: ["catalog.view", "inventory.view", "inventory.receive", "inventory.transfer"],
  production_manager: [...ALL_VIEW, "inventory.transfer", "stock.adjust.request"],
  quality_manager: [...ALL_VIEW, "lot.release", "lot.reject", "audit.view"],
  finance_manager: [...ALL_VIEW, "price.margin.view", "audit.view"],
  auditor: [...ALL_VIEW, "audit.view"],
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Superadministrador",
  org_admin: "Administrador de empresa",
  director: "Dirección",
  sales_manager: "Gerencia de ventas",
  sales_rep: "Ventas",
  cashier: "Caja / POS",
  purchasing_manager: "Compras",
  warehouse_manager: "Jefe de almacén",
  warehouse_operator: "Almacén",
  production_manager: "Producción",
  quality_manager: "Calidad",
  finance_manager: "Finanzas / Cobranza",
  auditor: "Auditoría",
}
