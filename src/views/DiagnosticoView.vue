<template>
  <main class="diagnostico-page">
    <section class="diagnostico-card">
      <p class="eyebrow">Quick & Easy</p>
      <h1>Examen diagnóstico</h1>

      <p class="subtitle">
        Responde por secciones para obtener una estimación inicial de tu nivel y el libro sugerido.
      </p>

      <div v-if="!result" class="progress-box">
        <p>Paso {{ currentStep + 1 }} de {{ sections.length }}</p>
        <div class="progress-bar">
          <span :style="{ width: progressWidth }"></span>
        </div>
      </div>

      <form v-if="!result" class="quiz-form" @submit.prevent="handleNext">
        <section class="section-slide">
          <p class="section-label">{{ activeSection.label }}</p>
          <h2>{{ activeSection.title }}</h2>
          <p class="section-description">{{ activeSection.description }}</p>

          <div class="question-card" v-for="question in activeSection.questions" :key="question.id">
            <h3>{{ question.text }}</h3>

            <label v-for="option in question.options" :key="option.text" class="option">
              <input
                v-model="answers[question.id]"
                type="radio"
                :name="question.id"
                :value="option.points"
                required
              />
              <span>{{ option.text }}</span>
            </label>
          </div>

          <div class="actions">
            <button
              v-if="currentStep > 0"
              type="button"
              class="outline-button"
              @click="previousStep"
            >
              Anterior
            </button>

            <button type="submit" class="primary-button">
              {{ isLastStep ? 'Ver resultado' : 'Continuar' }}
            </button>
          </div>
        </section>
      </form>

      <section v-else class="result-card">
        <p class="result-label">Resultado estimado</p>
        <h2>{{ result.final }}</h2>

        <p class="result-text">
          {{ result.description }}
        </p>

        <div class="book-box">
          <p>Guarda este resultado si deseas ingresarlo al crear tu cuenta:</p>
          <strong>{{ result.final }}</strong>
        </div>

        <button class="primary-button" @click="resetQuiz">
          Hacer diagnóstico otra vez
        </button>

        <RouterLink class="outline-link" to="/planes">
          Ver planes de pago
        </RouterLink>
      </section>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'

const currentStep = ref(0)
const answers = ref({})
const result = ref(null)

const sections = [
  {
    label: 'Sección 1',
    title: 'Gramática y estructura',
    description: 'Evalúa bases esenciales: presente, pasado, preguntas, tiempos verbales y estructuras más avanzadas.',
    questions: [
      {
        id: 'q1',
        text: 'Choose the correct sentence:',
        options: [
          { text: 'She are my friend.', points: 0 },
          { text: 'She is my friend.', points: 1 },
          { text: 'She be my friend.', points: 0 }
        ]
      },
      {
        id: 'q2',
        text: 'Complete: I usually ____ coffee in the morning.',
        options: [
          { text: 'drink', points: 1 },
          { text: 'drinks', points: 0 },
          { text: 'drinking', points: 0 }
        ]
      },
      {
        id: 'q3',
        text: 'Complete: Yesterday, we ____ a movie.',
        options: [
          { text: 'watched', points: 1 },
          { text: 'watch', points: 0 },
          { text: 'watching', points: 0 }
        ]
      },
      {
        id: 'q4',
        text: 'Choose the correct option:',
        options: [
          { text: 'I have lived here for five years.', points: 2 },
          { text: 'I live here since five years.', points: 0 },
          { text: 'I am living here since five years.', points: 0 }
        ]
      },
      {
        id: 'q5',
        text: 'Complete: If I had more time, I ____ travel more.',
        options: [
          { text: 'would', points: 2 },
          { text: 'will', points: 0 },
          { text: 'am', points: 0 }
        ]
      },
      {
        id: 'q6',
        text: 'Complete: The report ____ before the meeting started.',
        options: [
          { text: 'had been finished', points: 3 },
          { text: 'has finish', points: 0 },
          { text: 'finished had', points: 0 }
        ]
      },
      {
        id: 'q7',
        text: 'Complete: I wish I ____ spoken English more when I was younger.',
        options: [
          { text: 'had practiced', points: 3 },
          { text: 'practice', points: 0 },
          { text: 'have practice', points: 0 }
        ]
      }
    ]
  },
  {
    label: 'Sección 2',
    title: 'Vocabulario y uso cotidiano',
    description: 'Revisa expresiones comunes, vocabulario práctico y frases naturales para el día a día.',
    questions: [
      {
        id: 'q8',
        text: 'What is the best answer to: How are you?',
        options: [
          { text: 'I am fine, thank you.', points: 1 },
          { text: 'I have fine.', points: 0 },
          { text: 'I fine am.', points: 0 }
        ]
      },
      {
        id: 'q9',
        text: 'Choose the best option: I need to buy bread, milk and eggs at the ____.',
        options: [
          { text: 'grocery store', points: 1 },
          { text: 'hospital', points: 0 },
          { text: 'airport', points: 0 }
        ]
      },
      {
        id: 'q10',
        text: 'Complete: Could you ____ me the way to the station?',
        options: [
          { text: 'tell', points: 2 },
          { text: 'say', points: 0 },
          { text: 'speak', points: 0 }
        ]
      },
      {
        id: 'q11',
        text: 'Choose the most natural sentence:',
        options: [
          { text: 'I am interested in learning English.', points: 2 },
          { text: 'I am interesting to learn English.', points: 0 },
          { text: 'I have interest for learn English.', points: 0 }
        ]
      },
      {
        id: 'q12',
        text: 'Choose the best word: She speaks English very ____.',
        options: [
          { text: 'well', points: 2 },
          { text: 'good', points: 1 },
          { text: 'nice', points: 0 }
        ]
      },
      {
        id: 'q13',
        text: 'Choose the best option: I look forward to ____ from you.',
        options: [
          { text: 'hearing', points: 3 },
          { text: 'hear', points: 0 },
          { text: 'heard', points: 0 }
        ]
      }
    ]
  },
  {
    label: 'Sección 3',
    title: 'Comprensión breve',
    description: 'Lee pequeños textos y responde según la información presentada.',
    questions: [
      {
        id: 'q14',
        text: 'Text: Maria works from Monday to Friday. On weekends, she visits her family. When does Maria visit her family?',
        options: [
          { text: 'On weekends.', points: 1 },
          { text: 'From Monday to Friday.', points: 0 },
          { text: 'Every morning.', points: 0 }
        ]
      },
      {
        id: 'q15',
        text: 'Text: John missed the bus because he woke up late. Why did John miss the bus?',
        options: [
          { text: 'Because he woke up late.', points: 1 },
          { text: 'Because the bus was early.', points: 0 },
          { text: 'Because he was working.', points: 0 }
        ]
      },
      {
        id: 'q16',
        text: 'Text: Although the weather was bad, they decided to continue the trip. What does this mean?',
        options: [
          { text: 'They continued the trip despite the weather.', points: 2 },
          { text: 'They cancelled the trip.', points: 0 },
          { text: 'They waited until next year.', points: 0 }
        ]
      },
      {
        id: 'q17',
        text: 'Text: The company has grown rapidly since it launched its online platform. What happened?',
        options: [
          { text: 'The company expanded quickly after launching online.', points: 3 },
          { text: 'The company closed its platform.', points: 0 },
          { text: 'The company stopped growing.', points: 0 }
        ]
      }
    ]
  },
  {
    label: 'Sección 4',
    title: 'Comunicación y seguridad',
    description: 'Evalúa cómo te sientes usando el idioma en situaciones reales.',
    questions: [
      {
        id: 'q18',
        text: 'Can you introduce yourself in English?',
        options: [
          { text: 'Only with very basic phrases.', points: 0 },
          { text: 'Yes, with simple sentences.', points: 1 },
          { text: 'Yes, with details and confidence.', points: 2 },
          { text: 'Yes, naturally and fluently.', points: 3 }
        ]
      },
      {
        id: 'q19',
        text: 'Can you hold a conversation in English?',
        options: [
          { text: 'Not yet.', points: 0 },
          { text: 'Only very simple conversations.', points: 1 },
          { text: 'Yes, about familiar topics.', points: 2 },
          { text: 'Yes, about many topics with confidence.', points: 3 }
        ]
      },
      {
        id: 'q20',
        text: 'How comfortable do you feel understanding spoken English?',
        options: [
          { text: 'I understand very little.', points: 0 },
          { text: 'I understand basic phrases.', points: 1 },
          { text: 'I understand common conversations.', points: 2 },
          { text: 'I understand most conversations clearly.', points: 3 }
        ]
      }
    ]
  }
]

const activeSection = computed(() => sections[currentStep.value])
const isLastStep = computed(() => currentStep.value === sections.length - 1)
const progressWidth = computed(() => `${((currentStep.value + 1) / sections.length) * 100}%`)

function handleNext() {
  if (!isLastStep.value) {
    currentStep.value += 1
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  calculateResult()
}

function previousStep() {
  currentStep.value -= 1
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function calculateResult() {
  const total = Object.values(answers.value).reduce((sum, value) => sum + Number(value), 0)

  if (total <= 8) {
    result.value = {
      final: 'A1 — Interchange Intro',
      description: 'Resultado inicial. Se recomienda comenzar con bases esenciales, vocabulario básico y estructuras simples.'
    }
    return
  }

  if (total <= 17) {
    result.value = {
      final: 'A2 — Interchange Book 1',
      description: 'Resultado básico. Se recomienda fortalecer conversación cotidiana, gramática fundamental y vocabulario práctico.'
    }
    return
  }

  if (total <= 28) {
    result.value = {
      final: 'B1 — Interchange Book 2',
      description: 'Resultado intermedio. Se recomienda trabajar conversaciones más completas, tiempos verbales y expresión de ideas.'
    }
    return
  }

  if (total <= 40) {
    result.value = {
      final: 'B2 — Interchange Book 3',
      description: 'Resultado intermedio alto. Se recomienda fortalecer fluidez, precisión, comprensión y conversación aplicada.'
    }
    return
  }

  result.value = {
    final: 'C1 — Interchange Book 3 Avanzado',
    description: 'Resultado avanzado. Se recomienda revisión de ubicación para integrarse al grupo más adecuado.'
  }
}

function resetQuiz() {
  answers.value = {}
  result.value = null
  currentStep.value = 0
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped>
.diagnostico-page {
  min-height: 100vh;
  padding: 80px 24px;
  background:
    radial-gradient(circle at top left, rgba(211, 32, 65, 0.12), transparent 35%),
    radial-gradient(circle at top right, rgba(21, 45, 91, 0.16), transparent 35%),
    #ffffff;
  color: #152d5b;
  font-family: Arial, sans-serif;
}

.diagnostico-card {
  max-width: 900px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid rgba(21, 45, 91, 0.1);
  border-radius: 30px;
  padding: 42px;
  box-shadow: 0 18px 45px rgba(21, 45, 91, 0.12);
}

.eyebrow,
.section-label,
.result-label {
  margin: 0 0 12px;
  font-size: 0.85rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #d32041;
  font-weight: 900;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.3rem);
  line-height: 1.05;
}

.subtitle,
.section-description,
.result-text,
.small-note {
  color: #40506b;
  line-height: 1.6;
}

.progress-box {
  margin: 28px 0;
}

.progress-box p {
  margin: 0 0 8px;
  font-weight: 800;
}

.progress-bar {
  height: 10px;
  background: #f0f3fa;
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar span {
  display: block;
  height: 100%;
  background: #d32041;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.quiz-form {
  display: grid;
  gap: 24px;
}

.section-slide h2,
.result-card h2 {
  margin: 0 0 10px;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
}

.question-card {
  padding: 24px;
  border: 1px solid rgba(21, 45, 91, 0.1);
  border-radius: 22px;
  background: #f7f9ff;
  margin-top: 18px;
}

.question-card h3 {
  margin: 0 0 16px;
  font-size: 1.15rem;
}

.option {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin: 10px 0;
  color: #40506b;
  cursor: pointer;
}

.option input {
  margin-top: 3px;
  accent-color: #d32041;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 26px;
}

.primary-button,
.outline-button,
.outline-link {
  width: 100%;
  border-radius: 999px;
  padding: 15px 24px;
  font-weight: 800;
  cursor: pointer;
  font-size: 1rem;
  text-align: center;
  text-decoration: none;
}

.primary-button {
  border: none;
  background: #152d5b;
  color: #ffffff;
}

.primary-button:hover {
  background: #d32041;
}

.outline-button,
.outline-link {
  background: #ffffff;
  color: #152d5b;
  border: 2px solid #152d5b;
}

.outline-button:hover,
.outline-link:hover {
  color: #d32041;
  border-color: #d32041;
}

.result-card {
  display: grid;
  gap: 18px;
  padding: 26px;
  border-radius: 24px;
  background: #f7f9ff;
  border: 1px solid rgba(21, 45, 91, 0.1);
}

.book-box {
  padding: 18px;
  border-radius: 18px;
  background: #ffffff;
  border: 1px solid rgba(21, 45, 91, 0.1);
}

.book-box p {
  margin: 0 0 6px;
  color: #40506b;
}

.book-box strong {
  font-size: 1.25rem;
  color: #152d5b;
}

@media (max-width: 700px) {
  .diagnostico-page {
    padding: 56px 18px;
  }

  .diagnostico-card {
    padding: 30px 22px;
  }

  .actions {
    flex-direction: column;
  }
}
</style>