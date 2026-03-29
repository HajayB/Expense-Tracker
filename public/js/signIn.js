document.addEventListener("DOMContentLoaded", () => {
  const form        = document.querySelector("form");
  const emailInput  = form.querySelector('input[name="email"]');
  const passInput   = form.querySelector('input[name="password"]');
  const rememberMe  = form.querySelector('input[name="rememberMe"]');
  const submitBtn   = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email    = emailInput.value.trim();
    const password = passInput.value.trim();

    if (!email || !password) {
      return showToast("Please fill in all fields.", "error");
    }

    submitBtn.disabled = true;

    try {
      const res  = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Sign in failed.");

      const storage = rememberMe.checked ? localStorage : sessionStorage;
      storage.setItem("token", data.token);
      storage.setItem("user", JSON.stringify(data.user));

      showToast("Login successful! Redirecting...", "success");
      setTimeout(() => { window.location.href = "/api/users/dashboard"; }, 1200);
    } catch (error) {
      console.error("Login error:", error);
      showToast(error.message, "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
});
