(function($) {
	'use strict';

	// ========== UTILITY ==========
	function slugify(str) {
		return str.toLowerCase()
			.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/(^-|-$)/g, '');
	}

	function formatPriceFCFA(price) {
		return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	}

	// ========== QUICK VIEW MODAL ==========
	$(document).on('click', '.quick-view', function(e) {
		e.preventDefault();
		var $product = $(this).closest('.product');
		if (!$product.length) $product = $(this).closest('[data-name]');
		if (!$product.length) return;

		var name = $product.attr('data-name');
		var price = parseInt($product.attr('data-price'));
		var img = $product.attr('data-img');
		var category = $product.find('.product-category').text() || '';
		var ratingHtml = $product.find('.product-rating').html() || '';
		var oldPriceText = $product.find('.product-old-price').text() || '';

		var formattedPrice = formatPriceFCFA(price);

		var html = '<div class="qv-overlay"></div>';
		html += '<div class="qv-content">';
		html += '<button class="qv-close">&times;</button>';
		html += '<div class="qv-body">';
		html += '<div class="qv-img"><img src="' + img + '" alt="' + name + '"></div>';
		html += '<div class="qv-details">';
		html += '<p class="qv-category">' + category + '</p>';
		html += '<h3 class="qv-name">' + name + '</h3>';
		if (ratingHtml) html += '<div class="qv-rating">' + ratingHtml + '</div>';
		html += '<h4 class="qv-price">' + formattedPrice + ' FCFA';
		if (oldPriceText) html += ' <del class="qv-old-price">' + oldPriceText + '</del>';
		html += '</h4>';
		html += '<p class="qv-stock"><i class="fa fa-check-circle"></i> En Stock</p>';
		html += '<div class="qv-actions">';
		html += '<button class="add-to-cart-btn qv-add-cart" data-name="' + name + '" data-price="' + price + '" data-img="' + img + '"><i class="fa fa-shopping-cart"></i> Ajouter au panier</button>';
		html += ' <a href="product.html" class="qv-view-full">Voir le produit <i class="fa fa-arrow-circle-right"></i></a>';
		html += '</div>';
		html += '</div>';
		html += '</div>';
		html += '</div>';

		var $modal = $('<div id="quick-view-modal">' + html + '</div>');
		$('body').append($modal);
		setTimeout(function() { $modal.addClass('active'); }, 10);

		// Close handlers
		$modal.find('.qv-close, .qv-overlay').on('click', function() {
			$modal.removeClass('active');
			setTimeout(function() { $modal.remove(); }, 300);
		});

		$(document).on('keydown.quickview', function(ev) {
			if (ev.keyCode === 27) {
				$modal.removeClass('active');
				setTimeout(function() { $modal.remove(); }, 300);
				$(document).off('keydown.quickview');
			}
		});

		// Add to cart from modal
		$modal.find('.qv-add-cart').on('click', function() {
			var btn = this;
			var itemName = $(btn).attr('data-name');
			var itemPrice = parseInt($(btn).attr('data-price'));
			var itemImg = $(btn).attr('data-img');

			var existing = cart.find(function(c) { return c.name === itemName; });
			if (existing) {
				existing.qty += 1;
			} else {
				cart.push({ name: itemName, price: itemPrice, img: itemImg, qty: 1 });
			}
			saveCart();

			$(btn).html('<i class="fa fa-check"></i> Ajouté !').css('background', '#28a745');
			setTimeout(function() {
				$modal.removeClass('active');
				setTimeout(function() { $modal.remove(); }, 300);
			}, 800);
		});
	});

	// ========== SEARCH BAR ==========
	$('.header-search form').on('submit', function(e) {
		e.preventDefault();
		var q = $(this).find('.input').val().trim();
		var catOption = $(this).find('.input-select option:selected');
		var catText = catOption.length ? catOption.text() : '';

		var url = 'store.html';
		var params = [];
		if (q) params.push('q=' + encodeURIComponent(q));
		if (catText && catText !== 'Toutes les catégories') {
			params.push('category=' + encodeURIComponent(slugify(catText)));
		}
		if (params.length) url += '?' + params.join('&');
		window.location.href = url;
	});

	// ========== STORE PAGE FILTERING ==========
	var $storeEl = $('#store');
	if ($storeEl.length) {
		var $productCols = $storeEl.find('.product').closest('.col-md-4');
		var urlParams = new URLSearchParams(window.location.search);
		var urlCategory = urlParams.get('category');
		var urlBrand = urlParams.get('brand');
		var urlSearch = urlParams.get('q');

		// Pre-fill search input
		if (urlSearch) {
			$('.header-search .input').val(urlSearch);
		}

		// Pre-check category checkbox from URL
		if (urlCategory) {
			$('input[id^="category-"]').each(function() {
				var labelText = $(this).next('label').text().replace(/\s*\(.*\)/, '').trim();
				if (slugify(labelText) === urlCategory) {
					$(this).prop('checked', true);
				}
			});
		}

		// Pre-check brand checkbox from URL
		if (urlBrand) {
			$('input[id^="brand-"]').each(function() {
				var labelText = $(this).next('label').text().replace(/\s*\(.*\)/, '').trim();
				if (slugify(labelText) === urlBrand) {
					$(this).prop('checked', true);
				}
			});
		}

		// Bind filter events
		$('#aside input[type="checkbox"]').on('change', applyFilters);
		$('.store-sort .input-select').first().on('change', applyFilters);

		// Wait for nouislider to initialize, then bind and apply
		setTimeout(function() {
			var slider = document.getElementById('price-slider');
			if (slider && slider.noUiSlider) {
				slider.noUiSlider.on('change', applyFilters);
			}
			applyFilters();
		}, 300);

		function applyFilters() {
			// Get checked categories (slugified)
			var checkedCats = [];
			$('input[id^="category-"]:checked').each(function() {
				var labelText = $(this).next('label').text().replace(/\s*\(.*\)/, '').trim();
				checkedCats.push(slugify(labelText));
			});

			// Get checked brands (slugified)
			var checkedBrands = [];
			$('input[id^="brand-"]:checked').each(function() {
				var labelText = $(this).next('label').text().replace(/\s*\(.*\)/, '').trim();
				checkedBrands.push(slugify(labelText));
			});

			// Get price range
			var minPrice = parseInt($('#price-min').val()) || 0;
			var maxPrice = parseInt($('#price-max').val()) || 999999999;

			// Search term
			var searchTerm = (urlSearch || '').toLowerCase();

			var visibleCount = 0;

			$productCols.each(function() {
				var $col = $(this);
				var $prod = $col.find('.product');
				var name = ($prod.attr('data-name') || '').toLowerCase();
				var price = parseInt($prod.attr('data-price')) || 0;
				var category = ($prod.attr('data-category') || '').toLowerCase();
				var brand = ($prod.attr('data-brand') || '').toLowerCase();

				var show = true;

				// Category filter
				if (checkedCats.length > 0) {
					show = checkedCats.some(function(c) {
						return category.indexOf(c) !== -1 || c.indexOf(category) !== -1;
					});
				}

				// Brand filter
				if (show && checkedBrands.length > 0) {
					show = checkedBrands.some(function(b) {
						return brand === b;
					});
				}

				// Price filter
				if (show) {
					show = price >= minPrice && price <= maxPrice;
				}

				// Search filter
				if (show && searchTerm) {
					show = name.indexOf(searchTerm) !== -1 ||
						   category.indexOf(searchTerm) !== -1 ||
						   brand.indexOf(searchTerm) !== -1;
				}

				$col.toggle(show);
				if (show) visibleCount++;
			});

			// Hide clearfix divs during filtering to prevent layout issues
			var isFiltering = checkedCats.length > 0 || checkedBrands.length > 0 || searchTerm;
			$storeEl.find('.row .clearfix').toggle(!isFiltering);

			// Sort visible products
			var sortVal = $('.store-sort .input-select').first().val();
			var $row = $storeEl.find('.row').first();
			var $visible = $productCols.filter(':visible');

			if (sortVal === '1') {
				$visible.sort(function(a, b) {
					return parseInt($(a).find('.product').attr('data-price')) - parseInt($(b).find('.product').attr('data-price'));
				});
				$visible.each(function() { $row.append(this); });
			} else if (sortVal === '2') {
				$visible.sort(function(a, b) {
					return parseInt($(b).find('.product').attr('data-price')) - parseInt($(a).find('.product').attr('data-price'));
				});
				$visible.each(function() { $row.append(this); });
			}

			// Update count text
			$('.store-qty').text('Affichage de ' + visibleCount + ' produit(s)');
		}
	}

	// ========== GRID / LIST VIEW TOGGLE ==========
	$('.store-grid li').on('click', function(e) {
		e.preventDefault();
		$('.store-grid li').removeClass('active');
		$(this).addClass('active');
	});

})(jQuery);
