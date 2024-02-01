<?php
/**
 * Test WP_Font_Collection properties.
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 *
 * @covers WP_Font_Collection::load_from_json
 */
class Tests_Fonts_WpFontCollection_loadFromJson extends WP_UnitTestCase {
	private static $mock_collection_data = array(
		'slug'          => 'my-collection',
		'name'          => 'My Collection',
		'description'   => 'My collection description.',
		'font_families' => array( 'mock' ),
		'categories'    => array( 'mock' ),
	);

	public function test_should_load_json_from_file() {
		$mock_file = wp_tempnam( 'my-collection-data-' );
		file_put_contents( $mock_file, wp_json_encode( self::$mock_collection_data ) );

		$collection = new WP_Font_Collection( 'my-collection', $mock_file );
		$data       = array(
			'slug'          => $collection->slug,
			'name'          => $collection->name,
			'description'   => $collection->description,
			'font_families' => $collection->font_families,
			'categories'    => $collection->categories,
		);
		$this->assertSame( self::$mock_collection_data, $data );
	}

	public function test_should_load_json_from_url() {
		add_filter( 'pre_http_request', array( $this, 'mock_request' ), 10, 3 );

		$collection = new WP_Font_Collection( 'my-collection', 'https://localhost/fonts/mock-font-collection.json' );
		$data       = array(
			'slug'          => $collection->slug,
			'name'          => $collection->name,
			'description'   => $collection->description,
			'font_families' => $collection->font_families,
			'categories'    => $collection->categories,
		);
		$this->assertSame( self::$mock_collection_data, $data );

		remove_filter( 'pre_http_request', array( $this, 'mock_request' ) );
	}

	public function test_should_error_with_invalid_file_path() {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::load_from_json' );

		$collection = new WP_Font_Collection( 'my-collection', 'non-existing.json' );
		$collection->name;
	}

	public function test_should_error_with_invalid_url() {
		$this->setExpectedIncorrectUsage( 'WP_Font_Collection::load_from_json' );

		$collection = new WP_Font_Collection( 'my-collection', 'not-a-url' );
		$collection->name;
	}

	// public function test_should_error_with_invalid_url_response() {
	//  add_filter( 'pre_http_request', array( $this, 'mock_request_invalid_response' ), 10, 3 );

	//  $collection = new WP_Font_Collection( 'missing-collection', 'https://localhost/fonts/missing-collection.json' );
	//  $collection->name;

	//  $expected_message = 'WP_Font_Collection::load_from_url(): Error fetching the font collection data from "https://localhost/fonts/missing-collection.json".';
	//  $this->expectError();
	//  $this->expectErrorMessage( $expected_message );

	//  remove_filter( 'pre_http_request', array( $this, 'mock_request_invalid_response' ) );
	// }

	// public function test_should_error_with_invalid_json_from_file() {
	//  $mock_file = wp_tempnam( 'my-collection-data-' );
	//  file_put_contents( $mock_file, 'invalid-json' );

	// 	// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- Testing error response returned by `load_from_json`, not the underlying error from `wp_json_file_decode`.
	//  $config = @WP_Font_Collection::load_from_json( $mock_file );
	//  $this->assertWPError( $config, 'font_collection_decode_error' );
	// }

	// public function test_should_error_with_invalid_json_from_url() {
	//  add_filter( 'pre_http_request', array( $this, 'mock_request_invalid_json' ), 10, 3 );

	//  $config = WP_Font_Collection::load_from_json( 'https://localhost/fonts/invalid-collection.json' );
	//  $this->assertWPError( $config, 'font_collection_decode_error' );

	//  remove_filter( 'pre_http_request', array( $this, 'mock_request_invalid_json' ) );
	// }

	// public function test_should_error_with_json_from_file_missing_slug() {
	//  $mock_file            = wp_tempnam( 'my-collection-data-' );
	//  $mock_collection_data = self::$mock_collection_data;
	//  unset( $mock_collection_data['slug'] );
	//  file_put_contents( $mock_file, wp_json_encode( $mock_collection_data ) );
	//  $this->setExpectedIncorrectUsage( 'WP_Font_Collection::load_from_file' );

	//  $config = WP_Font_Collection::load_from_json( $mock_file );
	//  $this->assertWPError( $config, 'font_collection_invalid_json' );
	// }

	// public function test_should_error_with_json_from_url_missing_slug() {
	//  add_filter( 'pre_http_request', array( $this, 'mock_request_missing_slug' ), 10, 3 );
	//  $this->setExpectedIncorrectUsage( 'WP_Font_Collection::load_from_url' );

	//  $config = WP_Font_Collection::load_from_json( 'https://localhost/fonts/missing-slug.json' );
	//  $this->assertWPError( $config, 'font_collection_invalid_json' );

	//  remove_filter( 'pre_http_request', array( $this, 'mock_request_missing_slug' ) );
	// }

	public function mock_request( $preempt, $args, $url ) {
		// if the URL is not the URL you want to mock, return false.
		if ( 'https://localhost/fonts/mock-font-collection.json' !== $url ) {
			return false;
		}

		return array(
			'body'     => json_encode( self::$mock_collection_data ),
			'response' => array(
				'code' => 200,
			),
		);
	}

	public function mock_request_missing_slug( $preempt, $args, $url ) {
		// if the URL is not the URL you want to mock, return false.
		if ( 'https://localhost/fonts/missing-slug.json' !== $url ) {
			return false;
		}

		$mock_collection_data = self::$mock_collection_data;
		unset( $mock_collection_data['slug'] );

		return array(
			'body'     => json_encode( $mock_collection_data ),
			'response' => array(
				'code' => 200,
			),
		);
	}

	public function mock_request_invalid_response( $preempt, $args, $url ) {
		// if the URL is not the URL you want to mock, return false.
		if ( 'https://localhost/fonts/missing-collection.json' !== $url ) {
			return false;
		}

		return array(
			'body'     => '',
			'response' => array(
				'code' => 404,
			),
		);
	}

	public function mock_request_invalid_json( $preempt, $args, $url ) {
		// if the URL is not the URL you want to mock, return false.
		if ( 'https://localhost/fonts/invalid-collection.json' !== $url ) {
			return false;
		}

		return array(
			'body'     => 'invalid',
			'response' => array(
				'code' => 200,
			),
		);
	}
}
