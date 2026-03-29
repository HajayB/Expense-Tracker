document.addEventListener("DOMContentLoaded", async () => {

  // ---- Auth check -------------------------------------------
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) { window.location.href = "/api/users/signin"; return; }

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // ---- Element refs -----------------------------------------
  const form              = document.getElementById("transactionForm");
  const amountInput       = form.querySelector('input[name="amount"]');
  const typeInput         = form.querySelector('select[name="type"]');
  const categorySelect    = form.querySelector('select[name="category"]');
  const descriptionInput  = form.querySelector('textarea[name="description"]');
  const submitBtn         = form.querySelector('button[type="submit"]');
  const transactionsTable = document.querySelector(".transactions tbody");
  const welcomeText       = document.getElementById("welcome_text");

  // ---- Filter element refs ----------------------------------
  const filterSearch = document.getElementById("filterSearch");
  const filterType   = document.getElementById("filterType");
  const filterStart  = document.getElementById("filterStart");
  const filterEnd    = document.getElementById("filterEnd");
  const clearBtn     = document.getElementById("clearFilters");

  // ---- State ------------------------------------------------
  let currentPage     = 1;
  let pendingDeleteId = null;
  let searchTimer     = null;
  let allCategories   = [];
  const PAGE_LIMIT    = 10;
  const filters       = { search: "", type: "", startDate: "", endDate: "" };

  // ---- Categories -------------------------------------------
  async function loadCategories() {
    try {
      const res = await fetch("/api/categories", { headers });
      if (!res.ok) return;
      allCategories = await res.json();
      populateCategorySelect(categorySelect, typeInput.value);
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  }

  function populateCategorySelect(selectEl, type, currentValue = "") {
    const filtered = allCategories.filter(
      (c) => c.type === "both" || c.type === type
    );

    selectEl.innerHTML = "";

    if (!filtered.length) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No categories — add some in Categories";
      opt.disabled = true;
      opt.selected = true;
      selectEl.appendChild(opt);
      return;
    }

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select category";
    placeholder.disabled = true;
    placeholder.selected = !currentValue;
    selectEl.appendChild(placeholder);

    filtered.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.name;
      opt.textContent = `${cat.icon} ${cat.name}`;
      if (cat.name === currentValue) opt.selected = true;
      selectEl.appendChild(opt);
    });

    // If the current value isn't in the filtered list (old data), add it anyway
    if (currentValue && !filtered.find((c) => c.name === currentValue)) {
      const opt = document.createElement("option");
      opt.value = currentValue;
      opt.textContent = currentValue;
      opt.selected = true;
      selectEl.appendChild(opt);
    }
  }

  // Re-filter categories when type changes in the add form
  typeInput.addEventListener("change", () => {
    populateCategorySelect(categorySelect, typeInput.value);
  });

  // ---- Initial load -----------------------------------------
  async function init() {
    try {
      const profileRes = await fetch("/api/users/profile", { headers });
      if (!profileRes.ok) throw new Error("Failed to fetch profile");
      const profile = await profileRes.json();
      welcomeText.textContent = `Welcome, ${profile.name}`;
      await Promise.all([updateSummary(), loadCategories(), loadTransactions(1)]);
    } catch (error) {
      console.error("Init error:", error);
      showToast("Failed to load page data.", "error");
    }
  }

  // ---- Skeleton loader --------------------------------------
  function showSkeleton() {
    transactionsTable.innerHTML = Array(5).fill(`
      <tr>
        <td><div class="skeleton" style="height:14px;width:70px;border-radius:4px"></div></td>
        <td><div class="skeleton" style="height:14px;width:80px;border-radius:4px"></div></td>
        <td><div class="skeleton" style="height:14px;width:55px;border-radius:4px"></div></td>
        <td><div class="skeleton" style="height:14px;width:90px;border-radius:4px"></div></td>
        <td><div class="skeleton" style="height:14px;width:50px;border-radius:4px"></div></td>
      </tr>
    `).join("");
  }

  // ---- Load transactions ------------------------------------
  async function loadTransactions(page) {
    currentPage = page;
    showSkeleton();

    const params = new URLSearchParams({ page, limit: PAGE_LIMIT });
    if (filters.type)      params.set("type",      filters.type);
    if (filters.search)    params.set("search",    filters.search);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate)   params.set("endDate",   filters.endDate);

    try {
      const res = await fetch(`/api/transactions?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const { transactions, pagination } = await res.json();
      renderTransactions(transactions);
      renderPagination(pagination);
    } catch (error) {
      console.error("Transactions load error:", error);
      showToast("Failed to load transactions.", "error");
      transactionsTable.innerHTML = '<tr><td colspan="5" class="text-center text-gray-400 py-10">Failed to load.</td></tr>';
    }
  }

  // ---- Render transactions ----------------------------------
  function renderTransactions(transactions) {
    transactionsTable.innerHTML = "";

    if (!transactions.length) {
      transactionsTable.innerHTML = `
        <tr><td colspan="5">
          <div class="empty-state">
            <span>📭</span>
            <p>No transactions found</p>
            <small>Try adjusting your filters or add a new transaction</small>
          </div>
        </td></tr>`;
      return;
    }

    transactions.forEach((t) => {
      const tr      = document.createElement("tr");
      const date    = new Date(t.date).toLocaleDateString();
      const type    = t.type.charAt(0).toUpperCase() + t.type.slice(1);
      const tooltip = t.description || "No description";

      tr.innerHTML = `
        <td title="${tooltip}">${date}</td>
        <td title="${tooltip}" style="font-weight:600;color:${t.type === "income" ? "#16a34a" : "#dc2626"}">${fmt(t.amount)}</td>
        <td title="${tooltip}">${type}</td>
        <td title="${tooltip}">${t.category}</td>
        <td title="${tooltip}">
          <button class="edit"   data-id="${t._id}">✏️</button>
          <button class="delete" data-id="${t._id}">🗑️</button>
        </td>`;
      transactionsTable.appendChild(tr);
    });
  }

  // ---- Render pagination ------------------------------------
  function renderPagination({ page, totalPages, hasNextPage, hasPrevPage }) {
    const pageInfo = document.getElementById("pageInfo");
    const prevBtn  = document.getElementById("prevPage");
    const nextBtn  = document.getElementById("nextPage");
    if (!pageInfo) return;
    pageInfo.textContent  = `Page ${page} of ${totalPages || 1}`;
    prevBtn.disabled = !hasPrevPage;
    nextBtn.disabled = !hasNextPage;
  }

  document.getElementById("prevPage")?.addEventListener("click", () => loadTransactions(currentPage - 1));
  document.getElementById("nextPage")?.addEventListener("click", () => loadTransactions(currentPage + 1));

  // ---- Filter wiring ----------------------------------------
  filterSearch.addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      filters.search = e.target.value.trim();
      loadTransactions(1);
    }, 400);
  });

  filterType.addEventListener("change", (e) => {
    filters.type = e.target.value;
    loadTransactions(1);
  });

  filterStart.addEventListener("change", (e) => {
    filters.startDate = e.target.value;
    loadTransactions(1);
  });

  filterEnd.addEventListener("change", (e) => {
    filters.endDate = e.target.value;
    loadTransactions(1);
  });

  clearBtn.addEventListener("click", () => {
    filters.search = filters.type = filters.startDate = filters.endDate = "";
    filterSearch.value = "";
    filterType.value   = "";
    filterStart.value  = "";
    filterEnd.value    = "";
    loadTransactions(1);
  });

  // ---- Summary cards ----------------------------------------
  async function updateSummary() {
    try {
      const res = await fetch("/api/transactions/summary", { headers });
      if (!res.ok) return;
      const summary = await res.json();
      const cards   = document.querySelectorAll(".card p");
      if (cards.length >= 3) {
        cards[0].textContent = fmt(summary.balance);
        cards[1].textContent = fmt(summary.income);
        cards[2].textContent = fmt(summary.expenses);
      }
    } catch (e) {
      console.error("Summary update error:", e);
    }
  }

  // ---- Add transaction --------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount      = amountInput.value.trim();
    const type        = typeInput.value.trim();
    const category    = categorySelect.value.trim();
    const description = descriptionInput.value.trim();

    if (!amount || !type || !category) {
      return showToast("Amount, Type, and Category are required.", "error");
    }

    submitBtn.disabled = true;
    try {
      const res  = await fetch("/api/transactions", {
        method: "POST",
        headers,
        body: JSON.stringify({ amount, type, category, description, date: Date.now() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error adding transaction.");
      showToast("Transaction added!", "success");
      form.reset();
      populateCategorySelect(categorySelect, typeInput.value);
      await loadTransactions(1);
      updateSummary();
    } catch (error) {
      showToast(error.message || "Failed to add transaction.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // ---- Delete modal -----------------------------------------
  const deleteModal  = document.getElementById("deleteModal");
  const cancelDelete = document.getElementById("cancelDelete");
  const confirmDelete = document.getElementById("confirmDelete");

  function closeDeleteModal() {
    deleteModal.style.display = "none";
    pendingDeleteId = null;
  }

  cancelDelete.addEventListener("click", closeDeleteModal);
  window.addEventListener("click", (e) => { if (e.target === deleteModal) closeDeleteModal(); });

  confirmDelete.addEventListener("click", async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    closeDeleteModal();
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        showToast("Transaction deleted.", "success");
        await loadTransactions(currentPage);
        updateSummary();
      } else {
        showToast("Failed to delete transaction.", "error");
      }
    } catch (err) {
      showToast("Error deleting transaction.", "error");
    }
  });

  transactionsTable.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete")) {
      pendingDeleteId = e.target.dataset.id;
      deleteModal.style.display = "flex";
    }
  });

  // ---- Edit modal -------------------------------------------
  const editModal = document.getElementById("editModal");
  const closeBtn  = document.querySelector(".close");
  const editForm  = document.getElementById("editForm");

  transactionsTable.addEventListener("click", (e) => {
    if (!e.target.classList.contains("edit")) return;
    const id  = e.target.dataset.id;
    const row = e.target.closest("tr");
    const [dateTd, amountTd, typeTd, categoryTd] = row.children;

    const editType     = typeTd.textContent.toLowerCase();
    const editCategory = categoryTd.textContent.trim();

    editForm.elements.id.value          = id;
    editForm.elements.amount.value      = amountTd.textContent.replace("₦", "").replace(/,/g, "").trim();
    editForm.elements.type.value        = editType;
    editForm.elements.description.value = "";

    populateCategorySelect(editForm.elements.category, editType, editCategory);

    editModal.style.display = "flex";
  });

  closeBtn.onclick = () => { editModal.style.display = "none"; };
  window.addEventListener("click", (e) => { if (e.target === editModal) editModal.style.display = "none"; });

  editForm.elements.type.addEventListener("change", (e) => {
    const currentCat = editForm.elements.category.value;
    populateCategorySelect(editForm.elements.category, e.target.value, currentCat);
  });

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id          = editForm.elements.id.value;
    const amount      = editForm.elements.amount.value.trim();
    const type        = editForm.elements.type.value.trim();
    const category    = editForm.elements.category.value.trim();
    const description = editForm.elements.description.value.trim();

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ amount, type, category, description }),
      });
      if (!res.ok) throw new Error("Failed to update transaction.");
      showToast("Transaction updated!", "success");
      editModal.style.display = "none";
      await loadTransactions(currentPage);
      updateSummary();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // ---- Sidebar navigation ----------------------------------
  document.getElementById("dashboard")?.addEventListener("click",     () => window.location.href = "/api/users/dashboard");
  document.getElementById("transationBtn")?.addEventListener("click", () => window.location.href = "/api/users/transactions");
  document.getElementById("categoriesBtn")?.addEventListener("click", () => window.location.href = "/api/users/categories");
  document.getElementById("summaryBtn")?.addEventListener("click",    () => window.location.href = "/api/users/summary");

  // ---- Logout ----------------------------------------------
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.href = "/api/users/signin";
  });

  await init();
});
