export type MatrixState = 'default' | 'hover' | 'focus' | 'disabled' | 'loading' | 'error' | 'success' | 'empty' | 'selected'

export interface ComponentMatrixRow {
  id: string
  component: string
  implementation: string
  fixtureTestId: string
  states: MatrixState[]
}

export const componentMatrix: ComponentMatrixRow[] = [
  { id: 'button', component: 'Button', implementation: 'UButton / .gp-app-button', fixtureTestId: 'button-primary', states: ['default', 'hover', 'focus', 'disabled', 'loading'] },
  { id: 'input', component: 'Input', implementation: 'UInput / .gp-app-input', fixtureTestId: 'input-readonly', states: ['default', 'focus', 'disabled', 'error'] },
  { id: 'select', component: 'Select', implementation: 'USelect / .gp-app-select', fixtureTestId: 'select-disabled', states: ['default', 'focus', 'disabled', 'error'] },
  { id: 'form', component: 'Form', implementation: 'UForm + UFormField', fixtureTestId: 'section-form', states: ['default', 'error', 'disabled'] },
  { id: 'table', component: 'Table', implementation: 'UDataTable + UTable', fixtureTestId: 'section-table', states: ['default', 'loading', 'empty', 'selected'] },
  { id: 'modal', component: 'Modal', implementation: 'UModal', fixtureTestId: 'component-modal', states: ['default', 'focus'] },
  { id: 'navigation', component: 'Navigation', implementation: 'USidebarNav + UNavigationMenu + UBreadcrumb', fixtureTestId: 'section-navigation', states: ['default', 'focus', 'selected'] },
  { id: 'textarea', component: 'Textarea', implementation: 'UTextarea / .gp-app-textarea', fixtureTestId: 'textarea-notes', states: ['default', 'focus', 'disabled', 'error'] },
  { id: 'datepicker', component: 'DatePicker', implementation: 'UInputDate', fixtureTestId: 'date-state-fixtures', states: ['default', 'focus', 'disabled', 'error'] },
  { id: 'checkbox', component: 'Checkbox', implementation: 'UCheckbox', fixtureTestId: 'checkbox-fixture', states: ['default', 'focus', 'disabled', 'error', 'selected'] },
  { id: 'radio', component: 'Radio', implementation: 'URadioGroup', fixtureTestId: 'advanced-radio', states: ['default', 'focus', 'disabled', 'selected'] },
  { id: 'switch', component: 'Switch', implementation: 'USwitch', fixtureTestId: 'advanced-switch', states: ['default', 'focus', 'disabled', 'loading', 'selected'] },
  { id: 'card', component: 'Card', implementation: 'UCard', fixtureTestId: 'state-card', states: ['default'] },
  { id: 'tabs', component: 'Tabs', implementation: 'UTabs', fixtureTestId: 'state-tabs', states: ['default', 'focus', 'disabled', 'selected'] },
  { id: 'drawer', component: 'Drawer', implementation: 'UDrawer', fixtureTestId: 'state-drawer', states: ['default', 'focus'] },
  { id: 'tooltip', component: 'Tooltip', implementation: 'UNavigationMenu tooltip live region', fixtureTestId: 'section-navigation', states: ['default', 'hover', 'focus'] },
  { id: 'popover', component: 'Popover', implementation: 'UPopover', fixtureTestId: 'advanced-popover-trigger', states: ['default', 'hover', 'focus'] },
  { id: 'toast', component: 'Toast', implementation: 'useToast() live region', fixtureTestId: 'state-toast-open', states: ['default', 'success'] },
  { id: 'pagination', component: 'Pagination', implementation: 'UPagination', fixtureTestId: 'section-table', states: ['default', 'focus', 'disabled', 'loading'] },
  { id: 'upload', component: 'Upload', implementation: 'UFileUpload', fixtureTestId: 'advanced-upload', states: ['default', 'hover', 'focus', 'disabled', 'success', 'error'] },
  { id: 'tree', component: 'Tree', implementation: 'UTree', fixtureTestId: 'advanced-tree', states: ['default', 'focus', 'disabled', 'selected'] },
  { id: 'chart', component: 'Chart', implementation: 'UChart + --gp-chart-*', fixtureTestId: 'advanced-chart', states: ['default', 'empty', 'error'] },
  { id: 'skeleton', component: 'Skeleton', implementation: 'USkeleton', fixtureTestId: 'state-loading', states: ['loading'] },
  { id: 'empty-state', component: 'Empty', implementation: 'UEmpty', fixtureTestId: 'state-empty', states: ['empty'] },
]
