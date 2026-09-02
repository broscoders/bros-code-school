// Third seed pass: everything seedMockData.ts / seedMockData2.ts did not
// cover - Quiz/Online-Exams, LMS (Course/Lesson/Progress), Academy
// (Program/Batch/Enrollment), Library, Transport, Discounts/Refunds,
// LeaveRequests, MaintenanceTicket, Survey, and AutomationRule.
// Attaches everything to the SAME school and the same specific test
// teacher/student/parent accounts (bsft25030@itu.edu.pk /
// tailorstory4@gmail.com / hafizdaniyl17@gmail.com) that
// seedTestUsers.ts already created, so logging in as those accounts shows
// real, populated dashboards and charts across every module - not just the
// core academic ones the first two scripts covered.
//
// Idempotent: safe to run more than once (checks for existing records
// before creating).
//
// Run with: npx tsx src/scripts/seedMockData3.ts

import mongoose from "mongoose";
import dotenv from "dotenv";
import School from "../models/School";
import AcademicSession from "../models/AcademicSession";
import ClassModel from "../models/ClassModel";
import Section from "../models/Section";
import Subject from "../models/Subject";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import Parent from "../models/Parent";
import User from "../models/User";
import Quiz from "../models/Quiz";
import QuizAttempt from "../models/QuizAttempt";
import Course from "../models/Course";
import Lesson from "../models/Lesson";
import LessonProgress from "../models/LessonProgress";
import AcademyProgram from "../models/AcademyProgram";
import AcademyBatch from "../models/AcademyBatch";
import AcademyEnrollment from "../models/AcademyEnrollment";
import LibraryBook from "../models/LibraryBook";
import LibraryTransaction from "../models/LibraryTransaction";
import Vehicle from "../models/Vehicle";
import TransportAssignment from "../models/TransportAssignment";
import Discount from "../models/Discount";
import Refund from "../models/Refund";
import Invoice from "../models/Invoice";
import LeaveRequest from "../models/LeaveRequest";
import MaintenanceTicket from "../models/MaintenanceTicket";
import Survey from "../models/Survey";
import SurveyResponse from "../models/SurveyResponse";
import AutomationRule from "../models/AutomationRule";

dotenv.config();

const SCHOOL_ID = "6a7a34b8f4bf247132b2fe3e";
const TEST_TEACHER_EMAIL = "bsft25030@itu.edu.pk";
const TEST_STUDENT_EMAIL = "tailorstory4@gmail.com";
const TEST_PARENT_EMAIL = "hafizdaniyl17@gmail.com";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to MongoDB");

  const school = await School.findById(SCHOOL_ID);
  if (!school) throw new Error("School not found - run seedTestUsers.ts and seedMockData.ts first");
  const schoolId = school._id as mongoose.Types.ObjectId;

  const session = await AcademicSession.findOne({ schoolId, isActive: true });
  if (!session) throw new Error("No active session - run seedMockData.ts first");

  const testTeacherUser = await User.findOne({ email: TEST_TEACHER_EMAIL });
  const testStudentUser = await User.findOne({ email: TEST_STUDENT_EMAIL });
  const testParentUser = await User.findOne({ email: TEST_PARENT_EMAIL });
  if (!testTeacherUser || !testStudentUser || !testParentUser) {
    throw new Error("Test teacher/student/parent accounts not found - run seedTestUsers.ts first");
  }

  const testTeacher = await Teacher.findOne({ userId: testTeacherUser._id });
  const testStudent = await Student.findOne({ userId: testStudentUser._id });
  const testParent = await Parent.findOne({ userId: testParentUser._id });
  if (!testTeacher || !testStudent) throw new Error("Test teacher/student profiles missing");

  // Also grab a handful of the demo students/teachers seedMockData.ts made,
  // so class-wide views (results, results boards, batch rosters) have more
  // than one row in them.
  const demoStudents = await Student.find({ schoolId, admissionNumber: /^ADM-DEMO-/ }).limit(8);
  const allStudents = [testStudent, ...demoStudents.filter((s) => s._id.toString() !== testStudent._id.toString())];
  const demoTeachers = await Teacher.find({ schoolId, employeeId: /^EMP-DEMO-/ }).limit(3);
  const anyOtherTeacher = demoTeachers[0] || testTeacher;

  const cls = await ClassModel.findOne({ schoolId, _id: testStudent.classId });
  const subject = await Subject.findOne({ schoolId, classId: testStudent.classId });

  // ---------- Quiz / Online Exams ----------
  console.log("Seeding quizzes + attempts...");
  if (cls && subject) {
    let quiz = await Quiz.findOne({ schoolId, title: "Algebra Basics Quiz" });
    if (!quiz) {
      quiz = await Quiz.create({
        schoolId,
        classId: cls._id,
        sectionId: testStudent.sectionId,
        subjectId: subject._id,
        title: "Algebra Basics Quiz",
        description: "Covers linear equations and basic factoring.",
        timeLimitMinutes: 20,
        isPublished: true,
        allowRetake: true,
        maxAttempts: 3,
        createdBy: anyOtherTeacher._id,
        questions: [
          { questionText: "What is 2x + 3 = 7, x = ?", options: ["1", "2", "3", "4"], correctOptionIndex: 1 },
          { questionText: "Factor: x^2 - 9", options: ["(x-3)(x+3)", "(x-9)(x+1)", "(x-3)^2", "(x+9)(x-1)"], correctOptionIndex: 0 },
          { questionText: "Simplify: 3(x + 2)", options: ["3x + 2", "3x + 6", "x + 6", "3x + 5"], correctOptionIndex: 1 },
        ],
      });
    }
    const existingAttempt = await QuizAttempt.findOne({ quizId: quiz._id, studentId: testStudent._id });
    if (!existingAttempt) {
      await QuizAttempt.create({
        schoolId,
        quizId: quiz._id,
        studentId: testStudent._id,
        attemptNumber: 1,
        answers: [1, 0, 1],
        score: 3,
        totalQuestions: 3,
        status: "SUBMITTED",
        startedAt: daysAgo(5),
        submittedAt: daysAgo(5),
      });
    }
    // A couple of other students' attempts so the teacher's results view
    // has a real leaderboard, not just one row.
    for (const [i, s] of demoStudents.slice(0, 4).entries()) {
      const has = await QuizAttempt.findOne({ quizId: quiz._id, studentId: s._id });
      if (!has) {
        const score = 1 + (i % 3);
        await QuizAttempt.create({
          schoolId, quizId: quiz._id, studentId: s._id, attemptNumber: 1,
          answers: [1, 0, i % 2], score, totalQuestions: 3, status: "SUBMITTED",
          startedAt: daysAgo(4 + i), submittedAt: daysAgo(4 + i),
        });
      }
    }
  }

  // ---------- LMS ----------
  console.log("Seeding LMS course + lessons + progress...");
  if (cls && subject) {
    let course = await Course.findOne({ schoolId, title: "Introduction to Algebra" });
    if (!course) {
      course = await Course.create({
        schoolId, classId: cls._id, subjectId: subject._id,
        title: "Introduction to Algebra", description: "A short structured course covering the basics.",
        createdBy: anyOtherTeacher._id, isPublished: true,
      });
    }
    const lessonTitles = [
      { title: "What is Algebra?", contentType: "TEXT" as const, textContent: "Algebra uses letters to represent numbers..." },
      { title: "Solving Simple Equations", contentType: "VIDEO" as const, contentUrl: "https://example.com/video1" },
      { title: "Practice Worksheet", contentType: "PDF" as const, contentUrl: "https://example.com/worksheet.pdf" },
    ];
    const lessons = [];
    for (let i = 0; i < lessonTitles.length; i++) {
      let lesson = await Lesson.findOne({ schoolId, courseId: course._id, title: lessonTitles[i].title });
      if (!lesson) lesson = await Lesson.create({ schoolId, courseId: course._id, order: i, ...lessonTitles[i] });
      lessons.push(lesson);
    }
    // Test student completed the first two, in progress on the third.
    for (let i = 0; i < lessons.length; i++) {
      const status = i < 2 ? "COMPLETED" : "IN_PROGRESS";
      const existing = await LessonProgress.findOne({ studentId: testStudent._id, lessonId: lessons[i]._id });
      if (!existing) {
        await LessonProgress.create({
          schoolId, studentId: testStudent._id, courseId: course._id, lessonId: lessons[i]._id,
          status, completedAt: status === "COMPLETED" ? daysAgo(3 - i) : undefined,
        });
      }
    }
  }

  // ---------- Academy ----------
  console.log("Seeding academy program + batch + enrollment...");
  let program = await AcademyProgram.findOne({ schoolId, name: "Spoken English Program" });
  if (!program) program = await AcademyProgram.create({ schoolId, name: "Spoken English Program", description: "After-school spoken English classes." });
  let batch = await AcademyBatch.findOne({ schoolId, programId: program._id, name: "Evening Batch A" });
  if (!batch) {
    batch = await AcademyBatch.create({
      schoolId, programId: program._id, name: "Evening Batch A",
      days: ["Mon", "Wed"], startTime: "17:00", endTime: "18:00",
      teacherId: anyOtherTeacher._id, startDate: daysAgo(30), endDate: daysAgo(-60),
      capacity: 20, room: "Room 3", status: "ACTIVE",
    });
  }
  const academyEnrollExisting = await AcademyEnrollment.findOne({ batchId: batch._id, studentId: testStudent._id });
  if (!academyEnrollExisting) {
    await AcademyEnrollment.create({ schoolId, studentId: testStudent._id, batchId: batch._id, isActive: true });
  }

  // ---------- Library ----------
  console.log("Seeding library books + transactions...");
  const bookData = [
    { title: "To Kill a Mockingbird", author: "Harper Lee", category: "Fiction" },
    { title: "A Brief History of Time", author: "Stephen Hawking", category: "Science" },
    { title: "The Elements of Style", author: "Strunk & White", category: "Reference" },
  ];
  const books = [];
  for (const b of bookData) {
    let book = await LibraryBook.findOne({ schoolId, title: b.title });
    if (!book) book = await LibraryBook.create({ schoolId, ...b, totalCopies: 5, availableCopies: 4 });
    books.push(book);
  }
  const existingIssue = await LibraryTransaction.findOne({ schoolId, studentId: testStudent._id });
  if (!existingIssue) {
    await LibraryTransaction.create({
      schoolId, bookId: books[0]._id, studentId: testStudent._id,
      issueDate: daysAgo(10), dueDate: daysAgo(-4), status: "ISSUED",
    });
    if (demoStudents[0]) {
      await LibraryTransaction.create({
        schoolId, bookId: books[1]._id, studentId: demoStudents[0]._id,
        issueDate: daysAgo(20), dueDate: daysAgo(6), returnDate: daysAgo(5), status: "RETURNED",
      });
    }
  }

  // ---------- Transport ----------
  console.log("Seeding transport vehicle + assignment...");
  let vehicle = await Vehicle.findOne({ schoolId, vehicleNumber: "LEA-1234" });
  if (!vehicle) {
    vehicle = await Vehicle.create({
      schoolId, vehicleNumber: "LEA-1234", driverName: "Nasir Ahmed", driverContact: "0300-1234567",
      routeName: "Route A - Model Town", stops: ["Model Town Link Road", "Township Chowk", "School Gate"],
    });
  }
  const existingAssignment = await TransportAssignment.findOne({ schoolId, studentId: testStudent._id });
  if (!existingAssignment) {
    await TransportAssignment.create({ schoolId, studentId: testStudent._id, vehicleId: vehicle._id, monthlyFee: 3000, isActive: true });
  }

  // ---------- Discounts / Refunds (need an invoice to attach a refund to) ----------
  console.log("Seeding a discount + a refund...");
  const existingDiscount = await Discount.findOne({ schoolId, studentId: testStudent._id });
  if (!existingDiscount) {
    await Discount.create({
      schoolId, studentId: testStudent._id, type: "SCHOLARSHIP",
      reason: "Merit scholarship - top of class last term", percentage: 20,
      status: "APPROVED", isActive: true,
    });
  }
  const anyInvoice = await Invoice.findOne({ schoolId, studentId: testStudent._id });
  const existingRefund = await Refund.findOne({ schoolId, studentId: testStudent._id });
  if (anyInvoice && !existingRefund) {
    await Refund.create({
      schoolId, studentId: testStudent._id, invoiceId: anyInvoice._id,
      amount: 500, reason: "Overpayment adjustment", status: "PENDING",
    });
  }

  // ---------- Leave Requests ----------
  console.log("Seeding leave requests...");
  const existingLeave = await LeaveRequest.findOne({ schoolId, studentId: testStudent._id });
  if (!existingLeave) {
    await LeaveRequest.create({
      schoolId, requestedBy: testParentUser._id, studentId: testStudent._id, type: "STUDENT",
      reason: "Family function out of town", date: daysAgo(-3), status: "PENDING",
    });
  }
  const existingTeacherLeave = await LeaveRequest.findOne({ schoolId, teacherId: testTeacher._id });
  if (!existingTeacherLeave) {
    await LeaveRequest.create({
      schoolId, requestedBy: testTeacherUser._id, teacherId: testTeacher._id, type: "TEACHER",
      reason: "Medical appointment", date: daysAgo(-1), status: "APPROVED",
    });
  }

  // ---------- Maintenance ----------
  console.log("Seeding maintenance tickets...");
  const ticketCount = await MaintenanceTicket.countDocuments({ schoolId });
  if (ticketCount === 0) {
    await MaintenanceTicket.create([
      { schoolId, reportedBy: testTeacherUser._id, title: "Projector not working - Room 3", description: "Bulb seems dead, no display.", priority: "HIGH", status: "REPORTED" },
      { schoolId, reportedBy: testTeacherUser._id, title: "AC leaking - staff room", description: "Water dripping from unit.", priority: "MEDIUM", status: "IN_PROGRESS", assignedTo: "Facilities team" },
      { schoolId, reportedBy: testTeacherUser._id, title: "Broken chair - Grade 9 classroom", description: "One chair has a broken leg.", priority: "LOW", status: "RESOLVED", resolutionNotes: "Replaced with spare chair." },
    ]);
  }

  // ---------- Survey ----------
  console.log("Seeding a survey + a response...");
  let survey = await Survey.findOne({ schoolId, title: "Parent Satisfaction Survey" });
  if (!survey) {
    survey = await Survey.create({
      schoolId, title: "Parent Satisfaction Survey",
      description: "Help us improve - takes 2 minutes.",
      questions: ["How satisfied are you with communication from teachers?", "How would you rate the school facilities?"],
      targetAudience: "PARENTS", isActive: true,
    });
  }
  const existingResponse = await SurveyResponse.findOne({ surveyId: survey._id, respondedBy: testParentUser._id });
  if (!existingResponse) {
    await SurveyResponse.create({ surveyId: survey._id, respondedBy: testParentUser._id, answers: ["Very satisfied", "Good"] });
  }

  // ---------- Automation ----------
  console.log("Seeding automation rules...");
  const ruleCount = await AutomationRule.countDocuments({ schoolId });
  if (ruleCount === 0) {
    await AutomationRule.create([
      { schoolId, triggerEvent: "STUDENT_ABSENT", isActive: true, messageTemplate: "{studentName} was marked absent today." },
      { schoolId, triggerEvent: "FEE_DUE_SOON", isActive: true, messageTemplate: "A fee payment for {studentName} is due soon." },
      { schoolId, triggerEvent: "RESULT_PUBLISHED", isActive: true, messageTemplate: "Results for {examName} have been published." },
    ]);
  }

  console.log("\nDone. Seeded/verified: Quiz+Attempts, LMS Course+Lessons+Progress, Academy Program+Batch+Enrollment, Library, Transport, Discount+Refund, LeaveRequests, MaintenanceTickets, Survey+Response, AutomationRules.");
  console.log(`All attached to schoolId ${schoolId} and test accounts (${TEST_TEACHER_EMAIL} / ${TEST_STUDENT_EMAIL} / ${TEST_PARENT_EMAIL}).`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
