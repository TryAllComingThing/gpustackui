<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { z } from 'zod'

const { t } = useI18n()

export interface ComplexFormField {
  name: string
  label: string
  type?: 'text' | 'url' | 'password' | 'select'
  placeholder?: string
  required?: boolean
  options?: Array<{ label: string; value: string }>
}

const props = withDefaults(defineProps<{
  schema: z.ZodTypeAny
  initialState: Record<string, unknown>
  fields: ComplexFormField[]
  submitter?: (state: Record<string, unknown>) => Promise<void> | void
  submitLabel?: string
  resetLabel?: string
  successMessage?: string
}>(), {
  submitLabel: undefined,
  resetLabel: undefined,
  successMessage: undefined,
})

const resolvedSubmitLabel = computed(() => props.submitLabel ?? t('patterns.form.submit'))
const resolvedResetLabel = computed(() => props.resetLabel ?? t('patterns.form.reset'))
const resolvedSuccessMessage = computed(() => props.successMessage ?? t('patterns.form.success'))

const emit = defineEmits<{
  submit: [state: Record<string, unknown>]
  success: [state: Record<string, unknown>]
  error: [message: string]
  reset: []
}>()

function cloneState(value: Record<string, unknown>): Record<string, unknown> {
  if (typeof structuredClone === 'function') {
    try { return structuredClone(value) } catch { /* reactive proxies and non-cloneable values use the JSON fallback */ }
  }
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

const state = reactive<Record<string, unknown>>(cloneState(props.initialState))
const fieldErrors = reactive<Record<string, string | undefined>>({})
const submitting = ref(false)
const submitted = ref(false)
const formError = ref('')

function clearErrors() {
  for (const key of Object.keys(fieldErrors)) fieldErrors[key] = undefined
  formError.value = ''
}

function applyIssues(issues: Array<{ path: PropertyKey[]; message: string }>) {
  clearErrors()
  for (const issue of issues) {
    const name = String(issue.path[0] ?? '')
    if (name && !fieldErrors[name]) fieldErrors[name] = issue.message
  }
  formError.value = issues.map((issue) => issue.message).join('；') || t('patterns.form.correctionRequired')
  emit('error', formError.value)
}

function onNuxtFormError(event: { errors?: Array<{ name?: string; message?: string }> }) {
  applyIssues((event.errors ?? []).map((error) => ({ path: error.name ? [error.name] : [], message: error.message ?? t('patterns.form.correctionRequired') })))
}

async function handleSubmit() {
  submitted.value = false
  const result = props.schema.safeParse({ ...state })
  if (!result.success) {
    applyIssues(result.error.issues)
    return
  }
  clearErrors()
  submitting.value = true
  try {
    const data = result.data as Record<string, unknown>
    await props.submitter?.({ ...data })
    submitted.value = true
    emit('submit', { ...data })
    emit('success', { ...data })
  } catch (error) {
    formError.value = error instanceof Error ? error.message : t('patterns.form.failed')
    emit('error', formError.value)
  } finally {
    submitting.value = false
  }
}

function reset() {
  replaceState(props.initialState)
  emit('reset')
}

function replaceState(nextState: Record<string, unknown>) {
  for (const key of Object.keys(state)) delete state[key]
  Object.assign(state, cloneState(nextState))
  submitted.value = false
  clearErrors()
}

watch(() => props.initialState, (nextState) => {
  replaceState(nextState)
}, { deep: true })

watch(state, () => {
  submitted.value = false
  formError.value = ''
  for (const key of Object.keys(fieldErrors)) fieldErrors[key] = undefined
}, { deep: true })
</script>

<template>
  <UForm :schema="schema" :state="state" :disabled="submitting" :loading-auto="false" class="gp-complex-form" @submit="handleSubmit" @error="onNuxtFormError">
    <div class="gp-complex-form__grid">
      <UFormField v-for="field in fields" :key="field.name" :label="field.label" :name="field.name" :required="field.required" :error="fieldErrors[field.name]" class="gp-complex-form__field">
        <USelect v-if="field.type === 'select'" v-model="state[field.name]" :items="field.options ?? []" :placeholder="field.placeholder" />
        <UInput v-else v-model="state[field.name]" :type="field.type === 'url' ? 'url' : field.type === 'password' ? 'password' : 'text'" :placeholder="field.placeholder" />
      </UFormField>
    </div>
    <div class="gp-complex-form__actions">
      <UButton type="submit" :loading="submitting" :disabled="submitting">{{ resolvedSubmitLabel }}</UButton>
      <UButton type="button" color="neutral" variant="outline" :disabled="submitting" @click="reset">{{ resolvedResetLabel }}</UButton>
      <span v-if="submitted" class="gp-complex-form__success" role="status">{{ resolvedSuccessMessage }}</span>
      <span v-if="formError" class="gp-complex-form__error" role="alert">{{ formError }}</span>
    </div>
  </UForm>
</template>
