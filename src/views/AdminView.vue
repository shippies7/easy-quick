<template>
  <div style="padding: 40px;">
    <h1>Panel Admin</h1>

    <div
      style="
        display: grid;
        grid-template-columns: repeat(3, minmax(280px, 1fr));
        gap: 24px;
        align-items: start;
      "
    >
      <div
        style="
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 24px;
          background: #fff;
        "
      >
        <h2>Crear Profesor</h2>

        <input
          v-model="teacherName"
          placeholder="Nombre del profesor"
          style="width: 100%; padding: 10px; margin-bottom: 12px;"
        />

        <input
          v-model="teacherEmail"
          placeholder="Correo del profesor"
          style="width: 100%; padding: 10px; margin-bottom: 12px;"
        />

        <label style="display: block; margin-bottom: 6px;">Grupo asignado</label>
        <select
          v-model="assignedGroupId"
          style="width: 100%; padding: 10px; margin-bottom: 12px;"
        >
          <option value="">Pendiente de asignar</option>
          <option
            v-for="group in groups"
            :key="group.id"
            :value="group.id"
          >
            {{ group.groupCode || group.name || group.id }}
          </option>
        </select>

        <button @click="createTeacher" style="padding: 10px 16px;">
          Crear profesor
        </button>
      </div>

      <div
        style="
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 24px;
          background: #fff;
        "
      >
        <h2>Crear Grupo</h2>

        <label style="display: block; margin-bottom: 6px;">Profesor</label>
        <select
          v-model="teacherId"
          style="width: 100%; padding: 10px; margin-bottom: 12px;"
        >
          <option value="">Pendiente de asignar</option>
          <option
            v-for="teacher in teachers"
            :key="teacher.id"
            :value="teacher.id"
          >
            {{ teacher.teacherCode }} | {{ teacher.name }}
          </option>
        </select>

        <label style="display: block; margin-bottom: 6px;">Horario</label>
        <select
          v-model="scheduleType"
          style="width: 100%; padding: 10px; margin-bottom: 12px;"
        >
          <option disabled value="">Selecciona horario</option>
          <option value="lmv">Lunes, Miércoles, Viernes</option>
          <option value="mj">Martes y Jueves</option>
          <option value="sabado">Sabatino</option>
        </select>

        <label style="display: block; margin-bottom: 6px;">Hora</label>
        <select
          v-model="classTime"
          style="width: 100%; padding: 10px; margin-bottom: 12px;"
        >
          <option disabled value="">Selecciona hora</option>
          <option value="8am">8:00 am</option>
          <option value="9am">9:00 am</option>
          <option value="1pm">1:00 pm</option>
          <option value="5pm">5:00 pm</option>
          <option value="8pm">8:00 pm</option>
        </select>

        <label style="display: block; margin-bottom: 6px;">Fecha de inicio</label>
        <input
          v-model="startDate"
          type="date"
          style="width: 100%; padding: 10px; margin-bottom: 12px;"
        />

        <button @click="createGroup" style="padding: 10px 16px;">
          Crear grupo
        </button>
      </div>

      <div
        style="
          border: 1px solid #ddd;
          border-radius: 12px;
          padding: 24px;
          background: #fff;
        "
      >
        <h2>Crear Alumno</h2>

        <input
          v-model="studentName"
          placeholder="Nombre del alumno"
          style="width: 100%; padding: 10px; margin-bottom: 12px;"
        />

        <input
          v-model="studentEmail"
          placeholder="Correo del alumno"
          style="width: 100%; padding: 10px; margin-bottom: 12px;"
        />

        <label style="display: block; margin-bottom: 6px;">Grupo</label>
        <select
          v-model="studentGroupId"
          style="width: 100%; padding: 10px; margin-bottom: 12px;"
        >
          <option disabled value="">Selecciona grupo</option>
          <option
            v-for="group in groups"
            :key="group.id"
            :value="group.id"
          >
            {{ group.groupCode }} | {{ group.scheduleType }} | {{ group.classTime }}
          </option>
        </select>

        <button @click="createStudent" style="padding: 10px 16px;">
          Crear alumno
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '../firebase'
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore'

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

    alert(`Profesor creado: ${teacherCode} 🔥`)

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

    await addDoc(collection(db, 'groups'), {
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

    alert(`Grupo creado: ${groupCode} 🔥`)

    teacherId.value = ''
    scheduleType.value = ''
    classTime.value = ''
    startDate.value = ''

    await loadGroups()
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

    alert(`Alumno creado: ${studentCode} 🔥`)

    studentName.value = ''
    studentEmail.value = ''
    studentGroupId.value = ''

    await loadGroups()
  } catch (error) {
    console.error('Error al crear alumno:', error)
    alert('Hubo un error al crear el alumno')
  }
}

onMounted(async () => {
  await loadTeachers()
  await loadGroups()
})
</script>