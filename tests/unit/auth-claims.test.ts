import { describe, expect, it } from "vitest"
import { platformRoleFromClaims, tenantFromClaims, tenantRoleFromClaims } from "@/lib/auth"

describe("claims de autenticación", () => {
  it("separa el rol global del rol de empresa", () => {
    expect(platformRoleFromClaims({ platformAdmin: true, tenantRole: "user" })).toBe("platform_admin")
    expect(tenantRoleFromClaims({ platformAdmin: true, tenantRole: "user" })).toBe("user")
    expect(platformRoleFromClaims({ tenantRole: "admin" })).toBe("none")
    expect(tenantRoleFromClaims({ tenantRole: "admin" })).toBe("admin")
  })

  it("solo acepta tenants y roles firmados con tipos válidos", () => {
    expect(tenantFromClaims({ companyId: "org-soleilwire" })).toBe("org-soleilwire")
    expect(tenantFromClaims({ companyId: 42 })).toBeUndefined()
    expect(tenantRoleFromClaims({ tenantRole: "owner" })).toBeUndefined()
  })
})
