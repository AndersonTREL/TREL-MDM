import { PrismaClient, Role, OnboardingStepStatus } from '@prisma/client'
import { hashPassword } from '../lib/crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create Admin user
  const adminPassword = await hashPassword('Admin123!')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@treelogistics.com' },
    update: {},
    create: {
      email: 'admin@treelogistics.com',
      name: 'System Admin',
      password: adminPassword,
      role: Role.ADMIN,
      status: 'ACTIVE',
      locale: 'en',
      twoFactorEnabled: false,
    },
  })
  console.log('✅ Created admin user:', admin.email)

  // Create Inspector user
  const inspectorPassword = await hashPassword('Inspector123!')
  const inspector = await prisma.user.upsert({
    where: { email: 'inspector@treelogistics.com' },
    update: {},
    create: {
      email: 'inspector@treelogistics.com',
      name: 'John Inspector',
      password: inspectorPassword,
      role: Role.INSPECTOR,
      status: 'ACTIVE',
      locale: 'en',
      twoFactorEnabled: false,
    },
  })
  console.log('✅ Created inspector user:', inspector.email)

  // Create Driver users
  const driver1Password = await hashPassword('Driver123!')
  const driver1 = await prisma.user.upsert({
    where: { email: 'driver1@example.com' },
    update: {},
    create: {
      email: 'driver1@example.com',
      name: 'Max Mustermann',
      password: driver1Password,
      role: Role.DRIVER,
      status: 'ACTIVE',
      locale: 'de',
      phone: '+491234567890',
      driverProfile: {
        create: {
          dateOfBirth: new Date('1990-05-15'),
          placeOfBirth: 'Berlin',
          placeOfBirthDe: 'Berlin',
          nationality: 'German',
          nationalityDe: 'Deutsch',
          maritalStatus: 'MARRIED',
          healthInsuranceCompany: 'AOK',
          healthInsuranceCompanyDe: 'AOK',
          taxClass: 'CLASS_3',
          churchAffiliation: 'NONE',
          childAllowance: true,
          childFactor: 'ONE',
          otherEmployment: false,
          isMainEmployer: true,
        },
      },
    },
  })
  console.log('✅ Created driver1:', driver1.email)

  const driver2Password = await hashPassword('Driver123!')
  const driver2 = await prisma.user.upsert({
    where: { email: 'driver2@example.com' },
    update: {},
    create: {
      email: 'driver2@example.com',
      name: 'Anna Schmidt',
      password: driver2Password,
      role: Role.DRIVER,
      status: 'ACTIVE',
      locale: 'de',
      phone: '+491234567891',
      driverProfile: {
        create: {
          dateOfBirth: new Date('1995-08-20'),
          placeOfBirth: 'Munich',
          placeOfBirthDe: 'München',
          nationality: 'German',
          nationalityDe: 'Deutsch',
          maritalStatus: 'SINGLE',
          healthInsuranceCompany: 'TK',
          healthInsuranceCompanyDe: 'TK',
          taxClass: 'CLASS_1',
          churchAffiliation: 'EVANGELICAL',
          childAllowance: false,
          childFactor: 'ZERO',
          otherEmployment: false,
          isMainEmployer: true,
        },
      },
    },
  })
  console.log('✅ Created driver2:', driver2.email)

  // Create onboarding progress for drivers
  await prisma.onboardingProgress.upsert({
    where: { userId: driver1.id },
    update: {},
    create: {
      userId: driver1.id,
      profileStep: OnboardingStepStatus.COMPLETED,
      dataFormsStep: OnboardingStepStatus.COMPLETED,
      documentsStep: OnboardingStepStatus.IN_PROGRESS,
      coursesStep: OnboardingStepStatus.NOT_STARTED,
      assessmentStep: OnboardingStepStatus.NOT_STARTED,
      reviewStep: OnboardingStepStatus.NOT_STARTED,
      approvalStep: OnboardingStepStatus.NOT_STARTED,
    },
  })

  await prisma.onboardingProgress.upsert({
    where: { userId: driver2.id },
    update: {},
    create: {
      userId: driver2.id,
      profileStep: OnboardingStepStatus.COMPLETED,
      dataFormsStep: OnboardingStepStatus.IN_PROGRESS,
      documentsStep: OnboardingStepStatus.NOT_STARTED,
      coursesStep: OnboardingStepStatus.NOT_STARTED,
      assessmentStep: OnboardingStepStatus.NOT_STARTED,
      reviewStep: OnboardingStepStatus.NOT_STARTED,
      approvalStep: OnboardingStepStatus.NOT_STARTED,
    },
  })

  // Create sample courses
  const safetyCourse = await prisma.course.create({
    data: {
      title: 'Safety Training',
      titleDe: 'Sicherheitsschulung',
      description: 'Essential safety procedures for all drivers',
      descriptionDe: 'Wesentliche Sicherheitsverfahren für alle Fahrer',
      pointsReward: 100,
      isActive: true,
      modules: {
        create: [
          {
            title: 'Introduction to Safety',
            titleDe: 'Einführung in die Sicherheit',
            description: 'Basic safety concepts',
            descriptionDe: 'Grundlegende Sicherheitskonzepte',
            order: 1,
            lessons: {
              create: [
                {
                  title: 'Welcome to Safety Training',
                  titleDe: 'Willkommen zur Sicherheitsschulung',
                  contentType: 'text',
                  content: 'Safety is our top priority...',
                  contentDe: 'Sicherheit hat oberste Priorität...',
                  order: 1,
                },
              ],
            },
          },
        ],
      },
    },
  })
  console.log('✅ Created safety course:', safetyCourse.title)

  const complianceCourse = await prisma.course.create({
    data: {
      title: 'Compliance & Regulations',
      titleDe: 'Compliance & Vorschriften',
      description: 'Understanding transportation regulations',
      descriptionDe: 'Verständnis der Transportvorschriften',
      pointsReward: 150,
      isActive: true,
    },
  })
  console.log('✅ Created compliance course:', complianceCourse.title)

  // Create sample quiz
  const safetyQuiz = await prisma.quiz.create({
    data: {
      title: 'Safety Knowledge Check',
      titleDe: 'Sicherheitswissensprüfung',
      description: 'Test your safety knowledge',
      descriptionDe: 'Testen Sie Ihr Sicherheitswissen',
      courseId: safetyCourse.id,
      timeLimit: 30,
      passingScore: 80,
      pointsReward: 50,
      isActive: true,
      questions: {
        create: [
          {
            text: 'What should you do before starting the vehicle?',
            textDe: 'Was sollten Sie tun, bevor Sie das Fahrzeug starten?',
            type: 'MCQ',
            order: 1,
            options: {
              create: [
                {
                  text: 'Check all mirrors and surroundings',
                  textDe: 'Überprüfen Sie alle Spiegel und die Umgebung',
                  isCorrect: true,
                  order: 1,
                },
                {
                  text: 'Start immediately',
                  textDe: 'Sofort starten',
                  isCorrect: false,
                  order: 2,
                },
                {
                  text: 'Honk the horn',
                  textDe: 'Hupen',
                  isCorrect: false,
                  order: 3,
                },
              ],
            },
          },
          {
            text: 'Is it mandatory to wear seatbelts?',
            textDe: 'Ist das Tragen von Sicherheitsgurten Pflicht?',
            type: 'TRUE_FALSE',
            order: 2,
            options: {
              create: [
                {
                  text: 'True',
                  textDe: 'Wahr',
                  isCorrect: true,
                  order: 1,
                },
                {
                  text: 'False',
                  textDe: 'Falsch',
                  isCorrect: false,
                  order: 2,
                },
              ],
            },
          },
        ],
      },
    },
  })
  console.log('✅ Created safety quiz:', safetyQuiz.title)

  // Enroll drivers in courses
  await prisma.enrollment.create({
    data: {
      userId: driver1.id,
      courseId: safetyCourse.id,
      status: 'ASSIGNED',
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  })

  await prisma.enrollment.create({
    data: {
      userId: driver2.id,
      courseId: safetyCourse.id,
      status: 'ASSIGNED',
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.enrollment.create({
    data: {
      userId: driver1.id,
      courseId: complianceCourse.id,
      status: 'ASSIGNED',
      dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  // Create sample documents with expiry dates
  await prisma.document.create({
    data: {
      userId: driver1.id,
      type: 'DRIVERS_LICENSE_FRONT',
      urls: ['https://example.com/driver1-license-front.jpg'],
      status: 'APPROVED',
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      reviewerId: inspector.id,
      reviewedAt: new Date(),
    },
  })

  await prisma.document.create({
    data: {
      userId: driver1.id,
      type: 'ID_CARD_FRONT',
      urls: ['https://example.com/driver1-id-front.jpg'],
      status: 'PENDING_REVIEW',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now (will trigger reminder)
    },
  })

  // Create FAQs
  await prisma.fAQ.createMany({
    data: [
      {
        question: 'How do I upload documents?',
        questionDe: 'Wie lade ich Dokumente hoch?',
        answer: 'Navigate to the Documents section and click on Upload Document button.',
        answerDe: 'Navigieren Sie zum Abschnitt Dokumente und klicken Sie auf die Schaltfläche Dokument hochladen.',
        category: 'Documents',
        categoryDe: 'Dokumente',
        order: 1,
      },
      {
        question: 'What happens if I fail a quiz?',
        questionDe: 'Was passiert, wenn ich ein Quiz nicht bestehe?',
        answer: 'You can retake the quiz after reviewing the course material.',
        answerDe: 'Sie können das Quiz nach Überprüfung des Kursmaterials erneut ablegen.',
        category: 'Courses',
        categoryDe: 'Kurse',
        order: 2,
      },
    ],
  })

  // Create settings
  await prisma.setting.upsert({
    where: { key: 'MAX_FILE_SIZE_MB' },
    update: {},
    create: {
      key: 'MAX_FILE_SIZE_MB',
      value: 10,
    },
  })

  await prisma.setting.upsert({
    where: { key: 'EXPIRY_REMINDER_DAYS' },
    update: {},
    create: {
      key: 'EXPIRY_REMINDER_DAYS',
      value: [30, 14, 7, 1],
    },
  })

  console.log('✅ Seeding completed!')
  console.log('\n📝 Login credentials:')
  console.log('Admin: admin@treelogistics.com / Admin123!')
  console.log('Inspector: inspector@treelogistics.com / Inspector123!')
  console.log('Driver 1: driver1@example.com / Driver123!')
  console.log('Driver 2: driver2@example.com / Driver123!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

