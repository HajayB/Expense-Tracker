document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) { window.location.href = "/api/users/signin"; return; }

  const headers    = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  const welcomeText = document.getElementById("welcome_text");
  const cards       = document.querySelectorAll(".card p");

  // ---- Chart instances (kept for destroy-on-reload) ---------
  let barChart = null, doughnutChart = null, lineChart = null;

  // ---- Date range inputs ------------------------------------
  const startInput   = document.getElementById("summaryStart");
  const endInput     = document.getElementById("summaryEnd");
  const clearDateBtn = document.getElementById("clearDateRange");

  startInput.addEventListener("change",  () => loadSummary());
  endInput.addEventListener("change",    () => loadSummary());
  clearDateBtn.addEventListener("click", () => {
    startInput.value = "";
    endInput.value   = "";
    loadSummary();
  });

  // ---- Load & render ----------------------------------------
  async function loadSummary() {
    const params = new URLSearchParams();
    if (startInput.value) params.set("startDate", startInput.value);
    if (endInput.value)   params.set("endDate",   endInput.value);

    try {
      const [profileRes, summaryRes] = await Promise.all([
        fetch("/api/users/profile", { headers }),
        fetch(`/api/transactions/summary?${params}`, { headers }),
      ]);

      if (!profileRes.ok || !summaryRes.ok) throw new Error("Failed to load data");

      const profile = await profileRes.json();
      const summary = await summaryRes.json();

      welcomeText.textContent = `Welcome, ${profile.name}`;

      if (cards.length >= 3) {
        cards[0].textContent = fmt(summary.balance);
        cards[1].textContent = fmt(summary.income);
        cards[2].textContent = fmt(summary.expenses);
      }

      renderCharts(summary);
    } catch (error) {
      console.error("Summary error:", error);
      welcomeText.textContent = "Failed to load data.";
      showToast("Failed to load summary data.", "error");
    }
  }

  // ---- Render all three charts ------------------------------
  function renderCharts(summary) {
    // Destroy existing instances before redrawing
    if (barChart)      { barChart.destroy();      barChart      = null; }
    if (doughnutChart) { doughnutChart.destroy(); doughnutChart = null; }
    if (lineChart)     { lineChart.destroy();     lineChart     = null; }

    // ---- Bar chart: income vs expenses vs balance -----------
    const barCtx = document.getElementById("incomeExpenseChart").getContext("2d");
    barChart = new Chart(barCtx, {
      type: "bar",
      data: {
        labels: ["Income", "Expenses", "Balance"],
        datasets: [{
          data: [summary.income, summary.expenses, summary.balance],
          backgroundColor: ["rgba(34,197,94,0.8)", "rgba(239,68,68,0.8)", "rgba(59,130,246,0.8)"],
          borderRadius: 8,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: "Income vs Expenses vs Balance", font: { family: "Poppins", size: 13 } },
          tooltip: { callbacks: { label: (ctx) => ` ${fmt(ctx.raw)}` } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { callback: (v) => fmt(v) } },
        },
        animation: { duration: 800, easing: "easeOutQuart" },
      },
    });

    // ---- Doughnut chart: expenses by category ---------------
    const categories = Object.keys(summary.expensesByCategory);
    const values     = Object.values(summary.expensesByCategory);
    const pieCtx     = document.getElementById("expenseChart").getContext("2d");

    doughnutChart = new Chart(pieCtx, {
      type: "doughnut",
      data: {
        labels: categories.length ? categories : ["No expenses"],
        datasets: [{
          data: values.length ? values : [1],
          backgroundColor: [
            "rgba(239,68,68,0.75)",   "rgba(59,130,246,0.75)",
            "rgba(234,179,8,0.75)",   "rgba(34,197,94,0.75)",
            "rgba(168,85,247,0.75)",  "rgba(249,115,22,0.75)",
          ],
          borderColor: "transparent",
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom", labels: { padding: 16, font: { family: "Poppins", size: 12 } } },
          title: { display: true, text: "Expenses by Category", font: { family: "Poppins", size: 13 } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${fmt(ctx.raw)}` } },
        },
        animation: { animateScale: true, animateRotate: true },
      },
    });

    // ---- Line chart: 6-month trend (always all-time) --------
    const monthly  = summary.monthly || [];
    const lineCtx  = document.getElementById("monthlyChart").getContext("2d");

    lineChart = new Chart(lineCtx, {
      type: "line",
      data: {
        labels: monthly.map((m) => m.label),
        datasets: [
          {
            label: "Income",
            data: monthly.map((m) => m.income),
            borderColor: "rgba(34,197,94,0.9)",
            backgroundColor: "rgba(34,197,94,0.1)",
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: "Expenses",
            data: monthly.map((m) => m.expenses),
            borderColor: "rgba(239,68,68,0.9)",
            backgroundColor: "rgba(239,68,68,0.1)",
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: "6-Month Income & Expense Trend", font: { family: "Poppins", size: 13 } },
          legend: { position: "bottom", labels: { font: { family: "Poppins", size: 12 } } },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${fmt(ctx.raw)}` } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { callback: (v) => fmt(v) } },
        },
        animation: { duration: 800, easing: "easeOutQuart" },
      },
    });
  }

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

  await loadSummary();
});
