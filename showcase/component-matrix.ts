export type MatrixState = 'default' | 'hover' | 'focus' | 'disabled' | 'loading' | 'error' | 'success' | 'empty' | 'selected'

export interface ComponentMatrixRow {
  id: string
  component: string
  implementation: string
  states: MatrixState[]
}

export const componentMatrix: ComponentMatrixRow[] = [
  { id: 'button', component: 'Button', implementation: 'UButton / gp-button', states: ['default', 'hover', 'focus', 'disabled', 'loading'] },
  { id: 'input', component: 'Input', implementation: 'UInput / gp-input', states: ['default', 'focus', 'disabled', 'error'] },
  { id: 'select', component: 'Select', implementation: 'USelect', states: ['default', 'focus', 'disabled', 'error'] },
  { id: 'form', component: 'Form', implementation: 'UForm + UFormField', states: ['default', 'error', 'disabled'] },
  { id: 'table', component: 'Table', implementation: 'DrpDataTable + UTable', states: ['default', 'loading', 'empty', 'selected'] },
  { id: 'modal', component: 'Modal', implementation: 'UModal', states: ['default', 'focus'] },
  { id: 'navigation', component: 'Navigation', implementation: 'DrpSidebarNav + UNavigationMenu + DrpBreadcrumb', states: ['default', 'focus', 'selected'] },
  { id: 'textarea', component: 'Textarea', implementation: 'UTextarea / --gp-* contract', states: ['default', 'focus', 'disabled', 'error'] },
  { id: 'datepicker', component: 'DatePicker', implementation: 'Nuxt UI date contract', states: ['default', 'focus', 'disabled', 'error'] },
  { id: 'checkbox', component: 'Checkbox', implementation: 'UCheckbox', states: ['default', 'focus', 'disabled', 'error', 'selected'] },
  { id: 'radio', component: 'Radio', implementation: 'URadioGroup', states: ['default', 'focus', 'disabled', 'error', 'selected'] },
  { id: 'switch', component: 'Switch', implementation: 'USwitch', states: ['default', 'focus', 'disabled', 'loading', 'selected'] },
  { id: 'card', component: 'Card', implementation: 'UCard / gp-card', states: ['default', 'hover', 'focus', 'loading'] },
  { id: 'tabs', component: 'Tabs', implementation: 'UTabs', states: ['default', 'focus', 'disabled', 'selected'] },
  { id: 'drawer', component: 'Drawer', implementation: 'UDrawer contract', states: ['default', 'focus', 'loading', 'error'] },
  { id: 'tooltip', component: 'Tooltip', implementation: 'UTooltip contract', states: ['default', 'hover', 'focus'] },
  { id: 'popover', component: 'Popover', implementation: 'UPopover contract', states: ['default', 'focus'] },
  { id: 'toast', component: 'Toast', implementation: 'UToast live-region contract', states: ['default', 'success', 'error', 'loading'] },
  { id: 'pagination', component: 'Pagination', implementation: 'UPagination', states: ['default', 'focus', 'disabled', 'loading'] },
  { id: 'upload', component: 'Upload', implementation: 'UFileUpload contract', states: ['default', 'loading', 'success', 'error'] },
  { id: 'tree', component: 'Tree', implementation: 'UTree contract', states: ['default', 'focus', 'disabled', 'selected'] },
  { id: 'chart', component: 'Chart', implementation: 'Data table fallback contract', states: ['default', 'loading', 'empty', 'error'] },
  { id: 'skeleton', component: 'Skeleton', implementation: 'USkeleton', states: ['loading'] },
  { id: 'empty-state', component: 'EmptyState', implementation: 'Empty state contract', states: ['empty', 'error'] },
]
