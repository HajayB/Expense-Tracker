document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) { window.location.href = "/api/users/signin"; return; }

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const welcomeText       = document.getElementById("welcome_text");
  const cards             = document.querySelectorAll(".card p");
  const transactionsTable = document.querySelector(".transactions tbody");

  // ---- Show skeleton immediately ----------------------------
  cards.forEach((p) => {
    p.innerHTML = '<div class="skeleton" style="height:28px;width:110px;border-radius:6px;display:inline-block"></div>';
  });
  transactionsTable.innerHTML = Array(4).fill(`
    <tr>
      <td><div class="skeleton" style="height:13px;width:70px;border-radius:4px"></div></td>
      <td><div class="skeleton" style="height:13px;width:80px;border-radius:4px"></div></td>
      <td><div class="skeleton" style="height:13px;width:55px;border-radius:4px"></div></td>
      <td><div class="skeleton" style="height:13px;width:90px;border-radius:4px"></div></td>
    </tr>`).join("");

  // ---- Load all data ----------------------------------------
  try {
    const [profileRes, summaryRes, txRes] = await Promise.all([
      fetch("/api/users/profile", { headers }),
      fetch("/api/transactions/summary", { headers }),
      fetch("/api/transactions?limit=4", { headers }),
    ]);

    if (!profileRes.ok || !summaryRes.ok || !txRes.ok) throw new Error("Failed to load data");

    const profile          = await profileRes.json();
    const summary          = await summaryRes.json();
    const { transactions } = await txRes.json();

    welcomeText.textContent = `Welcome, ${profile.name}`;

    if (cards.length >= 3) {
      cards[0].textContent = fmt(summary.balance);
      cards[1].textContent = fmt(summary.income);
      cards[2].textContent = fmt(summary.expenses);
    }

    renderTransactions(transactions);
  } catch (error) {
    console.error("Dashboard load error:", error);
    showToast("Failed to load dashboard data.", "error");
    welcomeText.textContent = "Error loading data";
    cards.forEach((p) => { p.textContent = "—"; });
    transactionsTable.innerHTML = '<tr><td colspan="4" class="text-center text-gray-400 py-8">Failed to load.</td></tr>';
  }

  // ---- Render recent transactions ---------------------------
  function renderTransactions(transactions) {
    transactionsTable.innerHTML = "";

    if (!transactions.length) {
      transactionsTable.innerHTML = `
        <tr><td colspan="4">
          <div class="empty-state">
            <span>📭</span>
            <p>No transactions yet</p>
            <small>Head to Transactions to add your first one</small>
          </div>
        </td></tr>`;
      return;
    }

    transactions.forEach((t) => {
      const tr   = document.createElement("tr");
      const date = new Date(t.date).toLocaleDateString();
      const type = t.type.charAt(0).toUpperCase() + t.type.slice(1);
      tr.innerHTML = `
        <td>${date}</td>
        <td style="font-weight:600;color:${t.type === "income" ? "#16a34a" : "#dc2626"}">${fmt(t.amount)}</td>
        <td>${type}</td>
        <td>${t.category}</td>`;
      transactionsTable.appendChild(tr);
    });
  }

  // ---- Sidebar navigation -----------------------------------
  document.getElementById("dashboard")?.addEventListener("click",     () => window.location.href = "/api/users/dashboard");
  document.getElementById("transationBtn")?.addEventListener("click", () => window.location.href = "/api/users/transactions");
  document.getElementById("categoriesBtn")?.addEventListener("click", () => window.location.href = "/api/users/categories");
  document.getElementById("summaryBtn")?.addEventListener("click",    () => window.location.href = "/api/users/summary");

  // ---- Logout -----------------------------------------------
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    window.location.href = "/api/users/signin";
  });
});
