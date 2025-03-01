/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { store as interfaceStore } from '@wordpress/interface';
import { store as preferencesStore } from '@wordpress/preferences';
import { speak } from '@wordpress/a11y';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';
import deprecated from '@wordpress/deprecated';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getMetaBoxContainer } from '../utils/meta-boxes';
import { store as editPostStore } from '.';
import { unlock } from '../lock-unlock';

/**
 * Returns an action object used in signalling that the user opened an editor sidebar.
 *
 * @param {?string} name Sidebar name to be opened.
 */
export const openGeneralSidebar =
	( name ) =>
	( { dispatch, registry } ) => {
		const isDistractionFree = registry
			.select( preferencesStore )
			.get( 'core', 'distractionFree' );
		if ( isDistractionFree ) {
			dispatch.toggleDistractionFree();
		}
		registry
			.dispatch( interfaceStore )
			.enableComplementaryArea( editPostStore.name, name );
	};

/**
 * Returns an action object signalling that the user closed the sidebar.
 */
export const closeGeneralSidebar =
	() =>
	( { registry } ) =>
		registry
			.dispatch( interfaceStore )
			.disableComplementaryArea( editPostStore.name );

/**
 * Returns an action object used in signalling that the user opened a modal.
 *
 * @deprecated since WP 6.3 use `core/interface` store's action with the same name instead.
 *
 *
 * @param {string} name A string that uniquely identifies the modal.
 *
 * @return {Object} Action object.
 */
export const openModal =
	( name ) =>
	( { registry } ) => {
		deprecated( "select( 'core/edit-post' ).openModal( name )", {
			since: '6.3',
			alternative: "select( 'core/interface').openModal( name )",
		} );
		return registry.dispatch( interfaceStore ).openModal( name );
	};

/**
 * Returns an action object signalling that the user closed a modal.
 *
 * @deprecated since WP 6.3 use `core/interface` store's action with the same name instead.
 *
 * @return {Object} Action object.
 */
export const closeModal =
	() =>
	( { registry } ) => {
		deprecated( "select( 'core/edit-post' ).closeModal()", {
			since: '6.3',
			alternative: "select( 'core/interface').closeModal()",
		} );
		return registry.dispatch( interfaceStore ).closeModal();
	};

/**
 * Returns an action object used in signalling that the user opened the publish
 * sidebar.
 *
 * @return {Object} Action object
 */
export function openPublishSidebar() {
	return {
		type: 'OPEN_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user closed the
 * publish sidebar.
 *
 * @return {Object} Action object.
 */
export function closePublishSidebar() {
	return {
		type: 'CLOSE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used in signalling that the user toggles the publish sidebar.
 *
 * @return {Object} Action object
 */
export function togglePublishSidebar() {
	return {
		type: 'TOGGLE_PUBLISH_SIDEBAR',
	};
}

/**
 * Returns an action object used to enable or disable a panel in the editor.
 *
 * @deprecated
 *
 * @param {string} panelName A string that identifies the panel to enable or disable.
 *
 * @return {Object} Action object.
 */
export const toggleEditorPanelEnabled =
	( panelName ) =>
	( { registry } ) => {
		deprecated( "dispatch( 'core/edit-post' ).toggleEditorPanelEnabled", {
			since: '6.5',
			alternative: "dispatch( 'core/editor').toggleEditorPanelEnabled",
		} );
		registry.dispatch( editorStore ).toggleEditorPanelEnabled( panelName );
	};

/**
 * Opens a closed panel and closes an open panel.
 *
 * @deprecated
 *
 * @param {string} panelName A string that identifies the panel to open or close.
 */
export const toggleEditorPanelOpened =
	( panelName ) =>
	( { registry } ) => {
		deprecated( "dispatch( 'core/edit-post' ).toggleEditorPanelOpened", {
			since: '6.5',
			alternative: "dispatch( 'core/editor').toggleEditorPanelOpened",
		} );
		registry.dispatch( editorStore ).toggleEditorPanelOpened( panelName );
	};

/**
 * Returns an action object used to remove a panel from the editor.
 *
 * @deprecated
 *
 * @param {string} panelName A string that identifies the panel to remove.
 *
 * @return {Object} Action object.
 */
export const removeEditorPanel =
	( panelName ) =>
	( { registry } ) => {
		deprecated( "dispatch( 'core/edit-post' ).removeEditorPanel", {
			since: '6.5',
			alternative: "dispatch( 'core/editor').removeEditorPanel",
		} );
		registry.dispatch( editorStore ).removeEditorPanel( panelName );
	};

/**
 * Triggers an action used to toggle a feature flag.
 *
 * @param {string} feature Feature name.
 */
export const toggleFeature =
	( feature ) =>
	( { registry } ) =>
		registry
			.dispatch( preferencesStore )
			.toggle( 'core/edit-post', feature );

/**
 * Triggers an action used to switch editor mode.
 *
 * @param {string} mode The editor mode.
 */
export const switchEditorMode =
	( mode ) =>
	( { dispatch, registry } ) => {
		registry.dispatch( preferencesStore ).set( 'core', 'editorMode', mode );

		// Unselect blocks when we switch to the code editor.
		if ( mode !== 'visual' ) {
			registry.dispatch( blockEditorStore ).clearSelectedBlock();
		}

		if (
			mode === 'text' &&
			registry.select( preferencesStore ).get( 'core', 'distractionFree' )
		) {
			dispatch.toggleDistractionFree();
		}

		const message =
			mode === 'visual'
				? __( 'Visual editor selected' )
				: __( 'Code editor selected' );
		speak( message, 'assertive' );
	};

/**
 * Triggers an action object used to toggle a plugin name flag.
 *
 * @param {string} pluginName Plugin name.
 */
export const togglePinnedPluginItem =
	( pluginName ) =>
	( { registry } ) => {
		const isPinned = registry
			.select( interfaceStore )
			.isItemPinned( 'core/edit-post', pluginName );

		registry
			.dispatch( interfaceStore )
			[ isPinned ? 'unpinItem' : 'pinItem' ](
				'core/edit-post',
				pluginName
			);
	};

/**
 * Returns an action object used in signaling that a style should be auto-applied when a block is created.
 *
 * @param {string}  blockName  Name of the block.
 * @param {?string} blockStyle Name of the style that should be auto applied. If undefined, the "auto apply" setting of the block is removed.
 */
export const updatePreferredStyleVariations =
	( blockName, blockStyle ) =>
	( { registry } ) => {
		if ( ! blockName ) {
			return;
		}

		const existingVariations =
			registry
				.select( preferencesStore )
				.get( 'core/edit-post', 'preferredStyleVariations' ) ?? {};

		// When the blockStyle is omitted, remove the block's preferred variation.
		if ( ! blockStyle ) {
			const updatedVariations = {
				...existingVariations,
			};

			delete updatedVariations[ blockName ];

			registry
				.dispatch( preferencesStore )
				.set(
					'core/edit-post',
					'preferredStyleVariations',
					updatedVariations
				);
		} else {
			// Else add the variation.
			registry
				.dispatch( preferencesStore )
				.set( 'core/edit-post', 'preferredStyleVariations', {
					...existingVariations,
					[ blockName ]: blockStyle,
				} );
		}
	};

/**
 * Update the provided block types to be visible.
 *
 * @param {string[]} blockNames Names of block types to show.
 */
export const showBlockTypes =
	( blockNames ) =>
	( { registry } ) => {
		unlock( registry.dispatch( editorStore ) ).showBlockTypes( blockNames );
	};

/**
 * Update the provided block types to be hidden.
 *
 * @param {string[]} blockNames Names of block types to hide.
 */
export const hideBlockTypes =
	( blockNames ) =>
	( { registry } ) => {
		unlock( registry.dispatch( editorStore ) ).hideBlockTypes( blockNames );
	};

/**
 * Stores info about which Meta boxes are available in which location.
 *
 * @param {Object} metaBoxesPerLocation Meta boxes per location.
 */
export function setAvailableMetaBoxesPerLocation( metaBoxesPerLocation ) {
	return {
		type: 'SET_META_BOXES_PER_LOCATIONS',
		metaBoxesPerLocation,
	};
}

/**
 * Update a metabox.
 */
export const requestMetaBoxUpdates =
	() =>
	async ( { registry, select, dispatch } ) => {
		dispatch( {
			type: 'REQUEST_META_BOX_UPDATES',
		} );

		// Saves the wp_editor fields.
		if ( window.tinyMCE ) {
			window.tinyMCE.triggerSave();
		}

		// Additional data needed for backward compatibility.
		// If we do not provide this data, the post will be overridden with the default values.
		const post = registry.select( editorStore ).getCurrentPost();
		const additionalData = [
			post.comment_status
				? [ 'comment_status', post.comment_status ]
				: false,
			post.ping_status ? [ 'ping_status', post.ping_status ] : false,
			post.sticky ? [ 'sticky', post.sticky ] : false,
			post.author ? [ 'post_author', post.author ] : false,
		].filter( Boolean );

		// We gather all the metaboxes locations data and the base form data.
		const baseFormData = new window.FormData(
			document.querySelector( '.metabox-base-form' )
		);
		const activeMetaBoxLocations = select.getActiveMetaBoxLocations();
		const formDataToMerge = [
			baseFormData,
			...activeMetaBoxLocations.map(
				( location ) =>
					new window.FormData( getMetaBoxContainer( location ) )
			),
		];

		// Merge all form data objects into a single one.
		const formData = formDataToMerge.reduce( ( memo, currentFormData ) => {
			for ( const [ key, value ] of currentFormData ) {
				memo.append( key, value );
			}
			return memo;
		}, new window.FormData() );
		additionalData.forEach( ( [ key, value ] ) =>
			formData.append( key, value )
		);

		try {
			// Save the metaboxes.
			await apiFetch( {
				url: window._wpMetaBoxUrl,
				method: 'POST',
				body: formData,
				parse: false,
			} );
			dispatch.metaBoxUpdatesSuccess();
		} catch {
			dispatch.metaBoxUpdatesFailure();
		}
	};

/**
 * Returns an action object used to signal a successful meta box update.
 *
 * @return {Object} Action object.
 */
export function metaBoxUpdatesSuccess() {
	return {
		type: 'META_BOX_UPDATES_SUCCESS',
	};
}

/**
 * Returns an action object used to signal a failed meta box update.
 *
 * @return {Object} Action object.
 */
export function metaBoxUpdatesFailure() {
	return {
		type: 'META_BOX_UPDATES_FAILURE',
	};
}

/**
 * Action that changes the width of the editing canvas.
 *
 * @deprecated
 *
 * @param {string} deviceType
 */
export const __experimentalSetPreviewDeviceType =
	( deviceType ) =>
	( { registry } ) => {
		deprecated(
			"dispatch( 'core/edit-post' ).__experimentalSetPreviewDeviceType",
			{
				since: '6.5',
				version: '6.7',
				hint: 'registry.dispatch( editorStore ).setDeviceType',
			}
		);
		registry.dispatch( editorStore ).setDeviceType( deviceType );
	};

/**
 * Returns an action object used to open/close the inserter.
 *
 * @deprecated
 *
 * @param {boolean|Object} value Whether the inserter should be opened (true) or closed (false).
 */
export const setIsInserterOpened =
	( value ) =>
	( { registry } ) => {
		deprecated( "dispatch( 'core/edit-post' ).setIsInserterOpened", {
			since: '6.5',
			alternative: "dispatch( 'core/editor').setIsInserterOpened",
		} );
		registry.dispatch( editorStore ).setIsInserterOpened( value );
	};

/**
 * Returns an action object used to open/close the list view.
 *
 * @deprecated
 *
 * @param {boolean} isOpen A boolean representing whether the list view should be opened or closed.
 */
export const setIsListViewOpened =
	( isOpen ) =>
	( { registry } ) => {
		deprecated( "dispatch( 'core/edit-post' ).setIsListViewOpened", {
			since: '6.5',
			alternative: "dispatch( 'core/editor').setIsListViewOpened",
		} );
		registry.dispatch( editorStore ).setIsListViewOpened( isOpen );
	};

/**
 * Returns an action object used to switch to template editing.
 *
 * @deprecated
 */
export function setIsEditingTemplate() {
	deprecated( "dispatch( 'core/edit-post' ).setIsEditingTemplate", {
		since: '6.5',
		alternative: "dispatch( 'core/editor').setRenderingMode",
	} );
	return { type: 'NOTHING' };
}

/**
 * Create a block based template.
 *
 * @deprecated
 */
export function __unstableCreateTemplate() {
	deprecated( "dispatch( 'core/edit-post' ).__unstableCreateTemplate", {
		since: '6.5',
	} );
	return { type: 'NOTHING' };
}

let metaBoxesInitialized = false;

/**
 * Initializes WordPress `postboxes` script and the logic for saving meta boxes.
 */
export const initializeMetaBoxes =
	() =>
	( { registry, select, dispatch } ) => {
		const isEditorReady = registry
			.select( editorStore )
			.__unstableIsEditorReady();

		if ( ! isEditorReady ) {
			return;
		}
		// Only initialize once.
		if ( metaBoxesInitialized ) {
			return;
		}
		const postType = registry.select( editorStore ).getCurrentPostType();
		if ( window.postboxes.page !== postType ) {
			window.postboxes.add_postbox_toggles( postType );
		}

		metaBoxesInitialized = true;

		// Save metaboxes on save completion, except for autosaves.
		addFilter(
			'editor.__unstableSavePost',
			'core/edit-post/save-metaboxes',
			( previous, options ) =>
				previous.then( () => {
					if ( options.isAutosave ) {
						return;
					}

					if ( ! select.hasMetaBoxes() ) {
						return;
					}

					return dispatch.requestMetaBoxUpdates();
				} )
		);

		dispatch( {
			type: 'META_BOXES_INITIALIZED',
		} );
	};

/**
 * Action that toggles Distraction free mode.
 * Distraction free mode expects there are no sidebars, as due to the
 * z-index values set, you can't close sidebars.
 */
export const toggleDistractionFree =
	() =>
	( { dispatch, registry } ) => {
		const isDistractionFree = registry
			.select( preferencesStore )
			.get( 'core', 'distractionFree' );
		if ( ! isDistractionFree ) {
			registry.batch( () => {
				registry
					.dispatch( preferencesStore )
					.set( 'core', 'fixedToolbar', true );
				registry.dispatch( editorStore ).setIsInserterOpened( false );
				registry.dispatch( editorStore ).setIsListViewOpened( false );
				dispatch.closeGeneralSidebar();
			} );
		}
		registry.batch( () => {
			registry
				.dispatch( preferencesStore )
				.set( 'core', 'distractionFree', ! isDistractionFree );
			registry
				.dispatch( noticesStore )
				.createInfoNotice(
					isDistractionFree
						? __( 'Distraction free off.' )
						: __( 'Distraction free on.' ),
					{
						id: 'core/edit-post/distraction-free-mode/notice',
						type: 'snackbar',
						actions: [
							{
								label: __( 'Undo' ),
								onClick: () => {
									registry
										.dispatch( preferencesStore )
										.toggle( 'core', 'distractionFree' );
								},
							},
						],
					}
				);
		} );
	};
