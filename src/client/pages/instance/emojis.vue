<template>
<div class="mk-instance-emojis">
	<div class="_section" style="padding: 0;">
		<MkTab v-model:value="tab">
			<option value="local">{{ $ts.local }}</option>
			<option value="suggestion">{{ $ts.emojiSuggestion }}</option>
			<option value="remote">{{ $ts.remote }}</option>
		</MkTab>
	</div>

	<div class="_section">
		<div class="local" v-if="tab === 'local'">
			<MkButton primary @click="add" style="margin: 0 auto var(--margin) auto;"><Fa :icon="faPlus"/> {{ $ts.addEmoji }}</MkButton>
			<MkInput v-model:value="query" :debounce="true" type="search"><template #icon><Fa :icon="faSearch"/></template><span>{{ $ts.search }}</span></MkInput>
			<MkPagination :pagination="pagination" ref="emojis">
				<template #empty><span>{{ $ts.noCustomEmojis }}</span></template>
				<template #default="{items}">
					<div class="emojis">
						<button class="emoji _panel _button" v-for="emoji in items" :key="emoji.id" @click="edit(emoji)">
							<img :src="emoji.url" class="img" :alt="emoji.name"/>
							<div class="body">
								<div class="name">{{ emoji.name }}</div>
								<div class="info">{{ emoji.category }}</div>
							</div>
						</button>
					</div>
				</template>
			</MkPagination>
		</div>

		<div class="suggestions" v-else-if="tab === 'suggestion'">
			<MkSwitch v-model:value="pendingOnly">{{ $ts.pendingOnly }}</MkSwitch>
			<MkPagination :pagination="suggestionPagination" class="emojis" ref="suggestions">
				<template #empty><span>{{ $ts.noSuggestions }}</span></template>
				<template #default="{items}">
					<div class="emoji" v-for="req in items" :key="req.id">
						<img :src="req.file.url" class="img" :alt="req.name"/>
						<div class="body">
							<div>
								<span class="name">{{ req.name }}</span>
								<span class="alias" v-for="a in req.aliases" :key="a" v-text="a"/>
							</div>
							<div class="proposer">
								{{ $ts.proposer }}: 
								<MkA :to="userPage(req.proposer)"><MkAcct :user="req.proposer"/></MkA>
							</div>
							<Mfm class="description" :text="req.description" />
							<span class="state" v-if="req.state !== 'pending'">
								<Fa :icon="req.state === 'accepted' ? faCheck : faTimes" />
								{{ $t(req.state) }}
							</span>
							<MkButton inline primary v-if="req.state !== 'accepted'" @click="accept(req.id)">
								<Fa :icon="faCheck" />
								{{ $ts.accept }}
							</MkButton>
							<MkButton inline v-if="req.state === 'pending'" @click="reject(req.id)">
								<Fa :icon="faTimes" />
								{{ $ts.reject }}
							</MkButton>
						</div>
					</div>
				</template>
			</MkPagination>
		</div>

		<div class="remote" v-else-if="tab === 'remote'">
			<MkInput v-model:value="queryRemote" :debounce="true" type="search"><template #icon><Fa :icon="faSearch"/></template><span>{{ $ts.search }}</span></MkInput>
			<MkInput v-model:value="host" :debounce="true"><span>{{ $ts.host }}</span></MkInput>
			<MkPagination :pagination="remotePagination" ref="remoteEmojis">
				<template #empty><span>{{ $ts.noCustomEmojis }}</span></template>
				<template #default="{items}">
					<div class="emojis">
						<div class="emoji _panel _button" v-for="emoji in items" :key="emoji.id" @click="remoteMenu(emoji, $event)">
							<img :src="emoji.url" class="img" :alt="emoji.name"/>
							<div class="body">
								<div class="name">{{ emoji.name }}</div>
								<div class="info">{{ emoji.host }}</div>
							</div>
						</div>
					</div>
				</template>
			</MkPagination>
		</div>
	</div>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { faPlus, faSave, faCheck, faTimes, faSearch } from '@fortawesome/free-solid-svg-icons';
import { faTrashAlt, faLaugh } from '@fortawesome/free-regular-svg-icons';
import MkButton from '@/components/ui/button.vue';
import MkInput from '@/components/ui/input.vue';
import MkSwitch from '@/components/ui/switch.vue';
import MkPagination from '@/components/ui/pagination.vue';
import MkTab from '@/components/tab.vue';
import { selectFile } from '@/scripts/select-file';
import * as os from '@/os';
import { userPage } from '@/filters/user';

export default defineComponent({
	components: {
		MkTab,
		MkButton,
		MkInput,
		MkPagination,
		MkSwitch,
		MkTab,
	},

	data() {
		return {
			INFO: {
				title: this.$ts.customEmojis,
				icon: faLaugh,
				action: {
					icon: faPlus,
					handler: this.add
				}
			},
			tab: 'local',
			query: null,
			queryRemote: null,
			host: '',
			q: '',
			tab: 'local',
			pendingOnly: true,
			pagination: {
				endpoint: 'admin/emoji/list',
				limit: 30,
				params: computed(() => ({
					query: (this.query && this.query !== '') ? this.query : null
				}))
			},
			suggestionPagination: {
				endpoint: 'suggestions/emojis/list',
				limit: 10,
				params: computed(() => ({
					includingStates: this.pendingOnly ? [ 'pending' ] : [],
				}))
			},
			remotePagination: {
				endpoint: 'admin/emoji/list-remote',
				limit: 30,
				params: computed(() => ({
					query: (this.queryRemote && this.queryRemote !== '') ? this.queryRemote : null,
					host: (this.host && this.host !== '') ? this.host : null
				}))
			},
			faTrashAlt, faPlus, faLaugh, faSave, faSearch, faCheck, faTimes,
		}
	},

	methods: {
		async add(e) {
			const files = await selectFile(e.currentTarget || e.target, null, true);

			const promise = Promise.all(files.map(file => os.api('admin/emoji/add', {
				fileId: file.id,
			})));
			promise.then(() => {
				this.$refs.emojis.reload();
			});
			os.promiseDialog(promise);
		},

		edit(emoji) {
			os.popup(import('./emoji-edit-dialog.vue'), {
				emoji: emoji
			}, {
				done: result => {
					if (result.updated) {
						this.$refs.emojis.replaceItem(item => item.id === emoji.id, {
							...emoji,
							...result.updated
						});
					} else if (result.deleted) {
						this.$refs.emojis.removeItem(item => item.id === emoji.id);
					}
				},
			}, 'closed');
		},

		async accept(suggestionId: string) {
			await os.api('admin/suggestions/emojis/accept', { suggestionId });
			this.$refs.suggestions.reload();
		},

		async reject(suggestionId: string) {
			const { canceled, result: comment } = await os.dialog({
				title: this.$ts.writeRejectReason,
				input: true,
				autoComplete: true
			});

			if (canceled) return;

			await os.api('admin/suggestions/emojis/reject', { suggestionId, comment });
			this.$refs.suggestions.reload();
		},
		
		im(emoji) {
			os.apiWithDialog('admin/emoji/copy', {
				emojiId: emoji.id,
			});
		},

		remoteMenu(emoji, ev) {
			os.modalMenu([{
				type: 'label',
				text: ':' + emoji.name + ':',
			}, {
				text: this.$ts.import,
				icon: faPlus,
				action: () => { this.im(emoji) }
			}], ev.currentTarget || ev.target);
		},

		userPage
	}
});
</script>

<style lang="scss" scoped>
.mk-instance-emojis {
	> ._section {
		> .local {
			.emojis {
				display: grid;
				grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
				grid-gap: var(--margin);
		
				> .emoji {
					display: flex;
					align-items: center;
					padding: 12px;
					text-align: left;
					&:hover {
						color: var(--accent);
					}
					> .img {
						width: 42px;
						height: 42px;
					}
					> .body {
						padding: 0 0 0 8px;
						white-space: nowrap;
						overflow: hidden;
						> .name {
							text-overflow: ellipsis;
							overflow: hidden;
						}
						> .info {
							opacity: 0.5;
							text-overflow: ellipsis;
							overflow: hidden;
						}
					}
				}
			}
		}

		> .suggestions {
			> .emojis {
				display: flex;
				flex-direction: column;
				> .emoji {
					display: flex;
					align-items: center;
					> .img {
						width: 50px;
						height: 50px;
					}
					> .body {
						padding: 8px;
						div {
							> .name {
								font-weight: bold;
							}
							> .alias {
								opacity: 0.5;
								margin: 0 0.25em;
							}
						}
						> .proposer {
							opacity: 0.5;
						}
						> .description {
							display: block;
							margin: 8px;
							padding: 6px 0 6px 12px;
							color: var(--fg);
							border-left: solid 3px var(--fg);
							opacity: 0.7;
						}
						> .state {
							opacity: 0.5;
						}
					}
				}
			}
		}
		> .remote .emojis {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
			grid-gap: var(--margin);
			> .emoji {
				display: flex;
				align-items: center;
				padding: 12px;
				text-align: left;
				&:hover {
					color: var(--accent);
				}
				> .img {
					width: 32px;
					height: 32px;
				}
				> .body {
					padding: 0 0 0 8px;
					white-space: nowrap;
					overflow: hidden;
					> .name {
						text-overflow: ellipsis;
						overflow: hidden;
					}
					> .info {
						opacity: 0.5;
						text-overflow: ellipsis;
						overflow: hidden;
					}
				}
			}
		}
	}
}
</style>
