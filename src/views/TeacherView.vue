<template>
  <div class="page">
    <div class="topbar">
      <h1>Panel Maestro</h1>
      <button class="logout-btn" @click="cerrarSesion" :disabled="cerrandoSesion">
        {{ cerrandoSesion ? 'Saliendo...' : 'Cerrar sesión' }}
      </button>
    </div>

    <div class="content">
      <div class="hero-card">
        <div>
          <p class="eyebrow">Acceso docente</p>
          <h2 v-if="teacherData.name">{{ teacherData.name }}</h2>
          <h2 v-else>Cargando información del maestro...</h2>
          <p class="hero-text">
            Desde aquí puedes revisar tus grupos, ver alumnos, publicar avisos,
            responder comentarios y preparar clases con evaluación.
          </p>
        </div>

        <div class="teacher-mini-card">
          <span class="mini-label">Código</span>
          <strong>{{ teacherData.teacherCode || 'Pendiente' }}</strong>

          <span class="mini-label">Correo</span>
          <strong class="mini-email">{{ teacherData.email || 'Pendiente' }}</strong>
        </div>
      </div>

      <div class="main-grid">
        <!-- IZQUIERDA -->
        <div class="left-column">
          <div class="card">
            <div class="card-header">
              <h3>Tus grupos</h3>
              <p>Selecciona un grupo para abrir sus opciones.</p>
            </div>

            <div v-if="teacherGroups.length" class="group-list">
              <div
                v-for="group in teacherGroups"
                :key="group.id"
                class="group-wrapper"
              >
                <button
                  class="group-button"
                  :class=" [
                    getGroupCardClass(getGroupDisplayBook(group)),
                    { active: selectedGroupId === group.id }
                  ]"
                  @click="toggleGroup(group.id)"
                >
                  <div class="group-main">
                    <strong>{{ group.groupCode }}</strong>
                    <span>
                      {{ formatClassTime(group.classTime) }} · Unidad {{ getExpectedProgress(group).unit }}
                    </span>
                  </div>

                  <div class="group-arrow">
                    {{ selectedGroupId === group.id ? '▼' : '▶' }}
                  </div>
                </button>

                <transition name="fade-slide">
                  <div
                    v-if="selectedGroupId === group.id"
                    class="group-submenu"
                  >
                    <button class="submenu-btn" @click="openSection('resumen', group)">
                      Resumen
                    </button>

                    <button class="submenu-btn" @click="openSection('alumnos', group)">
                      Alumnos
                    </button>

                    <button class="submenu-btn" @click="openSection('clase', group)">
                      Clase y evaluación
                    </button>

                    <button class="submenu-btn" @click="goToHistory(group)">
                      Historial
                    </button>
                  </div>
                </transition>
              </div>
            </div>

            <p v-else class="empty-text">
              No tienes grupos asignados todavía.
            </p>
          </div>
        </div>

        <!-- DERECHA -->
        <div class="right-column">
          <!-- SECCIÓN ACTIVA ARRIBA -->
          <transition name="fade-slide">
            <div v-if="activeSection && activeGroup" class="card active-section-card">
              <div class="section-topbar">
                <div>
                  <h3 class="section-title">
                    {{ activeSectionTitle }}
                  </h3>
                  <p class="section-subtitle">
                    {{ activeGroup.groupCode }} · {{ formatClassTime(activeGroup.classTime) }}
                  </p>
                </div>

                <button class="close-section-btn" @click="closeActiveSection">
                  Cerrar
                </button>
              </div>

              <!-- RESUMEN -->
              <div v-if="activeSection === 'resumen'">
                <div class="summary-grid">
                  <div class="summary-box">
                    <span class="summary-label">Grupo</span>
                    <strong>{{ activeGroup.groupCode || '—' }}</strong>
                  </div>

                  <div class="summary-box">
                    <span class="summary-label">Horario</span>
                    <strong>{{ formatSchedule(activeGroup) }}</strong>
                  </div>

                  <div class="summary-box">
                    <span class="summary-label">Hora</span>
                    <strong>{{ formatClassTime(activeGroup.classTime) }}</strong>
                  </div>

                  <div class="summary-box">
                    <span class="summary-label">Alumnos</span>
                    <strong>{{ getStudentsForGroup(activeGroup.id).length }}</strong>
                  </div>

                  <div class="summary-box">
                    <span class="summary-label">Debe ir en</span>
                    <strong>
                      {{ formatBook(expectedProgress.book) }} · Unidad {{ expectedProgress.unit }}
                    </strong>
                    <p class="summary-hint">
                      {{ expectedProgress.sessions }} sesiones estimadas
                    </p>
                  </div>

                  <div class="summary-box">
                    <span class="summary-label">Meta de cierre</span>
                    <strong>{{ formatDateOnly(getExpectedEndDate(activeGroup)) }}</strong>
                    <p class="summary-hint">
                      Programa de 9 meses
                    </p>
                  </div>
                </div>

                <div class="progress-card">
                  <div class="progress-top">
                    <div>
                      <span class="summary-label">
                        {{ hasTeacherModifiedProgress ? 'Seguimiento del grupo' : 'Seguimiento esperado' }}
                      </span>
                      <h4 class="progress-title">
                        {{ progressStatus.label }}
                      </h4>
                      <p class="progress-message">
                        {{ progressStatus.message }}
                      </p>
                    </div>

                    <div
                      class="status-pill"
                      :class="getStatusClass(progressStatus.key)"
                    >
                      {{ progressStatus.label }}
                    </div>
                  </div>

                  <div v-if="hasTeacherModifiedProgress" class="progress-current-data">
                    <div class="mini-progress-box">
                      <span class="summary-label">Libro real</span>
                      <strong>{{ formatBook(actualBookInput) }}</strong>
                    </div>

                    <div class="mini-progress-box">
                      <span class="summary-label">Unidad real</span>
                      <strong>{{ actualUnitInput }}</strong>
                    </div>
                  </div>

                  <button
                    v-if="!editingProgress"
                    class="secondary-btn"
                    @click="editingProgress = true"
                  >
                    Modificar avance del grupo
                  </button>

                  <div v-if="editingProgress" class="edit-progress-wrap">
                    <div class="progress-form-grid">
                      <div>
                        <label class="field-label">Libro real</label>
                        <select v-model="actualBookInput" class="input">
                          <option value="yellow">Yellow</option>
                          <option value="orange">Orange</option>
                          <option value="blue">Blue</option>
                          <option value="green">Green</option>
                        </select>
                      </div>

                      <div>
                        <label class="field-label">Unidad real</label>
                        <input
                          v-model.number="actualUnitInput"
                          type="number"
                          min="1"
                          max="16"
                          class="input"
                          placeholder="Unidad real"
                        />
                      </div>
                    </div>

                    <div class="edit-progress-actions">
                      <button
                        class="secondary-btn"
                        @click="saveActualProgress"
                        :disabled="savingProgress"
                      >
                        {{ savingProgress ? 'Guardando...' : 'Guardar avance real' }}
                      </button>

                      <button
                        class="ghost-btn"
                        @click="cancelEditProgress"
                        type="button"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ALUMNOS -->
              <div v-else-if="activeSection === 'alumnos'">
                <div v-if="getStudentsForGroup(activeGroup.id).length" class="student-list">
                  <div
                    v-for="student in getStudentsForGroup(activeGroup.id)"
                    :key="student.id"
                    class="student-row"
                  >
                    <div>
                      <strong>{{ student.name }}</strong>
                      <p>{{ student.email }}</p>
                    </div>

                    <div class="student-side">
                      <span>{{ student.studentCode }}</span>
                    </div>
                  </div>
                </div>

                <p v-else class="empty-text">
                  Este grupo todavía no tiene alumnos registrados.
                </p>
              </div>

              <!-- CLASE Y EVALUACIÓN -->
              <div v-else-if="activeSection === 'clase'">
                <input
                  v-model="lessonDate"
                  type="date"
                  class="input"
                />

                <select v-model="lessonBook" class="input">
                  <option value="">Selecciona libro</option>
                  <option value="yellow">Yellow</option>
                  <option value="orange">Orange</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                </select>

                <input
                  v-model.number="lessonUnit"
                  type="number"
                  min="1"
                  max="16"
                  placeholder="Unidad"
                  class="input"
                />

                <input
                  v-model="lessonUrl"
                  type="text"
                  placeholder="Pega aquí el link de la clase o grabación"
                  class="input"
                />

                <select v-model.number="quizQuestionCount" class="input" @change="resetQuizQuestions">
                  <option :value="3">3 preguntas</option>
                  <option :value="5">5 preguntas</option>
                  <option :value="10">10 preguntas</option>
                </select>

                <div class="quiz-builder">
                  <div
                    v-for="(question, index) in quizQuestions"
                    :key="index"
                    class="quiz-question-card"
                  >
                    <h4>Pregunta {{ index + 1 }}</h4>

                    <input
                      v-model="question.question"
                      type="text"
                      placeholder="Escribe la pregunta"
                      class="input"
                    />

                    <input
                      v-model="question.options[0]"
                      type="text"
                      placeholder="Opción A"
                      class="input"
                    />

                    <input
                      v-model="question.options[1]"
                      type="text"
                      placeholder="Opción B"
                      class="input"
                    />

                    <input
                      v-model="question.options[2]"
                      type="text"
                      placeholder="Opción C"
                      class="input"
                    />

                    <input
                      v-model="question.options[3]"
                      type="text"
                      placeholder="Opción D"
                      class="input"
                    />

                    <select v-model.number="question.correctAnswer" class="input">
                      <option :value="0">Respuesta correcta: A</option>
                      <option :value="1">Respuesta correcta: B</option>
                      <option :value="2">Respuesta correcta: C</option>
                      <option :value="3">Respuesta correcta: D</option>
                    </select>
                  </div>
                </div>

                <button
                  class="secondary-btn"
                  @click="createLessonWithQuiz"
                  :disabled="creatingLessonPack"
                >
                  {{ creatingLessonPack ? 'Guardando...' : 'Guardar clase y evaluación' }}
                </button>
              </div>
            </div>
          </transition>

          <!-- DASHBOARD ABAJO -->
          <div class="card">
            <div class="card-header">
              <h3>Dashboard</h3>
              <p>Publicaciones y conversación del grupo seleccionado.</p>
            </div>

            <div v-if="selectedGroupData">
              <input
                v-model="postTitle"
                type="text"
                placeholder="Título del aviso"
                class="input"
              />

              <textarea
                v-model="postContent"
                placeholder="Escribe aquí el mensaje para tus alumnos..."
                class="textarea"
              ></textarea>

              <input
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="input"
              />

              <p v-if="uploadingImage" class="uploading-text">Subiendo imagen...</p>

              <img
                v-if="postImageUrl"
                :src="postImageUrl"
                alt="Vista previa"
                class="post-image preview-image"
              />

              <button
                class="primary-btn"
                @click="createPost"
                :disabled="creatingPost || uploadingImage"
              >
                {{
                  uploadingImage
                    ? 'Esperando imagen...'
                    : creatingPost
                    ? 'Publicando...'
                    : 'Publicar aviso'
                }}
              </button>
            </div>

            <p v-else class="empty-text dashboard-empty">
              Selecciona un grupo a la izquierda para publicar y ver actividad.
            </p>

            <div v-if="filteredPosts.length" class="posts-list dashboard-posts">
              <div v-for="post in filteredPosts" :key="post.id" class="post-card">
                <div class="post-top">
                  <div>
                    <h4>{{ post.title || 'Aviso' }}</h4>
                    <small>{{ formatDate(post.createdAt) }}</small>
                  </div>
                </div>

                <p class="post-content">{{ post.content }}</p>

                <img
                  v-if="post.imageUrl"
                  :src="post.imageUrl"
                  alt="Imagen de publicación"
                  class="post-image"
                />

                <div class="post-footer">
                  <span>{{ post.groupCode || selectedGroupData?.groupCode || 'Grupo' }}</span>
                  <button
                    class="comment-pill-btn"
                    @click="toggleComments(post.id)"
                    type="button"
                  >
                    <span class="arrow-icon">{{ expandedComments[post.id] ? '▼' : '▶' }}</span>
                    <span>{{ getRootCommentsForPost(post.id).length }} comentarios</span>
                  </button>
                </div>

                <transition name="fade-slide">
                  <div v-if="expandedComments[post.id]" class="comments-box">
                    <div
                      v-if="getRootCommentsForPost(post.id).length"
                      class="comments-list"
                    >
                      <div
                        v-for="comment in getRootCommentsForPost(post.id)"
                        :key="comment.id"
                        class="comment-item"
                      >
                        <div class="comment-head">
                          <strong>{{ comment.studentName || comment.authorName || 'Usuario' }}</strong>
                          <small>{{ formatDate(comment.createdAt) }}</small>
                        </div>

                        <p v-if="comment.studentCode" class="comment-code">{{ comment.studentCode }}</p>
                        <p class="comment-text">{{ comment.content }}</p>

                        <button
                          class="reply-toggle-btn"
                          @click="toggleReplyBox(comment.id)"
                        >
                          {{ replyBoxes[comment.id] ? 'Cancelar' : 'Responder' }}
                        </button>

                        <div v-if="replyBoxes[comment.id]" class="reply-box">
                          <textarea
                            v-model="replyInputs[comment.id]"
                            class="textarea reply-textarea"
                            placeholder="Escribe una respuesta..."
                          ></textarea>

                          <button
                            class="secondary-btn small-btn"
                            @click="addReply(comment, post)"
                            :disabled="creatingReply"
                          >
                            {{ creatingReply ? 'Enviando...' : 'Enviar respuesta' }}
                          </button>
                        </div>

                        <div v-if="getRepliesForComment(comment.id).length" class="replies-list">
                          <div
                            v-for="reply in getRepliesForComment(comment.id)"
                            :key="reply.id"
                            class="reply-item"
                          >
                            <div class="comment-head">
                              <strong>{{ reply.authorName || reply.studentName || 'Usuario' }}</strong>
                              <small>{{ formatDate(reply.createdAt) }}</small>
                            </div>

                            <p class="comment-text">{{ reply.content }}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p v-else class="empty-comments">
                      Aún no hay comentarios en esta publicación.
                    </p>
                  </div>
                </transition>
              </div>
            </div>

            <p v-else class="empty-text">
              Aún no hay publicaciones para este grupo.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase'
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc
} from 'firebase/firestore'

const router = useRouter()

const cerrandoSesion = ref(false)
const creatingPost = ref(false)
const uploadingImage = ref(false)
const creatingLessonPack = ref(false)
const creatingReply = ref(false)
const savingProgress = ref(false)
const editingProgress = ref(false)

const teacherData = reactive({
  id: '',
  name: '',
  email: '',
  teacherCode: ''
})

const teacherGroups = ref([])
const students = ref([])
const posts = ref([])
const comments = ref([])
const lessons = ref([])

const selectedGroupId = ref('')
const activeSection = ref('')
const activeGroupId = ref('')

const expandedComments = reactive({})
const replyBoxes = reactive({})
const replyInputs = reactive({})

const postTitle = ref('')
const postContent = ref('')
const postImageUrl = ref('')

const lessonDate = ref('')
const lessonBook = ref('')
const lessonUnit = ref('')
const lessonUrl = ref('')
const quizQuestionCount = ref(5)
const quizQuestions = ref([])

const actualBookInput = ref('yellow')
const actualUnitInput = ref(1)

function createEmptyQuestion() {
  return {
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  }
}

function resetQuizQuestions() {
  quizQuestions.value = Array.from(
    { length: quizQuestionCount.value },
    () => createEmptyQuestion()
  )
}

resetQuizQuestions()

const normalizeEmail = (value) =>
  String(value || '').trim().toLowerCase()

const selectedGroupData = computed(() =>
  teacherGroups.value.find((group) => group.id === selectedGroupId.value) || null
)

const activeGroup = computed(() =>
  teacherGroups.value.find((group) => group.id === activeGroupId.value) || null
)

const filteredPosts = computed(() =>
  posts.value
    .filter((post) => post.groupId === selectedGroupId.value)
    .sort((a, b) => getTimestamp(b.createdAt) - getTimestamp(a.createdAt))
)

const activeSectionTitle = computed(() => {
  if (activeSection.value === 'resumen') return 'Resumen'
  if (activeSection.value === 'alumnos') return 'Alumnos'
  if (activeSection.value === 'clase') return 'Clase y evaluación'
  return ''
})

const expectedProgress = computed(() => {
  if (!activeGroup.value) {
    return {
      sessions: 1,
      book: 'yellow',
      unit: 1
    }
  }

  return getExpectedProgress(activeGroup.value)
})

const hasTeacherModifiedProgress = computed(() => {
  if (!activeGroup.value) return false
  return Boolean(activeGroup.value.actualBook || activeGroup.value.actualUnit)
})

const progressStatus = computed(() => {
  if (!activeGroup.value) {
    return {
      key: 'green',
      label: 'En tiempo',
      message: 'Excelente, todo va en tiempo.'
    }
  }

  if (!hasTeacherModifiedProgress.value) {
    return {
      key: 'green',
      label: 'En tiempo',
      message: 'Todo va conforme al programa.'
    }
  }

  const expectedIndex = getGlobalUnitIndex(expectedProgress.value.book, expectedProgress.value.unit)
  const realBook = actualBookInput.value || activeGroup.value.actualBook || activeGroup.value.currentBook || 'yellow'
  const realUnit = Number(actualUnitInput.value || activeGroup.value.actualUnit || activeGroup.value.currentUnit || 1)
  const realIndex = getGlobalUnitIndex(realBook, realUnit)

  const delta = realIndex - expectedIndex

  if (delta >= -1 && delta <= 1) {
    return {
      key: 'green',
      label: 'Excelente',
      message: 'Muy bien, el grupo va en tiempo.'
    }
  }

  if (delta >= -3 && delta <= 3) {
    return {
      key: 'yellow',
      label: 'Todo bien',
      message: 'Van cerca del ritmo esperado. Todo bien, sigan así.'
    }
  }

  return {
    key: 'red',
    label: 'Atención',
    message: 'Hace falta poner atención, pero confiamos en que se pondrán al corriente.'
  }
})

function getTimestamp(value) {
  if (!value) return 0
  if (value.seconds) return value.seconds * 1000

  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function normalizeDateValue(value) {
  if (!value) return null

  if (value.seconds) {
    const date = new Date(value.seconds * 1000)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function todayAtMidnight() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function addMonths(date, months) {
  const copy = new Date(date)
  copy.setMonth(copy.getMonth() + months)
  return copy
}

function getClassSessionWeight(scheduleType, dayOfWeek) {
  const map = {
    lmv: {
      1: 1,
      3: 1,
      5: 1
    },
    mj: {
      2: 1.5,
      4: 1.5
    },
    sabado: {
      6: 3
    }
  }

  return map[scheduleType]?.[dayOfWeek] || 0
}

function countExpectedSessions(group) {
  const start = normalizeDateValue(group.startDate)
  if (!start) return 1

  const today = todayAtMidnight()
  if (today < start) return 1

  let cursor = new Date(start)
  let total = 0

  while (cursor <= today) {
    total += getClassSessionWeight(group.scheduleType, cursor.getDay())
    cursor.setDate(cursor.getDate() + 1)
  }

  const completed = Math.floor(total)
  return Math.min(Math.max(completed, 1), Number(group.totalSessions || 128))
}

function getBookBySession(sessionNumber) {
  if (sessionNumber <= 32) return 'yellow'
  if (sessionNumber <= 64) return 'orange'
  if (sessionNumber <= 96) return 'blue'
  return 'green'
}

function getUnitBySessionInBook(sessionInBook) {
  const safeSession = Math.min(Math.max(sessionInBook, 1), 32)
  const pairIndex = Math.floor((safeSession - 1) / 4)
  const position = ((safeSession - 1) % 4) + 1
  const baseUnit = pairIndex * 2

  if (position === 1) return baseUnit + 1
  return baseUnit + 2
}

function getExpectedProgress(group) {
  const sessions = countExpectedSessions(group)
  const book = getBookBySession(sessions)

  let sessionInBook = sessions
  if (sessions > 96) sessionInBook = sessions - 96
  else if (sessions > 64) sessionInBook = sessions - 64
  else if (sessions > 32) sessionInBook = sessions - 32

  const unit = getUnitBySessionInBook(sessionInBook)

  return {
    sessions,
    book,
    unit
  }
}

function getBookOrder(book) {
  const map = {
    yellow: 0,
    orange: 1,
    blue: 2,
    green: 3
  }

  return map[book] ?? 0
}

function getGlobalUnitIndex(book, unit) {
  return getBookOrder(book) * 16 + Number(unit || 1)
}

function getDisplayUnit(group) {
  return group?.actualUnit || group?.currentUnit || 1
}

function getGroupDisplayUnit(group) {
  return group?.actualUnit || group?.currentUnit || getExpectedProgress(group).unit || 1
}

function getGroupDisplayBook(group) {
  return group?.actualBook || group?.currentBook || getExpectedProgress(group).book || 'yellow'
}

function getExpectedEndDate(group) {
  const start = normalizeDateValue(group.startDate)
  if (!start) return null
  return addMonths(start, 9)
}

function formatBook(value) {
  const map = {
    yellow: 'Yellow',
    orange: 'Orange',
    blue: 'Blue',
    green: 'Green'
  }

  return map[value] || value || 'Pendiente'
}

function getGroupCardClass(value) {
  const map = {
    yellow: 'group-book-yellow',
    orange: 'group-book-orange',
    blue: 'group-book-blue',
    green: 'group-book-green'
  }

  return map[value] || 'group-book-neutral'
}

function getStatusClass(key) {
  if (key === 'green') return 'status-green'
  if (key === 'yellow') return 'status-yellow'
  return 'status-red'
}

function formatClassTime(value) {
  const map = {
    '8am': '8:00 am',
    '9am': '9:00 am',
    '1pm': '1:00 pm',
    '5pm': '5:00 pm',
    '8pm': '8:00 pm'
  }

  return map[value] || value || 'Pendiente'
}

function formatSchedule(group) {
  const scheduleMap = {
    lmv: 'Lunes, Miércoles, Viernes',
    mj: 'Martes y Jueves',
    sabado: 'Sabatino'
  }

  const scheduleText = scheduleMap[group.scheduleType] || 'Horario pendiente'
  const timeText = formatClassTime(group.classTime)

  return `${scheduleText} · ${timeText}`
}

function formatDate(value) {
  if (!value) return 'Fecha pendiente'

  let date

  if (value.seconds) {
    date = new Date(value.seconds * 1000)
  } else {
    date = new Date(value)
  }

  if (Number.isNaN(date.getTime())) return 'Fecha pendiente'

  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function formatDateOnly(value) {
  if (!value) return 'Fecha pendiente'

  const date = value.seconds
    ? new Date(value.seconds * 1000)
    : new Date(value)

  if (Number.isNaN(date.getTime())) return 'Fecha pendiente'

  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function toggleGroup(groupId) {
  if (selectedGroupId.value === groupId) {
    selectedGroupId.value = ''
    if (activeGroupId.value === groupId) {
      activeSection.value = ''
      activeGroupId.value = ''
      editingProgress.value = false
    }
    return
  }

  selectedGroupId.value = groupId
}

function openSection(section, group) {
  activeSection.value = section
  activeGroupId.value = group.id

  if (section === 'clase') {
    lessonDate.value = ''
    lessonBook.value = group.actualBook || group.currentBook || getExpectedProgress(group).book || ''
    lessonUnit.value = group.actualUnit || group.currentUnit || getExpectedProgress(group).unit || 1
    lessonUrl.value = ''
    quizQuestionCount.value = 5
    resetQuizQuestions()
  }

  if (section === 'resumen') {
    actualBookInput.value = group.actualBook || group.currentBook || getExpectedProgress(group).book || 'yellow'
    actualUnitInput.value = Number(group.actualUnit || group.currentUnit || getExpectedProgress(group).unit || 1)
    editingProgress.value = false
  }
}

function closeActiveSection() {
  activeSection.value = ''
  activeGroupId.value = ''
  editingProgress.value = false
}

function cancelEditProgress() {
  if (!activeGroup.value) {
    editingProgress.value = false
    return
  }

  actualBookInput.value = activeGroup.value.actualBook || activeGroup.value.currentBook || getExpectedProgress(activeGroup.value).book || 'yellow'
  actualUnitInput.value = Number(activeGroup.value.actualUnit || activeGroup.value.currentUnit || getExpectedProgress(activeGroup.value).unit || 1)
  editingProgress.value = false
}

function getStudentsForGroup(groupId) {
  return students.value.filter((student) => student.groupId === groupId)
}

function getRootCommentsForPost(postId) {
  return comments.value
    .filter((comment) => comment.postId === postId && !comment.parentId)
    .sort((a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt))
}

function getRepliesForComment(commentId) {
  return comments.value
    .filter((comment) => comment.parentId === commentId)
    .sort((a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt))
}

function toggleComments(postId) {
  expandedComments[postId] = !expandedComments[postId]
}

function toggleReplyBox(commentId) {
  replyBoxes[commentId] = !replyBoxes[commentId]
}

function goToHistory(group) {
  router.push(`/teacher-history/${group.id}`)
}

async function handleImageUpload(event) {
  try {
    const file = event.target.files[0]
    if (!file) return

    uploadingImage.value = true

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'teacher_posts')

    const response = await fetch('https://api.cloudinary.com/v1_1/dt8mqclpf/image/upload', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    if (!response.ok || !data.secure_url) {
      console.error('Respuesta de Cloudinary:', data)
      alert('No se pudo subir la imagen')
      return
    }

    postImageUrl.value = data.secure_url
  } catch (error) {
    console.error('Error al subir imagen:', error)
    alert('Error al subir la imagen')
  } finally {
    uploadingImage.value = false
  }
}

async function loadTeacherByEmail(email) {
  const teachersRef = collection(db, 'teachers')
  const snapshot = await getDocs(teachersRef)

  const foundTeacher = snapshot.docs.find((docItem) => {
    const data = docItem.data()
    return normalizeEmail(data.email) === normalizeEmail(email)
  })

  if (!foundTeacher) return null

  return {
    id: foundTeacher.id,
    ...foundTeacher.data()
  }
}

async function loadTeacherGroups() {
  if (!teacherData.id) return

  const groupsRef = collection(db, 'groups')
  const groupsQuery = query(groupsRef, where('teacherId', '==', teacherData.id))
  const snapshot = await getDocs(groupsQuery)

  teacherGroups.value = snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
  }))
}

async function loadStudents() {
  const studentsRef = collection(db, 'students')
  const snapshot = await getDocs(studentsRef)

  students.value = snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
  }))
}

async function loadPosts() {
  const postsRef = collection(db, 'posts')
  const snapshot = await getDocs(postsRef)

  posts.value = snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
  }))
}

async function loadComments() {
  const commentsRef = collection(db, 'comments')
  const snapshot = await getDocs(commentsRef)

  comments.value = snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
  }))
}

async function loadLessons() {
  const lessonsRef = collection(db, 'lessons')
  const snapshot = await getDocs(lessonsRef)

  lessons.value = snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
  }))
}

async function createPost() {
  try {
    if (!selectedGroupData.value) {
      alert('Selecciona un grupo')
      return
    }

    if (!postTitle.value.trim() || !postContent.value.trim()) {
      alert('Escribe título y contenido del aviso')
      return
    }

    if (uploadingImage.value) {
      alert('Espera a que termine de subir la imagen')
      return
    }

    creatingPost.value = true

    await addDoc(collection(db, 'posts'), {
      teacherId: teacherData.id,
      teacherName: teacherData.name,
      groupId: selectedGroupData.value.id,
      groupCode: selectedGroupData.value.groupCode || '',
      title: postTitle.value.trim(),
      content: postContent.value.trim(),
      imageUrl: postImageUrl.value.trim() || '',
      commentCount: 0,
      createdAt: new Date()
    })

    postTitle.value = ''
    postContent.value = ''
    postImageUrl.value = ''

    await loadPosts()
  } catch (error) {
    console.error('Error al crear publicación:', error)
    alert('No se pudo crear la publicación')
  } finally {
    creatingPost.value = false
  }
}

async function createLessonWithQuiz() {
  try {
    if (!activeGroup.value) {
      alert('Selecciona un grupo')
      return
    }

    if (!lessonDate.value || !lessonBook.value || !lessonUnit.value || !lessonUrl.value.trim()) {
      alert('Completa fecha, libro, unidad y link')
      return
    }

    for (const question of quizQuestions.value) {
      if (!question.question.trim()) {
        alert('Todas las preguntas deben tener texto')
        return
      }

      const cleanOptions = question.options.map((option) => String(option || '').trim())
      if (cleanOptions.some((option) => !option)) {
        alert('Todas las opciones deben estar completas')
        return
      }
    }

    creatingLessonPack.value = true

    await addDoc(collection(db, 'lessons'), {
      teacherId: teacherData.id,
      teacherName: teacherData.name,
      groupId: activeGroup.value.id,
      groupCode: activeGroup.value.groupCode || '',
      lessonDate: lessonDate.value,
      book: lessonBook.value,
      unit: Number(lessonUnit.value),
      url: lessonUrl.value.trim(),
      questionCount: quizQuestionCount.value,
      questions: quizQuestions.value.map((question) => ({
        question: question.question.trim(),
        options: question.options.map((option) => String(option || '').trim()),
        correctAnswer: question.correctAnswer
      })),
      createdAt: new Date()
    })

    lessonDate.value = ''
    lessonBook.value = activeGroup.value.actualBook || activeGroup.value.currentBook || getExpectedProgress(activeGroup.value).book || ''
    lessonUnit.value = activeGroup.value.actualUnit || activeGroup.value.currentUnit || getExpectedProgress(activeGroup.value).unit || 1
    lessonUrl.value = ''
    quizQuestionCount.value = 5
    resetQuizQuestions()

    await loadLessons()
    alert('Clase y evaluación guardadas')
  } catch (error) {
    console.error('Error al guardar clase y evaluación:', error)
    alert('No se pudo guardar la clase y evaluación')
  } finally {
    creatingLessonPack.value = false
  }
}

async function saveActualProgress() {
  try {
    if (!activeGroup.value) return

    if (!actualBookInput.value || !actualUnitInput.value) {
      alert('Completa libro y unidad real')
      return
    }

    savingProgress.value = true

    await updateDoc(doc(db, 'groups', activeGroup.value.id), {
      actualBook: actualBookInput.value,
      actualUnit: Number(actualUnitInput.value),
      progressStatus: progressStatus.value.key,
      expectedBook: expectedProgress.value.book,
      expectedUnit: expectedProgress.value.unit,
      expectedSessions: expectedProgress.value.sessions,
      expectedEndDate: getExpectedEndDate(activeGroup.value)
    })

    await loadTeacherGroups()
    editingProgress.value = false
    alert('Avance real guardado')
  } catch (error) {
    console.error('Error al guardar avance real:', error)
    alert('No se pudo guardar el avance real')
  } finally {
    savingProgress.value = false
  }
}

async function addReply(comment, post) {
  try {
    const content = String(replyInputs[comment.id] || '').trim()

    if (!content) {
      alert('Escribe una respuesta')
      return
    }

    creatingReply.value = true

    await addDoc(collection(db, 'comments'), {
      postId: post.id,
      groupId: post.groupId || '',
      parentId: comment.id,
      content,
      authorName: teacherData.name || 'Maestro',
      authorRole: 'teacher',
      teacherId: teacherData.id,
      createdAt: new Date()
    })

    replyInputs[comment.id] = ''
    replyBoxes[comment.id] = false

    await loadComments()
  } catch (error) {
    console.error('Error al responder comentario:', error)
    alert('No se pudo enviar la respuesta')
  } finally {
    creatingReply.value = false
  }
}

async function cerrarSesion() {
  try {
    cerrandoSesion.value = true
    await signOut(auth)
    router.push('/login')
  } catch (error) {
    console.error(error)
    alert('No se pudo cerrar sesión.')
  } finally {
    cerrandoSesion.value = false
  }
}

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (!user?.email) return

    const teacher = await loadTeacherByEmail(user.email)

    if (!teacher) {
      alert('No se encontró información de este maestro.')
      return
    }

    teacherData.id = teacher.id
    teacherData.name = teacher.name || ''
    teacherData.email = teacher.email || ''
    teacherData.teacherCode = teacher.teacherCode || ''

    await loadTeacherGroups()
    await loadStudents()
    await loadPosts()
    await loadComments()
    await loadLessons()
  })
})
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background: #f6f4f1;
  color: #111827;
  font-family: Arial, sans-serif;
}

.page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(239, 68, 68, 0.06), transparent 24%),
    radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.06), transparent 24%),
    #f6f4f1;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 30px;
  background: rgba(255, 255, 255, 0.92);
  border-bottom: 1px solid #ece7df;
  backdrop-filter: blur(10px);
}

.topbar h1 {
  margin: 0;
  font-size: 28px;
}

.logout-btn {
  background: #111827;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}

.content {
  max-width: 1380px;
  margin: 0 auto;
  padding: 32px 24px 50px;
}

.hero-card {
  display: grid;
  grid-template-columns: 1.5fr 0.7fr;
  gap: 20px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #ece7df;
  border-radius: 28px;
  padding: 28px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 10px;
  color: #7c2d12;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-card h2 {
  margin: 0 0 10px;
  font-size: 38px;
}

.hero-text {
  margin: 0;
  color: #6b7280;
  font-size: 16px;
  line-height: 1.6;
  max-width: 760px;
}

.teacher-mini-card {
  border: 1px solid #ece7df;
  border-radius: 20px;
  padding: 18px;
  background: #fbfaf8;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.mini-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8a8f98;
}

.mini-email {
  word-break: break-word;
}

.main-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 24px;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #ece7df;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.05);
}

.card-header h3 {
  margin: 0 0 6px;
  font-size: 24px;
}

.card-header p {
  margin: 0 0 18px;
  color: #6b7280;
  line-height: 1.5;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-button {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 16px;
  text-align: left;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  cursor: pointer;
  transition: 0.2s ease;
}

.group-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
}

.group-button.active {
  border-color: #1e3a8a;
}

.group-main strong {
  display: block;
  margin-bottom: 6px;
  font-size: 22px;
}

.group-main span {
  color: #374151;
  font-size: 14px;
}

.group-arrow {
  font-size: 14px;
  color: #374151;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.group-book-yellow {
  background: linear-gradient(180deg, #fff9db 0%, #fffef6 100%);
}

.group-book-orange {
  background: linear-gradient(180deg, #ffedd5 0%, #fffaf5 100%);
}

.group-book-blue {
  background: linear-gradient(180deg, #dbeafe 0%, #f8fbff 100%);
}

.group-book-green {
  background: linear-gradient(180deg, #dcfce7 0%, #f7fff9 100%);
}

.group-book-neutral {
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.group-submenu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 10px;
}

.submenu-btn {
  border: 1px solid #e5e7eb;
  background: white;
  color: #111827;
  padding: 12px 14px;
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  font-weight: 700;
}

.submenu-btn:hover {
  background: #f8fafc;
}

.active-section-card {
  margin-bottom: 0;
}

.section-topbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.section-title {
  margin: 0 0 6px;
  font-size: 24px;
}

.section-subtitle {
  margin: 0;
  color: #6b7280;
}

.close-section-btn {
  border: none;
  background: #111827;
  color: white;
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  flex-shrink: 0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.summary-box {
  border: 1px solid #ece7df;
  border-radius: 18px;
  padding: 16px;
  background: #fbfaf8;
}

.summary-label {
  display: block;
  color: #8a8f98;
  font-size: 12px;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-hint {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.progress-card {
  border: 1px solid #ece7df;
  border-radius: 20px;
  padding: 18px;
  background: #fbfaf8;
}

.progress-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.progress-title {
  margin: 6px 0;
  font-size: 24px;
}

.progress-message {
  margin: 0;
  color: #6b7280;
}

.progress-current-data {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.mini-progress-box {
  border: 1px solid #ece7df;
  border-radius: 16px;
  padding: 14px;
  background: white;
}

.progress-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.field-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.status-pill {
  padding: 10px 14px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 13px;
  white-space: nowrap;
}

.status-green {
  background: #dcfce7;
  color: #166534;
}

.status-yellow {
  background: #fef3c7;
  color: #92400e;
}

.status-red {
  background: #fee2e2;
  color: #991b1b;
}

.edit-progress-wrap {
  margin-top: 16px;
}

.edit-progress-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.student-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.student-row {
  border: 1px solid #ece7df;
  border-radius: 18px;
  padding: 16px;
  background: #fbfaf8;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
}

.student-row p {
  margin: 6px 0 0;
  color: #6b7280;
  word-break: break-word;
}

.student-side {
  white-space: nowrap;
  font-weight: 700;
}

.input,
.textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d8dbe2;
  border-radius: 14px;
  padding: 14px;
  font-size: 15px;
  margin-bottom: 12px;
  background: white;
}

.textarea {
  min-height: 130px;
  resize: vertical;
  font-family: inherit;
}

.primary-btn,
.secondary-btn,
.ghost-btn {
  border: none;
  padding: 14px 20px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 700;
  font-size: 15px;
}

.primary-btn {
  color: white;
  background: linear-gradient(90deg, #dc2626, #1e3a8a);
  min-width: 180px;
}

.secondary-btn {
  color: white;
  background: #111827;
}

.ghost-btn {
  background: white;
  color: #111827;
  border: 1px solid #d8dbe2;
}

.ghost-btn:hover {
  background: #f9fafb;
}

.primary-btn:disabled,
.secondary-btn:disabled,
.ghost-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.small-btn {
  padding: 10px 14px;
  font-size: 14px;
}

.uploading-text {
  margin: 4px 0 12px;
  color: #6b7280;
  font-size: 14px;
}

.dashboard-empty {
  margin-bottom: 18px;
}

.dashboard-posts {
  margin-top: 20px;
}

.posts-list,
.quiz-builder {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card,
.quiz-question-card {
  border: 1px solid #ece7df;
  border-radius: 20px;
  padding: 18px;
  background: #fbfaf8;
}

.post-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.post-top h4 {
  margin: 0 0 4px;
  font-size: 20px;
}

.post-top small {
  color: #6b7280;
}

.post-content {
  margin: 0 0 14px;
  color: #374151;
  line-height: 1.7;
  white-space: pre-line;
}

.post-image {
  width: 100%;
  border-radius: 16px;
  margin-bottom: 14px;
  border: 1px solid #e5e7eb;
}

.preview-image {
  max-height: 260px;
  object-fit: cover;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #6b7280;
  font-size: 14px;
  align-items: center;
}

.comment-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #dbe2ea;
  background: white;
  color: #111827;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.comment-pill-btn:hover {
  background: #f8fafc;
}

.arrow-icon {
  font-size: 12px;
}

.comments-box {
  border-top: 1px solid #ece7df;
  padding-top: 14px;
  margin-top: 14px;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  background: white;
  border: 1px solid #ece7df;
  border-radius: 16px;
  padding: 14px;
}

.comment-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.comment-head small {
  color: #6b7280;
}

.comment-code {
  margin: 0 0 8px;
  font-size: 13px;
  color: #8a8f98;
}

.comment-text {
  margin: 0;
  color: #374151;
  line-height: 1.6;
  white-space: pre-line;
}

.reply-toggle-btn {
  margin-top: 12px;
  border: none;
  background: transparent;
  color: #1d4ed8;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.reply-box {
  margin-top: 12px;
}

.reply-textarea {
  min-height: 90px;
  margin-bottom: 10px;
}

.replies-list {
  margin-top: 14px;
  padding-left: 18px;
  border-left: 2px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reply-item {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px;
}

.quiz-question-card h4 {
  margin: 0 0 12px;
  font-size: 18px;
}

.empty-comments,
.empty-text {
  margin: 0;
  color: #6b7280;
  line-height: 1.6;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 1100px) {
  .hero-card,
  .main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .summary-grid,
  .progress-form-grid,
  .progress-current-data {
    grid-template-columns: 1fr;
  }

  .hero-card h2 {
    font-size: 30px;
  }

  .student-row,
  .post-footer,
  .comment-head,
  .section-topbar,
  .progress-top {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>