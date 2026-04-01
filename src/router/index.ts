import './types.d.ts'

import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // ============================================
  // Main Routes
  // ============================================
  {
    path: '/',
    name: 'Home',
    component: () => import('@/features/home/HomePage.vue'),
    meta: {
      title: 'Home',
      showInNav: true,
      icon: 'mdi:home',
      group: 'main',
    },
  },
  {
    path: '/ide',
    name: 'Ide',
    component: () => import('@/features/ide/IdePage.vue'),
    meta: {
      title: 'IDE',
      showInNav: true,
      icon: 'mdi:monitor',
      group: 'main',
    },
  },

  // ============================================
  // Development Tools
  // ============================================
  {
    path: '/character-sprite-viewer',
    name: 'CharacterSpriteViewer',
    component: () => import('@/features/sprite-viewer/CharacterSpriteViewerPage.vue'),
    meta: {
      title: 'Sprite Viewer',
      showInNav: false,
      icon: 'mdi:eye',
      group: 'tools',
    },
  },
  {
    path: '/image-analyzer',
    name: 'ImageAnalyzer',
    component: () => import('@/features/image-analyzer/ImageAnalyzerPage.vue'),
    meta: {
      title: 'Image Analyzer',
      showInNav: true,
      icon: 'mdi:image',
      group: 'tools',
    },
  },
  {
    path: '/monaco',
    name: 'MonacoEditor',
    component: () => import('@/features/monaco-editor/MonacoEditorPage.vue'),
    meta: {
      title: 'Monaco Editor',
      showInNav: true,
      icon: 'mdi:code-tags',
      group: 'tools',
    },
  },

  // ============================================
  // Testing & Diagnostics
  // ============================================
  {
    path: '/performance-diagnostics',
    name: 'PerformanceDiagnostics',
    component: () => import('@/features/diagnostics/PerformanceDiagnosticsPage.vue'),
    meta: {
      title: 'Performance Diagnostics',
      showInNav: true,
      icon: 'mdi:speedometer',
      group: 'testing',
    },
  },
  {
    path: '/konva-test',
    name: 'KonvaSpriteTest',
    component: () => import('@/features/konva-test/KonvaSpriteTestPage.vue'),
    meta: {
      title: 'Konva Sprite Test',
      showInNav: true,
      icon: 'mdi:animation',
      group: 'testing',
    },
  },
  {
    path: '/position-sync-load-test',
    name: 'PositionSyncLoadTest',
    component: () => import('@/features/testing/PositionSyncLoadTestPage.vue'),
    meta: {
      title: 'Position Sync Load Test',
      showInNav: true,
      icon: 'mdi:sync',
      group: 'testing',
    },
  },
  {
    path: '/print-vs-sprites-test',
    name: 'PrintVsSpritesTest',
    component: () => import('@/features/testing/PrintVsSpritesTestPage.vue'),
    meta: {
      title: 'PRINT vs Sprites Test',
      showInNav: true,
      icon: 'mdi:test-tube',
      group: 'testing',
    },
  },
  {
    path: '/sound-test',
    name: 'SoundTest',
    component: () => import('@/features/sound-test/SoundTestPage.vue'),
    meta: {
      title: 'Sound Test',
      showInNav: true,
      icon: 'mdi:music',
      group: 'testing',
    },
  },

  // ============================================
  // Error Routes
  // ============================================
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/features/error/NotFoundPage.vue'),
    meta: {
      title: 'Not Found',
    },
  },
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
})

export default router
