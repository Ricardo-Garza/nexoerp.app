# Graph Report - .  (2026-07-14)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1863 nodes · 6796 edges · 151 communities (89 shown, 62 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e994d9a3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 146

## God Nodes (most connected - your core abstractions)
1. `cn()` - 139 edges
2. `Button()` - 134 edges
3. `Card()` - 128 edges
4. `CardContent()` - 128 edges
5. `Badge()` - 99 edges
6. `CardHeader()` - 97 edges
7. `useAuth()` - 96 edges
8. `CardTitle()` - 94 edges
9. `BaseDocument` - 85 edges
10. `Input()` - 75 edges

## Surprising Connections (you probably didn't know these)
- `seedStore()` --indirect_call--> `lot()`  [INFERRED]
  lib/server/store.ts → tests/unit/inventory.test.ts
- `SkuDetailPage()` --calls--> `getSkuDetail()`  [EXTRACTED]
  app/dashboard/catalogo/[sku]/page.tsx → lib/server/queries.ts
- `ECommercePage()` --indirect_call--> `ShoppingCart`  [INFERRED]
  app/dashboard/ecommerce/page.tsx → lib/types.ts
- `SalesChart()` --indirect_call--> `err()`  [INFERRED]
  components/dashboard/sales-chart.tsx → lib/domain/shared/result.ts
- `TopProducts()` --indirect_call--> `err()`  [INFERRED]
  components/dashboard/top-products.tsx → lib/domain/shared/result.ts

## Import Cycles
- None detected.

## Communities (151 total, 62 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (84): statusLabel, TENANT_TEMPLATES, TenantsPage(), PERMISSIONS, UserProfile, UserRole, STATUS_LABELS, NuevaPolizaDialogProps (+76 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (57): KIND_LABELS, SkuDetailPage(), Client, Document, Invoice, Prospect, Quotation, SEVERITY (+49 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (24): directionLabel, modeLabel, TaxReportsProps, CFDITab(), ClientFormDialog(), ClientsTab(), CobranzaTab(), DocumentsTab() (+16 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (54): Activity, Approver, Attachment, AttributeValue, BIAggregation, BIFilter, BillingAddress, BISorting (+46 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (19): SyncLogEntry, CRM_ENTITY_MAP, customerToMomentumContact(), EntityMap, HttpMomentumAdapter, MockMomentumAdapter, CrmSyncPort, buildOutboxEvent() (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (41): MODULE_ICONS, buildTenantMenu(), GROUP_ORDER, GROUP_TITLES, moduleLabel(), resolveTenantModules(), TenantMenuItem, TenantMenuSection (+33 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (33): AdminShell(), NAV, Logo(), NexoLogo(), NexoLogoProps, GoodsReceiptDialog(), Calendar(), CalendarDayButton() (+25 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (31): moduleStateLabel, tenantStatusLabel, CfdiDoc, createdTime(), Customer, documentTypeLabel(), emptyText(), FacturacionPage() (+23 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (40): JournalEntriesTableProps, MaintenanceScheduleTabProps, ProductionPlanningTabProps, ProductionQualityTabProps, AccountPayable, AccountReceivable, AttendanceRecord, BaseDocument (+32 more)

### Community 9 - "Community 9"
Cohesion: 0.05
Nodes (39): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, @playwright/test, postcss, tailwindcss (+31 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (27): DEFAULT_CHART_DATA, MonthlyData, data, FinancialReport(), InventoryReport(), data, kpis, PerformanceReport() (+19 more)

### Community 11 - "Community 11"
Cohesion: 0.13
Nodes (32): TenantIndicatorsBoard(), useIndicatorValues(), asNumber(), asString(), buildStockPositions(), importedRowToInventory(), importedRowToPriceEntry(), importedRowToProduct() (+24 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (28): INBOUND, isLotUsable(), OUTBOUND, suggestFefoAllocation(), validateMovement(), buildAuditEvent(), newCorrelationId(), DomainError (+20 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (19): BulkAction, ColumnFilters(), compareValues(), DataTableProProps, DATE_FILTERS, DATE_PRESETS, DateFilterControl(), DENSITIES (+11 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (30): applyEnterpriseTableState(), buildExportFilename(), ColumnStats, compareValues(), computeNumberStats(), createDefaultTableState(), EnterpriseColumnDef, EnterpriseColumnFilter (+22 more)

### Community 15 - "Community 15"
Cohesion: 0.09
Nodes (29): buildCatalog(), CHART_WIDGETS, chartData(), chartIcon(), ChartKind, ChartWidget(), COLORS, CustomizableDashboard() (+21 more)

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (24): SettingsPage(), LoginPage(), SupplierProductDialog(), AuthContext, AuthContextType, AuthProvider(), AuthUser, DEFAULT_PREFERENCES (+16 more)

### Community 17 - "Community 17"
Cohesion: 0.07
Nodes (29): ./*, dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+21 more)

### Community 18 - "Community 18"
Cohesion: 0.13
Nodes (18): ProductionContent(), CartLine, PosPage(), ProductBase, ProductWithStock, ProductionFormulasTab(), ProductionOrdersTab(), ProductionPlanningTab() (+10 more)

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (13): PayrollPage(), tabs, ReconciliationTab(), CTASection(), ConceptsTab(), HRTab(), IncidentsTab(), PayrollTab() (+5 more)

### Community 20 - "Community 20"
Cohesion: 0.17
Nodes (23): CatalogoPage(), ConfiguracionPage(), InventarioLotesPage(), ListasPreciosPage(), CatalogTable(), CatalogTableRow, PriceListTable(), CatalogFilter (+15 more)

### Community 21 - "Community 21"
Cohesion: 0.21
Nodes (21): ADR-0002, Brand, DataStatus, ProductFamily, ProductKind, Sku, StockLocation, Warehouse (+13 more)

### Community 22 - "Community 22"
Cohesion: 0.13
Nodes (18): DashboardDialog(), DashboardsTab(), AppHeader(), formatNotificationTime(), getNotificationTime(), getUserInitials(), NotificationItem, DropdownMenu() (+10 more)

### Community 23 - "Community 23"
Cohesion: 0.16
Nodes (22): ImportWizard(), Stat(), Step, autoMap(), buildTemplateWorkbook(), coerce(), downloadBlob(), errorsToCsv() (+14 more)

### Community 24 - "Community 24"
Cohesion: 0.09
Nodes (24): catalogRows, clean(), clientesDemo, clientRows, DATA, familias, familiesOrder, familyImages (+16 more)

### Community 25 - "Community 25"
Cohesion: 0.14
Nodes (19): FloatingAssistant(), Message, Suggestion, allowedActions(), AssistantContext, AssistantReply, AssistantSuggestion, buildAssistantReply() (+11 more)

### Community 26 - "Community 26"
Cohesion: 0.21
Nodes (22): InventoryStockView(), CatalogViewMode, FAMILY_TONES, familyInitials(), familyTone(), money(), ProductRow, ProductsPricingView() (+14 more)

### Community 27 - "Community 27"
Cohesion: 0.11
Nodes (22): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+14 more)

### Community 28 - "Community 28"
Cohesion: 0.15
Nodes (14): TenantDetailPage(), CrmEmbedPage(), CrmPage(), DashboardPage(), ProductosPreciosPage(), PlatformGuard(), RecordAuditSheet(), IndicatorSettingsCard() (+6 more)

### Community 29 - "Community 29"
Cohesion: 0.12
Nodes (14): maturityLabel, maturityVariant, EmployeesTab(), ESTADO_LABELS, toIsoDate(), PriceListInfo, PriceListTableProps, PriceRow (+6 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (15): GenerateDeliveryDialog(), GenerateInvoiceDialog(), PostConfirmDialog(), PostConfirmDialogProps, SalesOrderForm(), SalesOrderFormProps, Alert(), AlertDescription() (+7 more)

### Community 31 - "Community 31"
Cohesion: 0.20
Nodes (15): AdminUsersPage(), MaintenancePage(), PrintOrderPage(), GoodsReceiptDialogProps, InventoryStats(), Product, useFirestore(), useMaintenanceData() (+7 more)

### Community 32 - "Community 32"
Cohesion: 0.23
Nodes (12): SuppliersPage(), DocumentsTab(), PayablesTab(), ProductsTab(), StatisticsTab(), SupplierFormDialog(), SuppliersTab(), Supplier (+4 more)

### Community 33 - "Community 33"
Cohesion: 0.20
Nodes (15): BusinessIntelligencePage(), tabs, ECommercePage(), AuthGuard(), PUBLIC_ROUTES, MapsTab(), DashboardStats(), useAuth() (+7 more)

### Community 34 - "Community 34"
Cohesion: 0.10
Nodes (6): benefits, steps, modules, painPoints, modules, WhatsAppButton()

### Community 35 - "Community 35"
Cohesion: 0.19
Nodes (13): canTransitionLotQuality(), PostMovementInput, QUALITY_TRANSITIONS, FefoSuggestion, InventoryMovement, Lot, MovementType, StockProjectionRow (+5 more)

### Community 36 - "Community 36"
Cohesion: 0.21
Nodes (13): ClientDraft, NewClientSheetProps, OrderDetailDrawer(), OrderDetailDrawerProps, statusConfig, Separator(), Sheet(), SheetContent() (+5 more)

### Community 37 - "Community 37"
Cohesion: 0.17
Nodes (13): demoAuthService, listeners, User, DEMO_USERS, DemoUser, findDemoUser(), ALL_VIEW, hasPermission() (+5 more)

### Community 38 - "Community 38"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 39 - "Community 39"
Cohesion: 0.15
Nodes (12): AiConfigPage(), IntegrationsPage(), AdminOverviewPage(), priorityLabel, priorityVariant, statusLabel, SupportPage(), ImportCenterContent() (+4 more)

### Community 40 - "Community 40"
Cohesion: 0.30
Nodes (11): UserPreferencesCard(), UserPreferenceSelects(), UserPreferenceSelectsProps, DEFAULT_ERP_PREFERENCES, ErpLanguage, ErpPreferences, ErpTheme, mergeErpPreferences() (+3 more)

### Community 41 - "Community 41"
Cohesion: 0.17
Nodes (10): AccountingPage(), AccountsTable(), FinancialStatements(), ESTADO_LABELS, JournalEntriesTable(), toIsoDate(), NuevaCuentaDialog(), NuevaPolizaDialog() (+2 more)

### Community 42 - "Community 42"
Cohesion: 0.21
Nodes (13): AttributesPage(), AnalyticsTab(), AssignmentTab(), AttributeFormDialog(), AttributeFormDialogProps, CategoryFormDialog(), CategoryFormDialogProps, RegisteredAttributesTab() (+5 more)

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (13): ColumnConfigModal(), DemandPeriodSelector(), getProductStatus(), InventoryTable(), orderLevelConfig, Product, statusConfig, InventoryTab() (+5 more)

### Community 44 - "Community 44"
Cohesion: 0.33
Nodes (12): ClientsPageClient(), EProcurementPage(), useData(), addItem(), DataStore, defaultData, deleteItem(), getItems() (+4 more)

### Community 45 - "Community 45"
Cohesion: 0.19
Nodes (9): CustomerPortalTab(), features, OnlineOrdersTab(), OnlineOrdersTabProps, OverviewTab(), OverviewTabProps, SettingsTab(), WebCatalogTab() (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (12): computeMarginPct(), listCoversDate(), qualifiesForWholesale(), resolveChannelForOrder(), ResolvedPrice, resolvePrice(), PriceChannel, CatalogRow (+4 more)

### Community 47 - "Community 47"
Cohesion: 0.15
Nodes (14): dependencies, @radix-ui/react-aspect-ratio, @radix-ui/react-avatar, @radix-ui/react-dropdown-menu, @radix-ui/react-slider, @radix-ui/react-tabs, @radix-ui/react-toast, react-day-picker (+6 more)

### Community 49 - "Community 49"
Cohesion: 0.21
Nodes (11): BankingPage(), MovementsTab(), TIPO_LABELS, toIsoDate(), useBankingData(), BankStatement, BankTransaction, BankTransfer (+3 more)

### Community 50 - "Community 50"
Cohesion: 0.18
Nodes (11): CatalogItem, CertificadoItem, CoreConfig, EmpresaItem, ImpuestoItem, MonedaItem, SerieFolioItem, SucursalItem (+3 more)

### Community 51 - "Community 51"
Cohesion: 0.17
Nodes (12): brands, catalog, commercial, dataDir, dq, listIndex, outPath, parseCsv() (+4 more)

### Community 52 - "Community 52"
Cohesion: 0.26
Nodes (11): formatDate(), OrdenesVentaPage(), statusInfo(), toIsoDate(), VentasPage(), RecentOrders(), SalesChart(), ProductSales (+3 more)

### Community 53 - "Community 53"
Cohesion: 0.23
Nodes (9): InventoryLots(), LocationOption, LotRowView, qualityLabel(), qualityOptions, SkuOption, CONFIG, LotQualityBadge() (+1 more)

### Community 54 - "Community 54"
Cohesion: 0.35
Nodes (9): PlatformContext, PlatformContextType, PlatformProvider(), canAccessControlPlane(), isPlatformAdminEmail(), normalizeEmail(), PLATFORM_ADMIN_EMAILS, resolvePlatformRole() (+1 more)

### Community 55 - "Community 55"
Cohesion: 0.27
Nodes (9): fail(), main(), now, patchDoc(), SAMPLE_CUSTOMERS, signIn(), TENANTS, toFsFields() (+1 more)

### Community 56 - "Community 56"
Cohesion: 0.24
Nodes (6): _geist, _geistMono, metadata, ThemeProvider(), CompanyConfig, ADR-0001

### Community 57 - "Community 57"
Cohesion: 0.24
Nodes (9): AssistantTab(), AssistantTabProps, DashboardDialogProps, DashboardsTabProps, MapsTabProps, QueriesTabProps, QueryDialogProps, BIDashboard (+1 more)

### Community 58 - "Community 58"
Cohesion: 0.29
Nodes (7): ModuleToolbar(), ModuleToolbarAction, ModuleToolbarProps, Tooltip(), TooltipContent(), TooltipProvider(), TooltipTrigger()

### Community 59 - "Community 59"
Cohesion: 0.27
Nodes (10): EmployeeFormDialogProps, EmployeesTabProps, IncidentDialogProps, IncidentsTabProps, PayrollPeriodDialogProps, PayrollTabProps, ReportsTabProps, Employee (+2 more)

### Community 60 - "Community 60"
Cohesion: 0.28
Nodes (7): FieldServicesContent(), priorityConfig, statusConfig, useFieldServicesData(), FieldServiceMetrics, ProductoRetirado, RefaccionUsada

### Community 61 - "Community 61"
Cohesion: 0.22
Nodes (8): SupplierFormDialogProps, ContractAgreement, PurchaseOrder, PurchaseRequisition, RFQ, Supplier, SupplierCatalog, SupplierQuotation

### Community 62 - "Community 62"
Cohesion: 0.32
Nodes (4): OrdersStats(), stats, OrdersTable(), statusConfig

### Community 63 - "Community 63"
Cohesion: 0.47
Nodes (6): ProductionFormulasTabProps, ProductionOrderDialogProps, ProductionOrdersTabProps, Product, ProductFormula, ProductionOrder

### Community 64 - "Community 64"
Cohesion: 0.33
Nodes (5): UseFinancialDataOptions, Expense, FinancialPeriod, InventorySnapshot, Purchase

### Community 65 - "Community 65"
Cohesion: 0.47
Nodes (4): consoleErrors, loginAs(), loginAsAdmin(), switchUser()

### Community 66 - "Community 66"
Cohesion: 0.40
Nodes (4): initialRequisitions, stats, statusConfig, supplierBids

### Community 68 - "Community 68"
Cohesion: 0.60
Nodes (3): ServiceMapViewProps, FieldServiceOrder, TechnicianLocation

### Community 69 - "Community 69"
Cohesion: 0.40
Nodes (3): db, firebaseConfig, sampleData

### Community 70 - "Community 70"
Cohesion: 0.50
Nodes (4): AccountsTableProps, FinancialStatementsProps, NuevaCuentaDialogProps, LedgerAccount

### Community 73 - "Community 73"
Cohesion: 0.67
Nodes (3): CandidateDialogProps, HRTabProps, Candidate

### Community 74 - "Community 74"
Cohesion: 0.67
Nodes (3): ConceptDialogProps, ConceptsTabProps, BenefitDeduction

## Knowledge Gaps
- **466 isolated node(s):** `maturityVariant`, `maturityLabel`, `priorityVariant`, `priorityLabel`, `statusLabel` (+461 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **62 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Community 47` to `Community 128`, `Community 129`, `Community 130`, `Community 131`, `Community 132`, `Community 133`, `Community 134`, `Community 135`, `Community 136`, `Community 9`, `Community 10`, `Community 137`, `Community 138`, `Community 139`, `Community 140`, `Community 141`, `Community 142`, `Community 143`, `Community 23`, `Community 92`, `Community 93`, `Community 94`, `Community 95`, `Community 97`, `Community 98`, `Community 99`, `Community 100`, `Community 101`, `Community 102`, `Community 103`, `Community 104`, `Community 105`, `Community 106`, `Community 107`, `Community 108`, `Community 109`, `Community 111`, `Community 112`, `Community 113`, `Community 114`, `Community 115`, `Community 116`, `Community 117`, `Community 118`, `Community 119`, `Community 120`, `Community 121`, `Community 122`, `Community 123`, `Community 124`, `Community 125`, `Community 126`, `Community 127`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `react` connect `Community 10` to `Community 19`, `Community 6`, `Community 47`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 6` to `Community 0`, `Community 1`, `Community 2`, `Community 5`, `Community 7`, `Community 10`, `Community 13`, `Community 16`, `Community 19`, `Community 22`, `Community 23`, `Community 25`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 32`, `Community 36`, `Community 40`, `Community 48`, `Community 50`, `Community 58`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **What connects `maturityVariant`, `maturityLabel`, `priorityVariant` to the rest of the system?**
  _466 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0744571801323269 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06926406926406926 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.10999471179270227 - nodes in this community are weakly interconnected._