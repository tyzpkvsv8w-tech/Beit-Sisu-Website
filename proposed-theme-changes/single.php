<?php
/**
 * PROPOSED (not live): single template for Services and blog posts.
 * Matches the site's page layout: black title banner (one H1), image column,
 * content, Benefits + FAQ accordions for Services, Book Now button, no sidebar.
 *
 * @package beit-sisu
 */

get_header();
?>

	<main id="main" class="main">

		<?php
		while ( have_posts() ) :
			the_post();
			$is_service = ( 'services' === get_post_type() );
			$book_url   = home_url( '/book-appointment/' );
			?>

		<div class="container-fluid inside-page-title-wrap black-wrapper">
			<div class="row">
				<div class="col-12">
					<h1 class="section-title"><?php the_title(); ?></h1>
				</div>
			</div>
		</div>

		<div class="container-fluid section-wrapper white-wrapper">
			<div class="row">
				<?php if ( has_post_thumbnail() ) : ?>
				<div class="col-md-5">
					<div class="img-list img-list-650">
						<?php the_post_thumbnail( 'large', array( 'class' => 'img-fluid' ) ); ?>
					</div>
				</div>
				<div class="col-md-6 offset-md-1">
				<?php else : ?>
				<div class="col-lg-8">
				<?php endif; ?>

					<?php the_content(); ?>

					<?php if ( $is_service && function_exists( 'have_rows' ) && have_rows( 'benefits' ) ) : ?>
					<h2 class="section-title section-h1">Benefits</h2>
					<div class="accordion mb-4" id="benefits-<?php the_ID(); ?>">
						<?php $i = 1; while ( have_rows( 'benefits' ) ) : the_row(); ?>
						<div class="accordion-item">
							<h3 class="accordion-header" id="b-heading-<?php echo $i; ?>">
								<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#b-collapse-<?php echo $i; ?>" aria-expanded="false" aria-controls="b-collapse-<?php echo $i; ?>">
									<?php the_sub_field( 'title' ); ?>
								</button>
							</h3>
							<div id="b-collapse-<?php echo $i; ?>" class="accordion-collapse collapse" aria-labelledby="b-heading-<?php echo $i; ?>" data-bs-parent="#benefits-<?php the_ID(); ?>">
								<div class="accordion-body"><?php the_sub_field( 'description' ); ?></div>
							</div>
						</div>
						<?php $i++; endwhile; ?>
					</div>
					<?php endif; ?>

					<div class="hero-banner-btn">
						<a class="common-btn bor-btn-black mt-3" href="<?php echo esc_url( $book_url ); ?>" title="Book Now">Book Now</a>
					</div>
				</div>
			</div>
		</div>

		<?php
		$faqs = ( $is_service && function_exists( 'get_field' ) ) ? get_field( 'faq' ) : array();
		if ( ! empty( $faqs ) ) :
			?>
		<div class="container-fluid section-wrapper gray-wrapper">
			<div class="row">
				<div class="col-md-5">
					<h2 class="section-title section-h1">FAQs</h2>
				</div>
				<div class="col-md-6 offset-md-1">
					<div class="accordion accordion-big" id="faq-<?php the_ID(); ?>">
						<?php $j = 1; foreach ( $faqs as $faq ) : ?>
						<div class="accordion-item item-gray-wrapper">
							<h3 class="accordion-header" id="f-heading-<?php echo $j; ?>">
								<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#f-collapse-<?php echo $j; ?>" aria-expanded="false" aria-controls="f-collapse-<?php echo $j; ?>">
									<?php echo esc_html( $faq['title'] ); ?>
								</button>
							</h3>
							<div id="f-collapse-<?php echo $j; ?>" class="accordion-collapse collapse" aria-labelledby="f-heading-<?php echo $j; ?>" data-bs-parent="#faq-<?php the_ID(); ?>">
								<div class="accordion-body"><?php echo wp_kses_post( $faq['description'] ); ?></div>
							</div>
						</div>
						<?php $j++; endforeach; ?>
					</div>
				</div>
			</div>
		</div>
		<?php endif; ?>

		<?php endwhile; ?>

	</main><!-- #main -->

<?php
get_footer();
