<template>
  <div class="home">
    <header class="navbar">
      <div class="nav-left">
        <img src="/logo.png" alt="Quick & Easy" class="nav-logo" />
      </div>

      <div class="nav-right">
        <a
          href="https://wa.me/5210000000000"
          target="_blank"
          rel="noopener noreferrer"
          class="nav-link"
        >
          Informes
        </a>

        <router-link to="/login" class="nav-btn">
          Iniciar sesión
        </router-link>
      </div>
    </header>

    <main>
      <section class="hero">
        <div class="hero-text">
          <p class="eyebrow">🏆 Escuela Líder en Inglés Online</p>

          <h1>Domina el inglés <br>en 9 meses con clases profesionales en vivo</h1>

          <p class="hero-description">
            Transforma tu futuro con nuestro programa intensivo de inglés. Clases en vivo con profesores certificados, materiales premium incluidos y garantía de resultados. 
            <br>¡No esperes más para hablar inglés con confianza!
          </p>

          <div class="pricing-highlight">
            <div class="price-tag">
              <span class="original-price">$4,200</span>
              <span class="current-price">$2,500</span>
              <span class="price-note">Precio especial por tiempo limitado</span>
            </div>
          </div>

          <div class="hero-actions">
            <a
              href="https://wa.me/5210000000000"
              target="_blank"
              rel="noopener noreferrer"
              class="primary-btn"
            >
              🚀 Reservar mi lugar ahora
            </a>
        
          </div>

          <div class="hero-points">
            <span>✅ 9 meses de transformación</span>
            <span>👨‍🏫 Profesores certificados</span>
            <span>📚 Materiales incluidos</span>
            <span>🎯 Garantía de fluidez</span>
          </div>
        </div>

        <div class="hero-visual">
          <img src="/hero-class.jpg" alt="Clase en línea de inglés" class="hero-image" />
        </div>
      </section>

      <section class="stats-section">
        <div class="stat-card">
          <div class="stat-icon">🎓</div>
          <strong>500+ Estudiantes</strong>
          <span>Han logrado fluidez completa</span>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <strong>98% Satisfacción</strong>
          <span>Calificación promedio de nuestros alumnos</span>
        </div>

        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <strong>Certificación</strong>
          <span>Diploma al completar el curso</span>
        </div>
      </section>

      <section class="section">
        <div class="section-header center">
          <p class="section-kicker">¿Por qué elegirnos?</p>
          <h2>Resultados Comprobados en 9 Meses</h2>
          <p>
            Nuestro método probado transforma estudiantes principiantes en hablantes fluidos. Cada módulo está diseñado para maximizar tu progreso y garantizar que domines el inglés de manera efectiva.
          </p>
        </div>

        <div class="cards-grid">
          <article class="info-card">
            <div class="card-icon">🚀 ETAPA 1</div>
            <h3>Inicio Acelerado</h3>
            <p>
              En las primeras semanas dominarás lo esencial: presentaciones, conversaciones básicas y la estructura fundamental. ¡Verás progreso inmediato!
            </p>
          </article>

          <article class="info-card">
            <div class="card-icon">💼 ETAPA 2</div>
            <h3>Inglés Práctico</h3>
            <p>
              Aprende el inglés que realmente necesitas: trabajo, viajes, compras y situaciones diarias. Comunicación efectiva desde el primer día.
            </p>
          </article>

          <article class="info-card">
            <div class="card-icon">🎯 ETAPA 3</div>
            <h3>Fluidez Avanzada</h3>
            <p>
              Desarrolla habilidades complejas: debates, presentaciones y expresiones naturales. Comunícate como un nativo con confianza total.
            </p>
          </article>

          <article class="info-card">
            <div class="card-icon">💪 ETAPA 4</div>
            <h3>Confianza Total</h3>
            <p>
              Perfecciona tu pronunciación, comprensión y soltura. Habla inglés sin miedo ni barreras. ¡Tu transformación está garantizada!
            </p>
          </article>
        </div>
      </section>

      <section class="section split-section">
        <div class="split-image-wrap">
          <img src="/materials.jpg" alt="Materiales del curso de inglés" class="split-image" />
        </div>

        <div class="split-text">
          <p class="section-kicker dark">Metodología Premium</p>
          <h2>Aprendizaje Científico + Tecnología Avanzada</h2>
          <p>
            Combinamos metodología probada con herramientas digitales de vanguardia. Nuestros profesores certificados utilizan técnicas de enseñanza inmersiva que han demostrado resultados superiores en miles de estudiantes.
          </p>
          <p>
            Cada sesión incluye práctica real, corrección inmediata y seguimiento personalizado. No es solo un curso, es una transformación completa respaldada por años de experiencia educativa.
          </p>
          <div class="guarantee-badge">
            <span>🔒 Garantía de Satisfacción</span>
          </div>
        </div>
      </section>

      <section class="section final-cta">
        <div class="cta-card">
          <p class="section-kicker dark">¡Oferta Limitada!</p>
          <h2>Invierte en tu futuro: $2,500 por el curso completo</h2>
          <p>
            Costo real es de $4,200, nuestra promoción especial pagas solo $2,500. Incluye todo: clases en vivo, materiales premium, diploma al completar el curso y soporte personalizado. ¡No pierdas esta oportunidad!
          </p>
          <div class="urgency-note">
            ⏰ Solo quedan pocos cupos disponibles para el próximo grupo
          </div>

          <a
            href="https://wa.me/5210000000000"
            target="_blank"
            rel="noopener noreferrer"
            class="primary-btn"
          >
            📞 Llamar ahora y obtener descuento extra
          </a>
          <p class="small-print">
            *Descuento adicional disponible al contactar hoy. Consulta términos y condiciones.
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(220, 38, 38, 0.12), transparent 24%),
    linear-gradient(135deg, #091225, #1e3a8a);
  color: white;
}

.navbar {
  width: 100%;
  padding: 18px 32px;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-left,
.nav-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.nav-logo {
  width: 110px;
  max-width: 100%;
  display: block;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  opacity: 0.92;
}

.nav-link:hover {
  opacity: 1;
}

.nav-btn {
  text-decoration: none;
  background: white;
  color: #0f172a;
  padding: 12px 18px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 15px;
  transition: 0.2s ease;
}

.nav-btn:hover {
  opacity: 0.92;
}

.hero {
  max-width: 1180px;
  margin: 0 auto;
  padding: 34px 24px 50px;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 28px;
  align-items: center;
}

.eyebrow,
.section-kicker {
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 13px;
  font-weight: 700;
  color: #dbe3ff;
}

.section-kicker.dark {
  color: #1e3a8a;
}

.hero-text h1 {
  font-size: 58px;
  line-height: 1.02;
  margin: 0 0 18px;
}

.hero-description {
  font-size: 20px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.88);
  margin: 0 0 26px;
  max-width: 680px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 22px;
}

.primary-btn {
  display: inline-block;
  text-decoration: none;
  border-radius: 12px;
  padding: 15px 24px;
  font-weight: 700;
  font-size: 16px;
  transition: 0.2s ease;
  background: linear-gradient(90deg, #dc2626, #1e3a8a);
  color: white;
}

.primary-btn:hover {
  opacity: 0.92;
}

.hero-points {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-points span {
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.pricing-highlight {
  margin: 24px 0;
}

.price-tag {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1f2937;
  padding: 16px 24px;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
  margin-bottom: 16px;
}

.original-price {
  text-decoration: line-through;
  font-size: 18px;
  color: #6b7280;
  margin-bottom: 4px;
}

.current-price {
  font-size: 32px;
  font-weight: 900;
  color: #1f2937;
  margin-bottom: 4px;
}

.price-note {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cta-note {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8px;
  text-align: center;
}

.hero-visual {
  display: flex;
  justify-content: center;
}

.hero-image {
  width: 100%;
  max-width: 520px;
  height: 580px;
  object-fit: cover;
  border-radius: 28px;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.stats-section {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.stat-card strong {
  display: block;
  margin-bottom: 6px;
  font-size: 18px;
}

.stat-card span {
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
}

.section {
  max-width: 1180px;
  margin: 0 auto;
  padding: 30px 24px 34px;
}

.section-header {
  max-width: 820px;
  margin-bottom: 24px;
}

.section-header.center {
  text-align: center;
  margin-left: auto;
  margin-right: auto;
}

.section-header h2 {
  margin: 0 0 12px;
  font-size: 40px;
  line-height: 1.08;
}

.section-header p {
  margin: 0;
  color: rgba(255, 255, 255, 0.88);
  font-size: 17px;
  line-height: 1.7;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.info-card,
.cta-card {
  background: white;
  color: #0f172a;
  border-radius: 22px;
  padding: 28px 24px;
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.16);
}

.info-card h3,
.cta-card h2 {
  margin: 0 0 12px;
}

.card-icon {
  font-size: 28px;
  margin-bottom: 16px;
}

.info-card p,
.cta-card p,
.split-text p {
  margin: 0;
  color: #555;
  line-height: 1.7;
  font-size: 16px;
}

.split-section {
  display: grid;
  grid-template-columns: 0.95fr 1.05fr;
  gap: 26px;
  align-items: center;
}

.split-image {
  width: 100%;
  height: 430px;
  object-fit: cover;
  border-radius: 28px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.2);
}

.split-text {
  background: white;
  color: #0f172a;
  border-radius: 24px;
  padding: 34px 28px;
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.16);
}

.split-text h2 {
  margin: 0 0 12px;
  font-size: 38px;
  line-height: 1.08;
  color: #0f172a;
}

.split-text p + p {
  margin-top: 14px;
}

.guarantee-badge {
  margin-top: 20px;
  display: inline-block;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 12px 20px;
  border-radius: 25px;
  font-weight: 700;
  font-size: 14px;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.final-cta {
  padding-bottom: 60px;
}

.cta-card {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
  padding: 42px 28px;
}

.cta-card p {
  margin-bottom: 18px;
}

.urgency-note {
  background: #fef3c7;
  color: #92400e;
  padding: 12px 16px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  margin: 20px 0;
  border: 1px solid #f59e0b;
}

.small-print {
  font-size: 12px;
  color: #6b7280;
  margin-top: 16px;
  font-style: italic;
}

@media (max-width: 1024px) {
  .hero,
  .split-section {
    grid-template-columns: 1fr;
  }

  .hero-text h1 {
    font-size: 46px;
  }

  .stats-section,
  .cards-grid {
    grid-template-columns: 1fr;
  }

  .hero-image {
    height: 460px;
  }
}

@media (max-width: 640px) {
  .navbar {
    padding: 16px 18px;
  }

  .nav-logo {
    width: 90px;
  }

  .nav-right {
    gap: 10px;
  }

  .nav-link {
    display: none;
  }

  .nav-btn {
    padding: 10px 14px;
    font-size: 14px;
  }

  .hero {
    padding: 20px 16px 34px;
  }

  .hero-text h1 {
    font-size: 34px;
  }

  .hero-description {
    font-size: 17px;
  }

  .hero-image {
    height: 360px;
    border-radius: 22px;
  }

  .section,
  .stats-section {
    padding-left: 16px;
    padding-right: 16px;
  }

  .section-header h2,
  .split-text h2 {
    font-size: 30px;
  }

  .primary-btn {
    width: 100%;
    text-align: center;
    box-sizing: border-box;
  }

  .split-text,
  .cta-card,
  .info-card {
    padding: 24px 20px;
  }
}
</style>