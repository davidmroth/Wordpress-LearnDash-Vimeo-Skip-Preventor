<?php
/*
* Plugin Name: LearnDash - Vimeo Skip Preventor
* Plugin URI: 
* Description: Disable skipping of Vimeo videos when using LearnDash
* Version: 1.0
* Author: David Roth
* Author URI: 
* License: GPLv2 or later
* License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/


function learndash_vimeo_skip_preventor($atts, $content = null) {
	// Return custom embed code
	// https://stackoverflow.com/questions/684634/align-contents-inside-a-div

	wp_enqueue_script('load-javascript', plugins_url('/js/custom-script.js', __FILE__ ));
	wp_enqueue_style( 'load-css', plugins_url('/css/custom.css', __FILE__ ));

?>
	<script type="application/javascript">
		var vimeo_video_width = <?php echo esc_attr( get_option("video_width") ); ?> + "px";
		var vimeo_video_height = <?php echo esc_attr( get_option("video_height") ); ?> + "px";
	</script>
	<div id="vimeo_contianer">
		<div id="vimeo_blocker"></div>
	</div>

	<div id="vimeo_video_controls">
		<div style="max-width: 250px; width: 50%; margin: 0 auto;">
            <div id="vimeo_video_status">
              <input value="0s / 0s" disabled />
            </div>

            <div id="vimeo_control_buttons">
              <button id="vimeo_play_button">Play</button>
              <button id="vimeo_pause_button">Pause</button>
              <button id="vimeo_rewind_button">Rewind 30 secs</button>
              <span class="vimeo_control_buttons_strech"></span>
            </div>
		</div>
	</div>
<?php }

add_shortcode('video_no_skip', 'learndash_vimeo_skip_preventor');

function learndash_vimeo_skip_preventor_menu() {
	//create new top-level menu
	add_menu_page('LearnDash - Vimeo Skip Preventor', 'LearnDash - Video Skip Preventor', 'administrator', __FILE__, 'learndash_vimeo_skip_preventor_settings_page' , plugins_url('/images/icon.png', __FILE__) );

	//call register settings function
	add_action( 'admin_init', 'learndash_vimeo_skip_preventor_settings_init' );
}

function learndash_vimeo_skip_preventor_settings_init() {
	$video_height = array(
            'type' => 'string', 
            'sanitize_callback' => NULL,
            'default' => 430,
	);

	$video_width = array(
            'type' => 'string', 
            'sanitize_callback' => NULL,
            'default' => 640,
	);
	register_setting( 'learndash-vimeo-skip-preventor-group', 'video_height', $video_height);
	register_setting( 'learndash-vimeo-skip-preventor-group', 'video_width', $video_width );
}

function learndash_vimeo_skip_preventor_settings_page() {
?>
<div class="wrap">
    <h1>LearnDash - Vimeo Skip Preventor</h1>

    <form method="post" action="options.php">
        <?php settings_fields( 'learndash-vimeo-skip-preventor-group' ); ?>
        <?php do_settings_sections( 'learndash-vimeo-skip-preventor-group' ); ?>

        <table class="form-table">

            <tr valign="top">
                <th scope="row">Vimeo Video Width</th>
                <td><input type="text" name="video_width" size="3" value="<?php echo esc_attr( get_option('video_width') ); ?>" /></td>
            </tr>

            <tr valign="top">
                <th scope="row">Vimeo Video Height</th>
                <td><input type="text" name="video_height" size="3" value="<?php echo esc_attr( get_option('video_height') ); ?>" /></td>
            </tr>

        </table>
        
        <?php submit_button(); ?>

    </form>
</div>
<?php }

// create custom plugin settings menu
add_action('admin_menu', 'learndash_vimeo_skip_preventor_menu');