<template lang="pug">
#widget(v-if="loaded !== null && typeof loaded !== 'undefined'")
  app-context-toolbar
    v-tabs.elevation-0(
      v-model="tab"
      color="rgba(0,0,0,0)"
      slider-color="primary"
      grow
    )
      v-tab Info
      v-tab Edit Info
      v-tab Edit Source
      v-tab Edit Config
      v-tab Preview

  .tabs-items
    .tab-item.pa-3(:class="{ 'active' : tab === 0 }")
      div(v-html="compiledMarkdown")
    .tab-item(:class="{ 'active' : tab === 1 }")
      monaco-editor(
        class="editor"
        ref="editorReadme"
        v-model="readme"
        language="markdown"
      )
    .tab-item(:class="{ 'active' : tab === 2 }")
      monaco-editor(
        class="editor"
        ref="editorSource"
        v-model="source"
        language="javascript"
      )
    .tab-item(:class="{ 'active' : tab === 3 }")
      span EDIT CONFIG
    .tab-item(:class="{ 'active' : tab === 4 }")
      span PREVIEW
</template>

<script>
import marked from 'marked'
import * as _ from 'lodash'
import { mapActions, mapGetters } from 'vuex'
import AppContextToolbar from '@/components/app/AppContextToolbar'
import MonacoEditor from '@/components/app/MonacoEditor'

export default {
  name: 'Widget',
  components: {
    AppContextToolbar,
    MonacoEditor
  },
  data: () => ({
    tab: 0
  }),
  computed: {
    ...mapGetters('Widget', ['loaded']),
    compiledMarkdown () {
      try {
        return marked(this.readme, { sanitize: true })
      } catch (e) {
        return null
      }
    },
    readme: {
      get () {
        return this.loaded.readme
      },
      set: _.debounce(function (readme) {
        this.updateLoaded({ readme })
      }, 1000)
    },
    source: {
      get () {
        return this.loaded.source
      },
      set: _.debounce(function (source) {
        this.updateLoaded({ source })
      }, 1000)
    }
  },
  methods: {
    ...mapActions('Widget', ['load', 'updateLoaded']),
    updateDimensions () {
      this.$refs.editorReadme.getMonaco().layout()
      this.$refs.editorSource.getMonaco().layout()
    }
  },
  mounted () {
    this.load(this.$route.params.id)
    this.$nextTick(function () {
      window.addEventListener('resize', this.updateDimensions)
    })
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.updateDimensions)
  }
}
</script>

<style lang="stylus" scoped>
#widget
  height 100%

  >>> .tabs-items
    height calc(100% - 48px)
    position relative

    .tab-item
      position absolute
      top 0
      bottom 0
      left 0
      right 0
      visibility hidden

      &.active
        visibility visible

  >>> .editor
    height 100%
</style>