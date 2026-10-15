<template>
  <view class="admin-language-switch" role="group" :aria-label="$t('语言')">
    <button class="locale-button" role="button" :class="{ active: locale === 'zh-CN' }" :aria-pressed="locale === 'zh-CN'" @click="setLocale('zh-CN')">简体中文</button>
    <button class="locale-button" role="button" :class="{ active: locale === 'en' }" :aria-pressed="locale === 'en'" @click="setLocale('en')">English</button>
  </view>
</template>

<script setup>
import { locale, setLocale } from '@/locale'
</script>

<style scoped>
.admin-language-switch { display: flex; justify-content: flex-end; gap: 8px; margin: 0 0 16px; flex-wrap: wrap; }
.locale-button { margin: 0; min-height: 44px; padding: 5px 16px; border-radius: 8px; border: 1px solid #D9CBBB; color: #4A3427; background: #fff; font-size: 14px; line-height: 32px; }
.locale-button::after { border: none; }
.locale-button.active { color: #fff; background: #4A3427; border-color: #4A3427; }
.locale-button:focus-visible { outline: 3px solid #B8855B; outline-offset: 2px; }
</style>
