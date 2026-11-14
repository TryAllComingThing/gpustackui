<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { resolvePostLoginRedirect } from '../router/redirect'
import { useAuthStore } from '../../stores/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const retrying = ref(false)
const retryError = ref('')

async function retry() {
  if (retrying.value) return
  retrying.value = true
  retryError.value = ''
  try {
    const result = await auth.refresh()
    const redirect = resolvePostLoginRedirect(route.query.redirect)
    if (result.ok) {
      await router.replace(redirect)
      return
    }
    if (result.error.code === 'FORBIDDEN') {
      await router.replace({ name: 'forbidden' })
      return
    }
    if (result.error.code === 'UNAUTHORIZED') {
      await router.replace({ name: 'login', query: { redirect } })
      return
    }
    if (result.error.code !== 'CANCELED') retryError.value = t('error.unavailableRetryFailed')
  } finally {
    retrying.value = false
  }
}
</script>
<template>
  <section class="gp-page" data-testid="production-unavailable">
    <header class="gp-page-header"><div><h1 class="gp-page-title">{{ t('error.unavailable') }}</h1></div></header>
    <div class="gp-card">
      <p class="gp-body">{{ t('error.unavailableBody') }}</p>
      <UButton class="gp-mt-4" color="primary" variant="outline" :loading="retrying" :disabled="retrying" data-testid="session-retry" @click="retry">
        {{ t('feedback.retry') }}
      </UButton>
      <p v-if="retryError" class="gp-secondary" role="alert" data-testid="session-retry-error">{{ retryError }}</p>
    </div>
  </section>
</template>
