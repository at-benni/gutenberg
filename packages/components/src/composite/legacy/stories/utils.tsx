/**
 * External dependencies
 */
import type { StoryContext } from '@storybook/react';

/**
 * Internal dependencies
 */
import type { LegacyStateOptions } from '..';

export function UseCompositeStatePlaceholder( props: LegacyStateOptions ) {
	return (
		<dl>
			{ Object.entries( props ).map( ( [ name, value ] ) => (
				<>
					<dt>{ name }</dt>
					<dd>{ JSON.stringify( value ) }</dd>
				</>
			) ) }
		</dl>
	);
}
UseCompositeStatePlaceholder.displayName = 'useCompositeState';

export function transform( code: string, context: StoryContext ) {
	// The output generated by Storybook for these components is
	// messy, so we apply this transform to make it more useful
	// for anyone reading the docs.
	const config = ` ${ JSON.stringify( context.args, null, 2 ) } `;
	const state = config.replace( ' {} ', '' );
	return [
		// Include a setup line, showing how to make use of
		// `useCompositeState` to convert state options into
		// a composite state option.
		`const state = useCompositeState(${ state });`,
		'',
		'return (',
		'  ' +
			code
				// The generated output includes a full dump of everything
				// in the state; the reader probably isn't interested in
				// what that looks like, so instead we drop all of that
				// in favor of the state generated above.
				.replaceAll( /state=\{\{[\s\S]*?\}\}/g, 'state={ state }' )
				// The previous line only works for `state={ state }`, and
				// doesn't replace spread props, so we do that separately.
				.replaceAll( '=>', '' )
				.replaceAll( /baseId=[^>]+?(\s*>)/g, ( _, close ) => {
					return `{ ...state }${ close }`;
				} )
				// Now we tidy the output by removing any unnecesary
				// whitespace...
				.replaceAll( /<Composite\w+[\s\S]*?>/g, ( match ) =>
					match.replaceAll( /\s+\s/g, ' ' )
				)
				// ...including around <Composite*> children...
				.replaceAll(
					/ >\s+([\w\s]*?)\s+<\//g,
					( _, value ) => `>${ value }</`
				)
				// ...and inside JSX definitions.
				.replaceAll( '} >', '}>' )
				// Finally we indent eveything to make it more readable.
				.replaceAll( /\n/g, '\n  ' ),
		');',
	].join( '\n' );
}
