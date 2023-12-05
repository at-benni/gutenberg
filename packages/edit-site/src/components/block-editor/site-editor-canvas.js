/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useViewportMatch, useResizeObserver } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BackButton from './back-button';
import ResizableEditor from './resizable-editor';
import EditorCanvas from './editor-canvas';
import EditorCanvasContainer from '../editor-canvas-container';
import useSiteEditorSettings from './use-site-editor-settings';
import { store as editSiteStore } from '../../store';
import {
	FOCUSABLE_ENTITIES,
	NAVIGATION_POST_TYPE,
} from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import useIsNavigationOverlay from './use-is-navigation-overlay';

export default function SiteEditorCanvas() {
	const { templateType, isFocusMode, isViewMode } = useSelect( ( select ) => {
		const { getEditedPostType, getCanvasMode } = unlock(
			select( editSiteStore )
		);

		const _templateType = getEditedPostType();

		return {
			templateType: _templateType,
			isFocusMode: FOCUSABLE_ENTITIES.includes( _templateType ),
			isViewMode: getCanvasMode() === 'view',
		};
	}, [] );

	const isNavigationOverlayTemplate = useIsNavigationOverlay();

	const [ resizeObserver, sizes ] = useResizeObserver();

	const settings = useSiteEditorSettings();

	const isMobileViewport = useViewportMatch( 'small', '<' );
	const enableResizing =
		isFocusMode &&
		! isViewMode &&
		// Disable resizing in mobile viewport.
		! isMobileViewport;

	const isTemplateTypeNavigation = templateType === NAVIGATION_POST_TYPE;
	const isNavigationFocusMode = isTemplateTypeNavigation && isFocusMode;

	const forceFullHeight =
		isNavigationFocusMode || isNavigationOverlayTemplate;

	return (
		<EditorCanvasContainer.Slot>
			{ ( [ editorCanvasView ] ) =>
				editorCanvasView ? (
					<div className="edit-site-visual-editor is-focus-mode">
						{ editorCanvasView }
					</div>
				) : (
					<div
						className={ classnames( 'edit-site-visual-editor', {
							'is-focus-mode': isFocusMode || !! editorCanvasView,
							'is-view-mode': isViewMode,
						} ) }
					>
						<BackButton />
						<ResizableEditor
							enableResizing={ enableResizing }
							height={
								sizes.height && ! forceFullHeight
									? sizes.height
									: '100%'
							}
						>
							<EditorCanvas
								enableResizing={ enableResizing }
								settings={ settings }
							>
								{ resizeObserver }
							</EditorCanvas>
						</ResizableEditor>
					</div>
				)
			}
		</EditorCanvasContainer.Slot>
	);
}
