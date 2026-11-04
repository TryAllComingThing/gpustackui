export type MatrixState = 'default' | 'hover' | 'focus' | 'disabled' | 'loading' | 'error' | 'success' | 'empty' | 'selected'
export type MatrixStatus = 'implemented' | 'deferred'

export interface ComponentMatrixRow {
  id: string
  component: string
  implementation: string
  status: MatrixStatus
  states: MatrixState[]
}

export const componentMatrix: ComponentMatrixRow[] = [
  { id: 'button', component: 'Button', implementation: 'UButton / .gp-app-button', status: 'implemented', states: ['default', 'hover', 'focus', 'disabled', 'loading'] },
  { id: 'input', component: 'Input', implementation: 'UInput / .gp-app-input', status: 'implemented', states: ['default', 'focus', 'disabled', 'error'] },
  { id: 'select', component: 'Select', implementation: 'USelect / .gp-app-select', status: 'implemented', states: ['default', 'focus', 'disabled', 'error'] },
  { id: 'form', component: 'Form', implementation: 'UForm + UFormField', status: 'implemented', states: ['default', 'error', 'disabled'] },
  { id: 'table', component: 'Table', implementation: 'UDataTable + UTable', status: 'implemented', states: ['default', 'loading', 'empty', 'selected'] },
  { id: 'modal', component: 'Modal', implementation: 'UModal', status: 'implemented', states: ['default', 'focus'] },
  { id: 'navigation', component: 'Navigation', implementation: 'USidebarNav + UNavigationMenu + UBreadcrumb', status: 'implemented', states: ['default', 'focus', 'selected'] },
  { id: 'textarea', component: 'Textarea', implementation: 'UTextarea / .gp-app-textarea', status: 'implemented', states: ['default', 'focus', 'disabled', 'error'] },
  { id: 'datepicker', component: 'DatePicker', implementation: 'UInputDate', status: 'implemented', states: ['default', 'focus', 'disabled', 'error'] },
  { id: 'checkbox', component: 'Checkbox', implementation: 'UCheckbox', status: 'implemented', states: ['default', 'focus', 'disabled', 'error', 'selected'] },
  { id: 'radio', component: 'Radio', implementation: 'URadioGroup', status: 'implemented', states: ['default', 'focus', 'disabled', 'selected'] },
  { id: 'switch', component: 'Switch', implementation: 'USwitch', status: 'implemented', states: ['default', 'focus', 'disabled', 'loading', 'selected'] },
  { id: 'card', component: 'Card', implementation: 'UCard', status: 'implemented', states: ['default', 'hover', 'focus', 'loading'] },
  { id: 'tabs', component: 'Tabs', implementation: 'UTabs', status: 'implemented', states: ['default', 'focus', 'disabled', 'selected'] },
  { id: 'drawer', component: 'Drawer', implementation: 'UDrawer', status: 'implemented', states: ['default', 'focus', 'loading', 'error'] },
  { id: 'tooltip', component: 'Tooltip', implementation: 'UNavigationMenu Tooltip', status: 'implemented', states: ['default', 'hover', 'focus'] },
  { id: 'popover', component: 'Popover', implementation: 'UPopover', status: 'implemented', states: ['default', 'hover', 'focus'] },
  { id: 'toast', component: 'Toast', implementation: 'useToast() + UToast', status: 'implemented', states: ['default', 'success', 'error', 'loading'] },
  { id: 'pagination', component: 'Pagination', implementation: 'UPagination', status: 'implemented', states: ['default', 'focus', 'disabled', 'loading'] },
  { id: 'upload', component: 'Upload', implementation: 'UFileUpload', status: 'implemented', states: ['default', 'hover', 'focus', 'disabled', 'success', 'error'] },
  { id: 'tree', component: 'Tree', implementation: 'UTree', status: 'implemented', states: ['default', 'focus', 'disabled', 'selected'] },
  { id: 'chart', component: 'Chart', implementation: 'UChart + --gp-chart-*', status: 'implemented', states: ['default', 'empty', 'error'] },
  { id: 'skeleton', component: 'Skeleton', implementation: 'USkeleton', status: 'implemented', states: ['loading'] },
  { id: 'empty-state', component: 'EmptyState', implementation: 'UEmpty', status: 'implemented', states: ['empty', 'error'] },
]
