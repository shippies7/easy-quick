<template>
  <div class="home">
    <div class="card">
      <p class="eyebrow">Easy Quick School</p>
      <h1>Aprende inglés en vivo</h1>
      <p class="text">
        Entra a tu plataforma para acceder a tus clases en línea.
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
  background: #f7f7f7;
  padding: 24px;
}

.card {
  width: 100%;
  max-width: 560px;
  background: white;
  border-radius: 20px;
  padding: 40px 28px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.eyebrow {
  font-size: 14px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 10px;
}

h1 {
  font-size: 40px;
  margin: 0 0 14px;
  color: #111;
}

.text {
  font-size: 18px;
  color: #444;
  margin: 0 0 28px;
}

.btn {
  display: inline-block;
  text-decoration: none;
  background: black;
  color: white;
  padding: 14px 22px;
  border-radius: 12px;
  font-weight: 600;
}
</style>