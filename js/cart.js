// Cart & Wishlist management with localStorage (shared across all pages)
var cart = JSON.parse(localStorage.getItem('infotechCart')) || [];
var wishlist = JSON.parse(localStorage.getItem('infotechWishlist')) || [];

function formatPrice(price) {
	return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function saveCart() {
	localStorage.setItem('infotechCart', JSON.stringify(cart));
	updateCartUI();
	if (typeof updateCartPage === 'function') {
		updateCartPage();
	}
}

function saveWishlist() {
	localStorage.setItem('infotechWishlist', JSON.stringify(wishlist));
	updateWishlistUI();
}

function addToCart(btn) {
	var product = btn.closest('.product') || btn.closest('[data-name]');
	var name = product.getAttribute('data-name');
	var price = parseInt(product.getAttribute('data-price'));
	var img = product.getAttribute('data-img');

	var existing = cart.find(function(item) { return item.name === name; });
	if (existing) {
		existing.qty += 1;
	} else {
		cart.push({ name: name, price: price, img: img, qty: 1 });
	}

	saveCart();

	// Visual feedback
	btn.innerHTML = '<i class="fa fa-check"></i> Ajouté !';
	btn.style.background = '#28a745';
	setTimeout(function() {
		btn.innerHTML = '<i class="fa fa-shopping-cart"></i> ajouter au panier';
		btn.style.background = '';
	}, 1500);
}

function removeFromCart(index) {
	cart.splice(index, 1);
	saveCart();
}

function updateCartQty(index, delta) {
	cart[index].qty += delta;
	if (cart[index].qty <= 0) {
		cart.splice(index, 1);
	}
	saveCart();
}

function addToWishlist(btn) {
	var product = btn.closest('.product') || btn.closest('[data-name]');
	var name = product.getAttribute('data-name');
	var price = parseInt(product.getAttribute('data-price'));
	var img = product.getAttribute('data-img');

	var exists = wishlist.find(function(item) { return item.name === name; });
	if (!exists) {
		wishlist.push({ name: name, price: price, img: img });
		saveWishlist();
		btn.querySelector('i').className = 'fa fa-heart';
		btn.style.color = '#D10024';
	}
}

function updateCartUI() {
	var cartItems = document.getElementById('cart-items');
	var cartQty = document.getElementById('cart-qty');
	var cartCount = document.getElementById('cart-count');
	var cartTotal = document.getElementById('cart-total');

	if (!cartQty) return;

	var totalItems = cart.reduce(function(sum, item) { return sum + item.qty; }, 0);
	var totalPrice = cart.reduce(function(sum, item) { return sum + (item.price * item.qty); }, 0);

	cartQty.textContent = totalItems;
	if (cartCount) cartCount.textContent = totalItems + ' article(s) sélectionné(s)';
	if (cartTotal) cartTotal.textContent = formatPrice(totalPrice);

	if (!cartItems) return;

	if (cart.length === 0) {
		cartItems.innerHTML = '<p style="text-align:center; padding:20px; color:#888;">Votre panier est vide</p>';
		return;
	}

	var html = '';
	cart.forEach(function(item, index) {
		html += '<div class="product-widget">';
		html += '<div class="product-img"><img src="' + item.img + '" alt=""></div>';
		html += '<div class="product-body">';
		html += '<h3 class="product-name"><a href="#">' + item.name + '</a></h3>';
		html += '<h4 class="product-price"><span class="qty">' + item.qty + 'x</span>' + formatPrice(item.price) + ' FCFA</h4>';
		html += '</div>';
		html += '<button class="delete" onclick="removeFromCart(' + index + ')"><i class="fa fa-close"></i></button>';
		html += '</div>';
	});
	cartItems.innerHTML = html;
}

function updateWishlistUI() {
	var wishlistQty = document.getElementById('wishlist-qty');
	if (wishlistQty) wishlistQty.textContent = wishlist.length;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
	updateCartUI();
	updateWishlistUI();
});
