const socket = io();

document
  .getElementById("productForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((product) => {
        console.log("Product added:", product);
        addProductToList(product);
      })
      .catch((err) => console.error("Error adding product:", err));

    event.target.reset();
  });

function addProductToList(product) {
  const productList = document.getElementById("products");
  if (!productList) {
    console.error("Product list element not found");
    return;
  }
  const productItem = document.createElement("div");
  productItem.className = "col-md-4";
  productItem.id = `product-${product._id}`;
  productItem.innerHTML = `
        <div class="card mb-4 shadow-sm">
            <div class="card-body">
                <h5 class="card-title">${product.title}</h5>
                <p class="card-text">${product.description}</p>
                <p class="card-text"><strong>Code:</strong> ${product.code}</p>
                <p class="card-text"><strong>Price:</strong> $${product.price}</p>
                <p class="card-text"><strong>Stock:</strong> <span id="stock-${product._id}">${product.stock}</span></p>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <button class="btn btn-sm btn-primary" onclick="viewDetails('${product._id}')">See more..</button>
                        <button class="btn btn-sm btn-danger" onclick="confirmRemoveProduct('${product._id}')">Erase</button>
                        <button class="btn btn-sm btn-success" onclick="promptAddToCart('${product._id}')">Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>`;
  productList.appendChild(productItem);
}

function updateProductStock(productId, newStock) {
  const stockElement = document.getElementById(`stock-${productId}`);
  if (stockElement) {
    stockElement.textContent = newStock;
  }
}

function updateCartList(cart) {
  const cartList = document.getElementById("cart-items");
  const emptyCartMessage = document.getElementById("empty-cart");
  if (!cartList) {
    console.error("Cart list element not found");
    return;
  }
  cartList.innerHTML = ""; // Limpiar lista de carritos

  if (!cart || !cart.products || cart.products.length === 0) {
    emptyCartMessage.style.display = "block";
  } else {
    emptyCartMessage.style.display = "none";
    cart.products.forEach((item) => {
      const product = item.product;
      const cartItem = document.createElement("li");
      cartItem.className = "list-group-item";
      cartItem.id = `cart-${product._id}`;
      cartItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Title:</strong> ${
                          product.title || "undefined"
                        } <br>
                        <strong>Quantity:</strong> <span id="cart-quantity-${
                          product._id
                        }">${item.quantity}</span>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-danger" onclick="promptRemoveFromCart('${
                          product._id
                        }')">Remove</button>
                    </div>
                </div>`;
      cartList.appendChild(cartItem);
    });
  }
}

function updateCartQuantity(productId, newQuantity) {
  const quantityElement = document.getElementById(`cart-quantity-${productId}`);
  if (quantityElement) {
    quantityElement.textContent = newQuantity;
  }
}

function promptAddToCart(productId) {
  Swal.fire({
    title: "Enter the quantity to add",
    input: "number",
    inputAttributes: {
      min: 1,
    },
    showCancelButton: true,
    confirmButtonText: "Add to Cart",
    preConfirm: (quantity) => {
      return addToCart(productId, parseInt(quantity, 10));
    },
  });
}

function promptRemoveFromCart(productId) {
  Swal.fire({
    title: "Enter the quantity to remove",
    input: "number",
    inputAttributes: {
      min: 1,
    },
    showCancelButton: true,
    confirmButtonText: "Remove from Cart",
    preConfirm: (quantity) => {
      return removeFromCart(productId, parseInt(quantity, 10));
    },
  });
}

function confirmRemoveProduct(productId) {
  Swal.fire({
    title:
      "You are going to erase the selected product from the DDBB, is that correct?",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "No, keep it",
  }).then((result) => {
    if (result.isConfirmed) {
      removeProduct(productId);
    }
  });
}

function addToCart(productId, quantity) {
  fetch(`/api/carts/add/${productId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ quantity: quantity }),
  })
    .then((response) => response.json())
    .then((cart) => {
      console.log("Product added to cart:", cart);
      socket.emit("cartUpdated", cart);
    })
    .catch((err) => console.error("Error adding product to cart:", err));
}

function viewDetails(productId) {
  window.location.href = `/api/products/details/${productId}`;
}

function removeProduct(id) {
  fetch(`/api/products/${id}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((result) => {
      console.log("Product removed:", result);
      const productItem = document.getElementById(`product-${id}`);
      if (productItem) {
        productItem.remove();
      }
      socket.emit("cartUpdated");
    })
    .catch((err) => console.error("Error removing product:", err));
}

function removeFromCart(productId, quantity) {
  if (!productId) {
    console.error("Product ID is undefined");
    return;
  }

  fetch(`/api/carts/remove/${productId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ quantity: quantity }),
  })
    .then((response) => response.json())
    .then((cart) => {
      console.log("Product removed from cart:", cart);
      socket.emit("cartUpdated", cart);
    })
    .catch((err) => console.error("Error removing product from cart:", err));
}

function clearCart() {
  fetch("/api/carts/clear", {
    method: "POST",
  })
    .then((response) => response.json())
    .then((cart) => {
      console.log("Cart cleared:", cart);
      updateCartList(cart);
      socket.emit("cartCleared");
      // Emitir evento de actualización de productos después de vaciar el carrito
      cart.products.forEach((item) => {
        socket.emit("productUpdated", item.product);
      });
    })
    .catch((err) => console.error("Error clearing cart:", err));
}

socket.on("productUpdated", (product) => {
  updateProductStock(product._id, product.stock);
});

function updateProductStock(productId, newStock) {
  const stockElement = document.getElementById(`stock-${productId}`);
  if (stockElement) {
    stockElement.textContent = newStock;
  }
}

function fetchProducts(page = 1, limit = 10, sort = "", query = "") {
  fetch(`/api/products?page=${page}&limit=${limit}&sort=${sort}&query=${query}`)
    .then((response) => response.json())
    .then((response) => {
      if (response.status === "success") {
        const productsList = document.getElementById("products");
        if (!productsList) {
          console.error("Products list element not found");
          return;
        }
        productsList.innerHTML = "";
        response.payload.forEach((product) => addProductToList(product));

        // Actualizar los enlaces de paginación
        const paginationControls = document.getElementById(
          "pagination-controls"
        );
        if (paginationControls) {
          paginationControls.innerHTML = `
                        <nav>
                            <ul class="pagination">
                                ${
                                  response.hasPrevPage
                                    ? `<li class="page-item"><a class="page-link" href="#" onclick="fetchProducts(${response.prevPage}, ${limit}, '${sort}', '${query}')">Previous</a></li>`
                                    : ""
                                }
                                <li class="page-item active"><a class="page-link" href="#">${
                                  response.page
                                }</a></li>
                                ${
                                  response.hasNextPage
                                    ? `<li class="page-item"><a class="page-link" href="#" onclick="fetchProducts(${response.nextPage}, ${limit}, '${sort}', '${query}')">Next</a></li>`
                                    : ""
                                }
                            </ul>
                        </nav>
                    `;
        } else {
          console.error("Pagination controls element not found");
        }
      } else {
        console.error("Error fetching products:", response.msg);
      }
    })
    .catch((err) => console.error("Error fetching products:", err));
}

socket.on("productRemoved", (data) => {
  const productItem = document.getElementById(`product-${data.id}`);
  if (productItem) {
    productItem.remove();
  }
});

socket.on("productData", (data) => {
  addProductToList(data);
});

socket.on("productUpdated", (product) => {
  updateProductStock(product._id, product.stock);
});

function updateProductStock(productId, newStock) {
  const stockElement = document.getElementById(`stock-${productId}`);
  if (stockElement) {
    stockElement.textContent = newStock;
  }
}

socket.on("cartUpdated", (cart) => {
  updateCartList(cart);
});

socket.on("cartCleared", () => {
  clearCartUI();
});

function clearCartUI() {
  const cartList = document.getElementById("cart-items");
  if (!cartList) {
    console.error("Cart list element not found");
    return;
  }
  cartList.innerHTML = ""; // Limpiar lista de carritos
  const emptyCartMessage = document.getElementById("empty-cart");
  emptyCartMessage.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();

  fetch("/api/carts")
    .then((response) => response.json())
    .then((cart) => {
      if (cart) {
        updateCartList(cart);
      } else {
        updateCartList({ products: [] });
      }
    })
    .catch((err) => console.error("Error fetching cart:", err));
});
