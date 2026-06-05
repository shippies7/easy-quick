<template>
  <div class="page">
    <div class="topbar">
      <h1>Tu espacio</h1>
      <button class="logout-btn" @click="cerrarSesion" :disabled="cerrandoSesion">
        {{ cerrandoSesion ? 'Saliendo...' : 'Cerrar sesión' }}
      </button>
    </div>

    <div class="content">
      <div class="dashboard-grid">
        <!-- COLUMNA IZQUIERDA -->
        <div class="left-column">
          <div class="info-card">
            <div class="badge">Acceso activo</div>

            <h2 v-if="studentData.name">{{ studentData.name }}</h2>
            <h2 v-else>Cargando tu información...</h2>

            <p class="subtitle">
              Este es tu espacio dentro de Easy & Quick School.
            </p>

            <div class="data-grid">
              <div class="data-box">
                <span class="label">Código</span>
                <span class="value">{{ studentData.studentCode || 'Pendiente' }}</span>
              </div>

              <div class="data-box">
                <span class="label">Grupo</span>
                <span class="value">{{ studentData.groupCode || 'Pendiente' }}</span>
              </div>
            </div>

            <div class="student-progress-box">
              <div class="student-progress-top">
                <div>
                  <span class="mini-label">Avance del grupo</span>
                  <strong class="student-progress-title">
                    {{ studentProgress.bookLabel }} · Unidad {{ studentProgress.unit }}
                  </strong>
                </div>

                <div
                  v-if="groupProgressStatus"
                  class="status-pill"
                  :class="getStatusClass(groupProgressStatus)"
                >
                  {{ getStatusText(groupProgressStatus) }}
                </div>
              </div>

              <p class="student-progress-text">
                {{ studentProgress.message }}
              </p>
            </div>
          </div>

          <div class="class-card">
            <h2>Entrar a tu clase en vivo</h2>

            <p class="text">
              El botón aparecerá 15 minutos antes de tu clase.
            </p>

            <div v-if="nextClassText" class="next-class-box">
              <span class="next-class-label">Próxima clase</span>
              <strong class="next-class-value">{{ nextClassText }}</strong>
            </div>

            <button
              v-if="canShowZoomButton"
              @click="entrarReunion"
              :disabled="cargando"
              class="zoom-btn"
            >
              {{ cargando ? 'Cargando Zoom...' : 'Entrar a clase' }}
            </button>

            <p v-else class="not-available">
              Tu acceso todavía no está disponible.
            </p>

            <p v-if="mensaje" class="mensaje">{{ mensaje }}</p>
          </div>
        </div>

        <!-- COLUMNA DERECHA -->
        <div class="right-column">
          <!-- CLASES Y EVALUACIONES -->
          <div class="lessons-card">
            <div class="lessons-header">
              <div>
                <h2>Clases y evaluaciones</h2>
                <p>Revisa tus clases guardadas, abre el material y responde tu evaluación.</p>
              </div>

              <div class="lesson-filters" v-if="groupLessons.length">
                <button
                  class="lesson-filter-btn"
                  :class="{ active: lessonViewMode === 'pending' }"
                  @click="lessonViewMode = 'pending'"
                >
                  Pendientes
                  <span class="filter-count">{{ pendingLessons.length }}</span>
                </button>

                <button
                  class="lesson-filter-btn"
                  :class="{ active: lessonViewMode === 'history' }"
                  @click="lessonViewMode = 'history'"
                >
                  Anteriores
                  <span class="filter-count">{{ completedLessons.length }}</span>
                </button>
              </div>
            </div>

            <div v-if="loadingLessons" class="empty-text">
              Cargando clases...
            </div>

            <div v-else-if="displayedLessons.length" class="lessons-list">
              <div
                v-for="lesson in displayedLessons"
                :key="lesson.id"
                class="lesson-card"
                :class="{ 'lesson-card-compact': lessonViewMode === 'history' }"
              >
                <template v-if="lessonViewMode === 'pending'">
                  <div class="lesson-main-row">
                    <div class="lesson-main-left">
                      <div class="lesson-top">
                        <div>
                          <h3>{{ formatLessonDate(lesson.lessonDate) }}</h3>
                          <small>
                            {{ formatBook(lesson.book) }} · Unidad {{ lesson.unit || 1 }}
                          </small>
                        </div>

                        <div
                          class="lesson-status-pill"
                          :class="getLessonStatusClass(lesson.id)"
                        >
                          {{ getLessonStatusText(lesson.id) }}
                        </div>
                      </div>

                      <div class="lesson-meta-grid">
                        <div class="lesson-mini-box">
                          <span class="lesson-mini-label">Preguntas</span>
                          <strong>{{ lesson.questionCount || lesson.questions?.length || 0 }}</strong>
                        </div>

                        <div class="lesson-mini-box">
                          <span class="lesson-mini-label">Resultado</span>
                          <strong>Sin responder</strong>
                        </div>
                      </div>
                    </div>

                    <div class="lesson-actions lesson-actions-side">
                      <a
                        v-if="lesson.url"
                        :href="lesson.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="lesson-link-btn"
                      >
                        Ver clase
                      </a>

                      <button
                        class="lesson-toggle-btn"
                        @click="toggleLessonPanel(lesson.id)"
                      >
                        {{ openedLessonId === lesson.id ? 'Ocultar evaluación' : 'Ver evaluación' }}
                      </button>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div class="lesson-compact-row">
                    <div class="lesson-compact-main">
                      <strong class="compact-date">{{ formatLessonDate(lesson.lessonDate) }}</strong>
                      <span class="compact-separator">•</span>
                      <span class="compact-book">{{ formatBook(lesson.book) }}</span>
                      <span class="compact-separator">•</span>
                      <span class="compact-unit">Unidad {{ lesson.unit || 1 }}</span>
                      <span class="compact-separator">•</span>
                      <span class="compact-score">
                        {{ getSubmissionForLesson(lesson.id)?.score }}/{{ getSubmissionForLesson(lesson.id)?.totalQuestions }}
                      </span>
                      <span class="compact-separator">•</span>
                      <span class="compact-percent">
                        {{ getSubmissionForLesson(lesson.id)?.percentage }}%
                      </span>
                    </div>

                    <div class="lesson-actions lesson-actions-inline">
                      <a
                        v-if="lesson.url"
                        :href="lesson.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="lesson-link-btn compact-btn"
                      >
                        Ver clase
                      </a>

                      <button
                        class="lesson-toggle-btn compact-btn"
                        @click="toggleLessonPanel(lesson.id)"
                      >
                        {{ openedLessonId === lesson.id ? 'Ocultar' : 'Ver evaluación' }}
                      </button>
                    </div>
                  </div>
                </template>

                <transition name="fade-slide">
                  <div v-if="openedLessonId === lesson.id" class="lesson-panel">
                    <div v-if="getSubmissionForLesson(lesson.id)" class="submitted-box">
                      <div class="submitted-top">
                        <div>
                          <span class="mini-label">Resultado guardado</span>
                          <h4>
                            {{ getSubmissionForLesson(lesson.id).score }}/{{ getSubmissionForLesson(lesson.id).totalQuestions }}
                            · {{ getSubmissionForLesson(lesson.id).percentage }}%
                          </h4>
                        </div>

                        <div class="submitted-badge">
                          Respondida
                        </div>
                      </div>

                      <p class="submitted-date">
                        Respondiste el {{ formatDate(getSubmissionForLesson(lesson.id).submittedAt) }}
                      </p>
                    </div>

                    <div v-else>
                      <div
                        v-for="(question, qIndex) in lesson.questions || []"
                        :key="`${lesson.id}-${qIndex}`"
                        class="student-question-card"
                      >
                        <h4>Pregunta {{ qIndex + 1 }}</h4>
                        <p class="student-question-text">{{ question.question }}</p>

                        <div class="options-list">
                          <label
                            v-for="(option, optionIndex) in question.options"
                            :key="`${lesson.id}-${qIndex}-${optionIndex}`"
                            class="option-item"
                          >
                            <input
                              type="radio"
                              :name="`lesson-${lesson.id}-question-${qIndex}`"
                              :value="optionIndex"
                              v-model.number="lessonAnswers[lesson.id][qIndex]"
                            />
                            <span>{{ option }}</span>
                          </label>
                        </div>
                      </div>

                      <button
                        class="submit-quiz-btn"
                        @click="submitLessonQuiz(lesson)"
                        :disabled="submittingLessonId === lesson.id"
                      >
                        {{
                          submittingLessonId === lesson.id
                            ? 'Enviando...'
                            : 'Enviar evaluación'
                        }}
                      </button>
                    </div>
                  </div>
                </transition>
              </div>
            </div>

            <p v-else class="empty-text">
              {{
                lessonViewMode === 'pending'
                  ? 'No tienes evaluaciones pendientes.'
                  : 'Aún no hay evaluaciones anteriores.'
              }}
            </p>
          </div>

          <!-- AVISOS -->
          <div class="posts-card">
            <div class="posts-header">
              <h2>Avisos y materiales</h2>
              <p>Publicaciones recientes de tu profesor para este grupo.</p>
            </div>

            <div v-if="loadingPosts" class="empty-text">
              Cargando publicaciones...
            </div>

            <div v-else-if="filteredPosts.length" class="posts-list">
              <div v-for="post in filteredPosts" :key="post.id" class="post-card">
                <div class="post-top">
                  <div>
                    <h3>{{ post.title || 'Aviso' }}</h3>
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
                  <span>{{ post.groupCode || studentData.groupCode || 'Grupo' }}</span>
                  <span>{{ post.teacherName || 'Profesor' }}</span>
                </div>

                <div class="comments-section">
                  <h4 class="comments-title">
                    Comentarios ({{ getRootCommentsForPost(post.id).length }})
                  </h4>

                  <div class="comment-form">
                    <textarea
                      v-model="commentInputs[post.id]"
                      class="comment-textarea"
                      placeholder="Escribe tu comentario..."
                    ></textarea>

                    <button
                      class="comment-btn"
                      @click="submitComment(post)"
                      :disabled="submittingCommentFor === post.id"
                    >
                      {{
                        submittingCommentFor === post.id
                          ? 'Enviando...'
                          : 'Comentar'
                      }}
                    </button>
                  </div>

                  <div
                    v-if="getRootCommentsForPost(post.id).length"
                    class="comments-list"
                  >
                    <div
                      v-for="comment in getRootCommentsForPost(post.id)"
                      :key="comment.id"
                      class="comment-item"
                    >
                      <div class="comment-header">
                        <strong>{{ comment.studentName || comment.authorName || 'Usuario' }}</strong>
                        <small>{{ formatDate(comment.createdAt) }}</small>
                      </div>

                      <p class="comment-meta">
                        {{ comment.studentCode || comment.authorRole || '' }}
                      </p>

                      <p class="comment-content">
                        {{ comment.content }}
                      </p>

                      <button
                        class="reply-toggle-btn"
                        @click="toggleReplyBox(comment.id)"
                      >
                        {{ replyBoxes[comment.id] ? 'Cancelar' : 'Responder' }}
                      </button>

                      <div v-if="replyBoxes[comment.id]" class="reply-box">
                        <textarea
                          v-model="replyInputs[comment.id]"
                          class="comment-textarea reply-textarea"
                          placeholder="Escribe una respuesta..."
                        ></textarea>

                        <button
                          class="comment-btn"
                          @click="submitReply(comment, post)"
                          :disabled="submittingReplyFor === comment.id"
                        >
                          {{
                            submittingReplyFor === comment.id
                              ? 'Enviando...'
                              : 'Enviar respuesta'
                          }}
                        </button>
                      </div>

                      <div
                        v-if="getRepliesForComment(comment.id).length"
                        class="replies-list"
                      >
                        <div
                          v-for="reply in getRepliesForComment(comment.id)"
                          :key="reply.id"
                          class="reply-item"
                        >
                          <div class="comment-header">
                            <strong>{{ reply.studentName || reply.authorName || 'Usuario' }}</strong>
                            <small>{{ formatDate(reply.createdAt) }}</small>
                          </div>

                          <p class="comment-meta">
                            {{ reply.studentCode || reply.authorRole || '' }}
                          </p>

                          <p class="comment-content">
                            {{ reply.content }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p v-else class="empty-comments">
                    Aún no hay comentarios en esta publicación.
                  </p>
                </div>
              </div>
            </div>

            <p v-else class="empty-text">
              Aún no hay publicaciones para tu grupo.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { ZoomMtg } from '@zoom/meetingsdk'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'vue-router'
import { auth, db } from '../firebase'
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore'

const cargando = ref(false)
const mensaje = ref('')
const cerrandoSesion = ref(false)
const loadingPosts = ref(false)
const loadingLessons = ref(false)
const currentMexicoDate = ref(new Date())
const submittingCommentFor = ref('')
const submittingReplyFor = ref('')
const submittingLessonId = ref('')
const lessonViewMode = ref('pending')
const router = useRouter()

const posts = ref([])
const comments = ref([])
const lessons = ref([])
const lessonSubmissions = ref([])
const commentInputs = reactive({})
const replyInputs = reactive({})
const replyBoxes = reactive({})
const lessonAnswers = reactive({})
const openedLessonId = ref('')
let timeInterval = null
let authUnsubscribe = null
let unsubGroup = null
let unsubPosts = null
let unsubComments = null
let unsubLessons = null
let unsubLessonSubmissions = null

const studentData = reactive({
  id: '',
  name: '',
  studentCode: '',
  groupCode: '',
  groupId: ''
})

const groupData = reactive({
  scheduleType: '',
  classTime: '',
  currentBook: '',
  currentUnit: 1,
  actualBook: '',
  actualUnit: null,
  progressStatus: '',
  startDate: null,
  totalSessions: 128
})

const sdkKey = import.meta.env.VITE_ZOOM_SDK_KEY
const meetingNumber = '82275218133'
const passWord = '868344'
const leaveUrl = 'http://localhost:5173'
const userName = ref('Invitado')

const normalizeEmail = (value) =>
  String(value || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, '')
    .trim()
    .toLowerCase()

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

const filteredPosts = computed(() =>
  posts.value
    .filter((post) => post.groupId === studentData.groupId)
    .sort((a, b) => {
      const dateA = a.createdAt?.seconds
        ? a.createdAt.seconds * 1000
        : new Date(a.createdAt || 0).getTime()

      const dateB = b.createdAt?.seconds
        ? b.createdAt.seconds * 1000
        : new Date(b.createdAt || 0).getTime()

      return dateB - dateA
    })
)

const groupLessons = computed(() =>
  lessons.value
    .filter((lesson) => lesson.groupId === studentData.groupId)
    .sort((a, b) => {
      const dateA = new Date(a.lessonDate || 0).getTime()
      const dateB = new Date(b.lessonDate || 0).getTime()
      return dateB - dateA
    })
)

const latestGroupLesson = computed(() => {
  if (!groupLessons.value.length) return null
  return groupLessons.value[0]
})

const studentProgress = computed(() => {
  const expected = getExpectedProgress(groupData)
  return {
    book: expected.book,
    unit: expected.unit,
    bookLabel: formatBook(expected.book),
  }
})

const groupProgressStatus = computed(() => groupData.progressStatus || '')

const pendingLessons = computed(() =>
  groupLessons.value.filter((lesson) => !getSubmissionForLesson(lesson.id))
)

const completedLessons = computed(() =>
  groupLessons.value.filter((lesson) => !!getSubmissionForLesson(lesson.id))
)

const displayedLessons = computed(() =>
  lessonViewMode.value === 'pending'
    ? pendingLessons.value
    : completedLessons.value
)

function cleanupRealtimeListeners() {
  if (unsubGroup) unsubGroup()
  if (unsubPosts) unsubPosts()
  if (unsubComments) unsubComments()
  if (unsubLessons) unsubLessons()
  if (unsubLessonSubmissions) unsubLessonSubmissions()

  unsubGroup = null
  unsubPosts = null
  unsubComments = null
  unsubLessons = null
  unsubLessonSubmissions = null
}

function startRealtimeListeners() {
  cleanupRealtimeListeners()

  if (!studentData.groupId || !studentData.id) return

  unsubGroup = onSnapshot(doc(db, 'groups', studentData.groupId), (snapshot) => {
    if (!snapshot.exists()) return

    const data = snapshot.data()

    groupData.scheduleType = data.scheduleType || ''
    groupData.classTime = data.classTime || ''
    groupData.currentBook = data.currentBook || ''

groupData.currentUnit =
  data.currentUnit !== undefined &&
  data.currentUnit !== null &&
  data.currentUnit !== ''
    ? Number(data.currentUnit)
    : null

groupData.actualBook = data.actualBook || ''

groupData.actualUnit =
  data.actualUnit !== undefined &&
  data.actualUnit !== null &&
  data.actualUnit !== ''
    ? Number(data.actualUnit)
    : null
    groupData.progressStatus = data.progressStatus || ''
    groupData.startDate = data.startDate || null
    groupData.totalSessions = Number(data.totalSessions) || 128
  })

  loadingPosts.value = true
  unsubPosts = onSnapshot(collection(db, 'posts'), (snapshot) => {
    posts.value = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }))
    loadingPosts.value = false
  })

  unsubComments = onSnapshot(collection(db, 'comments'), (snapshot) => {
    comments.value = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }))
  })

  loadingLessons.value = true
  unsubLessons = onSnapshot(collection(db, 'lessons'), (snapshot) => {
    lessons.value = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }))
    loadingLessons.value = false
  })

  unsubLessonSubmissions = onSnapshot(collection(db, 'lessonSubmissions'), (snapshot) => {
    lessonSubmissions.value = snapshot.docs
      .map((docItem) => ({
        id: docItem.id,
        ...docItem.data()
      }))
      .filter((item) => item.studentId === studentData.id)
  })
}

function getRootCommentsForPost(postId) {
  return comments.value
    .filter((comment) => comment.postId === postId && !comment.parentId)
    .sort((a, b) => {
      const dateA = a.createdAt?.seconds
        ? a.createdAt.seconds * 1000
        : new Date(a.createdAt || 0).getTime()

      const dateB = b.createdAt?.seconds
        ? b.createdAt.seconds * 1000
        : new Date(b.createdAt || 0).getTime()

      return dateA - dateB
    })
}

function getRepliesForComment(commentId) {
  return comments.value
    .filter((comment) => comment.parentId === commentId)
    .sort((a, b) => {
      const dateA = a.createdAt?.seconds
        ? a.createdAt.seconds * 1000
        : new Date(a.createdAt || 0).getTime()

      const dateB = b.createdAt?.seconds
        ? b.createdAt.seconds * 1000
        : new Date(a.createdAt || 0).getTime()

      return dateA - dateB
    })
}

function getSubmissionForLesson(lessonId) {
  return lessonSubmissions.value.find((item) => item.lessonId === lessonId) || null
}

function toggleReplyBox(commentId) {
  replyBoxes[commentId] = !replyBoxes[commentId]
}

function toggleLessonPanel(lessonId) {
  if (openedLessonId.value === lessonId) {
    openedLessonId.value = ''
    return
  }

  openedLessonId.value = lessonId

  const lesson = groupLessons.value.find((item) => item.id === lessonId)
  if (!lesson) return

  if (!lessonAnswers[lessonId]) {
    lessonAnswers[lessonId] = Array.from(
      { length: lesson.questions?.length || 0 },
      () => null
    )
  }
}

function getLessonStatusClass(lessonId) {
  const submission = getSubmissionForLesson(lessonId)
  if (!submission) return 'status-pending'
  return 'status-done'
}

function getLessonStatusText(lessonId) {
  const submission = getSubmissionForLesson(lessonId)
  if (!submission) return 'Pendiente'
  return 'Respondida'
}

function getStatusClass(key) {
  if (key === 'green') return 'status-green'
  if (key === 'yellow') return 'status-yellow'
  if (key === 'red') return 'status-red'
  return 'status-neutral'
}

function getStatusText(key) {
  if (key === 'green') return 'Excelente'
  if (key === 'yellow') return 'Todo bien'
  if (key === 'red') return 'Atención'
  return 'Grupo'
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

function getMexicoNowParts() {
  const now = new Date()

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  const parts = formatter.formatToParts(now)
  const get = (type) => parts.find((part) => part.type === type)?.value || ''

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: get('weekday').toLowerCase(),
    hour: Number(get('hour')),
    minute: Number(get('minute'))
  }
}

function updateMexicoTime() {
  currentMexicoDate.value = new Date()
}

function getClassStartMinutes(classTime) {
  const classMinutesMap = {
    '8am': 8 * 60,
    '9am': 9 * 60,
    '1pm': 13 * 60,
    '5pm': 17 * 60,
    '8pm': 20 * 60
  }

  return classMinutesMap[classTime]
}

function getClassDurationMinutes(scheduleType) {
  const durationMap = {
    lmv: 60,
    mj: 90,
    sabado: 180
  }

  return durationMap[scheduleType] || 60
}

function getAllowedDays(scheduleType) {
  const allowedDaysMap = {
    lmv: ['mon', 'wed', 'fri'],
    mj: ['tue', 'thu'],
    sabado: ['sat']
  }

  return allowedDaysMap[scheduleType] || []
}

function getWeekdayLabel(dayKey) {
  const labels = {
    mon: 'lunes',
    tue: 'martes',
    wed: 'miércoles',
    thu: 'jueves',
    fri: 'viernes',
    sat: 'sábado',
    sun: 'domingo'
  }

  return labels[dayKey] || dayKey
}

function getTimeLabel(classTime) {
  const labels = {
    '8am': '8:00 am',
    '9am': '9:00 am',
    '1pm': '1:00 pm',
    '5pm': '5:00 pm',
    '8pm': '8:00 pm'
  }

  return labels[classTime] || classTime || ''
}

const canShowZoomButton = computed(() => {
  currentMexicoDate.value

  if (!groupData.scheduleType || !groupData.classTime) return false

  const nowParts = getMexicoNowParts()
  const allowedDays = getAllowedDays(groupData.scheduleType)
  const classStartMinutes = getClassStartMinutes(groupData.classTime)
  const durationMinutes = getClassDurationMinutes(groupData.scheduleType)

  if (!allowedDays.includes(nowParts.weekday)) return false
  if (classStartMinutes === undefined) return false

  const nowMinutes = nowParts.hour * 60 + nowParts.minute
  const startWindow = classStartMinutes - 15
  const endWindow = classStartMinutes + durationMinutes + 15

  return nowMinutes >= startWindow && nowMinutes <= endWindow
})

const nextClassText = computed(() => {
  currentMexicoDate.value

  if (!groupData.scheduleType || !groupData.classTime) return ''

  const allowedDays = getAllowedDays(groupData.scheduleType)
  const classStartMinutes = getClassStartMinutes(groupData.classTime)
  if (!allowedDays.length || classStartMinutes === undefined) return ''

  const nowParts = getMexicoNowParts()
  const nowMinutes = nowParts.hour * 60 + nowParts.minute

  const orderedDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const todayIndex = orderedDays.indexOf(nowParts.weekday)

  for (let offset = 0; offset < 7; offset++) {
    const dayIndex = (todayIndex + offset) % 7
    const dayKey = orderedDays[dayIndex]

    if (!allowedDays.includes(dayKey)) continue

    if (offset === 0 && nowMinutes > classStartMinutes) {
      continue
    }

    const dayLabel =
      offset === 0 ? 'hoy' : offset === 1 ? 'mañana' : getWeekdayLabel(dayKey)

    return `${dayLabel} a las ${getTimeLabel(groupData.classTime)}`
  }

  return ''
})

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

function formatLessonDate(value) {
  if (!value) return 'Clase'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'Clase'

  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

async function loadStudentDataByEmail(email) {
  try {
    const studentsRef = collection(db, 'students')
    const snapshot = await getDocs(studentsRef)

    const normalizedEmail = normalizeEmail(email)

    const studentDoc = snapshot.docs.find((docItem) => {
      const data = docItem.data()
      const firestoreEmail = normalizeEmail(data.email)
      return firestoreEmail === normalizedEmail
    })

    if (studentDoc) {
      const data = studentDoc.data()

      studentData.id = studentDoc.id
      studentData.name = data.name || ''
      studentData.studentCode = data.studentCode || ''
      studentData.groupCode = data.groupCode || ''
      studentData.groupId = data.groupId || ''
      userName.value = data.name || 'Invitado'
    } else {
      console.log('No se encontró alumno con ese correo en Firestore:', email)
    }
  } catch (error) {
    console.error('Error al cargar datos del alumno:', error)
  }
}

async function submitComment(post) {
  try {
    const text = String(commentInputs[post.id] || '').trim()

    if (!text) {
      alert('Escribe un comentario')
      return
    }

    submittingCommentFor.value = post.id

    await addDoc(collection(db, 'comments'), {
      postId: post.id,
      groupId: post.groupId || '',
      studentId: studentData.id || '',
      studentName: studentData.name || '',
      studentCode: studentData.studentCode || '',
      authorName: studentData.name || '',
      authorRole: 'student',
      content: text,
      createdAt: new Date()
    })

    await updateDoc(doc(db, 'posts', post.id), {
      commentCount: (post.commentCount || 0) + 1
    })

    commentInputs[post.id] = ''
  } catch (error) {
    console.error('Error al guardar comentario:', error)
    alert('No se pudo guardar el comentario')
  } finally {
    submittingCommentFor.value = ''
  }
}

async function submitReply(comment, post) {
  try {
    const text = String(replyInputs[comment.id] || '').trim()

    if (!text) {
      alert('Escribe una respuesta')
      return
    }

    submittingReplyFor.value = comment.id

    await addDoc(collection(db, 'comments'), {
      postId: post.id,
      groupId: post.groupId || '',
      parentId: comment.id,
      studentId: studentData.id || '',
      studentName: studentData.name || '',
      studentCode: studentData.studentCode || '',
      authorName: studentData.name || '',
      authorRole: 'student',
      content: text,
      createdAt: new Date()
    })

    replyInputs[comment.id] = ''
    replyBoxes[comment.id] = false
  } catch (error) {
    console.error('Error al guardar respuesta:', error)
    alert('No se pudo guardar la respuesta')
  } finally {
    submittingReplyFor.value = ''
  }
}

async function submitLessonQuiz(lesson) {
  try {
    if (!lesson?.id) return

    const answers = lessonAnswers[lesson.id] || []
    const totalQuestions = lesson.questions?.length || 0

    if (!totalQuestions) {
      alert('Esta evaluación no tiene preguntas')
      return
    }

    const hasEmpty = answers.length !== totalQuestions || answers.some((item) => item === null || item === undefined)
    if (hasEmpty) {
      alert('Responde todas las preguntas')
      return
    }

    submittingLessonId.value = lesson.id

    let score = 0

    lesson.questions.forEach((question, index) => {
      if (Number(answers[index]) === Number(question.correctAnswer)) {
        score += 1
      }
    })

    const percentage = Math.round((score / totalQuestions) * 100)

    const payload = {
      lessonId: lesson.id,
      groupId: lesson.groupId || '',
      studentId: studentData.id || '',
      studentName: studentData.name || '',
      studentCode: studentData.studentCode || '',
      answers,
      score,
      totalQuestions,
      percentage,
      submittedAt: new Date()
    }

    const existingSubmission = getSubmissionForLesson(lesson.id)

    if (existingSubmission?.id) {
      await updateDoc(doc(db, 'lessonSubmissions', existingSubmission.id), payload)
    } else {
      await addDoc(collection(db, 'lessonSubmissions'), payload)
    }

    openedLessonId.value = lesson.id
    lessonViewMode.value = 'pending'
    alert(`Evaluación enviada. Obtuviste ${score}/${totalQuestions}.`)
  } catch (error) {
    console.error('Error al enviar evaluación:', error)
    alert('No se pudo enviar la evaluación')
  } finally {
    submittingLessonId.value = ''
  }
}

async function entrarReunion() {
  try {
    cargando.value = true
    mensaje.value = 'Obteniendo acceso a tu clase...'

    ZoomMtg.preLoadWasm()
    ZoomMtg.prepareWebSDK()

    const response = await fetch('/api/signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meetingNumber,
        role: 0
      })
    })

    const data = await response.json()

    if (!data.signature) {
      console.error('Respuesta backend:', data)
      mensaje.value = 'No se pudo obtener el acceso a la clase.'
      cargando.value = false
      return
    }

    mensaje.value = 'Iniciando clase...'

    ZoomMtg.init({
      leaveUrl,
      patchJsMedia: true,
      success: function () {
        mensaje.value = 'Entrando a la reunión...'

        ZoomMtg.join({
          signature: data.signature,
          sdkKey,
          meetingNumber,
          passWord,
          userName: userName.value,
          success: function () {
            mensaje.value = ''
            cargando.value = false
          },
          error: function (err) {
            console.error('Error en join:', err)
            mensaje.value = 'Error al entrar a la clase. Revisa la consola.'
            cargando.value = false
          }
        })
      },
      error: function (err) {
        console.error('Error en init:', err)
        mensaje.value = 'Error al iniciar Zoom. Revisa la consola.'
        cargando.value = false
      }
    })
  } catch (error) {
    console.error('Error general:', error)
    mensaje.value = 'No se pudo conectar con el backend.'
    cargando.value = false
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
  updateMexicoTime()
  timeInterval = setInterval(updateMexicoTime, 60000)

  authUnsubscribe = onAuthStateChanged(auth, async (user) => {
    cleanupRealtimeListeners()

    if (user?.email) {
      await loadStudentDataByEmail(user.email)
      lessonViewMode.value = 'pending'
      startRealtimeListeners()
    }
  })
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }

  if (authUnsubscribe) {
    authUnsubscribe()
  }

  cleanupRealtimeListeners()
})
</script>

<style>
:root {
  --brand-red: #c8102e;
  --brand-blue: #163d7a;
  --brand-black: #111111;
  --brand-white: #ffffff;
  --brand-ink: #1f2937;
  --brand-soft: #f7f7f8;
  --brand-border: #e5e7eb;
  --brand-red-soft: rgba(200, 16, 46, 0.08);
  --brand-blue-soft: rgba(22, 61, 122, 0.08);
}

html, body, #app {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background: var(--brand-white);
  color: var(--brand-ink);
  font-family: Arial, sans-serif;
}

.page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, var(--brand-red-soft), transparent 28%),
    radial-gradient(circle at bottom right, var(--brand-blue-soft), transparent 28%),
    #f8f8fa;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22px 30px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid var(--brand-border);
  backdrop-filter: blur(10px);
}

.topbar h1 {
  margin: 0;
  font-size: 24px;
  color: var(--brand-black);
}

.logout-btn {
  background: var(--brand-black);
  color: var(--brand-white);
  border: none;
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
}

.logout-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.content {
  padding: 40px 24px;
  box-sizing: border-box;
}

.dashboard-grid {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 0.8fr 1.4fr;
  gap: 24px;
  align-items: start;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card,
.class-card,
.posts-card,
.lessons-card {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--brand-border);
  border-radius: 24px;
  padding: 34px 30px;
  box-shadow: 0 18px 45px rgba(17, 17, 17, 0.06);
  backdrop-filter: blur(8px);
}

.badge {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(200, 16, 46, 0.1);
  color: var(--brand-red);
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 18px;
}

.info-card h2,
.class-card h2,
.posts-header h2,
.lessons-header h2 {
  margin: 0 0 10px;
  font-size: 34px;
  color: var(--brand-black);
}

.subtitle {
  margin: 0 0 26px;
  color: #6b7280;
  font-size: 16px;
  line-height: 1.5;
}

.data-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.data-box {
  background: #fcfcfd;
  border: 1px solid var(--brand-border);
  border-radius: 18px;
  padding: 18px;
}

.label {
  display: block;
  font-size: 13px;
  color: #8a8f98;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--brand-black);
}

.student-progress-box {
  background: linear-gradient(135deg, rgba(22, 61, 122, 0.05), rgba(200, 16, 46, 0.05));
  border: 1px solid var(--brand-border);
  border-radius: 18px;
  padding: 18px;
}

.student-progress-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 10px;
}

.mini-label {
  display: block;
  font-size: 12px;
  color: #8a8f98;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.student-progress-title {
  display: block;
  font-size: 20px;
  color: var(--brand-black);
}

.student-progress-text {
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
}

.status-pill,
.lesson-status-pill,
.submitted-badge {
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.status-green,
.status-done {
  background: #dcfce7;
  color: #166534;
}

.status-yellow,
.status-warning {
  background: #fef3c7;
  color: #92400e;
}

.status-red {
  background: #fee2e2;
  color: #991b1b;
}

.status-neutral,
.status-pending {
  background: rgba(22, 61, 122, 0.1);
  color: var(--brand-blue);
}

.text {
  margin: 0 0 18px;
  color: #555;
  font-size: 17px;
  line-height: 1.6;
}

.next-class-box {
  background: #fcfcfd;
  border: 1px solid var(--brand-border);
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 18px;
}

.next-class-label {
  display: block;
  font-size: 12px;
  color: #8a8f98;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
}

.next-class-value {
  display: block;
  font-size: 18px;
  color: var(--brand-black);
}

.zoom-btn {
  width: 100%;
  background: linear-gradient(90deg, var(--brand-red), var(--brand-blue));
  color: var(--brand-white);
  border: none;
  padding: 15px 22px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 12px 28px rgba(22, 61, 122, 0.18);
}

.zoom-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.not-available {
  margin: 0;
  color: #6b7280;
  font-size: 15px;
  line-height: 1.6;
}

.mensaje {
  margin-top: 18px;
  color: #444;
  font-size: 15px;
}

.lessons-header,
.posts-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.lessons-header p,
.posts-header p {
  margin: 0 0 22px;
  color: #6b7280;
  line-height: 1.5;
}

.lesson-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.lesson-filter-btn {
  border: 1px solid var(--brand-border);
  background: var(--brand-white);
  color: var(--brand-black);
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.lesson-filter-btn.active {
  background: linear-gradient(90deg, var(--brand-red), var(--brand-blue));
  color: var(--brand-white);
  border-color: transparent;
}

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 12px;
  padding: 0 6px;
}

.lesson-filter-btn:not(.active) .filter-count {
  background: #f3f4f6;
}

.lessons-list,
.posts-list,
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lesson-card,
.post-card {
  border: 1px solid var(--brand-border);
  border-radius: 20px;
  padding: 18px;
  background: #fcfcfd;
}

.lesson-card-compact {
  padding: 14px 16px;
}

.lesson-main-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.lesson-main-left {
  flex: 1;
  min-width: 0;
}

.lesson-top,
.post-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.lesson-top h3,
.post-top h3 {
  margin: 0 0 4px;
  font-size: 22px;
  color: var(--brand-black);
}

.lesson-top small,
.post-top small {
  color: #6b7280;
}

.lesson-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 0;
}

.lesson-mini-box {
  background: var(--brand-white);
  border: 1px solid var(--brand-border);
  border-radius: 16px;
  padding: 14px;
}

.lesson-mini-label {
  display: block;
  font-size: 12px;
  color: #8a8f98;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 6px;
}

.lesson-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.lesson-actions-side {
  flex-direction: column;
  align-items: stretch;
  min-width: 170px;
}

.lesson-actions-inline {
  align-items: center;
  flex-shrink: 0;
}

.lesson-link-btn,
.lesson-toggle-btn,
.submit-quiz-btn,
.comment-btn {
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  text-align: center;
}

.lesson-link-btn {
  background: var(--brand-blue);
  color: var(--brand-white);
  text-decoration: none;
}

.lesson-toggle-btn {
  background: var(--brand-white);
  color: var(--brand-black);
  border: 1px solid var(--brand-border);
}

.compact-btn {
  padding: 10px 14px;
  font-size: 13px;
}

.submit-quiz-btn,
.comment-btn {
  background: linear-gradient(90deg, var(--brand-red), var(--brand-blue));
  color: var(--brand-white);
}

.lesson-link-btn:hover,
.submit-quiz-btn:hover,
.comment-btn:hover,
.lesson-toggle-btn:hover {
  opacity: 0.95;
}

.lesson-compact-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: nowrap;
}

.lesson-compact-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: thin;
}

.compact-date,
.compact-book,
.compact-unit,
.compact-score,
.compact-percent {
  white-space: nowrap;
  color: var(--brand-black);
  font-size: 14px;
}

.compact-score {
  color: var(--brand-blue);
  font-weight: 700;
}

.compact-percent {
  color: var(--brand-red);
  font-weight: 700;
}

.compact-separator {
  color: #9ca3af;
  white-space: nowrap;
}

.lesson-panel {
  margin-top: 18px;
  border-top: 1px solid var(--brand-border);
  padding-top: 18px;
}

.submitted-box {
  background: var(--brand-white);
  border: 1px solid var(--brand-border);
  border-radius: 18px;
  padding: 16px;
}

.submitted-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 8px;
}

.submitted-top h4 {
  margin: 0;
  font-size: 22px;
}

.submitted-date {
  margin: 0;
  color: #6b7280;
}

.student-question-card {
  background: var(--brand-white);
  border: 1px solid var(--brand-border);
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 14px;
}

.student-question-card h4 {
  margin: 0 0 10px;
  font-size: 18px;
}

.student-question-text {
  margin: 0 0 14px;
  color: #374151;
  line-height: 1.6;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #fcfcfd;
  border: 1px solid var(--brand-border);
  border-radius: 14px;
  padding: 12px;
  cursor: pointer;
}

.option-item input {
  margin-top: 3px;
  accent-color: var(--brand-red);
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
  border: 1px solid var(--brand-border);
}

.post-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 18px;
}

.comments-section {
  margin-top: 12px;
  border-top: 1px solid var(--brand-border);
  padding-top: 18px;
}

.comments-title {
  margin: 0 0 14px;
  font-size: 18px;
  color: var(--brand-black);
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}

.comment-textarea {
  width: 100%;
  min-height: 90px;
  resize: vertical;
  box-sizing: border-box;
  border: 1px solid var(--brand-border);
  border-radius: 14px;
  padding: 14px;
  font-size: 14px;
  font-family: inherit;
  background: var(--brand-white);
}

.comment-btn:disabled,
.submit-quiz-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.comment-item {
  background: var(--brand-white);
  border: 1px solid var(--brand-border);
  border-radius: 16px;
  padding: 14px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.comment-header small {
  color: #6b7280;
}

.comment-meta {
  margin: 0 0 8px;
  font-size: 13px;
  color: #8a8f98;
}

.comment-content {
  margin: 0;
  color: #374151;
  line-height: 1.6;
  white-space: pre-line;
}

.reply-toggle-btn {
  margin-top: 12px;
  border: none;
  background: transparent;
  color: var(--brand-blue);
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.reply-box {
  margin-top: 12px;
}

.reply-textarea {
  min-height: 80px;
  margin-bottom: 10px;
}

.replies-list {
  margin-top: 14px;
  padding-left: 18px;
  border-left: 2px solid rgba(22, 61, 122, 0.18);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reply-item {
  background: #f9fafb;
  border: 1px solid var(--brand-border);
  border-radius: 14px;
  padding: 12px;
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

@media (max-width: 980px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .info-card h2,
  .class-card h2,
  .posts-header h2,
  .lessons-header h2 {
    font-size: 28px;
  }

  .post-footer,
  .comment-header,
  .lesson-top,
  .submitted-top,
  .student-progress-top,
  .lesson-main-row,
  .lessons-header,
  .posts-header,
  .lesson-compact-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .lesson-meta-grid {
    grid-template-columns: 1fr;
  }

  .lesson-actions-side,
  .lesson-actions-inline {
    width: 100%;
    min-width: 0;
    flex-direction: row;
    flex-wrap: wrap;
  }

  .lesson-compact-main {
    flex-wrap: wrap;
    overflow-x: visible;
  }
}
</style>