document.addEventListener("DOMContentLoaded", () => {
  const form           = document.querySelector("form");
  const firstNameInput = form.querySelector('input[name="firstname"]');
  const lastNameInput  = form.querySelector('input[name="lastname"]');
  const emailInput     = form.querySelector('input[name="email"]');
  const passwordInput  = form.querySelector('input[name="password"]');
  const submitBtn      = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name     = `${firstNameInput.value.trim()} ${lastNameInput.value.trim()}`.trim();
    const email    = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!name || !email || !password) {
      return showToast("Please fill in all fields.", "error");
    }

    submitBtn.disabled = true;

    try {
      const res  = await fetch("/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Signup failed.");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showToast("Account created! Redirecting...", "success");
      setTimeout(() => { window.location.href = "/api/users/signin"; }, 1400);
    } catch (error) {
      console.error(error);
      showToast(error.message, "error");
    } finally {
      submitBtn.disabled = false;
    }
  });
});
