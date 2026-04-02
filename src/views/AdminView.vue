<template>
  <div class="admin-page">
    <div class="admin-topbar">
      <h1>Panel Admin</h1>
      <p>Desde aquí puedes crear profesores, grupos, alumnos y asignar profesores a grupos.</p>
    </div>

    <div class="admin-grid">
      <!-- CREAR PROFESOR -->
      <div class="card">
        <h2>Crear Profesor</h2>

        <input
          v-model="teacherName"
          placeholder="Nombre del profesor"
          class="input"
        />

        <input
          v-model="teacherEmail"
          placeholder="Correo del profesor"
          class="input"
        />

        <label class="label">Grupo asignado</label>
        <select v-model="assignedGroupId" class="input">
          <option value="">Pendiente de asignar</option>
          <option
            v-for="group in groups"
            :key="group.id"
            :value="group.id"
          >
            {{ group.groupCode || group.name || group.id }}
          </option>
        </select>

        <button @click="createTeacher" class="primary-btn">
          Crear profesor
        </button>
      </div>

      <!-- CREAR GRUPO -->
      <div class="card">
        <h2>Crear Grupo</h2>

        <label class="label">Profesor</label>
        <select v-model="teacherId" class="input">
          <option value="">Pendiente de asignar</option>
          <option
            v-for="teacher in teachers"
            :key="teacher.id"
            :value="teacher.id"
          >
            {{ teacher.teacherCode }} | {{ teacher.name }}
          </option>
        </select>

        <label class="label">Horario</label>
        <select v-model="scheduleType" class="input">
          <option disabled value="">Selecciona horario</option>
          <option value="lmv">Lunes, Miércoles, Viernes</option>
          <option value="mj">Martes y Jueves</option>
          <option value="sabado">Sabatino</option>
        </select>

        <label class="label">Hora</label>
        <select v-model="classTime" class="input">
          <option disabled value="">Selecciona hora</option>
          <option value="8am">8:00 am</option>
          <option value="9am">9:00 am</option>
          <option value="1pm">1:00 pm</option>
          <option value="5pm">5:00 pm</option>
          <option value="8pm">8:00 pm</option>
        </select>

        <label class="label">Fecha de inicio</label>
        <input
          v-model="startDate"
          type="date"
          class="input"
        />

        <button @click="createGroup" class="primary-btn">
          Crear grupo
        </button>
      </div>

      <!-- CREAR ALUMNO -->
      <div class="card">
        <h2>Crear Alumno</h2>

        <input
          v-model="studentName"
          placeholder="Nombre del alumno"
          class="input"
        />

        <input
          v-model="studentEmail"
          placeholder="Correo del alumno"
          class="input"
        />

        <label class="label">Grupo</label>
        <select v-model="studentGroupId" class="input">
          <option disabled value="">Selecciona grupo</option>
          <option
            v-for="group in groups"
            :key="group.id"
            :value="group.id"
          >
            {{ group.groupCode }} | {{ group.scheduleType }} | {{ group.classTime }}
          </option>
        </select>

        <button @click="createStudent" class="primary-btn">
          Crear alumno
        </button>
      </div>

      <!-- ASIGNAR PROFESOR A GRUPO -->
      <div class="card">
        <h2>Asignar Profesor a Grupo</h2>

        <label class="label">Profesor existente</label>
        <select v-model="assignmentTeacherId" class="input">
          <option value="">Selecciona profesor</option>
          <option
            v-for="teacher in teachers"
            :key="teacher.id"
            :value="teacher.id"
          >
            {{ teacher.teacherCode }} | {{ teacher.name }}
          </option>
        </select>

        <label class="label">Grupo existente</label>
        <select v-model="assignmentGroupId" class="input">
          <option value="">Selecciona grupo</option>
          <option
            v-for="group in groups"
            :key="group.id"
            :value="group.id"
          >
            {{ group.groupCode || group.name || group.id }}
          </option>
        </select>

        <button @click="assignTeacherToGroup" class="primary-btn">
          Guardar asignación
        </button>
      </div>

      <!-- LISTA DE PROFESORES -->
      <div class="card">
        <h2>Profesores actuales</h2>

        <div v-if="teachers.length" class="list">
          <div
            v-for="teacher in teachers"
            :key="teacher.id"
            class="list-item"
          >
            <strong>{{ teacher.teacherCode }} | {{ teacher.name }}</strong>
            <span>{{ teacher.email }}</span>
            <small>Grupo asignado: {{ teacher.assignedGroupId || 'Pendiente' }}</small>
          </div>
        </div>

        <p v-else class="empty-text">No hay profesores todavía.</p>
      </div>

      <!-- LISTA DE GRUPOS -->
      <div class="card">
        <h2>Grupos actuales</h2>

        <div v-if="groups.length" class="list">
          <div
            v-for="group in groups"
            :key="group.id"
            class="list-item"
          >
            <strong>{{ group.groupCode }}</strong>
            <span>{{ group.scheduleType }} | {{ group.classTime }}</span>
            <small>teacherId: {{ group.teacherId || 'Pendiente' }}</small>
          </div>
        </div>

        <p v-else class="empty-text">No hay grupos todavía.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../firebase'
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc
} from 'firebase/firestore'

const teacherName = ref('')
const teacherEmail = ref('')
const assignedGroupId = ref('')

const teacherId = ref('')
const scheduleType = ref('')
const classTime = ref('')
const startDate = ref('')

const studentName = ref('')
const studentEmail = ref('')
const studentGroupId = ref('')

const assignmentTeacherId = ref('')
const assignmentGroupId = ref('')

const teachers = ref([])
const groups = ref([])

const normalizeEmail = (value) =>
  String(value || '').trim().toLowerCase()

const loadTeachers = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'teachers'))
    teachers.value = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }))
  } catch (error) {
    console.error('Error al cargar profesores:', error)
  }
}

const loadGroups = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'groups'))
    groups.value = snapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data()
    }))
  } catch (error) {
    console.error('Error al cargar grupos:', error)
  }
}

const getNextTeacherNumber = async () => {
  const snapshot = await getDocs(collection(db, 'teachers'))
  let maxNumber = 100

  snapshot.forEach((docItem) => {
    const data = docItem.data()
    if (data.teacherNumber && data.teacherNumber > maxNumber) {
      maxNumber = data.teacherNumber
    }
  })

  return maxNumber + 1
}

const getNextGroupNumber = async () => {
  const snapshot = await getDocs(collection(db, 'groups'))
  let maxNumber = 1010

  snapshot.forEach((docItem) => {
    const data = docItem.data()
    if (data.groupNumber && data.groupNumber > maxNumber) {
      maxNumber = data.groupNumber
    }
  })

  return maxNumber + 1
}

const getNextStudentNumber = async () => {
  const snapshot = await getDocs(collection(db, 'students'))
  let maxNumber = 1000

  snapshot.forEach((docItem) => {
    const data = docItem.data()
    if (data.studentNumber && data.studentNumber > maxNumber) {
      maxNumber = data.studentNumber
    }
  })

  return maxNumber + 1
}

const createTeacher = async () => {
  try {
    if (!teacherName.value || !teacherEmail.value) {
      alert('Completa nombre y correo del profesor')
      return
    }

    const nextTeacherNumber = await getNextTeacherNumber()
    const teacherCode = `PRO${nextTeacherNumber}`

    const teacherRef = await addDoc(collection(db, 'teachers'), {
      name: teacherName.value.trim(),
      email: normalizeEmail(teacherEmail.value),
      teacherCode,
      teacherNumber: nextTeacherNumber,
      assignedGroupId: assignedGroupId.value || null,
      status: 'active',
      createdAt: new Date()
    })

    if (assignedGroupId.value) {
      await updateDoc(doc(db, 'groups', assignedGroupId.value), {
        teacherId: teacherRef.id
      })
    }

    alert(`Profesor creado: ${teacherCode}`)

    teacherName.value = ''
    teacherEmail.value = ''
    assignedGroupId.value = ''

    await loadTeachers()
    await loadGroups()
  } catch (error) {
    console.error('Error al crear profesor:', error)
    alert('Hubo un error al crear el profesor')
  }
}

const createGroup = async () => {
  try {
    if (!scheduleType.value || !classTime.value || !startDate.value) {
      alert('Completa horario, hora y fecha de inicio')
      return
    }

    const nextGroupNumber = await getNextGroupNumber()

    const prefix =
      scheduleType.value === 'lmv'
        ? 'LMV'
        : scheduleType.value === 'mj'
        ? 'MJ'
        : 'SAB'

    const groupCode = `${prefix}${nextGroupNumber}`

    const sessionsPerWeek =
      scheduleType.value === 'lmv'
        ? 3
        : scheduleType.value === 'mj'
        ? 2
        : 1

    const groupRef = await addDoc(collection(db, 'groups'), {
      name: groupCode,
      groupCode,
      groupNumber: nextGroupNumber,
      teacherId: teacherId.value || null,
      scheduleType: scheduleType.value,
      classTime: classTime.value,
      sessionsPerWeek,
      startDate: new Date(`${startDate.value}T00:00:00`),
      status: 'active',
      programType: 'intensive-9-months',
      totalSessions: 128,
      studentCount: 0,
      currentUnit: 1,
      currentBook: 'yellow',
      createdAt: new Date()
    })

    if (teacherId.value) {
      await updateDoc(doc(db, 'teachers', teacherId.value), {
        assignedGroupId: groupRef.id
      })
    }

    alert(`Grupo creado: ${groupCode}`)

    teacherId.value = ''
    scheduleType.value = ''
    classTime.value = ''
    startDate.value = ''

    await loadGroups()
    await loadTeachers()
  } catch (error) {
    console.error('Error al crear grupo:', error)
    alert('Hubo un error al crear el grupo')
  }
}

const createStudent = async () => {
  try {
    if (!studentName.value || !studentEmail.value || !studentGroupId.value) {
      alert('Completa nombre, correo y grupo del alumno')
      return
    }

    const selectedGroup = groups.value.find(
      (group) => group.id === studentGroupId.value
    )

    if (!selectedGroup) {
      alert('No se encontró el grupo seleccionado')
      return
    }

    const nextStudentNumber = await getNextStudentNumber()
    const studentCode = `ALU${nextStudentNumber}`

    await addDoc(collection(db, 'students'), {
      name: studentName.value.trim(),
      email: normalizeEmail(studentEmail.value),
      studentCode,
      studentNumber: nextStudentNumber,
      groupId: selectedGroup.id,
      groupCode: selectedGroup.groupCode || null,
      teacherId: selectedGroup.teacherId || null,
      status: 'active',
      absences: 0,
      currentUnit: selectedGroup.currentUnit || 1,
      currentBook: selectedGroup.currentBook || 'yellow',
      createdAt: new Date()
    })

    await updateDoc(doc(db, 'groups', selectedGroup.id), {
      studentCount: (selectedGroup.studentCount || 0) + 1
    })

    alert(`Alumno creado: ${studentCode}`)

    studentName.value = ''
    studentEmail.value = ''
    studentGroupId.value = ''

    await loadGroups()
  } catch (error) {
    console.error('Error al crear el alumno:', error)
    alert('Hubo un error al crear el alumno')
  }
}

const assignTeacherToGroup = async () => {
  try {
    if (!assignmentTeacherId.value || !assignmentGroupId.value) {
      alert('Selecciona profesor y grupo')
      return
    }

    await updateDoc(doc(db, 'groups', assignmentGroupId.value), {
      teacherId: assignmentTeacherId.value
    })

    await updateDoc(doc(db, 'teachers', assignmentTeacherId.value), {
      assignedGroupId: assignmentGroupId.value
    })

    alert('Asignación guardada correctamente')

    assignmentTeacherId.value = ''
    assignmentGroupId.value = ''

    await loadGroups()
    await loadTeachers()
  } catch (error) {
    console.error('Error al asignar profesor a grupo:', error)
    alert('No se pudo guardar la asignación')
  }
}

onMounted(async () => {
  await loadTeachers()
  await loadGroups()
})
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f6f4f1;
  padding: 40px;
  box-sizing: border-box;
}

.admin-topbar {
  margin-bottom: 28px;
}

.admin-topbar h1 {
  margin: 0 0 8px;
  font-size: 36px;
  color: #111827;
}

.admin-topbar p {
  margin: 0;
  color: #6b7280;
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(280px, 1fr));
  gap: 24px;
  align-items: start;
}

.card {
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 24px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.card h2 {
  margin: 0 0 18px;
  color: #111827;
  font-size: 24px;
}

.label {
  display: block;
  margin-bottom: 6px;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  margin-bottom: 12px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #fff;
  font-size: 14px;
}

.primary-btn {
  width: 100%;
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  background: #111827;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.primary-btn:hover {
  opacity: 0.95;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item {
  border: 1px solid #ece7df;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #fbfaf8;
}

.list-item strong {
  color: #111827;
}

.list-item span,
.list-item small {
  color: #6b7280;
  word-break: break-word;
}

.empty-text {
  margin: 0;
  color: #6b7280;
}

@media (max-width: 1100px) {
  .admin-grid {
    grid-template-columns: 1fr;
  }
}
</style>