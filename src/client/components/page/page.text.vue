<template>
<div class="mrdgzndn">
	<MkPlainText v-if="block.format === 'plainText'" :text="text"/>
	<MkMarkdown v-else-if="block.format === 'markdown'" :text="text"/>
	<span v-else-if="block.format === 'html'" v-html="text"/>
	<Mfm v-else :text="text" :is-note="false" :i="$i" :key="text"/>
	<MkUrlPreview v-for="url in urls" :url="url" :key="url" class="url"/>
</div>
</template>

<script lang="ts">
import { TextBlock } from '@/scripts/hpml/block';
import { Hpml } from '@/scripts/hpml/evaluator';
import { defineAsyncComponent, defineComponent, PropType } from 'vue';
import { parse } from '../../../mfm/parse';
import { unique } from '../../../prelude/array';

export default defineComponent({
	components: {
		MkUrlPreview: defineAsyncComponent(() => import('@/components/url-preview.vue')),
		MkMarkdown: defineAsyncComponent(() => import('@/components/markdown.vue')),
	},
	props: {
		block: {
			type: Object as PropType<TextBlock>,
			required: true
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true
		}
	},
	data() {
		return {
			text: this.hpml.interpolate(this.block.text),
		};
	},
	computed: {
		urls(): string[] {
			if (this.text) {
				const ast = parse(this.text);
				// TODO: 再帰的にURL要素がないか調べる
				return unique(ast
					.filter(t => ((t.node.type == 'url' || t.node.type == 'link') && t.node.props.url && !t.node.props.silent))
					.map(t => t.node.props.url));
			} else {
				return [];
			}
		}
	},
	watch: {
		'hpml.vars': {
			handler() {
				this.text = this.hpml.interpolate(this.block.text);
			},
			deep: true
		}
	},
});
</script>

<style lang="scss" scoped>
.mrdgzndn {
	&:not(:first-child) {
		margin-top: 0.5em;
	}

	&:not(:last-child) {
		margin-bottom: 0.5em;
	}

	> .url {
		margin: 0.5em 0;
	}
}
</style>
