<template>
  <div class="home">
    <div class="card">
      <img src="/logo.png" alt="Easy Quick School" class="logo" />

      <p class="eyebrow">Easy Quick School</p>

      <h1>Aprende inglés en vivo</h1>

      <p class="text">
        Accede a tus clases en línea desde una plataforma privada, simple y profesional.
      </p>

      <router-link to="/login" class="btn">
        Iniciar sesión
      </router-link>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a, #1e3a8a);
  padding: 24px;
  box-sizing: border-box;
}

.card {
  width: 100%;
  max-width: 560px;
  background: white;
  border-radius: 24px;
  padding: 48px 32px;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.22);
  text-align: center;
}

.logo {
  width: 170px;
  max-width: 100%;
  margin-bottom: 20px;
}

.eyebrow {
  font-size: 14px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #666;
  margin: 0 0 10px;
}

h1 {
  font-size: 46px;
  line-height: 1.1;
  margin: 0 0 16px;
  color: #0f172a;
}

.text {
  font-size: 18px;
  color: #555;
  margin: 0 0 30px;
  line-height: 1.5;
}

.btn {
  display: inline-block;
  text-decoration: none;
  background: linear-gradient(90deg, #dc2626, #1e3a8a);
  color: white;
  padding: 15px 26px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  min-width: 220px;
  transition: 0.2s ease;
}

.btn:hover {
  opacity: 0.92;
}

@media (max-width: 640px) {
  .card {
    padding: 36px 22px;
    border-radius: 20px;
  }

  .logo {
    width: 140px;
  }

  h1 {
    font-size: 34px;
  }

  .text {
    font-size: 16px;
  }

  .btn {
    width: 100%;
  }
}
</style>