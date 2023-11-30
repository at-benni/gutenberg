<?php
/**
 * WP_Directive_Processor class
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

if ( class_exists( 'WP_Directive_Processor' ) ) {
	return;
}

/**
 * This processor is built on top of the HTML Tag Processor and augments its
 * capabilities to process the Interactivity API directives.
 *
 * IMPORTANT DISCLAIMER: This code is highly experimental and its only purpose
 * is to provide a way to test the server-side rendering of the Interactivity
 * API. Most of this code will be discarded once the HTML Processor is
 * available.  Please restrain from investing unnecessary time and effort trying
 * to improve this code.
 */
class WP_Directive_Processor extends Gutenberg_HTML_Tag_Processor_6_4 {

	/**
	 * A string containing the main root block.
	 *
	 * @var string
	 */
	public static $root_block = null;

	/**
	 * Add a root block to the variable.
	 *
	 * @param array $block The block to add.
	 *
	 * @return void
	 */
	public static function mark_root_block( $block ) {
		self::$root_block = md5( serialize( $block ) );
	}

	/**
	 * Remove a root block to the variable.
	 *
	 * @return void
	 */
	public static function unmark_root_block() {
		self::$root_block = null;
	}

	/**
	 * Check if block is a root block.
	 *
	 * @param array $block The block to check.
	 *
	 * @return bool True if block is a root block, false otherwise.
	 */
	public static function is_marked_as_root_block( $block ) {
		return md5( serialize( $block ) ) === self::$root_block;
	}

	/**
	 * Check if a root block has already been defined.
	 *
	 * @return bool True if block is a root block, false otherwise.
	 */
	public static function has_root_block() {
		return isset( self::$root_block );
	}

	/**
	 * An array containing the main children of interactive.
	 *
	 * @var array
	 */
	public static $children_of_interactive_block = array();

	/**
	 * Add a root block to the variable.
	 *
	 * @param array $block The block to add.
	 *
	 * @return void
	 */
	public static function mark_children_of_interactive_block( $block ) {
		self::$children_of_interactive_block[] = md5( serialize( $block ) );
	}

	/**
	 * Remove a root block to the variable.
	 *
	 * @param array $block The block to remove.
	 * @return void
	 */
	public static function unmark_children_of_interactive_block( $block ) {
		self::$children_of_interactive_block = array_diff( self::$children_of_interactive_block, array( md5( serialize( $block ) ) ) );
	}

	/**
	 * Check if block is a root block.
	 *
	 * @param array $block The block to check.
	 *
	 * @return bool True if block is a root block, false otherwise.
	 */
	public static function is_marked_as_children_of_interactive_block( $block ) {
		return in_array( md5( serialize( $block ) ), self::$children_of_interactive_block, true );
	}

	/**
	 * Stack of namespaces.
	 *
	 * @var string[]
	 */
	private $ns_stack = array();

	/**
	 * Push a new namespace onto the namespace stack.
	 *
	 * @param string $ns The new namespace.
	 */
	public function push_namespace( string $ns ) {
		$this->ns_stack[] = $ns;
	}

	/**
	 * Discard the current namespace.
	 */
	public function pop_namespace() {
		array_pop( $this->ns_stack );
	}

	/**
	 * Return the current namespace, or false if no namespace is set.
	 *
	 * @return string|bool
	 */
	public function get_namespace() {
		return end( $this->ns_stack );
	}

	/**
	 * Find the matching closing tag for an opening tag.
	 *
	 * When called while on an open tag, traverse the HTML until we find the
	 * matching closing tag, respecting any in-between content, including nested
	 * tags of the same name. Return false when called on a closing or void tag,
	 * or if no matching closing tag was found.
	 *
	 * @return bool Whether a matching closing tag was found.
	 */
	public function next_balanced_closer() {
		$depth = 0;

		$tag_name = $this->get_tag();

		if ( self::is_html_void_element( $tag_name ) ) {
			return false;
		}

		while ( $this->next_tag(
			array(
				'tag_name'    => $tag_name,
				'tag_closers' => 'visit',
			)
		) ) {
			if ( ! $this->is_tag_closer() ) {
				++$depth;
				continue;
			}

			if ( 0 === $depth ) {
				return true;
			}

			--$depth;
		}

		return false;
	}

	/**
	 * Traverses the HTML searching for Interactivity API directives and processing
	 * them.
	 *
	 * @param string   $prefix Attribute prefix.
	 * @param string[] $directives Directives.
	 *
	 * @return WP_Directive_Processor The modified instance of the
	 * WP_Directive_Processor.
	 */
	public function process_rendered_html( $prefix, $directives ) {
		$context   = new WP_Directive_Context();
		$tag_stack = array();

		// Extract all directive names. They'll be used later on.
		$directive_names     = array_keys( $directives );
		$directive_names_rev = array_reverse( $directive_names );

		while ( $this->next_tag( array( 'tag_closers' => 'visit' ) ) ) {
			$tag_name = $this->get_tag();

			// Is this a tag that closes the latest opening tag?
			if ( $this->is_tag_closer() ) {
				if ( 0 === count( $tag_stack ) ) {
					continue;
				}

				list( $latest_opening_tag_name, $attributes ) = end( $tag_stack );
				if ( $latest_opening_tag_name === $tag_name ) {
					array_pop( $tag_stack );

					// If the matching opening tag didn't have any directives, we move on.
					if ( 0 === count( $attributes ) ) {
						continue;
					}
				}
			} else {
				$attributes = array();
				foreach ( $this->get_attribute_names_with_prefix( $prefix ) as $name ) {
					/*
					 * Removes the part after the double hyphen before looking for
					 * the directive processor inside `$directives`, e.g., "wp-bind"
					 * from "wp-bind--src" and "wp-context" from "wp-context" etc...
					 */
					list( $type ) = WP_Directive_Processor::parse_attribute_name( $name );
					if ( array_key_exists( $type, $directives ) ) {
						$attributes[] = $type;
					}
				}

				/*
				 * If this is an open tag, and if it either has directives, or if
				 * we're inside a tag that does, take note of this tag and its
				 * directives so we can call its directive processor once we
				 * encounter the matching closing tag.
				 */
				if (
				! WP_Directive_Processor::is_html_void_element( $this->get_tag() ) &&
				( 0 !== count( $attributes ) || 0 !== count( $tag_stack ) )
				) {
					$tag_stack[] = array( $tag_name, $attributes );
				}
			}

			/*
			 * Sort attributes by the order they appear in the `$directives`
			 * argument, considering it as the priority order in which
			 * directives should be processed. Note that the order is reversed
			 * for tag closers.
			 */
			$sorted_attrs = array_intersect(
				$this->is_tag_closer()
					? $directive_names_rev
					: $directive_names,
				$attributes
			);

			foreach ( $sorted_attrs as $attribute ) {
				call_user_func( $directives[ $attribute ], $this, $context );
			}
		}

		return $this;
	}

	/**
	 * Return the content between two balanced tags.
	 *
	 * When called on an opening tag, return the HTML content found between that
	 * opening tag and its matching closing tag.
	 *
	 * @return string The content between the current opening and its matching
	 * closing tag.
	 */
	public function get_inner_html() {
		$bookmarks = $this->get_balanced_tag_bookmarks();
		if ( ! $bookmarks ) {
			return false;
		}
		list( $start_name, $end_name ) = $bookmarks;

		$start = $this->bookmarks[ $start_name ]->end + 1;
		$end   = $this->bookmarks[ $end_name ]->start;

		$this->seek( $start_name ); // Return to original position.
		$this->release_bookmark( $start_name );
		$this->release_bookmark( $end_name );

		return substr( $this->html, $start, $end - $start );
	}

	/**
	 * Set the content between two balanced tags.
	 *
	 * When called on an opening tag, set the HTML content found between that
	 * opening tag and its matching closing tag.
	 *
	 * @param string $new_html The string to replace the content between the
	 * matching tags with.
	 *
	 * @return bool            Whether the content was successfully replaced.
	 */
	public function set_inner_html( $new_html ) {
		$this->get_updated_html(); // Apply potential previous updates.

		$bookmarks = $this->get_balanced_tag_bookmarks();
		if ( ! $bookmarks ) {
			return false;
		}
		list( $start_name, $end_name ) = $bookmarks;

		$start = $this->bookmarks[ $start_name ]->end + 1;
		$end   = $this->bookmarks[ $end_name ]->start;

		$this->seek( $start_name ); // Return to original position.
		$this->release_bookmark( $start_name );
		$this->release_bookmark( $end_name );

		$this->lexical_updates[] = new WP_HTML_Text_Replacement( $start, $end, $new_html );
		return true;
	}

	/**
	 * Return a pair of bookmarks for the current opening tag and the matching
	 * closing tag.
	 *
	 * @return array|false A pair of bookmarks, or false if there's no matching
	 * closing tag.
	 */
	public function get_balanced_tag_bookmarks() {
		$i = 0;
		while ( array_key_exists( 'start' . $i, $this->bookmarks ) ) {
			++$i;
		}
		$start_name = 'start' . $i;

		$this->set_bookmark( $start_name );
		if ( ! $this->next_balanced_closer() ) {
			$this->release_bookmark( $start_name );
			return false;
		}

		$i = 0;
		while ( array_key_exists( 'end' . $i, $this->bookmarks ) ) {
			++$i;
		}
		$end_name = 'end' . $i;
		$this->set_bookmark( $end_name );

		return array( $start_name, $end_name );
	}

	/**
	 * Whether a given HTML element is void (e.g. <br>).
	 *
	 * @param string $tag_name The element in question.
	 * @return bool True if the element is void.
	 *
	 * @see https://html.spec.whatwg.org/#elements-2
	 */
	public static function is_html_void_element( $tag_name ) {
		switch ( $tag_name ) {
			case 'AREA':
			case 'BASE':
			case 'BR':
			case 'COL':
			case 'EMBED':
			case 'HR':
			case 'IMG':
			case 'INPUT':
			case 'LINK':
			case 'META':
			case 'SOURCE':
			case 'TRACK':
			case 'WBR':
				return true;

			default:
				return false;
		}
	}

	/**
	 * Extract and return the directive type and the the part after the double
	 * hyphen from an attribute name (if present), in an array format.
	 *
	 * Examples:
	 *
	 *     'wp-island'            => array( 'wp-island', null )
	 *     'wp-bind--src'         => array( 'wp-bind', 'src' )
	 *     'wp-thing--and--thang' => array( 'wp-thing', 'and--thang' )
	 *
	 * @param string $name The attribute name.
	 * @return array The resulting array
	 */
	public static function parse_attribute_name( $name ) {
		return explode( '--', $name, 2 );
	}

	/**
	 * Extract and return the namespace from the given directive value.
	 *
	 * @param string $value The directive value.
	 * @return array The resulting array
	 */
	public static function parse_value_ns( $value ) {
		$matches = array();
		$has_ns  = preg_match( '/^([\w\-_\/]+)::(.+)$/', $value, $matches );

		if ( $has_ns ) {
			return array_slice( $matches, 1 );
		} else {
			return array( null, $value );
		}
	}
}
