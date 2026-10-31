<template>
  <main class="page">
    <section class="card">
      <p class="eyebrow">EASY & QUICK SCHOOL</p>

      <div v-if="checking" class="status">Estamos preparando tu inscripción...</div>

      <template v-else-if="intake">
        <p class="success">✓ Pago confirmado</p>
        <h1>¡Bienvenido{{ displayName ? ', ' + firstName : '' }}!</h1>
        <p class="subtitle">Completa tu inscripción en unos minutos.</p>

        <div class="identity">
          <p><span>Matrícula</span><strong>{{ intake.matricula }}</strong></p>
          <p><span>Correo registrado</span><strong>{{ intake.email }}</strong></p>
          <p v-if="intake.amount"><span>Pago registrado</span><strong>{{ intake.amount }} {{ intake.currency }}</strong></p>
        </div>

        <div v-if="!intake.name" class="step">
          <h2>Confirma tu nombre</h2>
          <p>No encontramos tu nombre en los datos de compra. Escríbelo tal como debe aparecer en tu acuerdo.</p>
          <label>Nombre completo<input v-model.trim="enteredName" autocomplete="name" placeholder="Nombre y apellidos" /></label>
        </div>

        <section class="step">
          <h2><span class="num">1</span> Tu acuerdo de inscripción</h2>
          <p class="muted">Alumno: <strong>{{ displayName || 'Pendiente de confirmar' }}</strong></p>
          <p class="muted">Matrícula: <strong>{{ intake.matricula }}</strong></p>
          <div class="agreement">
            <h3>ACUERDO DE INSCRIPCIÓN AL PROGRAMA DE INGLÉS</h3>
            <p><strong>Prestadora:</strong> Easy & Quick School</p>
            <p><strong>Programa:</strong> Inglés en línea · 9 meses · 108 horas académicas</p>
            <div v-for="c in clauses" :key="c.title">
              <h4>{{ c.title }}</h4>
              <ul><li v-for="t in c.points" :key="t">{{ t }}</li></ul>
            </div>
            <div class="sign">
              <img v-if="signatureAvailable" src="/school-signature.png" alt="Firma autorizada de la escuela" />
              <strong>Easy & Quick School</strong>
              <small>Representación institucional</small>
            </div>
          </div>
          <label class="check"><input v-model="accepted" type="checkbox" /> He leído y acepto el acuerdo de inscripción.</label>
          <button type="button" class="outline" :disabled="!displayName || !accepted" @click="printAgreement">Descargar mi acuerdo en PDF</button>
          <p class="muted small">Se abrirá la opción de impresión: selecciona «Guardar como PDF».</p>
        </section>

        <section class="step">
          <h2><span class="num">2</span> Selecciona tu horario</h2>
          <label class="choice"><input v-model="group" type="radio" value="lmv-8pm" />
            <span><strong>Lunes, miércoles y viernes</strong><small>8:00 a 9:00 p. m. · Inicio 16 de noviembre de 2026</small></span></label>
          <label class="choice"><input v-model="group" type="radio" value="sabados-9am" />
            <span><strong>Sábados</strong><small>9:00 a. m. a 12:00 p. m. · Inicio 21 de noviembre de 2026</small></span></label>
          <p class="muted small">Horario de México (zona centro). Tu selección se asignará automáticamente al grupo correspondiente.</p>
        </section>

        <section v-if="!awaitingVerification" class="step">
          <h2><span class="num">3</span> Crea tu cuenta</h2>
          <label>Correo electrónico<input :value="intake.email" type="email" readonly /></label>
          <p class="muted small">Este es el correo de tu compra y no se puede modificar.</p>
          <label>Contraseña<input v-model="password" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" /></label>
          <label>Confirmar contraseña<input v-model="confirmPassword" type="password" autocomplete="new-password" /></label>
          <button class="primary" :disabled="working" @click="register">{{ working ? 'Procesando...' : 'Crear mi cuenta' }}</button>
        </section>

        <section v-else class="step">
          <h2>Verifica tu correo</h2>
          <p>Te enviamos un enlace a <strong>{{ intake.email }}</strong>. Revísalo y vuelve aquí.</p>
          <button class="primary" :disabled="working" @click="finish">{{ working ? 'Comprobando...' : 'Ya verifiqué mi correo' }}</button>
          <button class="outline" :disabled="working" @click="resend">Reenviar verificación</button>
        </section>

        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <div v-if="showHelp" class="help">
          <h3>¿Necesitas ayuda con tu inscripción?</h3>
          <p>Envíanos tu nombre, matrícula <strong>{{ intake.matricula }}</strong> y correo <strong>{{ intake.email }}</strong>.</p>
          <a :href="supportEmail">Enviar correo a info@easyquickschool.com</a>
          <a :href="supportWhatsapp" target="_blank" rel="noopener">Escribir por WhatsApp: +52 81 3558 3914</a>
        </div>
      </template>

      <div v-else class="step">
        <h1>No pudimos recuperar tu inscripción</h1>
        <p>{{ error || 'Abre el enlace recibido después de completar tu pago.' }}</p>
        <p>Si acabas de pagar, espera unos momentos y actualiza la página.</p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, sendEmailVerification, reload
} from 'firebase/auth'
import { auth } from '../firebase'

const route = useRoute()
const router = useRouter()
const sessionId = String(route.query.session_id || '')
const checking = ref(true)
const working = ref(false)
const intake = ref(null)
const enteredName = ref('')
const accepted = ref(false)
const group = ref('')
const password = ref('')
const confirmPassword = ref('')
const awaitingVerification = ref(false)
const error = ref('')
const showHelp = ref(false)
const signatureAvailable = ref(true) // Cambiar a true al colocar la firma autorizada en public/school-signature.png

const displayName = computed(() => (intake.value?.name || enteredName.value || '').trim())
const firstName = computed(() => displayName.value.split(/\s+/)[0])
const supportEmail = computed(() => `mailto:info@easyquickschool.com?subject=${encodeURIComponent('Ayuda inscripción ' + (intake.value?.matricula || ''))}&body=${encodeURIComponent(`Nombre: ${displayName.value}\nMatrícula: ${intake.value?.matricula}\nCorreo: ${intake.value?.email}\n\nNecesito ayuda con mi inscripción.`)}`)
const supportWhatsapp = computed(() => `https://wa.me/528135583914?text=${encodeURIComponent(`Hola, necesito ayuda con mi inscripción a Easy & Quick School.\nNombre: ${displayName.value}\nMatrícula: ${intake.value?.matricula}\nCorreo: ${intake.value?.email}`)}`)

const groups = {
  'lmv-8pm': { name: 'Lunes, miércoles y viernes', schedule: '8:00 pm a 9:00 pm', level: 'Curso completo', groupCode: 'LMV1012' },
  'sabados-9am': { name: 'Sábados', schedule: '9:00 am a 12:00 pm', level: 'Curso completo', groupCode: 'SAB1013' }
}
const clauses = [
  { title: '1. Prestación del servicio', points: ['La Prestadora del Servicio brindará asesoría en el aprendizaje del idioma inglés.', 'El servicio se impartirá mediante clases grupales en modalidad en línea.', 'Incluye acceso a sesiones en vivo y materiales digitales de apoyo.'] },
  { title: '2. Duración y estructura del programa', points: ['El programa contempla un total de 108 horas académicas.', 'Equivalente a 12 horas mensuales durante 9 meses consecutivos.', 'El contenido se distribuye en niveles progresivos.', 'El horario se elegirá entre los grupos disponibles y estará sujeto a confirmación administrativa.'] },
  { title: '3. Compromiso del alumno', points: ['El Alumno se compromete a participar de forma constante en las sesiones.', 'El aprovechamiento del programa depende de la asistencia y seguimiento continuo.'] },
  { title: '4. Interrupción voluntaria', points: ['En caso de que el Alumno decida interrumpir su participación, deberá notificarlo por escrito.', 'La interrupción implica la terminación inmediata del acuerdo, con derecho a establecer un acuerdo para la reincorporación.', 'No habrá derecho a reembolso.'] },
  { title: '5. Faltas y bajas', points: ['La acumulación de 3 faltas consecutivas no repuestas o 5 faltas totales no repuestas dará lugar a la baja automática del programa.', 'Dicha baja implica la terminación del presente acuerdo sin derecho a reembolso.'] },
  { title: '6. Validación de clases', points: ['Se considera falta no repuesta aquella sesión no asistida que no haya sido validada mediante la revisión completa de la grabación correspondiente.', 'La validación deberá realizarse conforme a los lineamientos establecidos por la institución.'] },
  { title: '7. Reincorporación', points: ['La reincorporación al programa estará sujeta a evaluación y autorización de la Prestadora del Servicio.', 'Podrá implicar una penalización administrativa.', 'Se considerará el avance del grupo al momento de la solicitud.'] },
  { title: '8. Pago y aceptación', points: ['El pago del programa se realiza conforme a la modalidad contratada.', 'La aceptación electrónica de este acuerdo implica la aceptación de sus términos.'] }
]

async function post(url, data, token) {
  const response = await fetch(url, { method: 'POST', headers: {
    'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {})
  }, body: JSON.stringify(data) })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'No pudimos completar la operación.')
  return result
}
onMounted(async () => {
  try {
    if (!sessionId) throw new Error('Falta la referencia de tu compra.')
    // Este endpoint debe comprobar la sesión en Stripe y crear/recuperar matrícula en Firestore.
    intake.value = await post('/api/registration-intake', { sessionId })
    if (!intake.value.email || !intake.value.matricula) throw new Error('Faltan datos de inscripción.')
  } catch (e) { error.value = e.message } finally { checking.value = false }
})
async function register() {
  error.value = ''
  showHelp.value = false
  if (!displayName.value) { error.value = 'Escribe tu nombre completo.'; return }
  if (!accepted.value) { error.value = 'Acepta el acuerdo de inscripción.'; return }
  if (!groups[group.value]) { error.value = 'Selecciona tu horario.'; return }
  if (password.value.length < 6 || password.value !== confirmPassword.value) {
    error.value = 'La contraseña debe tener al menos 6 caracteres y coincidir en ambos campos.'; return
  }
  working.value = true
  try {
    // Validación en servidor; el correo no se toma de un campo editable.
    await post('/api/registration-intake', { sessionId })
    let user
    try {
      const result = await createUserWithEmailAndPassword(auth, intake.value.email, password.value)
      user = result.user
      await updateProfile(user, { displayName: displayName.value })
    } catch (e) {
      if (e.code !== 'auth/email-already-in-use') throw e
      const result = await signInWithEmailAndPassword(auth, intake.value.email, password.value)
      user = result.user
    }
    awaitingVerification.value = true
    if (!user.emailVerified) await sendEmailVerification(user)
    else { working.value = false; await finish() }
  } catch (e) {
    error.value = e.code === 'auth/email-already-in-use' ? 'Esta cuenta ya existe. Inicia sesión.' : (e.message || 'No pudimos crear tu cuenta.')
    showHelp.value = true
  } finally { working.value = false }
}
async function resend() {
  working.value = true; error.value = ''
  try {
    if (!auth.currentUser) throw new Error('Vuelve a iniciar sesión.')
    await sendEmailVerification(auth.currentUser)
  } catch (e) { error.value = e.message } finally { working.value = false }
}
async function finish() {
  working.value = true; error.value = ''
  try {
    const user = auth.currentUser
    if (!user) throw new Error('Tu sesión terminó. Inicia sesión para continuar.')
    await reload(user)
    if (!user.emailVerified) throw new Error('Todavía no has verificado tu correo.')
    if (user.email?.toLowerCase() !== intake.value.email.toLowerCase()) throw new Error('El correo de la cuenta no coincide con el de la compra.')
    const token = await user.getIdToken(true)
    await post('/api/complete-registration', {
      uid: user.uid, sessionId, name: displayName.value, email: intake.value.email,
      matricula: intake.value.matricula,
      groupPreferenceId: group.value, groupPreference: groups[group.value],
      diagnosticSubmitted: false, diagnosticResult: null,
      agreementAccepted: true, agreementVersion: '2026-10-31',
      agreementAcceptedAt: new Date().toISOString()
    }, token)
    await router.push('/clase')
  } catch (e) { error.value = e.message; showHelp.value = true } finally { working.value = false }
}
function escapeHtml(v) { return String(v ?? '').replace(/[&<>"']/g, x => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[x])) }
function printAgreement() {
  if (!displayName.value || !accepted.value || !intake.value?.matricula) return
  const w = window.open('', '_blank')
  if (!w) { error.value = 'Permite ventanas emergentes para guardar el acuerdo.'; return }
  const body = clauses.map(c => `<section><h3>${escapeHtml(c.title)}</h3><ul>${c.points.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul></section>`).join('')
  const signature = signatureAvailable.value ? '<img src="/school-signature.png" style="max-width:150px;max-height:75px;display:block" alt="Firma de la escuela">' : ''
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Acuerdo ${escapeHtml(intake.value.matricula)}</title><style>body{font:12px/1.5 Arial,sans-serif;max-width:790px;margin:30px auto;padding:0 22px;color:#152d5b}h1{text-align:center;font-size:21px}h3{font-size:13px;margin:14px 0 4px}li{margin:3px 0}section{break-inside:avoid}.sign{margin-top:30px;border-top:1px solid #152d5b;width:240px;padding-top:8px}</style></head><body><h1>Easy & Quick School<br>Acuerdo de inscripción</h1><p><b>Alumno:</b> ${escapeHtml(displayName.value)}<br><b>Matrícula:</b> ${escapeHtml(intake.value.matricula)}<br><b>Fecha:</b> ${escapeHtml(new Date().toLocaleDateString('es-MX'))}<br><b>Programa:</b> Inglés en línea · 9 meses · 108 horas académicas</p>${body}<div class="sign">${signature}<b>Easy & Quick School</b><br>Representación institucional</div><p>El alumno marcó la casilla de aceptación durante su registro. La constancia definitiva debe conservarse en el expediente electrónico.</p></body></html>`)
  w.document.close()
  w.focus()
  w.print()
}
</script>

<style scoped>
*{box-sizing:border-box}.page{min-height:100vh;padding:45px 18px;background:radial-gradient(circle at top left,#fcecef,transparent 36%),radial-gradient(circle at top right,#e9eff9,transparent 38%),#fff;font-family:Arial,sans-serif;color:#152d5b}.card{max-width:780px;margin:auto;padding:35px;background:white;border:1px solid #e3e8f1;border-radius:25px;box-shadow:0 15px 35px #152d5b12}.eyebrow{font-size:12px;letter-spacing:.16em;font-weight:900;color:#d32041}.success{font-weight:800;color:#167347}h1{font-size:clamp(29px,5vw,42px);margin:8px 0}.subtitle,.muted{color:#52627a;line-height:1.55}.small{font-size:12px}.identity{background:#f3f6fb;border:1px solid #dce5f2;border-radius:16px;padding:10px 18px;margin:25px 0}.identity p{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin:12px 0}.identity span{color:#64748b}.step{border:1px solid #e3e8f1;border-radius:17px;padding:23px;margin:18px 0;display:grid;gap:13px}.step h2{font-size:21px;margin:0;display:flex;align-items:center;gap:10px}.num{display:inline-grid;place-items:center;background:#d32041;color:white;border-radius:50%;width:32px;height:32px;font-size:16px}.step label:not(.choice):not(.check){display:grid;gap:7px;font-weight:700;font-size:14px}.step input:not([type=radio]):not([type=checkbox]){width:100%;padding:13px;border:1px solid #cad5e6;border-radius:11px;font-size:15px}.step input[readonly]{background:#f1f4fa;color:#53647b}.agreement{max-height:320px;overflow:auto;padding:18px;background:#fafcff;border:1px solid #dce4f0;border-radius:12px;font-size:13px;line-height:1.55}.agreement h3{text-align:center}.agreement h4{margin:18px 0 6px}.agreement ul{padding-left:22px}.sign{margin-top:25px;padding-top:8px;border-top:1px solid #9caec8;display:grid;width:max-content;gap:4px}.sign img{max-width:150px;max-height:75px}.sign small{color:#66788e}.check,.choice{display:flex;gap:12px;align-items:flex-start}.check input,.choice input{accent-color:#d32041;width:18px;height:18px;flex-shrink:0}.choice{border:1px solid #dce5f2;padding:14px;border-radius:12px;background:#f8faff;cursor:pointer}.choice span{display:grid;gap:5px}.choice small{color:#53647b}.primary,.outline{border:0;border-radius:999px;padding:14px 18px;font-weight:800;cursor:pointer;font-size:14px}.primary{background:#152d5b;color:white}.outline{background:white;color:#152d5b;border:2px solid #152d5b}.primary:disabled,.outline:disabled{opacity:.55;cursor:not-allowed}.error{background:#fce8ec;color:#991b1b;border-radius:12px;padding:14px}.help{background:#f5f8ff;border-radius:14px;padding:20px;margin-top:20px}.help a{display:block;margin:10px 0;color:#152d5b;font-weight:700}.status{text-align:center;padding:35px}@media(max-width:600px){.card{padding:20px}.step{padding:16px}.identity p{display:grid;gap:4px}}
</style>
