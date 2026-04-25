
// ESTADO GLOBAL
let cart = JSON.parse(localStorage.getItem("cart")) || [];

let currentPage = 1;
const pagesFixed = 3;
const itemsPerPage = 15; 

// UTILIDADES

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


// Busqueda de navegador

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

// INYECTAR BOTÓN "AGREGAR" EN TUS CARDS

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


// El carrito

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

// El pago
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

// =========================
// VALIDACIÓN DE TARJETA (real)
// =========================

// Algoritmo de Luhn (validación real)
function isValidCardNumber(number) {
  let sum = 0;
  let shouldDouble = false;

  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i]);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function isValidExpiry(exp) {
  if (!/^\d{2}\/\d{2}$/.test(exp)) return false;

  const [month, year] = exp.split("/").map(Number);
  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  return year > currentYear || (year === currentYear && month >= currentMonth);
}

function isValidCVV(cvv) {
  return /^\d{3,4}$/.test(cvv);
}

function processPayment() {
  const number = document.getElementById("card-number").value.replace(/\s+/g, "");
  const exp = document.getElementById("card-exp").value.trim();
  const cvv = document.getElementById("card-cvv").value.trim();
  const status = document.getElementById("payment-status");

  status.textContent = "";
  status.style.color = "red";

  // ===== VALIDACIONES =====
  if (!/^\d{13,19}$/.test(number)) {
    status.textContent = "❌ Número de tarjeta inválido";
    return;
  }

  if (!isValidCardNumber(number)) {
    status.textContent = "❌ Tarjeta no válida";
    return;
  }

  if (!isValidExpiry(exp)) {
    status.textContent = "❌ Tarjeta vencida o fecha incorrecta";
    return;
  }

  if (!isValidCVV(cvv)) {
    status.textContent = "❌ CVV inválido";
    return;
  }

  // ===== SI TODO ESTÁ BIEN =====
  status.style.color = "green";
  status.textContent = "⏳ Procesando pago...";

  setTimeout(() => {
    status.textContent = "✅ Pago aprobado";

    setTimeout(() => {
      closePayment();
      generateTicket();

      cart = [];
      saveCart();
      renderCart();

      // limpiar inputs
      ["card-number", "card-name", "card-exp", "card-cvv"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });

      status.textContent = "";
    }, 1000);
  }, 1500);
}


// La factura
function generateTicket() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("jsPDF no está cargado");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

 
  const pink = [255, 87, 171];
  const gray = [150, 150, 150];

 
  doc.setTextColor(...pink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("MONSTER SHOP", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Factura de compra", 105, 30, { align: "center" });


  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 42);
  doc.text(`Factura N°: ${Math.floor(Math.random() * 100000)}`, 14, 48);

  
  doc.setDrawColor(...gray);
  doc.line(14, 52, 196, 52);

 
  let y = 62;

  doc.setFont("helvetica", "bold");
  doc.text("Producto", 14, y);
  doc.text("Cant.", 130, y);
  doc.text("Subtotal", 170, y, { align: "right" });

  doc.line(14, y + 2, 196, y + 2);

 // La lista de productos
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

  // Linea
  y += 4;
  doc.line(14, y, 196, y);

  // Total
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TOTAL:", 130, y);
  doc.text(`$${total.toFixed(2)}`, 196, y, { align: "right" });

  // Mensaje Final
  y += 20;
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...gray);
  doc.text("Gracias por tu compra", 105, y, { align: "center" });
  doc.text("Monster High Store", 105, y + 6, { align: "center" });
  doc.save("factura-monster-shop.pdf");
}


document.addEventListener("DOMContentLoaded", () => {
  injectAddButtons();
  setupSearch();
  setupPagination();
  renderProductsWithPagination();
  renderCart();
});

window.openPayment = openPayment;
window.closePayment = closePayment;
window.processPayment = processPayment;
window.addToCart = addToCart;