<script setup lang="ts">
import { reactive, ref } from 'vue'
import { z } from 'zod'

export interface ComplexFormField {
  name: string
  label: string
  type?: 'text' | 'url' | 'select'
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
  submitLabel: '提交',
  resetLabel: '重置',
  successMessage: '提交成功',
})

const emit = defineEmits<{
  submit: [state: Record<string, unknown>]
  success: [state: Record<string, unknown>]
  error: [message: string]
  reset: []
}>()

const state = reactive<Record<string, unknown>>({ ...props.initialState })
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
  formError.value = issues.map((issue) => issue.message).join('；') || '请修正表单错误'
  emit('error', formError.value)
}

function onNuxtFormError(event: { errors?: Array<{ name?: string; message?: string }> }) {
  applyIssues((event.errors ?? []).map((error) => ({ path: error.name ? [error.name] : [], message: error.message ?? '请修正表单错误' })))
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
    formError.value = error instanceof Error ? error.message : '提交失败，请稍后重试'
    emit('error', formError.value)
  } finally {
    submitting.value = false
  }
}

function reset() {
  Object.assign(state, props.initialState)
  submitted.value = false
  clearErrors()
  emit('reset')
}
</script>

<template>
  <UForm :schema="schema" :state="state" :disabled="submitting" :loading-auto="false" class="drp-complex-form" @submit="handleSubmit" @error="onNuxtFormError">
    <div class="drp-complex-form__grid">
      <UFormField v-for="field in fields" :key="field.name" :label="field.label" :name="field.name" :required="field.required" :error="fieldErrors[field.name]" class="drp-complex-form__field">
        <USelect v-if="field.type === 'select'" v-model="state[field.name]" :items="field.options ?? []" :placeholder="field.placeholder" />
        <UInput v-else v-model="state[field.name]" :type="field.type === 'url' ? 'url' : 'text'" :placeholder="field.placeholder" />
      </UFormField>
    </div>
    <div class="drp-complex-form__actions">
      <UButton type="submit" :loading="submitting" :disabled="submitting">{{ submitLabel }}</UButton>
      <UButton type="button" color="neutral" variant="outline" :disabled="submitting" @click="reset">{{ resetLabel }}</UButton>
      <span v-if="submitted" class="drp-complex-form__success" role="status">{{ successMessage }}</span>
      <span v-if="formError" class="drp-complex-form__error" role="alert">{{ formError }}</span>
    </div>
  </UForm>
</template>
