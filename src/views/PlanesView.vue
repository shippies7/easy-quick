<template>
  <main class="planes-page">
    <section class="hero" id="top">
      <p class="eyebrow">Quick & Easy</p>
      <h1>Elige tu plan de inglés</h1>
      <p class="subtitle">
        Curso de inglés de 9 meses con metodología Cambridge, materiales Interchange incluidos,
        clases en vivo, práctica constante y acceso a plataforma educativa digital.
      </p>

      <a class="scroll-button" href="#planes">Ver planes de pago</a>

      <div class="promo-box">
        <label for="promoCode">¿Tienes un código promocional?</label>
        <div class="promo-row">
          <input
            id="promoCode"
            v-model="promoCode"
            type="text"
            placeholder="Escribe tu código aquí"
          />
          <button @click="applyCode">Aplicar</button>
        </div>
        <p class="promo-note">{{ promoMessage }}</p>
      </div>
    </section>

    <section class="includes-section">
      <div class="section-heading">
        <p class="eyebrow">Qué incluye</p>
        <h2>Un programa estructurado para avanzar con claridad</h2>
        <p>
          El curso trabaja comprensión, expresión oral, vocabulario, pronunciación y estructuras
          del inglés en contextos prácticos y situaciones cotidianas.
        </p>
      </div>

      <div class="includes-grid">
        <div class="include-card" v-for="item in includes" :key="item.title">
          <span>{{ item.icon }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
        </div>
      </div>

      <div class="center-action">
        <a class="secondary-button" href="#planes">Ir a planes de pago</a>
      </div>
    </section>

    <section class="program-section">
      <div class="section-heading">
        <p class="eyebrow">Programa de 9 meses</p>
        <h2>De las bases a la confianza al hablar</h2>
      </div>

      <div class="stages-grid">
        <article class="stage-card">
          <strong>Etapa 1</strong>
          <h3>Construcción de las bases</h3>
          <p>Presentarte, hablar de ti, describir personas, objetos y lugares, y formular preguntas básicas.</p>
        </article>

        <article class="stage-card">
          <strong>Etapa 2</strong>
          <h3>Inglés para el día a día</h3>
          <p>Rutinas, horarios, preferencias, ubicaciones y conversaciones cotidianas más fluidas.</p>
        </article>

        <article class="stage-card">
          <strong>Etapa 3</strong>
          <h3>Desarrollo de ideas</h3>
          <p>Experiencias pasadas, planes futuros, eventos y conversaciones más completas.</p>
        </article>

        <article class="stage-card">
          <strong>Etapa 4</strong>
          <h3>Confianza al hablar</h3>
          <p>Comprensión amplia, pronunciación, entonación, vocabulario y uso del inglés en distintos contextos.</p>
        </article>
      </div>
    </section>

    <section class="schedule-section">
      <div class="section-heading">
        <p class="eyebrow">Horarios disponibles</p>
        <h2>Revisa los horarios antes de inscribirte</h2>
        <p>
          Actualmente las clases disponibles se imparten en los siguientes horarios.
          Tómalos en cuenta antes de realizar tu pago.
        </p>
      </div>

      <div class="schedule-grid">
        <article class="schedule-card">
          <p class="badge">Avanzado</p>
          <h3>Lunes, miércoles y viernes</h3>
          <p class="schedule-time">8:00 pm a 9:00 pm</p>
          <p class="schedule-note">Grupo recomendado para estudiantes con nivel B1 en adelante.</p>
        </article>

        <article class="schedule-card">
          <p class="badge">Nuevo grupo</p>
          <h3>Martes y jueves</h3>
          <p class="schedule-time">8:00 pm a 9:30 pm</p>
          <p class="schedule-note">Grupo próximo a iniciar el 30 de Junio. Ideal para nuevos estudiantes.</p>
        </article>
      </div>
    </section>

    <section class="plans-section" id="planes">
      <div class="section-heading">
        <p class="eyebrow">Planes de pago</p>
        <h2>Elige cómo quieres iniciar</h2>
      </div>

      <div class="plans-grid">
        <article class="plan-card highlighted">
          <p class="badge">Curso completo</p>
          <h2>Acceso por 9 meses</h2>

          <p class="old-price" v-if="currentPlan.hasDiscount">$4,500 MXN</p>
          <p class="price">${{ currentPlan.fullPrice }} MXN</p>

          <p class="description">
            Cubre el programa completo de 9 meses con un solo pago.
          </p>

          <button class="primary-button" @click="goToPayment(currentPlan.fullLink)">
            Pagar curso completo
          </button>

          <button class="outline-button" @click="goToPayment(currentPlan.twoPaymentsLink)">
            Pagar en 2 exhibiciones de ${{ currentPlan.twoPaymentsPrice }} MXN
          </button>
        </article>

        <article class="plan-card">
          <p class="badge">Plan mensual</p>
          <h2>Acceso mensual</h2>

          <p class="old-price" v-if="currentPlan.hasDiscount">$800 MXN / mes</p>
          <p class="price">${{ currentPlan.monthlyPrice }} MXN / mes</p>

          <p class="description">
            Paga mes a mes durante 9 meses y mantén activo tu acceso mientras avanzas.
          </p>

          <button class="primary-button" @click="goToPayment(currentPlan.monthlyLink)">
            Elegir plan mensual
          </button>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'

const promoCode = ref('')
const promoMessage = ref('Puedes dejarlo vacío y pagar el precio normal.')

const plans = {
  DEFAULT: {
    fullPrice: '4,500',
    twoPaymentsPrice: '2,250',
    monthlyPrice: '800',
    hasDiscount: false,
    fullLink: 'https://buy.stripe.com/8x27sEaQ6agrftCgGpcfK09',
    twoPaymentsLink: 'https://buy.stripe.com/eVq8wI0bsbkvchq9dXcfK05',
    monthlyLink: 'https://buy.stripe.com/aFaaEQaQ6coza9ibm5cfK07'
  },
  PROMO1: {
    fullPrice: '2,500',
    twoPaymentsPrice: '1,250',
    monthlyPrice: '500',
    hasDiscount: true,
    fullLink: 'https://buy.stripe.com/00w00c8HYdsD2GQbm5cfK06',
    twoPaymentsLink: 'https://buy.stripe.com/fZu00c8HY3S32GQ9dXcfK04',
    monthlyLink: 'https://buy.stripe.com/00w7sE3nE9cn1CMcq9cfK00'
  },
  PROMO2: {
    fullPrice: '2,200',
    twoPaymentsPrice: '1,100',
    monthlyPrice: '500',
    hasDiscount: true,
    fullLink: 'https://buy.stripe.com/8x2fZa8HY88j0yIfClcfK01',
    twoPaymentsLink: 'https://buy.stripe.com/aFa9AM0bsagrchqai1cfK03',
    monthlyLink: 'https://buy.stripe.com/00w7sE3nE9cn1CMcq9cfK00'
  },
  OPORTUNIDAD: {
    fullPrice: '2,000',
    twoPaymentsPrice: '1,000',
    monthlyPrice: '500',
    hasDiscount: true,
    fullLink: 'https://buy.stripe.com/cNicMYaQ6agr1CM1LvcfK08',
    twoPaymentsLink: 'https://buy.stripe.com/5kQ00c0bsdsD5T2gGpcfK02',
    monthlyLink: 'https://buy.stripe.com/00w7sE3nE9cn1CMcq9cfK00'
  }
}

const currentPlan = ref(plans.DEFAULT)

const includes = [
  {
    icon: '🎥',
    title: 'Clases en vivo',
    text: 'Sesiones en vivo con profesores calificados y acompañamiento durante el proceso.'
  },
  {
    icon: '📚',
    title: 'Material Cambridge',
    text: 'Uso de libros Interchange y materiales reconocidos internacionalmente.'
  },
  {
    icon: '💻',
    title: 'Plataforma educativa digital',
    text: 'Acceso organizado a clases, materiales, comunicados y recursos del programa.'
  },
  {
    icon: '▶️',
    title: 'Clases grabadas',
    text: 'Grabaciones disponibles para quienes no puedan asistir a una clase en vivo.'
  },
  {
    icon: '🗣️',
    title: 'Práctica oral constante',
    text: 'Conversación aplicada, pronunciación y actividades enfocadas en el uso real del idioma.'
  },
  {
    icon: '🌱',
    title: 'Grupos por nivel',
    text: 'Grupos para principiantes y estudiantes avanzados, según el avance del alumno.'
  }
]

function applyCode() {
  const code = promoCode.value.trim().toUpperCase()

  if (!code) {
    currentPlan.value = plans.DEFAULT
    promoMessage.value = 'Puedes dejarlo vacío y pagar el precio normal.'
    return
  }

  if (!plans[code]) {
    currentPlan.value = plans.DEFAULT
    promoMessage.value = 'Código no válido. Revisa que esté escrito correctamente.'
    return
  }

  currentPlan.value = plans[code]
  promoMessage.value = 'Código aplicado correctamente. Los precios disponibles se actualizaron.'
}

function goToPayment(link) {
  window.location.href = link
}
</script>

<style scoped>
.planes-page {
  min-height: 100vh;
  padding: 80px 24px;
  background:
    radial-gradient(circle at top left, rgba(211, 32, 65, 0.12), transparent 35%),
    radial-gradient(circle at top right, rgba(21, 45, 91, 0.16), transparent 35%),
    #ffffff;
  color: #152d5b;
  font-family: Arial, sans-serif;
}

.hero {
  max-width: 900px;
  margin: 0 auto 56px;
  text-align: center;
}

.eyebrow {
  margin-bottom: 12px;
  font-size: 0.9rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #d32041;
  font-weight: 800;
}

h1 {
  margin: 0;
  font-size: clamp(2.3rem, 5vw, 4rem);
  line-height: 1.05;
  color: #152d5b;
}

.subtitle {
  margin: 20px auto 0;
  max-width: 780px;
  font-size: 1.1rem;
  color: #40506b;
  line-height: 1.6;
}

.scroll-button,
.secondary-button {
  display: inline-block;
  margin-top: 26px;
  padding: 14px 24px;
  border-radius: 999px;
  background: #d32041;
  color: white;
  font-weight: 800;
  text-decoration: none;
}

.promo-box {
  margin: 32px auto 0;
  max-width: 580px;
  padding: 24px;
  background: #f7f9ff;
  border: 1px solid rgba(21, 45, 91, 0.12);
  border-radius: 24px;
}

.promo-box label {
  display: block;
  margin-bottom: 12px;
  font-weight: 800;
}

.promo-row {
  display: flex;
  gap: 12px;
}

.promo-row input {
  flex: 1;
  border: 1px solid rgba(21, 45, 91, 0.2);
  border-radius: 999px;
  padding: 14px 18px;
  font-size: 1rem;
}

.promo-row button {
  border: none;
  border-radius: 999px;
  padding: 14px 22px;
  background: #d32041;
  color: white;
  font-weight: 800;
  cursor: pointer;
}

.promo-note {
  margin: 12px 0 0;
  color: #40506b;
  font-size: 0.95rem;
}

.includes-section,
.program-section,
.schedule-section,
.plans-section {
  max-width: 1150px;
  margin: 0 auto 56px;
}

.section-heading {
  max-width: 780px;
  margin: 0 auto 28px;
  text-align: center;
}

.section-heading h2 {
  margin: 0;
  font-size: clamp(1.9rem, 4vw, 2.8rem);
}

.section-heading p {
  color: #40506b;
  line-height: 1.6;
}

.includes-grid,
.stages-grid,
.schedule-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.stages-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.schedule-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.include-card,
.stage-card,
.schedule-card,
.plan-card {
  background: #ffffff;
  border: 1px solid rgba(21, 45, 91, 0.1);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 12px 30px rgba(21, 45, 91, 0.08);
}

.schedule-card {
  padding: 28px;
}

.include-card span {
  font-size: 1.8rem;
}

.include-card h3,
.stage-card h3,
.schedule-card h3 {
  margin: 14px 0 10px;
  color: #152d5b;
}

.include-card p,
.stage-card p {
  margin: 0;
  color: #40506b;
  line-height: 1.55;
}

.schedule-time {
  margin: 0 0 12px;
  font-size: 1.3rem;
  font-weight: 900;
  color: #152d5b;
}

.schedule-note {
  margin: 0;
  color: #40506b;
  line-height: 1.55;
}

.stage-card strong {
  color: #d32041;
}

.center-action {
  text-align: center;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.plan-card {
  padding: 34px;
}

.plan-card.highlighted {
  border: 2px solid #d32041;
}

.badge {
  display: inline-block;
  margin: 0 0 18px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(211, 32, 65, 0.1);
  color: #d32041;
  font-size: 0.85rem;
  font-weight: 800;
}

.plan-card h2 {
  margin: 0 0 14px;
  font-size: 1.7rem;
}

.old-price {
  margin: 0 0 6px;
  color: #7b8794;
  text-decoration: line-through;
  font-weight: 700;
}

.price {
  margin: 0 0 18px;
  font-size: 2rem;
  font-weight: 900;
}

.description {
  margin: 0 0 28px;
  color: #40506b;
  line-height: 1.6;
}

.primary-button,
.outline-button {
  width: 100%;
  border: none;
  border-radius: 999px;
  padding: 15px 24px;
  font-weight: 800;
  cursor: pointer;
  font-size: 1rem;
}

.primary-button {
  background: #152d5b;
  color: white;
}

.primary-button:hover {
  background: #d32041;
}

.outline-button {
  margin-top: 12px;
  background: white;
  color: #152d5b;
  border: 2px solid #152d5b;
}

.outline-button:hover {
  color: #d32041;
  border-color: #d32041;
}

@media (max-width: 980px) {
  .includes-grid,
  .stages-grid,
  .schedule-grid,
  .plans-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 800px) {
  .planes-page {
    padding: 56px 18px;
  }

  .promo-row {
    flex-direction: column;
  }
}
</style>