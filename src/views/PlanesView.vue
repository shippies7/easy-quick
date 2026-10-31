<template>
  <div class="school-page">
    <header class="navbar">
      <router-link to="/" class="brand"><img src="/logo.png" alt="Easy & Quick School" /><span>Easy & Quick School</span></router-link>
      <nav class="nav-links">
        <router-link to="/">Inicio</router-link>
        <a href="#horarios">Horarios</a>
        <a href="#planes">Precios</a>
        <router-link to="/login" class="login-link">Iniciar sesión</router-link>
      </nav>
    </header>

    <main>
      <section class="hero">
        <div class="container">
          <p class="eyebrow">INSCRIPCIONES ABIERTAS · NOVIEMBRE 2026</p>
          <h1>Aprende inglés en 9 meses.<br /><span>Practica también fuera de clase.</span></h1>
          <p class="hero-copy">Clases en vivo con profesor, actividades para reforzar cada tema, grabaciones y materiales en una plataforma digital.</p>
          <div class="hero-points"><span>✓ Clases en vivo</span><span>✓ Actividades de refuerzo</span><span>✓ Clases grabadas</span></div>
          <a class="main-cta" href="#planes">Ver precios e inscribirme</a>
          <p class="hero-dates">Grupos que comienzan el 16 y el 21 de noviembre</p>
        </div>
      </section>

      <section id="horarios" class="section schedules">
        <div class="container">
          <div class="section-heading"><p class="eyebrow">ELIGE TU GRUPO</p><h2>Próximos horarios</h2><p>Dos opciones para tomar el mismo curso completo de inglés.</p></div>
          <div class="schedule-grid">
            <article class="schedule-card"><span class="pill">Entre semana</span><h3>Lunes, miércoles y viernes</h3><p class="schedule-time">8:00 a 9:00 p. m.</p><p class="start-date">Inicia el 16 de noviembre de 2026</p></article>
            <article class="schedule-card"><span class="pill">Sabatino</span><h3>Sábados</h3><p class="schedule-time">9:00 a. m. a 12:00 p. m.</p><p class="start-date">Inicia el 21 de noviembre de 2026</p></article>
          </div>
          <p class="small-note">Horarios de la zona centro de México. Elegirás tu grupo durante el registro después del pago.</p>
        </div>
      </section>

      <section id="planes" class="section pricing">
        <div class="container">
          <div class="section-heading"><p class="eyebrow">INSCRÍBETE</p><h2>Elige tu plan de pago</h2><p>Selecciona tu promoción, moneda y forma de pago.</p></div>
          <div class="promo-box">
            <label for="promoCode">¿Tienes un código promocional?</label>
            <div class="promo-row"><input id="promoCode" v-model="promoCode" type="text" autocomplete="off" placeholder="Escribe tu código" @keyup.enter="applyCode" /><button type="button" @click="applyCode">Aplicar</button></div>
            <p :class="['promo-message', { error: promoError }]" role="status">{{ promoMessage }}</p>
          </div>
          <div class="currency-row"><span>ELIGE TU MONEDA · Ver precios en:</span><div class="currency-options"><button type="button" :class="{ selected: currency === 'MXN' }" :aria-pressed="currency === 'MXN'" @click="currency = 'MXN'">MXN</button><button type="button" :class="{ selected: currency === 'USD' }" :aria-pressed="currency === 'USD'" @click="currency = 'USD'">USD</button></div></div>

          <div v-if="currency === 'MXN'" class="price-grid">
            <article class="price-card primary-card"><span class="pill">Curso completo</span><h3>Pago único</h3><p v-if="currentPlan.hasDiscount" class="strikethrough">$4,500 MXN</p><p class="big-price">${{ currentPlan.fullPrice }} <small>MXN</small></p><p class="price-desc">Liquida tu curso de 9 meses en un solo pago.</p><button type="button" class="pay-button" @click="goToPayment(currentPlan.fullLink)">Inscribirme con pago único</button><div class="alternatives"><p>O elige pagar en parcialidades:</p><button type="button" class="outline-button" @click="goToPayment(currentPlan.twoPaymentsLink)">2 pagos de ${{ currentPlan.twoPaymentsPrice }} MXN</button><button v-if="currentPlan.threePaymentsLink" type="button" class="outline-button" @click="goToPayment(currentPlan.threePaymentsLink)">3 pagos de ${{ currentPlan.threePaymentsPrice }} MXN</button></div></article>
            <article class="price-card"><span class="pill">Plan mensual</span><h3>Paga mes a mes</h3><p v-if="currentPlan.hasDiscount" class="strikethrough">$800 MXN / mes</p><p class="big-price">${{ currentPlan.monthlyPrice }} <small>MXN / mes</small></p><p class="price-desc">Inscríbete con un esquema de pago mensual independiente, con cobros automáticos.</p><button type="button" class="pay-button" @click="goToPayment(currentPlan.monthlyLink)">Elegir plan mensual</button></article>
          </div>

          <div v-else class="price-grid">
            <article class="price-card primary-card">
              <span class="pill">Curso completo · USD</span>
              <h3>Pago único</h3>
              <p v-if="usdAvailable" class="strikethrough">$225 USD</p>
              <p class="big-price">${{ usdAvailable ? '125' : '225' }} <small>USD</small></p>
              <p class="price-desc">Liquida tu curso de 9 meses en un solo pago.</p>
              <button type="button" class="pay-button" @click="goToUsdPayment(usdPlans.fullLink)">Inscribirme con pago único</button>
              <div class="alternatives">
                <p>O elige pagar en parcialidades:</p>
                <button type="button" class="outline-button" @click="goToUsdPayment(usdPlans.twoPaymentsLink)">2 pagos de ${{ usdAvailable ? '63' : '113' }} USD</button>
                <button v-if="usdAvailable" type="button" class="outline-button" @click="goToPayment(usdPlans.threePaymentsLink)">3 pagos de $42 USD</button>
              </div>
            </article>
            <article class="price-card">
              <span class="pill">Plan mensual · USD</span>
              <h3>Paga mes a mes</h3>
              <p v-if="usdAvailable" class="strikethrough">$40 USD / mes</p>
              <p class="big-price">${{ usdAvailable ? '18' : '40' }} <small>USD / mes</small></p>
              <p class="price-desc">Inscríbete con un esquema de pago mensual independiente, con cobros automáticos.</p>
              <button type="button" class="pay-button" @click="goToUsdPayment(usdPlans.monthlyLink)">Elegir plan mensual</button>
            </article>
          </div>
          <p class="small-note">Los pagos se procesan en Stripe. Antes de confirmar, revisa el importe, la frecuencia y las condiciones del plan elegido.</p>
        </div>
      </section>

      <section class="section value-section">
        <div class="container">
          <div class="section-heading"><p class="eyebrow">TODO LO QUE ACOMPAÑA TU APRENDIZAJE</p><h2>Tu inglés no termina cuando acaba la clase</h2><p>Aprende con tu profesor y sigue practicando durante la semana para reforzar lo que estudiaste.</p></div>
          <div class="benefit-grid">
            <article v-for="item in benefits" :key="item.title" class="benefit-card"><span class="benefit-icon">{{ item.icon }}</span><h3>{{ item.title }}</h3><p>{{ item.description }}</p></article>
          </div>
        </div>
      </section>

      <section class="section method-section"><div class="container"><div class="method-panel"><div><p class="eyebrow">ASÍ FUNCIONA</p><h2>Aprende, practica, repasa y avanza</h2><p>Una ruta de aprendizaje que combina clases guiadas, ejercicios de refuerzo, materiales de consulta y evaluaciones de progreso.</p></div><div class="method-steps"><p><strong>01 · Aprende:</strong> asiste a tu clase en vivo.</p><p><strong>02 · Practica:</strong> realiza actividades de refuerzo.</p><p><strong>03 · Repasa:</strong> consulta grabaciones y materiales.</p><p><strong>04 · Avanza:</strong> identifica los temas que necesitas reforzar.</p></div></div></div></section>

      <section class="section faq-section"><div class="container"><div class="section-heading"><p class="eyebrow">PREGUNTAS FRECUENTES</p><h2>Lo que necesitas saber</h2></div><div class="faq-list"><details><summary>¿Cuánto dura el curso?</summary><p>El programa completo tiene una duración de 9 meses.</p></details><details><summary>¿Las clases son en vivo?</summary><p>Sí. Tendrás clases en vivo con profesor en el horario del grupo que selecciones.</p></details><details><summary>¿Qué hago si no puedo asistir a una clase?</summary><p>Podrás consultar la grabación para repasar la explicación correspondiente.</p></details><details><summary>¿Qué actividades incluye?</summary><p>Actividades para reforzar vocabulario, gramática, comprensión auditiva y expresión oral, además de materiales y evaluaciones de progreso.</p></details><details><summary>¿Cuándo elijo mi grupo?</summary><p>Después de pagar, durante el registro. Los grupos disponibles son lunes, miércoles y viernes, o sábados.</p></details><details><summary>¿Puedo pagar en parcialidades?</summary><p>Sí. Hay opciones de pago único, pagos diferidos y plan mensual. Las opciones dependen de la promoción aplicada.</p></details></div></div></section>
      <footer class="footer"><p>Easy & Quick School · Aprende inglés a tu ritmo de vida.</p></footer>
    </main>
  </div>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'

const promoCode = ref('')
const appliedCode = ref('')
const promoError = ref(false)
const promoMessage = ref('Ingresa tu código si tienes una promoción especial.')
const currency = ref('MXN')

const plans = {
  DEFAULT: { fullPrice: '4,500', twoPaymentsPrice: '2,250', monthlyPrice: '800', hasDiscount: false, fullLink: 'https://buy.stripe.com/8x27sEaQ6agrftCgGpcfK09', twoPaymentsLink: 'https://buy.stripe.com/eVq8wI0bsbkvchq9dXcfK05', monthlyLink: 'https://buy.stripe.com/aFaaEQaQ6coza9ibm5cfK07' },
  PROMO1: { fullPrice: '2,500', twoPaymentsPrice: '1,250', threePaymentsPrice: '834', monthlyPrice: '350', hasDiscount: true, fullLink: 'https://buy.stripe.com/00w00c8HYdsD2GQbm5cfK06', twoPaymentsLink: 'https://buy.stripe.com/fZu00c8HY3S32GQ9dXcfK04', threePaymentsLink: 'https://buy.stripe.com/9B68wI1fw0FRdlu1LvcfK0e', monthlyLink: 'https://buy.stripe.com/3cIbIU8HY3S3bdm2PzcfK0b' },
  PROMO2: { fullPrice: '2,200', twoPaymentsPrice: '1,100', monthlyPrice: '500', hasDiscount: true, fullLink: 'https://buy.stripe.com/8x2fZa8HY88j0yIfClcfK01', twoPaymentsLink: 'https://buy.stripe.com/aFa9AM0bsagrchqai1cfK03', monthlyLink: 'https://buy.stripe.com/00w7sE3nE9cn1CMcq9cfK00' },
  HELSY: { fullPrice: '2,500', twoPaymentsPrice: '1,250', threePaymentsPrice: '834', monthlyPrice: '350', hasDiscount: true, fullLink: 'https://buy.stripe.com/00w00c8HYdsD2GQbm5cfK06', twoPaymentsLink: 'https://buy.stripe.com/fZu00c8HY3S32GQ9dXcfK04', threePaymentsLink: 'https://buy.stripe.com/9B68wI1fw0FRdlu1LvcfK0e', monthlyLink: 'https://buy.stripe.com/3cIbIU8HY3S3bdm2PzcfK0b' },
  OPORTUNIDAD: { fullPrice: '2,000', twoPaymentsPrice: '1,000', monthlyPrice: '500', hasDiscount: true, fullLink: 'https://buy.stripe.com/cNicMYaQ6agr1CM1LvcfK08', twoPaymentsLink: 'https://buy.stripe.com/5kQ00c0bsdsD5T2gGpcfK02', monthlyLink: 'https://buy.stripe.com/00w7sE3nE9cn1CMcq9cfK00' }
}

const usdPlans = {
  fullLink: 'https://buy.stripe.com/28EcMY7DU1JV81a0HrcfK0c',
  twoPaymentsLink: 'https://buy.stripe.com/00w6oA9M274fchqbm5cfK0g',
  threePaymentsLink: 'https://buy.stripe.com/eVqaEQcYe88jbdm89TcfK0f',
  monthlyLink: 'https://buy.stripe.com/aFa7sE9M20FRa9ibm5cfK0d'
}

const benefits = [
  { icon: '🎥', title: 'Clases en vivo', description: 'Aprende con profesor, practica conversaciones y resuelve tus dudas.' },
  { icon: '🧩', title: 'Actividades de refuerzo', description: 'Practica después de clase para consolidar cada tema aprendido.' },
  { icon: '🎧', title: 'Listening y speaking', description: 'Trabaja comprensión auditiva, pronunciación y expresión oral.' },
  { icon: '📚', title: 'Vocabulario y gramática', description: 'Ejercicios prácticos para comprender y utilizar el idioma.' },
  { icon: '▶️', title: 'Clases grabadas', description: 'Vuelve a las explicaciones cuando necesites repasar.' },
  { icon: '💻', title: 'Plataforma digital', description: 'Accede a materiales, actividades y seguimiento de tu progreso.' }
]

const currentPlan = computed(() => plans[appliedCode.value] || plans.DEFAULT)
const usdAvailable = computed(() => ['PROMO1', 'HELSY'].includes(appliedCode.value))

function applyCode() {
  const code = promoCode.value.trim().toUpperCase()
  if (!code) {
    appliedCode.value = ''
    promoError.value = false
    promoMessage.value = 'Se muestran los precios regulares.'
    return
  }
  if (!Object.prototype.hasOwnProperty.call(plans, code)) {
    appliedCode.value = ''
    promoError.value = true
    promoMessage.value = 'Código no válido. Verifica que esté escrito correctamente.'
    return
  }
  appliedCode.value = code
  promoError.value = false
  promoMessage.value = 'Código aplicado. Ya puedes elegir tu plan con el precio promocional.'
}

async function focusPromo() {
  currency.value = 'MXN'
  await nextTick()
  const input = document.getElementById('promoCode')
  if (input) {
    input.scrollIntoView({ behavior: 'smooth', block: 'center' })
    input.focus()
  }
}

function goToPayment(link) {
  if (link) window.location.assign(link)
}

function goToUsdPayment(link) {
  if (!usdAvailable.value) return
  goToPayment(link)
}
</script>

<style scoped>
* { box-sizing: border-box; }
.school-page { font-family: Arial, Helvetica, sans-serif; color: #152d5b; background: #fff; }
.container { width: min(100%, 1100px); margin: 0 auto; }
.navbar { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 12px 5%; border-bottom: 1px solid #e8edf4; }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 900; color: #152d5b; text-decoration: none; }
.brand img { width: 55px; height: auto; }
.nav-links { display: flex; align-items: center; gap: 22px; flex-wrap: wrap; }
.nav-links a { color: #152d5b; font-size: 14px; font-weight: 700; text-decoration: none; }
.nav-links a:hover { color: #d32041; }
.nav-links .login-link { color: white; background: #152d5b; border-radius: 999px; padding: 11px 17px; }
.hero { padding: 66px 24px 55px; text-align: center; background: radial-gradient(circle at 10% 10%, #ffeef2, transparent 45%), linear-gradient(130deg, #fff 20%, #f0f5ff 100%); }
.eyebrow { margin: 0 0 12px; color: #d32041; font-size: 12px; font-weight: 900; letter-spacing: .12em; }
h1 { max-width: 850px; margin: 0 auto; font-size: clamp(34px, 5vw, 58px); line-height: 1.12; letter-spacing: -.035em; }
h1 span { color: #d32041; }
.hero-copy { max-width: 690px; margin: 20px auto; color: #50627d; font-size: 17px; line-height: 1.7; }
.hero-points { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin: 22px 0 27px; }
.hero-points span { padding: 9px 13px; background: white; border: 1px solid #e5eaf2; border-radius: 999px; font-size: 13px; font-weight: 800; }
.main-cta { display: inline-block; padding: 16px 28px; color: #fff; background: #d32041; border-radius: 999px; font-weight: 900; text-decoration: none; }
.main-cta:hover { background: #b91b39; }
.hero-dates { margin: 17px 0 0; font-size: 13px; color: #586980; font-weight: 700; }
.section { padding: 54px 24px; scroll-margin-top: 15px; }
.section-heading { max-width: 750px; margin: 0 auto 26px; text-align: center; }
.section-heading h2 { margin: 0 0 12px; font-size: clamp(27px, 4vw, 38px); line-height: 1.2; }
.section-heading > p:not(.eyebrow) { margin: 0; color: #5b6980; font-size: 15px; line-height: 1.65; }
.schedules { padding-bottom: 35px; }
.schedule-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; max-width: 900px; margin: auto; }
.schedule-card { padding: 25px 28px; border: 1px solid #e3e9f1; border-radius: 20px; box-shadow: 0 8px 24px #152d5b0a; }
.pill { display: inline-block; padding: 8px 13px; border-radius: 999px; background: #fce8ed; color: #bd1e3d; font-size: 12px; font-weight: 900; }
.schedule-card h3 { margin: 16px 0 8px; font-size: 19px; }
.schedule-time { margin: 0 0 12px; font-size: 21px; font-weight: 900; }
.start-date { margin: 0; color: #d32041; font-size: 14px; font-weight: 800; }
.small-note { max-width: 800px; margin: 20px auto 0; color: #66748a; font-size: 12px; line-height: 1.6; text-align: center; }
.pricing { background: #f7f9fd; }
.promo-box { max-width: 570px; margin: 0 auto 22px; padding: 22px; border: 1px solid #e1e7f0; border-radius: 20px; background: #fff; text-align: center; }
.promo-box label { display: block; margin-bottom: 12px; font-weight: 900; }
.promo-row { display: flex; gap: 10px; }
.promo-row input { flex: 1; min-width: 0; padding: 13px 16px; border: 1px solid #cdd7e4; border-radius: 999px; font-size: 15px; }
.promo-row button, .usd-message button { padding: 12px 22px; border: none; border-radius: 999px; background: #d32041; color: #fff; font-weight: 900; cursor: pointer; }
.promo-message { margin: 12px 0 0; color: #586980; font-size: 12px; }
.promo-message.error { color: #bd1e3d; }
.currency-row { display: flex; justify-content: center; align-items: center; gap: 16px; margin: 0 auto 30px; padding: 15px 20px; max-width: 580px; border: 2px solid #152d5b; border-radius: 18px; background: #eaf0fb; font-size: 15px; font-weight: 900; }
.currency-options { display: flex; gap: 6px; padding: 4px; background: #e8edf5; border-radius: 999px; }
.currency-options button { padding: 14px 29px; border: none; border-radius: 999px; background: transparent; color: #152d5b; font-weight: 900; cursor: pointer; }
.currency-options button.selected { background: #152d5b; color: #fff; }
.price-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; max-width: 900px; margin: auto; }
.price-card { display: flex; flex-direction: column; padding: 30px; background: #fff; border: 1px solid #e2e8f0; border-radius: 23px; box-shadow: 0 10px 30px #152d5b0b; }
.price-card.primary-card { border: 2px solid #d32041; }
.price-card .pill { align-self: flex-start; }
.price-card h3 { margin: 18px 0 12px; font-size: 23px; }
.strikethrough { margin: 0 0 5px; color: #8791a1; text-decoration: line-through; font-weight: 700; }
.big-price { margin: 0 0 15px; font-size: clamp(30px, 4vw, 40px); font-weight: 900; }
.big-price small { font-size: 16px; }
.price-desc { margin: 0 0 23px; color: #5a6a82; font-size: 14px; line-height: 1.65; }
.pay-button, .outline-button { width: 100%; padding: 14px; border-radius: 999px; font-size: 14px; font-weight: 900; cursor: pointer; }
.pay-button { margin-top: auto; background: #152d5b; color: #fff; border: none; }
.pay-button:hover { background: #d32041; }
.alternatives { margin-top: 20px; }
.alternatives > p { margin: 0 0 10px; color: #647187; font-size: 13px; text-align: center; font-weight: 700; }
.outline-button { margin-top: 9px; border: 2px solid #152d5b; color: #152d5b; background: #fff; }
.outline-button:hover { border-color: #d32041; color: #d32041; }
.usd-message { max-width: 640px; margin: auto; padding: 30px; background: #fff; border: 1px solid #e1e7f0; border-radius: 20px; text-align: center; }
.usd-message h3 { margin: 0 0 10px; }
.usd-message p { color: #5a6a82; line-height: 1.6; }
.value-section { padding-top: 70px; }
.benefit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.benefit-card { padding: 25px; border: 1px solid #e6ebf3; border-radius: 20px; }
.benefit-icon { display: block; margin-bottom: 14px; font-size: 26px; }
.benefit-card h3 { margin: 0 0 10px; font-size: 17px; }
.benefit-card p { margin: 0; color: #5a6a82; font-size: 14px; line-height: 1.7; }
.method-panel { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 30px; padding: 38px; border-radius: 24px; background: #152d5b; color: #fff; }
.method-panel .eyebrow { color: #ffb8c5; }
.method-panel h2 { margin: 0 0 15px; font-size: 31px; }
.method-panel p { color: #dce5f1; line-height: 1.7; }
.method-steps p { margin: 9px 0; padding: 12px 15px; border-radius: 12px; background: #ffffff13; font-size: 14px; }
.faq-section { padding-top: 40px; }
.faq-list { max-width: 850px; margin: auto; display: grid; gap: 10px; }
.faq-list details { padding: 18px 22px; border: 1px solid #e5eaf2; border-radius: 14px; }
.faq-list summary { cursor: pointer; font-size: 15px; font-weight: 900; }
.faq-list details p { margin: 12px 0 0; color: #5a6a82; font-size: 14px; line-height: 1.7; }
.footer { padding: 28px 20px; background: #152d5b; color: #dce5f1; text-align: center; font-size: 13px; }
@media (max-width: 800px) { .benefit-grid { grid-template-columns: repeat(2, 1fr); } .method-panel { grid-template-columns: 1fr; } }
@media (max-width: 650px) { .navbar { flex-wrap: wrap; padding: 12px 16px; } .brand span { font-size: 13px; } .nav-links { gap: 12px; } .nav-links a { font-size: 12px; } .hero { padding: 52px 18px 42px; } .hero-copy { font-size: 15px; } .section { padding: 43px 17px; } .schedule-grid, .price-grid, .benefit-grid { grid-template-columns: 1fr; } .promo-row { flex-direction: column; } .currency-row { flex-wrap: wrap; } .schedule-card, .price-card { padding: 24px; } .method-panel { padding: 27px 22px; } }

</style>

