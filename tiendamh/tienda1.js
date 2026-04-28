// =========================
// ESTADO GLOBAL
// =========================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

let currentPage = 1;
const pagesFixed = 3;
const itemsPerPage = 15; 

// =========================
// UTILIDADES
// =========================
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function parsePrice(text) {
  // "$25.99" -> 25.99
  if (!text) return NaN;
  return parseFloat(text.replace("$", "").replace(",", ".").trim());
}

function getQuery() {
  const input = document.getElementById("searchInput");
  return (input?.value || "").toLowerCase().trim();
}

function getAllProducts() {
  return Array.from(document.querySelectorAll(".product-card"));
}

function getFilteredProducts() {
  const q = getQuery();
  const products = getAllProducts();
  if (!q) return products;

  return products.filter(card => {
    const text = card.innerText.toLowerCase();
    return text.includes(q);
  });
}

// =========================
// BÚSQUEDA
// =========================
function setupSearch() {
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");

  if (!searchInput || !searchBtn) return;

  function runSearch() {
    currentPage = 1;
    renderProductsWithPagination();
  }

  searchInput.addEventListener("input", runSearch);
  searchBtn.addEventListener("click", runSearch);
}


// Paginas
function setupPagination() {
  const nav = document.querySelector(".pagination.monster-pagina");
  if (!nav) return;

  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a.page-link");
    if (!a) return;
    e.preventDefault();

    const label = a.getAttribute("aria-label");
    const text = a.innerText.trim();

    if (label === "Previous") {
      if (currentPage > 1) currentPage--;
      renderProductsWithPagination();
      return;
    }

    if (label === "Next") {
      if (currentPage < pagesFixed) currentPage++;
      renderProductsWithPagination();
      return;
    }

    const pageNum = Number(text);
    if (!Number.isNaN(pageNum)) {
      currentPage = pageNum;
      renderProductsWithPagination();
    }
  });
}

function updatePaginationUI() {
  const items = document.querySelectorAll(".pagination.monster-pagina .page-item");
  if (!items.length) return;

  // items[0] = prev, items[1]=1, items[2]=2, items[3]=3, items[4]=next
  items.forEach(i => i.classList.remove("active"));

  const activeIndex = currentPage; // 1->items[1], 2->items[2]...
  if (items[activeIndex]) items[activeIndex].classList.add("active");

  // deshabilitar prev/next visualmente
  if (items[0]) items[0].classList.toggle("disabled", currentPage === 1);
  if (items[items.length - 1]) items[items.length - 1].classList.toggle("disabled", currentPage === pagesFixed);
}

function renderProductsWithPagination() {
  const all = getAllProducts();
  const filtered = getFilteredProducts();

  // Primero ocultamos todos
  all.forEach(card => (card.style.display = "none"));

  // Luego mostramos solo los de la página actual dentro del filtrado
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  filtered.slice(start, end).forEach(card => (card.style.display = ""));

  updatePaginationUI();
}


function cerrarDropdown(elemento) {
  const dropdown = elemento.closest('.dropdown');
  const boton = dropdown.querySelector('.dropdown-toggle');

  const instancia = bootstrap.Dropdown.getInstance(boton);
  if (instancia) instancia.hide();
}
``

// =========================
// INYECTAR BOTÓN "AGREGAR" EN TUS CARDS
// =========================
function injectAddButtons() {
  document.querySelectorAll(".product-card").forEach(card => {
    if (card.querySelector(".btn-add-cart")) return;

    const nameEl = card.querySelector("h3, .card-title");
    const priceEl = card.querySelector(".price");

    if (!nameEl || !priceEl) return;

    const name = nameEl.textContent.trim();
    const price = parsePrice(priceEl.textContent);

    if (!name || Number.isNaN(price)) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-outline-success w-100 mt-2 btn-add-cart";
    btn.textContent = "Agregar";
    btn.addEventListener("click", () => addToCart(name, price));

    const body = card.querySelector(".card-body");
    (body || card).appendChild(btn);
  });
}

// =========================
// CARRITO
// =========================
function addToCart(name, price) {
  let item = cart.find(p => p.name === name);
  if (item) item.qty++;
  else cart.push({ name, price, qty: 1 });

  saveCart();
  renderCart();
}

function renderCart() {
  const list = document.getElementById("cart-list");
  const totalEl = document.getElementById("total");
  if (!list || !totalEl) return;

  list.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const subtotal = item.price * item.qty;
    total += subtotal;

    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";

    li.innerHTML = `
      <div class="me-2">
        <strong>${item.name}</strong><br>
        <small>$${item.price.toFixed(2)} x ${item.qty} = $${subtotal.toFixed(2)}</small>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-sm btn-outline-success" type="button" data-act="plus" data-i="${index}">+</button>
        <button class="btn btn-sm btn-outline-success" type="button" data-act="minus" data-i="${index}">-</button>
        <button class="btn btn-sm btn-danger" type="button" data-act="del" data-i="${index}">🗑</button>
      </div>
    `;

    list.appendChild(li);
  });

  totalEl.textContent = "Total: $" + total.toFixed(2);

  // Eventos botones del carrito
  list.querySelectorAll("button[data-act]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = Number(btn.dataset.i);
      const act = btn.dataset.act;

      if (act === "plus") changeQty(i, 1);
      if (act === "minus") changeQty(i, -1);
      if (act === "del") removeItem(i);
    });
  });
}

function changeQty(index, change) {
  if (!cart[index]) return;
  cart[index].qty += change;
  if (cart[index].qty <= 0) cart.splice(index, 1);

  saveCart();
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

// =========================
// PAGO + MODAL (Bootstrap)
// =========================
function openPayment() {
  if (cart.length === 0) {
    alert("Carrito vacío");
    return;
  }
  const modalEl = document.getElementById("payment-modal");
  if (!modalEl) return;

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}

function closePayment() {
  const modalEl = document.getElementById("payment-modal");
  if (!modalEl) return;

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.hide();
}

function processPayment() {
  const status = document.getElementById("payment-status");
  const number = document.getElementById("card-number")?.value?.trim();

  if (!status) return;

  if (!number || number.length < 12) {
    status.textContent = "❌ Tarjeta inválida";
    return;
  }

  status.textContent = "⏳ Procesando...";

  setTimeout(() => {
    status.textContent = "✅ Pago aprobado";

    setTimeout(() => {
      closePayment();
      generateTicket();

      cart = [];
      saveCart();
      renderCart();

      status.textContent = "";
      ["card-number", "card-name", "card-exp", "card-cvv"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
    }, 1000);
  }, 1200);
}

// =========================
// FACTURA PDF (jsPDF)
// =========================
function generateTicket() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("jsPDF no está cargado");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // ===== COLORES =====
  const pink = [255, 87, 171];
  const gray = [150, 150, 150];

  // ===== TÍTULO =====
  doc.setTextColor(...pink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MONSTER SHOP", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Factura de compra", 105, 30, { align: "center" });

  // ===== INFO GENERAL =====
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 42);
  doc.text(`Factura N°: ${Math.floor(Math.random() * 100000)}`, 14, 48);

  // ===== LÍNEA =====
  doc.setDrawColor(...gray);
  doc.line(14, 52, 196, 52);

  // ===== ENCABEZADOS =====
  let y = 62;

  doc.setFont("helvetica", "bold");
  doc.text("Producto", 14, y);
  doc.text("Cant.", 130, y);
  doc.text("Subtotal", 170, y, { align: "right" });

  doc.line(14, y + 2, 196, y + 2);

  // ===== LISTA DE PRODUCTOS =====
  y += 10;
  doc.setFont("helvetica", "normal");

  let total = 0;

  cart.forEach(item => {
    const subtotal = item.price * item.qty;
    total += subtotal;

    doc.text(item.name, 14, y);
    doc.text(String(item.qty), 135, y);
    doc.text(`$${subtotal.toFixed(2)}`, 196, y, { align: "right" });

    y += 8;
  });

  // ===== LÍNEA =====
  y += 4;
  doc.line(14, y, 196, y);

  // ===== TOTAL =====
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TOTAL:", 130, y);
  doc.text(`$${total.toFixed(2)}`, 196, y, { align: "right" });

  // ===== MENSAJE FINAL =====
  y += 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...gray);
  doc.text("Gracias por tu compra", 105, y, { align: "center" });
  doc.text("Monster High Store – Proyecto Académico", 105, y + 6, { align: "center" });

  // ===== GUARDAR =====
  doc.save("factura-monster-shop.pdf");
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  injectAddButtons();
  setupSearch();
  setupPagination();
  renderProductsWithPagination();
  renderCart();
});

// Asegura que tus onclick del HTML funcionen (global)
window.openPayment = openPayment;
window.closePayment = closePayment;
window.processPayment = processPayment;
window.addToCart = addToCart;
// =========================
// BUSCAR CATEGORÍAS + CARRUSEL (FIX REAL)
// =========================

const carousel = document.getElementById("carouselPrincipal");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

// ---- mostrar / ocultar carrusel ----
function ocultarCarousel() {
  if (carousel) carousel.style.display = "none";
}

function mostrarCarousel() {
  if (carousel) carousel.style.display = "block";
}

// ---- búsqueda real ----
function filtrarProductos() {
  const query = (searchInput?.value || "").toLowerCase().trim();

  const cards = document.querySelectorAll(".product-card");

  cards.forEach(card => {
    const text = card.innerText.toLowerCase();
    const match = text.includes(query);

    card.style.display = match ? "" : "none";
  });

  // carrusel
  if (query.length > 0) {
    ocultarCarousel();
  } else {
    mostrarCarousel();
  }

  currentPage = 1;
  renderProductsWithPagination();
}

// ---- eventos búsqueda ----
function setupSearch() {
  if (!searchInput || !searchBtn) return;

  searchInput.addEventListener("input", filtrarProductos);

  searchBtn.addEventListener("click", filtrarProductos);
}

// ---- ir a categorías ----
function irASeccion(seccion) {
  ocultarCarousel();

  const el = document.getElementById(seccion);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
}

// =========================
// INIT FINAL (IMPORTANTE)
// =========================
document.addEventListener("DOMContentLoaded", () => {
  injectAddButtons();
  setupSearch();
  setupPagination();
  renderProductsWithPagination();
  renderCart();
});


//PRUEBA DE ORGANIZACION DE CATEGORIAS
document.getElementById('searchInput').addEventListener('input', function() {
  const searchTerm = this.value.toLowerCase();
  const allCategories = document.querySelectorAll('.category');
  
  // Filtra las categorías
  allCategories.forEach(category => {
    const categoryName = category.getAttribute('data-category').toLowerCase();
    
    // Si la categoría coincide con el término de búsqueda
    if (categoryName.includes(searchTerm)) {
      category.style.display = 'block'; // Mostrarla
    } else {
      category.style.display = 'none'; // Ocultarla si no coincide
    }
  });
});

// Event listener para cambiar de pestaña y mostrar las categorías activas
const tabs = document.querySelectorAll('.nav-link');
tabs.forEach(tab => {
  tab.addEventListener('click', function() {
    const activeTab = document.querySelector('.nav-link.active').getAttribute('href');
    const allCategories = document.querySelectorAll('.category');

    // Ocultar todas las categorías
    allCategories.forEach(category => {
      category.style.display = 'none';
    });

    // Mostrar categorías de la pestaña activa
    const activeCategories = document.querySelectorAll(activeTab + ' .category');
    activeCategories.forEach(category => {
      category.style.display = 'block';
    });
  });
});

// =========================
// CODIGO FINAL CATEGORIAS + BUSQUEDA + TITULOS
// =========================

// 👉 Modo normal (sin búsqueda)
function mostrarModoNormal() {
  document.querySelectorAll(".categoria").forEach(cat => {
    cat.style.display = "block";
  });

  document.querySelectorAll(".product-card").forEach(card => {
    card.style.display = "";
  });

  mostrarCarousel();
}

// 👉 Render principal (usa búsqueda + paginación)
function renderProductsWithPagination() {
  const all = getAllProducts();
  const filtered = getFilteredProducts();

  // Oculta todo
  all.forEach(card => (card.style.display = "none"));

  // Paginación
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;

  filtered.slice(start, end).forEach(card => {
    card.style.display = "";
  });

  // 🔥 Mostrar/ocultar categorías completas (incluye títulos)
  document.querySelectorAll(".categoria").forEach(cat => {
    const visibleProducts = cat.querySelectorAll(
      ".product-card:not([style*='display: none'])"
    );

    if (visibleProducts.length > 0) {
      cat.style.display = "block";
    } else {
      cat.style.display = "none";
    }
  });

  updatePaginationUI();
}

// 👉 Búsqueda (única y correcta)
function setupSearch() {
  const input = document.getElementById("searchInput");
  const btn = document.getElementById("searchBtn");

  if (!input || !btn) return;

  function runSearch() {
    const query = input.value.trim();

    currentPage = 1;

    if (query === "") {
      mostrarModoNormal();
    }

    renderProductsWithPagination();

    // ocultar carrusel si hay búsqueda
    if (query !== "") {
      ocultarCarousel();
    } else {
      mostrarCarousel();
    }
  }

  input.addEventListener("input", runSearch);
  btn.addEventListener("click", runSearch);
}

// 👉 Navegación a secciones (dropdown)
function irASeccion(seccion) {
  mostrarModoNormal();

  const el = document.getElementById(seccion);
  if (el) {
    el.scrollIntoView({ behavior: "smooth" });
  }
}