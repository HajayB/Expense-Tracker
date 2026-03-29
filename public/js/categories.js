document.addEventListener("DOMContentLoaded", async () => {

  // ---- Auth check -------------------------------------------
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) { window.location.href = "/api/users/signin"; return; }

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // ---- Element refs -----------------------------------------
  const welcomeText  = document.getElementById("welcome_text");
  const categoryGrid = document.getElementById("categoryGrid");
  const addForm      = document.getElementById("categoryForm");

  let pendingDeleteId = null;

  // ---- Initial load -----------------------------------------
  async function init() {
    try {
      const profileRes = await fetch("/api/users/profile", { headers });
      if (!profileRes.ok) throw new Error();
      const profile = await profileRes.json();
      welcomeText.textContent = `Welcome, ${profile.name}`;
      await loadCategories();
    } catch {
      showToast("Failed to load page data.", "error");
    }
  }

  // ---- Load categories --------------------------------------
  async function loadCategories() {
    // Show skeleton
    categoryGrid.innerHTML = Array(4).fill(`
      <div class="category-card">
        <div class="skeleton" style="height:40px;width:40px;border-radius:50%"></div>
        <div style="flex:1">
          <div class="skeleton" style="height:14px;width:80px;border-radius:4px;margin-bottom:6px"></div>
          <div class="skeleton" style="height:12px;width:50px;border-radius:4px"></div>
        </div>
      </div>`).join("");

    try {
      const res = await fetch("/api/categories", { headers });
      if (!res.ok) throw new Error();
      const categories = await res.json();
      renderCategories(categories);
    } catch {
      showToast("Failed to load categories.", "error");
      categoryGrid.innerHTML = "";
    }
  }

  // ---- Render categories ------------------------------------
  function renderCategories(categories) {
    categoryGrid.innerHTML = "";

    if (!categories.length) {
      categoryGrid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <span>🗂️</span>
          <p>No categories yet</p>
          <small>Add your first category above</small>
        </div>`;
      return;
    }

    categories.forEach((cat) => {
      const card = document.createElement("div");
      card.className = "category-card";
      card.innerHTML = `
        <span style="font-size:1.75rem;line-height:1">${cat.icon || "💰"}</span>
        <div style="flex:1;min-width:0">
          <p style="font-weight:600;font-size:0.9rem;margin:0 0 4px;truncate">${cat.name}</p>
          <span class="cat-type-badge ${cat.type}">${cat.type}</span>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button class="edit-cat" data-id="${cat._id}" title="Edit">✏️</button>
          <button class="delete-cat" data-id="${cat._id}" title="Delete">🗑️</button>
        </div>`;
      categoryGrid.appendChild(card);
    });
  }

  // ---- Add category -----------------------------------------
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = addForm.elements.name.value.trim();
    const type = addForm.elements.type.value;
    const icon = addForm.elements.icon.value.trim() || "💰";

    if (!name) return showToast("Category name is required.", "error");

    const submitBtn = addForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      const res  = await fetch("/api/categories", {
        method: "POST",
        headers,
        body: JSON.stringify({ name, type, icon }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add category.");
      showToast("Category added!", "success");
      addForm.reset();
      await loadCategories();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // ---- Delete modal -----------------------------------------
  const deleteCatModal  = document.getElementById("deleteCatModal");
  const cancelCatDelete = document.getElementById("cancelCatDelete");
  const confirmCatDelete = document.getElementById("confirmCatDelete");

  function closeDeleteModal() {
    deleteCatModal.style.display = "none";
    pendingDeleteId = null;
  }

  cancelCatDelete.addEventListener("click", closeDeleteModal);
  window.addEventListener("click", (e) => { if (e.target === deleteCatModal) closeDeleteModal(); });

  confirmCatDelete.addEventListener("click", async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    closeDeleteModal();
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        showToast("Category deleted.", "success");
        await loadCategories();
      } else {
        showToast("Failed to delete category.", "error");
      }
    } catch {
      showToast("Error deleting category.", "error");
    }
  });

  // ---- Edit modal -------------------------------------------
  const editCatModal  = document.getElementById("editCatModal");
  const editCatForm   = document.getElementById("editCatForm");
  const cancelCatEdit = document.getElementById("cancelCatEdit");

  function closeEditModal() { editCatModal.style.display = "none"; }
  cancelCatEdit.addEventListener("click", closeEditModal);
  window.addEventListener("click", (e) => { if (e.target === editCatModal) closeEditModal(); });

  editCatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id   = editCatForm.elements.id.value;
    const name = editCatForm.elements.name.value.trim();
    const type = editCatForm.elements.type.value;
    const icon = editCatForm.elements.icon.value.trim() || "💰";

    if (!name) return showToast("Category name is required.", "error");

    try {
      const res  = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ name, type, icon }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update category.");
      showToast("Category updated!", "success");
      closeEditModal();
      await loadCategories();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // ---- Grid click delegation (edit / delete) ----------------
  categoryGrid.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-cat")) {
      pendingDeleteId = e.target.dataset.id;
      deleteCatModal.style.display = "flex";
    }

    if (e.target.classList.contains("edit-cat")) {
      const card = e.target.closest(".category-card");
      const id   = e.target.dataset.id;
      // Pull values from the rendered card
      const icon = card.querySelector("span").textContent.trim();
      const name = card.querySelector("p").textContent.trim();
      const type = card.querySelector(".cat-type-badge").textContent.trim();

      editCatForm.elements.id.value   = id;
      editCatForm.elements.icon.value = icon;
      editCatForm.elements.name.value = name;
      editCatForm.elements.type.value = type;

      editCatModal.style.display = "flex";
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
