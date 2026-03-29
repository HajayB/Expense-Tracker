// Handles dark mode toggle and hamburger sidebar — included on every app page

document.addEventListener('DOMContentLoaded', () => {

  // ---- Dark mode toggle ----------------------------------------
  const darkToggle = document.getElementById('darkToggle');
  if (darkToggle) {
    darkToggle.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';

    darkToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      darkToggle.textContent = isDark ? '☀️' : '🌙';
    });
  }

  // ---- Hamburger sidebar (mobile) ------------------------------
  const hamburger   = document.getElementById('hamburger');
  const sidebar     = document.getElementById('sidebar');
  const overlay     = document.getElementById('overlay');
  const closeBtn    = document.getElementById('closeSidebar');

  function openSidebar() {
    sidebar?.classList.remove('-translate-x-full');
    sidebar?.classList.add('translate-x-0');
    overlay?.classList.remove('hidden');
  }

  function closeSidebar() {
    sidebar?.classList.add('-translate-x-full');
    sidebar?.classList.remove('translate-x-0');
    overlay?.classList.add('hidden');
  }

  hamburger?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);
});
