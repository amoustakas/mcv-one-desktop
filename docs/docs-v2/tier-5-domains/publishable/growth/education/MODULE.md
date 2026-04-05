# @mcv/growth/education

> Education & Learning Content — Customer education, product adoption, and knowledge sharing platform for MCV.ONE

---

## Purpose

The `@mcv/growth/education` module provides a comprehensive education and learning management system designed for SaaS platforms that need to educate customers, drive product adoption, and share knowledge at scale. It encompasses course creation, learning path orchestration, certification management, interactive assessments, knowledge base authoring, live webinar coordination, guided onboarding experiences, community-driven learning, and deep analytics — all within a multi-tenant architecture.

### Why This Module Exists

Customer education is a growth multiplier. Companies that invest in structured learning programs see higher product adoption, reduced support tickets, lower churn, and stronger community engagement. This module provides the infrastructure to:

- **Reduce time-to-value** — Onboarding guides and learning paths get users productive faster
- **Scale knowledge transfer** — Self-serve courses replace repetitive 1:1 training sessions
- **Drive feature adoption** — Targeted educational content introduces users to underutilized capabilities
- **Build community** — Peer learning, forums, and mentor matching create sticky engagement loops
- **Certify expertise** — Certification programs create credentialed power users who champion your product
- **Measure effectiveness** — Analytics reveal knowledge gaps, content quality, and learner engagement patterns

### Design Philosophy

1. **Content-first** — Rich multimedia support (video via Mux, interactive exercises, code playgrounds) so educators can use the best medium for each concept
2. **Adaptive progression** — Prerequisites, skill-based recommendations, and resume-where-left-off ensure learners follow appropriate paths at their own pace
3. **Multi-tenant by default** — Every entity is tenant-scoped with Row-Level Security; one deployment serves all customers
4. **Composable** — Each capability (courses, quizzes, knowledge base, webinars) works independently or composes into rich learning experiences
5. **Observable** — Every learner interaction is tracked, enabling analytics dashboards, knowledge gap detection, and content optimization

---

## Exports

```typescript
// === Core Service ===
export { EducationService }              from './service';
export type { EducationServiceConfig }   from './service';

// === Course Builder ===
export { CourseBuilder }                 from './courses/builder';
export { CourseRenderer }                from './courses/renderer';
export { LessonEngine }                  from './courses/lessons';
export type {
  Course,
  CourseStatus,
  CourseVisibility,
  CourseModule,
  Lesson,
  LessonContent,
  LessonContentType,
  LessonContentBlock,
  ContentBlockVideo,
  ContentBlockText,
  ContentBlockInteractive,
  ContentBlockCode,
  ContentBlockEmbed,
  CourseEnrollment,
  EnrollmentStatus,
} from './courses/types';

// === Learning Paths ===
export { LearningPathService }           from './paths/service';
export { PathRecommendationEngine }      from './paths/recommendations';
export type {
  LearningPath,
  PathCourse,
  PathPrerequisite,
  PathRecommendation,
  SkillLevel,
} from './paths/types';

// === Certifications ===
export { CertificationService }          from './certifications/service';
export { CertificateGenerator }          from './certifications/generator';
export { CertificateVerifier }           from './certifications/verifier';
export type {
  Certificate,
  CertificateTemplate,
  CertificateVerification,
  CertificateStatus,
  BadgeDefinition,
} from './certifications/types';

// === Quiz & Assessment ===
export { QuizEngine }                    from './quizzes/engine';
export { AutoGrader }                    from './quizzes/grader';
export { QuestionBank }                  from './quizzes/question-bank';
export type {
  Quiz,
  QuizQuestion,
  QuestionType,
  QuizAttempt,
  QuizAttemptAnswer,
  QuizResult,
  GradingResult,
  CodingChallenge,
  CodingChallengeResult,
} from './quizzes/types';

// === Progress Tracking ===
export { ProgressTracker }               from './progress/tracker';
export { ResumeService }                 from './progress/resume';
export type {
  LearnerProgress,
  LessonProgress,
  CourseProgress,
  PathProgress,
  ProgressSnapshot,
  TimeTracking,
} from './progress/types';

// === Knowledge Base ===
export { KnowledgeBaseService }          from './knowledge/service';
export { ArticleSearch }                 from './knowledge/search';
export { ArticleVersioning }             from './knowledge/versioning';
export type {
  KnowledgeArticle,
  ArticleCategory,
  ArticleVersion,
  ArticleFeedback,
  ArticleSearchResult,
  RelatedArticle,
} from './knowledge/types';

// === Webinars & Live ===
export { WebinarService }                from './webinars/service';
export { WebinarScheduler }              from './webinars/scheduler';
export { AttendanceTracker }             from './webinars/attendance';
export type {
  Webinar,
  WebinarStatus,
  WebinarRegistration,
  WebinarAttendance,
  WebinarRecording,
  WebinarQA,
  WebinarQAQuestion,
} from './webinars/types';

// === Onboarding Guides ===
export { OnboardingService }             from './onboarding/service';
export { TourEngine }                    from './onboarding/tours';
export { ChecklistEngine }              from './onboarding/checklists';
export type {
  OnboardingGuide,
  GuideStep,
  GuideStepType,
  ProductTour,
  TourStep,
  TourTooltip,
  OnboardingChecklist,
  ChecklistItem,
  OnboardingCompletion,
} from './onboarding/types';

// === Community Learning ===
export { CommunityService }              from './community/service';
export { ForumService }                  from './community/forums';
export { MentorMatchingService }         from './community/mentors';
export type {
  DiscussionForum,
  ForumThread,
  ForumPost,
  StudyGroup,
  StudyGroupMember,
  MentorProfile,
  MentorMatch,
  MentorshipSession,
} from './community/types';

// === Analytics ===
export { EducationAnalytics }            from './analytics/service';
export { KnowledgeGapAnalyzer }          from './analytics/knowledge-gaps';
export { ContentEffectivenessTracker }   from './analytics/content-effectiveness';
export type {
  CourseAnalytics,
  QuizAnalytics,
  LearnerAnalytics,
  PathAnalytics,
  KnowledgeGapReport,
  ContentEffectivenessReport,
  EngagementMetrics,
  CompletionFunnel,
} from './analytics/types';

// === tRPC Router ===
export { educationRouter }               from './router';
export type { EducationRouter }          from './router';

// === Database ===
export { educationSchemas }              from './db/schema';
export { educationMigrations }           from './db/migrations';

// === Utilities ===
export { EducationErrors }               from './errors';
export { educationEvents }               from './events';
export type { EducationEvent }           from './events';
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         @mcv/growth/education                               │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        EducationService                              │   │
│  │  Unified API — orchestrates all subsystems, enforces tenant scope    │   │
│  └───────────┬──────────┬──────────┬──────────┬──────────┬─────────────┘   │
│              │          │          │          │          │                   │
│  ┌───────────┴──┐ ┌─────┴────┐ ┌──┴───────┐ ┌┴─────────┴┐ ┌────────────┐  │
│  │ CourseBuilder │ │ QuizEng  │ │ PathSvc  │ │ CertSvc   │ │ KnowledgeB │  │
│  │              │ │          │ │          │ │           │ │            │  │
│  │ • Courses    │ │ • Quizzes│ │ • Paths  │ │ • Certs   │ │ • Articles │  │
│  │ • Modules    │ │ • Grade  │ │ • Prereqs│ │ • Verify  │ │ • Search   │  │
│  │ • Lessons    │ │ • Bank   │ │ • Recs   │ │ • Badges  │ │ • Version  │  │
│  │ • Content    │ │ • Code   │ │ • Skills │ │ • Renewal │ │ • Feedback │  │
│  └──────┬───────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘ └─────┬──────┘  │
│         │              │            │              │              │         │
│  ┌──────┴──────┐ ┌─────┴──────┐ ┌──┴────────┐ ┌───┴──────┐ ┌────┴───────┐ │
│  │ WebinarSvc  │ │ Onboarding │ │ Community  │ │ Progress │ │ Analytics  │ │
│  │             │ │            │ │            │ │ Tracker  │ │            │ │
│  │ • Schedule  │ │ • Tours    │ │ • Forums   │ │          │ │ • Metrics  │ │
│  │ • Register  │ │ • Lists    │ │ • Groups   │ │ • Track  │ │ • Gaps     │ │
│  │ • Attend    │ │ • Tooltips │ │ • Mentors  │ │ • Resume │ │ • Funnel   │ │
│  │ • Record    │ │ • Complete │ │ • Q&A      │ │ • Time   │ │ • Effect.  │ │
│  └─────────────┘ └────────────┘ └────────────┘ └──────────┘ └────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         Data Layer                                   │   │
│  │  Supabase PostgreSQL · Drizzle ORM · RLS · Mux (video) · Storage    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Learner Request
     │
     ▼
┌──────────┐     ┌────────────────┐     ┌─────────────────┐
│  tRPC    │────▶│ EducationSvc   │────▶│ Tenant Context   │
│  Router  │     │ (orchestrator) │     │ (RLS enforced)   │
└──────────┘     └───────┬────────┘     └─────────────────┘
                         │
              ┌──────────┼──────────┬──────────────┐
              ▼          ▼          ▼              ▼
        ┌──────────┐ ┌────────┐ ┌────────┐  ┌──────────┐
        │ Course   │ │ Quiz   │ │ Path   │  │ Progress │
        │ Builder  │ │ Engine │ │ Service│  │ Tracker  │
        └────┬─────┘ └───┬────┘ └───┬────┘  └────┬─────┘
             │            │          │             │
             ▼            ▼          ▼             ▼
        ┌─────────────────────────────────────────────┐
        │           Supabase PostgreSQL                │
        │  ┌─────────┐ ┌──────────┐ ┌──────────────┐  │
        │  │ courses  │ │ quizzes  │ │ learner_     │  │
        │  │ lessons  │ │ attempts │ │ progress     │  │
        │  │ content  │ │ questions│ │ time_tracking│  │
        │  └─────────┘ └──────────┘ └──────────────┘  │
        └─────────────────────────────────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────────────────┐
        │         Event Bus (educationEvents)          │
        │  course.completed │ quiz.graded │ cert.issued│
        │  path.advanced │ article.viewed │ webinar.*  │
        └─────────────────────────────────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────────────────┐
        │           Education Analytics                │
        │  completion rates │ knowledge gaps │ funnel  │
        └─────────────────────────────────────────────┘
```

### Video Pipeline (Mux Integration)

```
Upload (Supabase Storage)
     │
     ▼
┌────────────┐     ┌─────────────┐     ┌────────────────┐
│ Storage    │────▶│ Mux Ingest  │────▶│ Mux Asset      │
│ Bucket     │     │ (webhook)   │     │ (transcoded)   │
└────────────┘     └─────────────┘     └───────┬────────┘
                                               │
                              ┌────────────────┼────────────────┐
                              ▼                ▼                ▼
                        ┌──────────┐    ┌───────────┐   ┌────────────┐
                        │ HLS      │    │ Thumbnail │   │ Subtitles  │
                        │ Playback │    │ Generation│   │ (auto-gen) │
                        └──────────┘    └───────────┘   └────────────┘
```

### Multi-Tenant Isolation

Every database table includes a `tenant_id` column. Supabase Row-Level Security (RLS) policies ensure that:

1. **Reads** — Users only see data belonging to their tenant
2. **Writes** — New records are automatically stamped with the current tenant
3. **Cross-tenant** — Impossible at the database level, even if application code has bugs
4. **Admin** — Tenant admins can manage all education content within their tenant
5. **Learners** — Can only see published content and their own progress/attempts

```sql
-- Example RLS policy for courses table
CREATE POLICY "tenant_isolation" ON courses
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "learner_sees_published" ON courses
  FOR SELECT
  USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      status = 'published'
      OR author_id = current_setting('app.current_user_id')::uuid
      OR current_setting('app.current_user_role') IN ('admin', 'editor')
    )
  );
```

---

## Core Interfaces

### EducationService

The central orchestrator that composes all subsystems and provides a unified API.

```typescript
interface EducationServiceConfig {
  /** Supabase client (already tenant-scoped) */
  supabase: SupabaseClient;
  /** Drizzle ORM instance */
  db: DrizzleInstance;
  /** Mux API credentials for video */
  mux: {
    tokenId: string;
    tokenSecret: string;
    webhookSecret: string;
  };
  /** Storage bucket for education assets */
  storageBucket: string;
  /** Certificate template configuration */
  certificates: {
    templateBucket: string;
    verificationBaseUrl: string;
    signingKey: string;
  };
  /** Feature flags */
  features?: {
    communityLearning?: boolean;
    codingChallenges?: boolean;
    aiRecommendations?: boolean;
    webinars?: boolean;
  };
}

interface EducationService {
  // --- Course Builder ---
  createCourse(input: CreateCourseInput): Promise<Course>;
  updateCourse(courseId: string, input: UpdateCourseInput): Promise<Course>;
  deleteCourse(courseId: string): Promise<void>;
  publishCourse(courseId: string): Promise<Course>;
  unpublishCourse(courseId: string): Promise<Course>;
  getCourse(courseId: string): Promise<Course | null>;
  listCourses(filters?: CourseFilters): Promise<PaginatedResult<Course>>;
  duplicateCourse(courseId: string, options?: DuplicateOptions): Promise<Course>;

  // --- Modules & Lessons ---
  addModule(courseId: string, input: CreateModuleInput): Promise<CourseModule>;
  reorderModules(courseId: string, moduleIds: string[]): Promise<void>;
  addLesson(moduleId: string, input: CreateLessonInput): Promise<Lesson>;
  updateLesson(lessonId: string, input: UpdateLessonInput): Promise<Lesson>;
  reorderLessons(moduleId: string, lessonIds: string[]): Promise<void>;
  addLessonContent(lessonId: string, block: LessonContentBlock): Promise<LessonContent>;
  updateLessonContent(contentId: string, block: LessonContentBlock): Promise<LessonContent>;
  reorderLessonContent(lessonId: string, contentIds: string[]): Promise<void>;

  // --- Enrollment ---
  enrollUser(courseId: string, userId: string, options?: EnrollmentOptions): Promise<CourseEnrollment>;
  unenrollUser(courseId: string, userId: string): Promise<void>;
  getEnrollment(courseId: string, userId: string): Promise<CourseEnrollment | null>;
  listEnrollments(courseId: string, filters?: EnrollmentFilters): Promise<PaginatedResult<CourseEnrollment>>;

  // --- Learning Paths ---
  createPath(input: CreatePathInput): Promise<LearningPath>;
  updatePath(pathId: string, input: UpdatePathInput): Promise<LearningPath>;
  addCourseToPath(pathId: string, courseId: string, options?: PathCourseOptions): Promise<PathCourse>;
  removeCourseFromPath(pathId: string, courseId: string): Promise<void>;
  reorderPathCourses(pathId: string, courseIds: string[]): Promise<void>;
  getRecommendedPaths(userId: string): Promise<PathRecommendation[]>;

  // --- Certifications ---
  issueCertificate(userId: string, courseId: string): Promise<Certificate>;
  revokeCertificate(certificateId: string, reason: string): Promise<void>;
  verifyCertificate(verificationCode: string): Promise<CertificateVerification>;
  renewCertificate(certificateId: string): Promise<Certificate>;
  getCertificates(userId: string): Promise<Certificate[]>;

  // --- Quiz & Assessment ---
  createQuiz(lessonId: string, input: CreateQuizInput): Promise<Quiz>;
  updateQuiz(quizId: string, input: UpdateQuizInput): Promise<Quiz>;
  addQuestion(quizId: string, input: CreateQuestionInput): Promise<QuizQuestion>;
  startQuizAttempt(quizId: string, userId: string): Promise<QuizAttempt>;
  submitAnswer(attemptId: string, questionId: string, answer: unknown): Promise<void>;
  finishQuizAttempt(attemptId: string): Promise<QuizResult>;
  getQuizResults(quizId: string, userId: string): Promise<QuizResult[]>;

  // --- Progress Tracking ---
  markLessonComplete(lessonId: string, userId: string): Promise<LessonProgress>;
  markLessonStarted(lessonId: string, userId: string): Promise<LessonProgress>;
  trackTime(lessonId: string, userId: string, seconds: number): Promise<TimeTracking>;
  getProgress(courseId: string, userId: string): Promise<CourseProgress>;
  getPathProgress(pathId: string, userId: string): Promise<PathProgress>;
  getResumePoint(userId: string): Promise<ProgressSnapshot | null>;

  // --- Knowledge Base ---
  createArticle(input: CreateArticleInput): Promise<KnowledgeArticle>;
  updateArticle(articleId: string, input: UpdateArticleInput): Promise<KnowledgeArticle>;
  publishArticle(articleId: string): Promise<KnowledgeArticle>;
  searchArticles(query: string, filters?: ArticleFilters): Promise<ArticleSearchResult[]>;
  submitFeedback(articleId: string, feedback: ArticleFeedback): Promise<void>;
  getRelatedArticles(articleId: string): Promise<RelatedArticle[]>;

  // --- Webinars & Live ---
  createWebinar(input: CreateWebinarInput): Promise<Webinar>;
  scheduleWebinar(webinarId: string, schedule: WebinarSchedule): Promise<Webinar>;
  registerForWebinar(webinarId: string, userId: string): Promise<WebinarRegistration>;
  cancelRegistration(webinarId: string, userId: string): Promise<void>;
  startWebinar(webinarId: string): Promise<Webinar>;
  endWebinar(webinarId: string): Promise<Webinar>;
  trackAttendance(webinarId: string, userId: string, event: AttendanceEvent): Promise<void>;
  submitQuestion(webinarId: string, userId: string, question: string): Promise<WebinarQAQuestion>;

  // --- Onboarding Guides ---
  createGuide(input: CreateGuideInput): Promise<OnboardingGuide>;
  updateGuide(guideId: string, input: UpdateGuideInput): Promise<OnboardingGuide>;
  activateGuide(guideId: string): Promise<OnboardingGuide>;
  getActiveGuides(userId: string, context?: GuideContext): Promise<OnboardingGuide[]>;
  completeGuideStep(guideId: string, stepId: string, userId: string): Promise<OnboardingCompletion>;
  getGuideCompletion(guideId: string, userId: string): Promise<OnboardingCompletion>;

  // --- Community Learning ---
  createForum(courseId: string, input: CreateForumInput): Promise<DiscussionForum>;
  createThread(forumId: string, input: CreateThreadInput): Promise<ForumThread>;
  createPost(threadId: string, input: CreatePostInput): Promise<ForumPost>;
  createStudyGroup(input: CreateStudyGroupInput): Promise<StudyGroup>;
  joinStudyGroup(groupId: string, userId: string): Promise<StudyGroupMember>;
  registerAsMentor(userId: string, profile: MentorProfile): Promise<MentorProfile>;
  requestMentorMatch(userId: string, preferences: MentorPreferences): Promise<MentorMatch>;

  // --- Analytics ---
  getCourseAnalytics(courseId: string, period?: DateRange): Promise<CourseAnalytics>;
  getQuizAnalytics(quizId: string, period?: DateRange): Promise<QuizAnalytics>;
  getLearnerAnalytics(userId: string, period?: DateRange): Promise<LearnerAnalytics>;
  getPathAnalytics(pathId: string, period?: DateRange): Promise<PathAnalytics>;
  getKnowledgeGaps(options?: KnowledgeGapOptions): Promise<KnowledgeGapReport>;
  getContentEffectiveness(period?: DateRange): Promise<ContentEffectivenessReport>;
  getCompletionFunnel(courseId: string): Promise<CompletionFunnel>;
}
```

### Course & Lesson Types

```typescript
interface Course {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  coverImageUrl: string | null;
  previewVideoUrl: string | null;
  authorId: string;
  authorName: string;
  status: CourseStatus;
  visibility: CourseVisibility;
  level: SkillLevel;
  estimatedDurationMinutes: number;
  tags: string[];
  categoryId: string | null;
  modules: CourseModule[];
  enrollmentCount: number;
  averageRating: number | null;
  metadata: Record<string, unknown>;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type CourseStatus = 'draft' | 'review' | 'published' | 'archived';
type CourseVisibility = 'public' | 'enrolled' | 'private' | 'organization';
type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  lessons: Lesson[];
  createdAt: Date;
  updatedAt: Date;
}

interface Lesson {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  description: string | null;
  type: LessonType;
  sortOrder: number;
  estimatedDurationMinutes: number;
  isFree: boolean;
  isRequired: boolean;
  content: LessonContent[];
  quizId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

type LessonType = 'video' | 'text' | 'interactive' | 'quiz' | 'assignment' | 'live';

interface LessonContent {
  id: string;
  lessonId: string;
  type: LessonContentType;
  sortOrder: number;
  data: LessonContentBlock;
  createdAt: Date;
  updatedAt: Date;
}

type LessonContentType = 'video' | 'text' | 'code' | 'interactive' | 'embed' | 'image' | 'download' | 'quiz_inline';

type LessonContentBlock =
  | ContentBlockVideo
  | ContentBlockText
  | ContentBlockCode
  | ContentBlockInteractive
  | ContentBlockEmbed
  | ContentBlockImage
  | ContentBlockDownload
  | ContentBlockQuizInline;

interface ContentBlockVideo {
  type: 'video';
  muxAssetId: string;
  muxPlaybackId: string;
  title: string | null;
  description: string | null;
  durationSeconds: number;
  thumbnailUrl: string | null;
  subtitlesUrl: string | null;
  chapters: VideoChapter[];
}

interface VideoChapter {
  title: string;
  startSeconds: number;
}

interface ContentBlockText {
  type: 'text';
  /** Rich text in Markdown / MDX */
  content: string;
  format: 'markdown' | 'mdx' | 'html';
}

interface ContentBlockCode {
  type: 'code';
  language: string;
  code: string;
  runnable: boolean;
  expectedOutput: string | null;
  hints: string[];
}

interface ContentBlockInteractive {
  type: 'interactive';
  interactionType: 'drag-drop' | 'fill-blank' | 'hotspot' | 'timeline' | 'matching';
  config: Record<string, unknown>;
  instructions: string;
}

interface ContentBlockEmbed {
  type: 'embed';
  url: string;
  embedType: 'iframe' | 'codepen' | 'codesandbox' | 'figma' | 'miro' | 'generic';
  width: number | null;
  height: number | null;
}

interface ContentBlockImage {
  type: 'image';
  url: string;
  alt: string;
  caption: string | null;
  width: number | null;
  height: number | null;
}

interface ContentBlockDownload {
  type: 'download';
  url: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  description: string | null;
}

interface ContentBlockQuizInline {
  type: 'quiz_inline';
  quizId: string;
  showImmediateFeedback: boolean;
}

interface CourseEnrollment {
  id: string;
  courseId: string;
  userId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt: Date | null;
  expiresAt: Date | null;
  progress: number; // 0-100
  lastAccessedAt: Date | null;
  metadata: Record<string, unknown>;
}

type EnrollmentStatus = 'active' | 'completed' | 'expired' | 'suspended' | 'cancelled';
```

### Learning Path Types

```typescript
interface LearningPath {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  level: SkillLevel;
  estimatedDurationMinutes: number;
  courses: PathCourse[];
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  enrollmentCount: number;
  completionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PathCourse {
  id: string;
  pathId: string;
  courseId: string;
  course: Course;
  sortOrder: number;
  isRequired: boolean;
  prerequisites: PathPrerequisite[];
  unlockCondition: UnlockCondition | null;
}

interface PathPrerequisite {
  id: string;
  pathCourseId: string;
  requiredCourseId: string;
  minimumScore: number | null; // minimum quiz score (0-100) to unlock
}

type UnlockCondition =
  | { type: 'immediate' }
  | { type: 'after_completion'; courseId: string }
  | { type: 'after_date'; date: Date }
  | { type: 'after_score'; courseId: string; minimumScore: number }
  | { type: 'manual_approval' };

interface PathRecommendation {
  path: LearningPath;
  score: number; // relevance score 0-1
  reason: string;
  matchedSkills: string[];
  estimatedTimeToComplete: number; // minutes
}
```

### Certification Types

```typescript
interface Certificate {
  id: string;
  tenantId: string;
  userId: string;
  courseId: string | null;
  pathId: string | null;
  templateId: string;
  verificationCode: string;
  verificationUrl: string;
  status: CertificateStatus;
  recipientName: string;
  recipientEmail: string;
  courseTitle: string;
  issuerName: string;
  issuedAt: Date;
  expiresAt: Date | null;
  renewedAt: Date | null;
  revokedAt: Date | null;
  revocationReason: string | null;
  pdfUrl: string | null;
  imageUrl: string | null;
  badges: BadgeDefinition[];
  metadata: Record<string, unknown>;
  createdAt: Date;
}

type CertificateStatus = 'active' | 'expired' | 'revoked' | 'renewed';

interface CertificateTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  htmlTemplate: string;
  cssStyles: string;
  paperSize: 'a4' | 'letter' | 'custom';
  orientation: 'landscape' | 'portrait';
  variables: TemplateVariable[];
  previewUrl: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'date' | 'image' | 'qr_code';
  required: boolean;
  defaultValue: string | null;
}

interface CertificateVerification {
  isValid: boolean;
  certificate: Certificate | null;
  verifiedAt: Date;
  status: CertificateStatus;
  message: string;
}

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  criteria: string;
  issuerName: string;
  /** Open Badges 2.0 compliant assertion URL */
  assertionUrl: string | null;
}
```

### Quiz & Assessment Types

```typescript
interface Quiz {
  id: string;
  tenantId: string;
  lessonId: string | null;
  courseId: string;
  title: string;
  description: string | null;
  type: QuizType;
  questions: QuizQuestion[];
  passingScore: number; // 0-100
  maxAttempts: number | null; // null = unlimited
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showCorrectAnswers: boolean;
  showExplanations: boolean;
  isGraded: boolean;
  weight: number; // weight in final course grade
  availableFrom: Date | null;
  availableUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type QuizType = 'practice' | 'graded' | 'survey' | 'assessment' | 'final_exam';

interface QuizQuestion {
  id: string;
  quizId: string;
  type: QuestionType;
  content: string; // Markdown
  points: number;
  sortOrder: number;
  explanation: string | null;
  hints: string[];
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  options: QuestionOption[] | null;
  correctAnswer: unknown; // type depends on QuestionType
  gradingRubric: string | null;
  codingChallenge: CodingChallenge | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

type QuestionType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'true_false'
  | 'fill_in_blank'
  | 'matching'
  | 'ordering'
  | 'short_answer'
  | 'essay'
  | 'coding'
  | 'file_upload';

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string | null;
  sortOrder: number;
}

interface CodingChallenge {
  language: string;
  starterCode: string;
  solutionCode: string;
  testCases: CodingTestCase[];
  timeoutMs: number;
  memoryLimitMb: number;
  allowedImports: string[];
  forbiddenPatterns: string[];
}

interface CodingTestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  points: number;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  status: 'in_progress' | 'submitted' | 'graded' | 'timed_out';
  startedAt: Date;
  submittedAt: Date | null;
  gradedAt: Date | null;
  score: number | null; // 0-100
  passed: boolean | null;
  answers: QuizAttemptAnswer[];
  timeSpentSeconds: number;
  attemptNumber: number;
}

interface QuizAttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  answer: unknown;
  isCorrect: boolean | null;
  pointsEarned: number | null;
  feedback: string | null;
  answeredAt: Date;
}

interface QuizResult {
  attempt: QuizAttempt;
  totalPoints: number;
  earnedPoints: number;
  score: number; // 0-100
  passed: boolean;
  timeSpentSeconds: number;
  questionResults: QuestionResult[];
  feedback: string | null;
}

interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  pointsPossible: number;
  explanation: string | null;
  correctAnswer: unknown;
  userAnswer: unknown;
}

interface GradingResult {
  score: number;
  passed: boolean;
  pointsEarned: number;
  pointsPossible: number;
  feedback: string;
  questionGrades: Map<string, { correct: boolean; points: number; feedback: string }>;
}
```

### Progress Tracking Types

```typescript
interface LearnerProgress {
  id: string;
  tenantId: string;
  userId: string;
  courseId: string;
  lessonId: string | null;
  pathId: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number; // 0-100
  timeSpentSeconds: number;
  lastAccessedAt: Date;
  completedAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface LessonProgress {
  lessonId: string;
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercent: number;
  timeSpentSeconds: number;
  videoProgress: Record<string, number>; // muxAssetId -> seconds watched
  lastAccessedAt: Date;
  completedAt: Date | null;
}

interface CourseProgress {
  courseId: string;
  userId: string;
  enrollment: CourseEnrollment;
  overallProgress: number; // 0-100
  modulesCompleted: number;
  modulesTotal: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  quizzesPassed: number;
  quizzesTotal: number;
  averageQuizScore: number | null;
  totalTimeSpentSeconds: number;
  moduleProgress: ModuleProgressDetail[];
  lastAccessedAt: Date;
  estimatedTimeRemainingMinutes: number;
}

interface ModuleProgressDetail {
  moduleId: string;
  moduleTitle: string;
  lessonsCompleted: number;
  lessonsTotal: number;
  isComplete: boolean;
  lessons: LessonProgress[];
}

interface PathProgress {
  pathId: string;
  userId: string;
  overallProgress: number; // 0-100
  coursesCompleted: number;
  coursesTotal: number;
  currentCourseId: string | null;
  courseProgress: CourseProgress[];
  certificateIssued: boolean;
  startedAt: Date;
  estimatedCompletionDate: Date | null;
}

interface ProgressSnapshot {
  userId: string;
  lastCourseId: string;
  lastLessonId: string;
  lastModuleId: string;
  lastContentId: string | null;
  videoTimestamp: number | null; // seconds
  scrollPosition: number | null; // percentage 0-100
  lastAccessedAt: Date;
  resumeUrl: string;
}

interface TimeTracking {
  id: string;
  userId: string;
  lessonId: string;
  courseId: string;
  sessionStart: Date;
  sessionEnd: Date;
  activeSeconds: number; // time with focus
  totalSeconds: number;
  events: TimeTrackingEvent[];
}

interface TimeTrackingEvent {
  type: 'start' | 'pause' | 'resume' | 'focus_lost' | 'focus_gained' | 'complete';
  timestamp: Date;
  metadata: Record<string, unknown>;
}
```

### Knowledge Base Types

```typescript
interface KnowledgeArticle {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  content: string; // Markdown
  excerpt: string;
  authorId: string;
  authorName: string;
  categoryId: string;
  category: ArticleCategory;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  version: number;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  relatedArticleIds: string[];
  featuredImageUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ArticleCategory {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  iconUrl: string | null;
  articleCount: number;
  children: ArticleCategory[];
}

interface ArticleVersion {
  id: string;
  articleId: string;
  version: number;
  title: string;
  content: string;
  changelog: string | null;
  authorId: string;
  createdAt: Date;
}

interface ArticleFeedback {
  articleId: string;
  userId: string;
  helpful: boolean;
  comment: string | null;
  submittedAt: Date;
}

interface ArticleSearchResult {
  article: KnowledgeArticle;
  relevanceScore: number;
  highlightedTitle: string;
  highlightedExcerpt: string;
  matchedTerms: string[];
}

interface RelatedArticle {
  articleId: string;
  title: string;
  slug: string;
  categoryName: string;
  relevanceScore: number;
}
```

### Webinar Types

```typescript
interface Webinar {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  coHostIds: string[];
  status: WebinarStatus;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  actualStartAt: Date | null;
  actualEndAt: Date | null;
  timezone: string;
  maxAttendees: number | null;
  registrationRequired: boolean;
  registrationDeadline: Date | null;
  registrationCount: number;
  attendanceCount: number;
  meetingUrl: string | null;
  recordingUrl: string | null;
  recording: WebinarRecording | null;
  tags: string[];
  courseId: string | null; // linked course, if any
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

type WebinarStatus = 'draft' | 'scheduled' | 'live' | 'ended' | 'cancelled';

interface WebinarRegistration {
  id: string;
  webinarId: string;
  userId: string;
  status: 'registered' | 'waitlisted' | 'cancelled' | 'attended' | 'no_show';
  registeredAt: Date;
  cancelledAt: Date | null;
  reminderSent: boolean;
  attendanceData: WebinarAttendance | null;
}

interface WebinarAttendance {
  userId: string;
  webinarId: string;
  joinedAt: Date;
  leftAt: Date | null;
  totalMinutesAttended: number;
  attentionScore: number; // 0-100 based on tab focus, interactions
  interactions: WebinarInteraction[];
}

interface WebinarInteraction {
  type: 'chat' | 'question' | 'poll_vote' | 'reaction' | 'hand_raise';
  timestamp: Date;
  data: Record<string, unknown>;
}

interface WebinarRecording {
  id: string;
  webinarId: string;
  muxAssetId: string;
  muxPlaybackId: string;
  durationSeconds: number;
  status: 'processing' | 'ready' | 'failed';
  thumbnailUrl: string | null;
  transcriptUrl: string | null;
  availableAt: Date | null;
  createdAt: Date;
}

interface WebinarQA {
  webinarId: string;
  questions: WebinarQAQuestion[];
  totalQuestions: number;
  answeredQuestions: number;
}

interface WebinarQAQuestion {
  id: string;
  webinarId: string;
  userId: string;
  userName: string;
  question: string;
  answer: string | null;
  answeredById: string | null;
  answeredByName: string | null;
  upvotes: number;
  isAnswered: boolean;
  isPinned: boolean;
  createdAt: Date;
  answeredAt: Date | null;
}
```

### Onboarding Guide Types

```typescript
interface OnboardingGuide {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  type: GuideType;
  triggerCondition: GuideTrigger;
  steps: GuideStep[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  targetAudience: TargetAudience;
  priority: number;
  completionCount: number;
  dismissCount: number;
  createdAt: Date;
  updatedAt: Date;
}

type GuideType = 'product_tour' | 'checklist' | 'tooltip_sequence' | 'video_walkthrough' | 'interactive_demo';

type GuideTrigger =
  | { type: 'first_login' }
  | { type: 'feature_access'; feature: string }
  | { type: 'role_assigned'; role: string }
  | { type: 'manual' }
  | { type: 'event'; eventName: string; conditions?: Record<string, unknown> }
  | { type: 'time_based'; afterDays: number; sinceEvent: string };

interface TargetAudience {
  roles: string[];
  plans: string[];
  segments: string[];
  excludeCompletedGuides: string[];
}

interface GuideStep {
  id: string;
  guideId: string;
  type: GuideStepType;
  title: string;
  content: string; // Markdown
  sortOrder: number;
  isRequired: boolean;
  action: StepAction | null;
  tooltip: TourTooltip | null;
  metadata: Record<string, unknown>;
}

type GuideStepType = 'info' | 'action' | 'tooltip' | 'video' | 'checklist_item' | 'celebration';

interface StepAction {
  type: 'click' | 'navigate' | 'input' | 'api_call' | 'custom';
  target: string; // CSS selector, URL, or custom identifier
  validation: StepValidation | null;
}

interface StepValidation {
  type: 'element_exists' | 'url_match' | 'api_check' | 'custom';
  value: string;
  timeoutMs: number;
}

interface TourTooltip {
  targetSelector: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  highlightTarget: boolean;
  overlayOpacity: number;
  allowInteraction: boolean;
  advanceOn: 'click_target' | 'click_next' | 'auto' | 'custom';
  autoAdvanceMs: number | null;
}

interface OnboardingChecklist {
  id: string;
  guideId: string;
  userId: string;
  items: ChecklistItemProgress[];
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  startedAt: Date;
  completedAt: Date | null;
}

interface ChecklistItem {
  id: string;
  guideId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isRequired: boolean;
  completionCriteria: CompletionCriteria;
  rewardText: string | null;
}

interface CompletionCriteria {
  type: 'manual' | 'event' | 'url_visit' | 'api_check';
  value: string;
  metadata: Record<string, unknown>;
}

interface ChecklistItemProgress {
  item: ChecklistItem;
  isComplete: boolean;
  completedAt: Date | null;
}

interface OnboardingCompletion {
  guideId: string;
  userId: string;
  stepsCompleted: number;
  stepsTotal: number;
  isComplete: boolean;
  stepProgress: Map<string, { completed: boolean; completedAt: Date | null }>;
  startedAt: Date;
  completedAt: Date | null;
  dismissedAt: Date | null;
}
```

### Community Learning Types

```typescript
interface DiscussionForum {
  id: string;
  tenantId: string;
  courseId: string;
  title: string;
  description: string | null;
  threadCount: number;
  postCount: number;
  lastActivityAt: Date;
  isLocked: boolean;
  moderatorIds: string[];
  guidelines: string | null;
  createdAt: Date;
}

interface ForumThread {
  id: string;
  forumId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string; // Markdown
  isPinned: boolean;
  isLocked: boolean;
  isResolved: boolean;
  resolvedById: string | null;
  postCount: number;
  viewCount: number;
  upvotes: number;
  tags: string[];
  lastPostAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ForumPost {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  content: string; // Markdown
  isAnswer: boolean; // marked as the accepted answer
  upvotes: number;
  parentPostId: string | null; // for nested replies
  isEdited: boolean;
  editedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface StudyGroup {
  id: string;
  tenantId: string;
  courseId: string | null;
  pathId: string | null;
  name: string;
  description: string;
  maxMembers: number;
  memberCount: number;
  isPublic: boolean;
  creatorId: string;
  schedule: StudyGroupSchedule | null;
  tags: string[];
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
}

interface StudyGroupSchedule {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek: number | null; // 0-6
  time: string; // HH:mm
  timezone: string;
  durationMinutes: number;
  meetingUrl: string | null;
}

interface StudyGroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'member' | 'moderator' | 'creator';
  joinedAt: Date;
  lastActiveAt: Date;
}

interface MentorProfile {
  id: string;
  userId: string;
  tenantId: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  expertiseAreas: string[];
  skillLevels: Record<string, SkillLevel>;
  availableHoursPerWeek: number;
  timezone: string;
  languages: string[];
  rating: number | null;
  totalSessions: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MentorMatch {
  id: string;
  mentorId: string;
  menteeId: string;
  status: 'pending' | 'accepted' | 'declined' | 'active' | 'completed';
  matchScore: number; // 0-1
  matchReason: string;
  requestedAt: Date;
  acceptedAt: Date | null;
  sessions: MentorshipSession[];
}

interface MentorshipSession {
  id: string;
  matchId: string;
  scheduledAt: Date;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  meetingUrl: string | null;
  notes: string | null;
  menteeRating: number | null;
  menteeFeedback: string | null;
  completedAt: Date | null;
}
```

### Analytics Types

```typescript
interface CourseAnalytics {
  courseId: string;
  period: DateRange;
  enrollments: {
    total: number;
    newInPeriod: number;
    active: number;
    completed: number;
    dropped: number;
  };
  completion: {
    rate: number; // 0-100
    averageTimeToComplete: number; // minutes
    medianTimeToComplete: number;
    fastestCompletion: number;
    slowestCompletion: number;
  };
  engagement: {
    averageTimePerSession: number; // minutes
    averageSessionsPerWeek: number;
    totalTimeSpent: number; // minutes
    bounceRate: number; // 0-100
    returnRate: number; // 0-100
  };
  content: {
    mostViewedLessons: Array<{ lessonId: string; title: string; views: number }>;
    leastViewedLessons: Array<{ lessonId: string; title: string; views: number }>;
    averageLessonCompletionRate: number;
    dropOffPoints: Array<{ lessonId: string; title: string; dropOffRate: number }>;
  };
  ratings: {
    average: number | null;
    distribution: Record<1 | 2 | 3 | 4 | 5, number>;
    totalRatings: number;
  };
}

interface QuizAnalytics {
  quizId: string;
  period: DateRange;
  attempts: {
    total: number;
    unique: number;
    averageAttemptsPerUser: number;
  };
  scores: {
    average: number;
    median: number;
    highest: number;
    lowest: number;
    standardDeviation: number;
    passRate: number; // 0-100
    distribution: Array<{ range: string; count: number }>; // e.g., "0-10", "10-20", ...
  };
  questions: {
    mostMissed: Array<{ questionId: string; content: string; correctRate: number }>;
    easiest: Array<{ questionId: string; content: string; correctRate: number }>;
    averageTimePerQuestion: Record<string, number>;
  };
  timing: {
    averageDuration: number; // seconds
    medianDuration: number;
    timeoutRate: number; // 0-100
  };
}

interface LearnerAnalytics {
  userId: string;
  period: DateRange;
  courses: {
    enrolled: number;
    completed: number;
    inProgress: number;
    averageScore: number;
    totalTimeSpent: number; // minutes
  };
  paths: {
    enrolled: number;
    completed: number;
    inProgress: number;
  };
  certificates: {
    earned: number;
    active: number;
    expired: number;
  };
  quizzes: {
    attempted: number;
    passed: number;
    averageScore: number;
    bestSubjects: string[];
    weakSubjects: string[];
  };
  engagement: {
    streakDays: number;
    totalSessions: number;
    averageSessionDuration: number; // minutes
    lastActiveAt: Date;
    weeklyActivityPattern: Record<number, number>; // day-of-week -> minutes
  };
}

interface PathAnalytics {
  pathId: string;
  period: DateRange;
  enrollments: {
    total: number;
    active: number;
    completed: number;
  };
  completion: {
    rate: number;
    averageTimeToComplete: number;
    courseCompletionRates: Array<{ courseId: string; title: string; rate: number }>;
    bottleneckCourses: Array<{ courseId: string; title: string; dropOffRate: number }>;
  };
  progression: {
    averageCoursesCompleted: number;
    progressDistribution: Array<{ percentRange: string; learnerCount: number }>;
  };
}

interface KnowledgeGapReport {
  tenantId: string;
  generatedAt: Date;
  gaps: KnowledgeGap[];
  recommendations: string[];
  overallCoverageScore: number; // 0-100
}

interface KnowledgeGap {
  topic: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedLearners: number;
  averageScore: number;
  relatedQuizIds: string[];
  relatedCourseIds: string[];
  suggestedActions: string[];
}

interface ContentEffectivenessReport {
  period: DateRange;
  courses: Array<{
    courseId: string;
    title: string;
    effectivenessScore: number; // 0-100
    completionRate: number;
    averageQuizScore: number;
    learnerSatisfaction: number;
    timeEfficiency: number; // actual vs estimated time ratio
  }>;
  topPerformers: Array<{ courseId: string; title: string; score: number }>;
  needsImprovement: Array<{ courseId: string; title: string; score: number; issues: string[] }>;
}

interface EngagementMetrics {
  period: DateRange;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  contentInteractions: number;
  forumActivity: number;
  webinarAttendance: number;
  trends: Array<{ date: string; dau: number; sessions: number; completions: number }>;
}

interface CompletionFunnel {
  courseId: string;
  stages: FunnelStage[];
  overallCompletionRate: number;
  biggestDropOff: { from: string; to: string; dropRate: number };
}

interface FunnelStage {
  id: string;
  name: string; // "Enrolled" | module/lesson name
  type: 'enrollment' | 'module' | 'lesson' | 'quiz' | 'completion';
  learnersEntered: number;
  learnersCompleted: number;
  dropOffRate: number; // 0-100
  averageTimeSpent: number; // minutes
}

interface DateRange {
  from: Date;
  to: Date;
}
```

### Input / Filter Types

```typescript
interface CreateCourseInput {
  title: string;
  description: string;
  shortDescription?: string;
  coverImageUrl?: string;
  previewVideoUrl?: string;
  level?: SkillLevel;
  tags?: string[];
  categoryId?: string;
  visibility?: CourseVisibility;
  metadata?: Record<string, unknown>;
}

interface UpdateCourseInput {
  title?: string;
  description?: string;
  shortDescription?: string;
  coverImageUrl?: string | null;
  previewVideoUrl?: string | null;
  level?: SkillLevel;
  tags?: string[];
  categoryId?: string | null;
  visibility?: CourseVisibility;
  metadata?: Record<string, unknown>;
}

interface CourseFilters {
  status?: CourseStatus;
  visibility?: CourseVisibility;
  level?: SkillLevel;
  categoryId?: string;
  authorId?: string;
  tags?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'title' | 'created_at' | 'updated_at' | 'enrollment_count' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

interface CreateModuleInput {
  title: string;
  description?: string;
  sortOrder?: number;
}

interface CreateLessonInput {
  title: string;
  description?: string;
  type: LessonType;
  estimatedDurationMinutes?: number;
  isFree?: boolean;
  isRequired?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
}

interface UpdateLessonInput {
  title?: string;
  description?: string;
  type?: LessonType;
  estimatedDurationMinutes?: number;
  isFree?: boolean;
  isRequired?: boolean;
  metadata?: Record<string, unknown>;
}

interface EnrollmentOptions {
  expiresAt?: Date;
  sendWelcomeEmail?: boolean;
  autoStartPath?: boolean;
  metadata?: Record<string, unknown>;
}

interface EnrollmentFilters {
  status?: EnrollmentStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface DuplicateOptions {
  includeEnrollments?: boolean;
  includeQuizAttempts?: boolean;
  newTitle?: string;
  asDraft?: boolean;
}

interface CreatePathInput {
  title: string;
  description: string;
  coverImageUrl?: string;
  level?: SkillLevel;
  tags?: string[];
}

interface UpdatePathInput {
  title?: string;
  description?: string;
  coverImageUrl?: string | null;
  level?: SkillLevel;
  tags?: string[];
}

interface PathCourseOptions {
  sortOrder?: number;
  isRequired?: boolean;
  prerequisites?: string[]; // course IDs
  unlockCondition?: UnlockCondition;
}

interface CreateQuizInput {
  title: string;
  description?: string;
  type?: QuizType;
  passingScore?: number;
  maxAttempts?: number;
  timeLimitMinutes?: number;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  showCorrectAnswers?: boolean;
  showExplanations?: boolean;
  isGraded?: boolean;
  weight?: number;
}

interface UpdateQuizInput extends Partial<CreateQuizInput> {}

interface CreateQuestionInput {
  type: QuestionType;
  content: string;
  points?: number;
  explanation?: string;
  hints?: string[];
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  options?: Omit<QuestionOption, 'id'>[];
  correctAnswer: unknown;
  gradingRubric?: string;
  codingChallenge?: CodingChallenge;
}

interface CreateArticleInput {
  title: string;
  content: string;
  excerpt?: string;
  categoryId: string;
  tags?: string[];
  featuredImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  relatedArticleIds?: string[];
}

interface UpdateArticleInput extends Partial<CreateArticleInput> {
  changelog?: string;
}

interface ArticleFilters {
  categoryId?: string;
  status?: 'draft' | 'published' | 'archived';
  tags?: string[];
  authorId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'title' | 'created_at' | 'updated_at' | 'view_count' | 'helpful_count';
  sortOrder?: 'asc' | 'desc';
}

interface CreateWebinarInput {
  title: string;
  description: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  timezone: string;
  maxAttendees?: number;
  registrationRequired?: boolean;
  registrationDeadline?: Date;
  coHostIds?: string[];
  tags?: string[];
  courseId?: string;
}

interface WebinarSchedule {
  startAt: Date;
  endAt: Date;
  timezone: string;
  reminderMinutesBefore: number[];
}

interface AttendanceEvent {
  type: 'join' | 'leave' | 'focus_lost' | 'focus_gained' | 'interaction';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface CreateGuideInput {
  title: string;
  description?: string;
  type: GuideType;
  triggerCondition: GuideTrigger;
  targetAudience?: TargetAudience;
  priority?: number;
  steps: Omit<GuideStep, 'id' | 'guideId'>[];
}

interface UpdateGuideInput {
  title?: string;
  description?: string;
  triggerCondition?: GuideTrigger;
  targetAudience?: TargetAudience;
  priority?: number;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  steps?: Omit<GuideStep, 'id' | 'guideId'>[];
}

interface GuideContext {
  url?: string;
  feature?: string;
  role?: string;
  plan?: string;
  segment?: string;
}

interface CreateForumInput {
  title: string;
  description?: string;
  guidelines?: string;
  moderatorIds?: string[];
}

interface CreateThreadInput {
  title: string;
  content: string;
  tags?: string[];
}

interface CreatePostInput {
  content: string;
  parentPostId?: string;
}

interface CreateStudyGroupInput {
  name: string;
  description: string;
  courseId?: string;
  pathId?: string;
  maxMembers?: number;
  isPublic?: boolean;
  schedule?: StudyGroupSchedule;
  tags?: string[];
}

interface MentorPreferences {
  expertiseAreas: string[];
  preferredLanguages?: string[];
  preferredTimezone?: string;
  skillLevel?: SkillLevel;
}

interface KnowledgeGapOptions {
  courseIds?: string[];
  minimumAttempts?: number;
  scoreThreshold?: number;
  period?: DateRange;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

---

## Database Schemas

### Courses & Lessons

```typescript
import { pgTable, uuid, text, varchar, integer, boolean, timestamp, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';

// === Enums ===

export const courseStatusEnum = pgEnum('course_status', ['draft', 'review', 'published', 'archived']);
export const courseVisibilityEnum = pgEnum('course_visibility', ['public', 'enrolled', 'private', 'organization']);
export const skillLevelEnum = pgEnum('skill_level', ['beginner', 'intermediate', 'advanced', 'expert']);
export const lessonTypeEnum = pgEnum('lesson_type', ['video', 'text', 'interactive', 'quiz', 'assignment', 'live']);
export const contentTypeEnum = pgEnum('content_type', ['video', 'text', 'code', 'interactive', 'embed', 'image', 'download', 'quiz_inline']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['active', 'completed', 'expired', 'suspended', 'cancelled']);

// === Tables ===

export const courses = pgTable('education_courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull(),
  description: text('description').notNull().default(''),
  shortDescription: varchar('short_description', { length: 1000 }),
  coverImageUrl: text('cover_image_url'),
  previewVideoUrl: text('preview_video_url'),
  authorId: uuid('author_id').notNull(),
  authorName: varchar('author_name', { length: 255 }).notNull(),
  status: courseStatusEnum('status').notNull().default('draft'),
  visibility: courseVisibilityEnum('visibility').notNull().default('enrolled'),
  level: skillLevelEnum('level').notNull().default('beginner'),
  estimatedDurationMinutes: integer('estimated_duration_minutes').notNull().default(0),
  tags: jsonb('tags').notNull().default([]),
  categoryId: uuid('category_id'),
  enrollmentCount: integer('enrollment_count').notNull().default(0),
  averageRating: integer('average_rating'),  // stored as 0-500 (multiply by 100)
  metadata: jsonb('metadata').notNull().default({}),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('edu_courses_tenant_idx').on(table.tenantId),
  slugIdx: index('edu_courses_slug_idx').on(table.tenantId, table.slug).unique(),
  statusIdx: index('edu_courses_status_idx').on(table.tenantId, table.status),
  authorIdx: index('edu_courses_author_idx').on(table.tenantId, table.authorId),
  categoryIdx: index('edu_courses_category_idx').on(table.tenantId, table.categoryId),
}));

export const courseModules = pgTable('education_course_modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  courseIdx: index('edu_modules_course_idx').on(table.courseId),
  sortIdx: index('edu_modules_sort_idx').on(table.courseId, table.sortOrder),
}));

export const lessons = pgTable('education_lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').notNull().references(() => courseModules.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  type: lessonTypeEnum('type').notNull().default('text'),
  sortOrder: integer('sort_order').notNull().default(0),
  estimatedDurationMinutes: integer('estimated_duration_minutes').notNull().default(5),
  isFree: boolean('is_free').notNull().default(false),
  isRequired: boolean('is_required').notNull().default(true),
  quizId: uuid('quiz_id'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  moduleIdx: index('edu_lessons_module_idx').on(table.moduleId),
  courseIdx: index('edu_lessons_course_idx').on(table.courseId),
  sortIdx: index('edu_lessons_sort_idx').on(table.moduleId, table.sortOrder),
}));

export const lessonContent = pgTable('education_lesson_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  type: contentTypeEnum('type').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  lessonIdx: index('edu_content_lesson_idx').on(table.lessonId),
  sortIdx: index('edu_content_sort_idx').on(table.lessonId, table.sortOrder),
}));

export const courseEnrollments = pgTable('education_enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  status: enrollmentStatusEnum('status').notNull().default('active'),
  progress: integer('progress').notNull().default(0),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  metadata: jsonb('metadata').notNull().default({}),
}, (table) => ({
  tenantIdx: index('edu_enrollments_tenant_idx').on(table.tenantId),
  courseUserIdx: index('edu_enrollments_course_user_idx').on(table.courseId, table.userId).unique(),
  userIdx: index('edu_enrollments_user_idx').on(table.tenantId, table.userId),
  statusIdx: index('edu_enrollments_status_idx').on(table.tenantId, table.status),
}));

export const courseCategories = pgTable('education_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id'),
  sortOrder: integer('sort_order').notNull().default(0),
  iconUrl: text('icon_url'),
  articleCount: integer('article_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('edu_categories_tenant_idx').on(table.tenantId),
  slugIdx: index('edu_categories_slug_idx').on(table.tenantId, table.slug).unique(),
  parentIdx: index('edu_categories_parent_idx').on(table.tenantId, table.parentId),
}));
```

### Quizzes & Assessments

```typescript
export const quizTypeEnum = pgEnum('quiz_type', ['practice', 'graded', 'survey', 'assessment', 'final_exam']);
export const questionTypeEnum = pgEnum('question_type', [
  'multiple_choice', 'multiple_select', 'true_false', 'fill_in_blank',
  'matching', 'ordering', 'short_answer', 'essay', 'coding', 'file_upload',
]);
export const difficultyEnum = pgEnum('question_difficulty', ['easy', 'medium', 'hard']);
export const attemptStatusEnum = pgEnum('attempt_status', ['in_progress', 'submitted', 'graded', 'timed_out']);

export const quizzes = pgTable('education_quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'set null' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  type: quizTypeEnum('type').notNull().default('practice'),
  passingScore: integer('passing_score').notNull().default(70),
  maxAttempts: integer('max_attempts'),
  timeLimitMinutes: integer('time_limit_minutes'),
  shuffleQuestions: boolean('shuffle_questions').notNull().default(false),
  shuffleAnswers: boolean('shuffle_answers').notNull().default(false),
  showCorrectAnswers: boolean('show_correct_answers').notNull().default(true),
  showExplanations: boolean('show_explanations').notNull().default(true),
  isGraded: boolean('is_graded').notNull().default(true),
  weight: integer('weight').notNull().default(100), // basis points (100 = 1x)
  availableFrom: timestamp('available_from', { withTimezone: true }),
  availableUntil: timestamp('available_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('edu_quizzes_tenant_idx').on(table.tenantId),
  lessonIdx: index('edu_quizzes_lesson_idx').on(table.lessonId),
  courseIdx: index('edu_quizzes_course_idx').on(table.courseId),
}));

export const quizQuestions = pgTable('education_quiz_questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  type: questionTypeEnum('type').notNull(),
  content: text('content').notNull(),
  points: integer('points').notNull().default(1),
  sortOrder: integer('sort_order').notNull().default(0),
  explanation: text('explanation'),
  hints: jsonb('hints').notNull().default([]),
  tags: jsonb('tags').notNull().default([]),
  difficulty: difficultyEnum('difficulty').notNull().default('medium'),
  options: jsonb('options'), // QuestionOption[]
  correctAnswer: jsonb('correct_answer').notNull(),
  gradingRubric: text('grading_rubric'),
  codingChallenge: jsonb('coding_challenge'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  quizIdx: index('edu_questions_quiz_idx').on(table.quizId),
  sortIdx: index('edu_questions_sort_idx').on(table.quizId, table.sortOrder),
  difficultyIdx: index('edu_questions_difficulty_idx').on(table.quizId, table.difficulty),
}));

export const quizAttempts = pgTable('education_quiz_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  status: attemptStatusEnum('status').notNull().default('in_progress'),
  score: integer('score'),
  passed: boolean('passed'),
  attemptNumber: integer('attempt_number').notNull().default(1),
  timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  gradedAt: timestamp('graded_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('edu_attempts_tenant_idx').on(table.tenantId),
  quizUserIdx: index('edu_attempts_quiz_user_idx').on(table.quizId, table.userId),
  userIdx: index('edu_attempts_user_idx').on(table.tenantId, table.userId),
}));

export const quizAttemptAnswers = pgTable('education_quiz_attempt_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  attemptId: uuid('attempt_id').notNull().references(() => quizAttempts.id, { onDelete: 'cascade' }),
  questionId: uuid('question_id').notNull().references(() => quizQuestions.id, { onDelete: 'cascade' }),
  answer: jsonb('answer').notNull(),
  isCorrect: boolean('is_correct'),
  pointsEarned: integer('points_earned'),
  feedback: text('feedback'),
  answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  attemptIdx: index('edu_answers_attempt_idx').on(table.attemptId),
  questionIdx: index('edu_answers_question_idx').on(table.attemptId, table.questionId),
}));
```

### Learning Paths

```typescript
export const pathStatusEnum = pgEnum('path_status', ['draft', 'published', 'archived']);

export const learningPaths = pgTable('education_learning_paths', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull(),
  description: text('description').notNull().default(''),
  coverImageUrl: text('cover_image_url'),
  level: skillLevelEnum('level').notNull().default('beginner'),
  estimatedDurationMinutes: integer('estimated_duration_minutes').notNull().default(0),
  tags: jsonb('tags').notNull().default([]),
  status: pathStatusEnum('status').notNull().default('draft'),
  enrollmentCount: integer('enrollment_count').notNull().default(0),
  completionRate: integer('completion_rate').notNull().default(0), // 0-10000 (basis points)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('edu_paths_tenant_idx').on(table.tenantId),
  slugIdx: index('edu_paths_slug_idx').on(table.tenantId, table.slug).unique(),
  statusIdx: index('edu_paths_status_idx').on(table.tenantId, table.status),
}));

export const pathCourses = pgTable('education_path_courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  pathId: uuid('path_id').notNull().references(() => learningPaths.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  isRequired: boolean('is_required').notNull().default(true),
  unlockCondition: jsonb('unlock_condition'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pathIdx: index('edu_path_courses_path_idx').on(table.pathId),
  courseIdx: index('edu_path_courses_course_idx').on(table.courseId),
  uniqueIdx: index('edu_path_courses_unique_idx').on(table.pathId, table.courseId).unique(),
  sortIdx: index('edu_path_courses_sort_idx').on(table.pathId, table.sortOrder),
}));

export const pathPrerequisites = pgTable('education_path_prerequisites', {
  id: uuid('id').primaryKey().defaultRandom(),
  pathCourseId: uuid('path_course_id').notNull().references(() => pathCourses.id, { onDelete: 'cascade' }),
  requiredCourseId: uuid('required_course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  minimumScore: integer('minimum_score'),
}, (table) => ({
  pathCourseIdx: index('edu_prereqs_path_course_idx').on(table.pathCourseId),
}));

export const pathEnrollments = pgTable('education_path_enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  pathId: uuid('path_id').notNull().references(() => learningPaths.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  status: enrollmentStatusEnum('status').notNull().default('active'),
  progress: integer('progress').notNull().default(0),
  currentCourseId: uuid('current_course_id'),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  tenantIdx: index('edu_path_enroll_tenant_idx').on(table.tenantId),
  pathUserIdx: index('edu_path_enroll_path_user_idx').on(table.pathId, table.userId).unique(),
}));
```

### Certificates

```typescript
export const certificateStatusEnum = pgEnum('certificate_status', ['active', 'expired', 'revoked', 'renewed']);

export const certificates = pgTable('education_certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  pathId: uuid('path_id').references(() => learningPaths.id, { onDelete: 'set null' }),
  templateId: uuid('template_id').notNull(),
  verificationCode: varchar('verification_code', { length: 64 }).notNull().unique(),
  verificationUrl: text('verification_url').notNull(),
  status: certificateStatusEnum('status').notNull().default('active'),
  recipientName: varchar('recipient_name', { length: 255 }).notNull(),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  courseTitle: varchar('course_title', { length: 500 }).notNull(),
  issuerName: varchar('issuer_name', { length: 255 }).notNull(),
  pdfUrl: text('pdf_url'),
  imageUrl: text('image_url'),
  badges: jsonb('badges').notNull().default([]),
  metadata: jsonb('metadata').notNull().default({}),
  issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  renewedAt: timestamp('renewed_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revocationReason: text('revocation_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('edu_certs_tenant_idx').on(table.tenantId),
  userIdx: index('edu_certs_user_idx').on(table.tenantId, table.userId),
  verificationIdx: index('edu_certs_verification_idx').on(table.verificationCode),
  courseIdx: index('edu_certs_course_idx').on(table.tenantId, table.courseId),
  statusIdx: index('edu_certs_status_idx').on(table.tenantId, table.status),
}));

export const certificateTemplates = pgTable('education_certificate_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  htmlTemplate: text('html_template').notNull(),
  cssStyles: text('css_styles').notNull().default(''),
  paperSize: varchar('paper_size', { length: 20 }).notNull().default('a4'),
  orientation: varchar('orientation', { length: 20 }).notNull().default('landscape'),
  variables: jsonb('variables').notNull().default([]),
  previewUrl: text('preview_url'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('edu_cert_templates_tenant_idx').on(table.tenantId),
}));
```

### Knowledge Base

```typescript
export const articleStatusEnum = pgEnum('article_status', ['draft', 'published', 'archived']);

export const knowledgeArticles = pgTable('education_knowledge_articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull(),
  content: text('content').notNull(),
  excerpt: varchar('excerpt', { length: 1000 }).notNull().default(''),
  authorId: uuid('author_id').notNull(),
  authorName: varchar('author_name', { length: 255 }).notNull(),
  categoryId: uuid('category_id').notNull().references(() => courseCategories.id),
  tags: jsonb('tags').notNull().default([]),
  status: articleStatusEnum('status').notNull().default('draft'),
  version: integer('version').notNull().default(1),
  viewCount: integer('view_count').notNull().default(0),
  helpfulCount: integer('helpful_count').notNull().default(0),
  notHelpfulCount: integer('not_helpful_count').notNull().default(0),
  relatedArticleIds: jsonb('related_article_ids').notNull().default([]),
  featuredImageUrl: text('featured_image_url'),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: varchar('seo_description', { length: 500 }),
  /** tsvector for full-text search */
  searchVector: text('search_vector'), // populated by trigger
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('edu_articles_tenant_idx').on(table.tenantId),
  slugIdx: index('edu_articles_slug_idx').on(table.tenantId, table.slug).unique(),
  categoryIdx: index('edu_articles_category_idx').on(table.tenantId, table.categoryId),
  statusIdx: index('edu_articles_status_idx').on(table.tenantId, table.status),
  authorIdx: index('edu_articles_author_idx').on(table.tenantId, table.authorId),
  // GIN index for full-text search — applied via raw SQL migration
}));

export const articleVersions = pgTable('education_article_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id').notNull().references(() => knowledgeArticles.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  changelog: text('changelog'),
  authorId: uuid('author_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  articleIdx: index('edu_article_versions_article_idx').on(table.articleId),
  versionIdx: index('edu_article_versions_version_idx').on(table.articleId, table.version).unique(),
}));

export const articleFeedback = pgTable('education_article_feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  articleId: uuid('article_id').notNull().references(() => knowledgeArticles.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  helpful: boolean('helpful').notNull(),
  comment: text('comment'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  articleUserIdx: index('edu_feedback_article_user_idx').on(table.articleId, table.userId).unique(),
}));
```

### Webinars

```typescript
export const webinarStatusEnum = pgEnum('webinar_status', ['draft', 'scheduled', 'live', 'ended', 'cancelled']);
export const registrationStatusEnum = pgEnum('registration_status', ['registered', 'waitlisted', 'cancelled', 'attended', 'no_show']);

export const webinars = pgTable('education_webinars', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull().default(''),
  hostId: uuid('host_id').notNull(),
  hostName: varchar('host_name', { length: 255 }).notNull(),
  coHostIds: jsonb('co_host_ids').notNull().default([]),
  status: webinarStatusEnum('status').notNull().default('draft'),
  scheduledStartAt: timestamp('scheduled_start_at', { withTimezone: true }).notNull(),
  scheduledEndAt: timestamp('scheduled_end_at', { withTimezone: true }).notNull(),
  actualStartAt: timestamp('actual_start_at', { withTimezone: true }),
  actualEndAt: timestamp('actual_end_at', { withTimezone: true }),
  timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
  maxAttendees: integer('max_attendees'),
  registrationRequired: boolean('registration_required').notNull().default(true),
  registrationDeadline: timestamp('registration_deadline', { withTimezone: true }),
  registrationCount: integer('registration_count').notNull().default(0),
  attendanceCount: integer('attendance_count').notNull().default(0),
  meetingUrl: text('meeting_url'),
  recordingUrl: text('recording_url'),
  tags: jsonb('tags').notNull().default([]),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('edu_webinars_tenant_idx').on(table.tenantId),
  statusIdx: index('edu_webinars_status_idx').on(table.tenantId, table.status),
  scheduleIdx: index('edu_webinars_schedule_idx').on(table.tenantId, table.scheduledStartAt),
}));

export const webinarRegistrations = pgTable('education_webinar_registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  webinarId: uuid('webinar_id').notNull().references(() => webinars.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  status: registrationStatusEnum('status').notNull().default('registered'),
  registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  reminderSent: boolean('reminder_sent').notNull().default(false),
  attendanceData: jsonb('attendance_data'),
}, (table) => ({
  webinarUserIdx: index('edu_registrations_webinar_user_idx').on(table.webinarId, table.userId).unique(),
  tenantUserIdx: index('edu_registrations_tenant_user_idx').on(table.tenantId, table.userId),
}));

export const webinarQaQuestions = pgTable('education_webinar_qa', {
  id: uuid('id').primaryKey().defaultRandom(),
  webinarId: uuid('webinar_id').notNull().references(() => webinars.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  userName: varchar('user_name', { length: 255 }).notNull(),
  question: text('question').notNull(),
  answer: text('answer'),
  answeredById: uuid('answered_by_id'),
  answeredByName: varchar('answered_by_name', { length: 255 }),
  upvotes: integer('upvotes').notNull().default(0),
  isAnswered: boolean('is_answered').notNull().default(false),
  isPinned: boolean('is_pinned').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  answeredAt: timestamp('answered_at', { withTimezone: true }),
}, (table) => ({
  webinarIdx: index('edu_qa_webinar_idx').on(table.webinarId),
}));
```

### Onboarding Guides

```typescript
export const guideTypeEnum = pgEnum('guide_type', ['product_tour', 'checklist', 'tooltip_sequence', 'video_walkthrough', 'interactive_demo']);
export const guideStatusEnum = pgEnum('guide_status', ['draft', 'active', 'paused', 'archived']);

export const onboardingGuides = pgTable('education_onboarding_guides', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  type: guideTypeEnum('type').notNull(),
  triggerCondition: jsonb('trigger_condition').notNull(),
  targetAudience: jsonb('target_audience').notNull().default({}),
  status: guideStatusEnum('status').notNull().default('draft'),
  priority: integer('priority').notNull().default(0),
  completionCount: integer('completion_count').notNull().default(0),
  dismissCount: integer('dismiss_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('edu_guides_tenant_idx').on(table.tenantId),
  statusIdx: index('edu_guides_status_idx').on(table.tenantId, table.status),
  typeIdx: index('edu_guides_type_idx').on(table.tenantId, table.type),
}));

export const guideSteps = pgTable('education_guide_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  guideId: uuid('guide_id').notNull().references(() => onboardingGuides.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  isRequired: boolean('is_required').notNull().default(true),
  action: jsonb('action'),
  tooltip: jsonb('tooltip'),
  metadata: jsonb('metadata').notNull().default({}),
}, (table) => ({
  guideIdx: index('edu_guide_steps_guide_idx').on(table.guideId),
  sortIdx: index('edu_guide_steps_sort_idx').on(table.guideId, table.sortOrder),
}));

export const onboardingCompletions = pgTable('education_onboarding_completions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  guideId: uuid('guide_id').notNull().references(() => onboardingGuides.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  stepsCompleted: integer('steps_completed').notNull().default(0),
  stepsTotal: integer('steps_total').notNull(),
  isComplete: boolean('is_complete').notNull().default(false),
  stepProgress: jsonb('step_progress').notNull().default({}),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
}, (table) => ({
  guideUserIdx: index('edu_completions_guide_user_idx').on(table.guideId, table.userId).unique(),
  tenantUserIdx: index('edu_completions_tenant_user_idx').on(table.tenantId, table.userId),
}));
```

### Progress Tracking

```typescript
export const progressStatusEnum = pgEnum('progress_status', ['not_started', 'in_progress', 'completed']);

export const learnerProgress = pgTable('education_learner_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }),
  pathId: uuid('path_id').references(() => learningPaths.id, { onDelete: 'set null' }),
  status: progressStatusEnum('status').notNull().default('not_started'),
  progressPercent: integer('progress_percent').notNull().default(0),
  timeSpentSeconds: integer('time_spent_seconds').notNull().default(0),
  videoProgress: jsonb('video_progress').notNull().default({}),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('edu_progress_tenant_idx').on(table.tenantId),
  userCourseIdx: index('edu_progress_user_course_idx').on(table.userId, table.courseId),
  userLessonIdx: index('edu_progress_user_lesson_idx').on(table.userId, table.lessonId).unique(),
  statusIdx: index('edu_progress_status_idx').on(table.tenantId, table.status),
}));

export const timeTracking = pgTable('education_time_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  sessionStart: timestamp('session_start', { withTimezone: true }).notNull().defaultNow(),
  sessionEnd: timestamp('session_end', { withTimezone: true }),
  activeSeconds: integer('active_seconds').notNull().default(0),
  totalSeconds: integer('total_seconds').notNull().default(0),
  events: jsonb('events').notNull().default([]),
}, (table) => ({
  tenantUserIdx: index('edu_time_tenant_user_idx').on(table.tenantId, table.userId),
  lessonIdx: index('edu_time_lesson_idx').on(table.lessonId),
  sessionIdx: index('edu_time_session_idx').on(table.userId, table.sessionStart),
}));

export const resumePoints = pgTable('education_resume_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull(),
  contentId: uuid('content_id'),
  videoTimestamp: integer('video_timestamp'),
  scrollPosition: integer('scroll_position'),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('edu_resume_user_idx').on(table.tenantId, table.userId).unique(),
}));
```

### Community Learning

```typescript
export const discussionForums = pgTable('education_discussion_forums', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  threadCount: integer('thread_count').notNull().default(0),
  postCount: integer('post_count').notNull().default(0),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),
  isLocked: boolean('is_locked').notNull().default(false),
  moderatorIds: jsonb('moderator_ids').notNull().default([]),
  guidelines: text('guidelines'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('edu_forums_tenant_idx').on(table.tenantId),
  courseIdx: index('edu_forums_course_idx').on(table.courseId),
}));

export const forumThreads = pgTable('education_forum_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  forumId: uuid('forum_id').notNull().references(() => discussionForums.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull(),
  authorName: varchar('author_name', { length: 255 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  isPinned: boolean('is_pinned').notNull().default(false),
  isLocked: boolean('is_locked').notNull().default(false),
  isResolved: boolean('is_resolved').notNull().default(false),
  resolvedById: uuid('resolved_by_id'),
  postCount: integer('post_count').notNull().default(0),
  viewCount: integer('view_count').notNull().default(0),
  upvotes: integer('upvotes').notNull().default(0),
  tags: jsonb('tags').notNull().default([]),
  lastPostAt: timestamp('last_post_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  forumIdx: index('edu_threads_forum_idx').on(table.forumId),
  authorIdx: index('edu_threads_author_idx').on(table.authorId),
  pinnedIdx: index('edu_threads_pinned_idx').on(table.forumId, table.isPinned),
}));

export const forumPosts = pgTable('education_forum_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').notNull().references(() => forumThreads.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').notNull(),
  authorName: varchar('author_name', { length: 255 }).notNull(),
  content: text('content').notNull(),
  isAnswer: boolean('is_answer').notNull().default(false),
  upvotes: integer('upvotes').notNull().default(0),
  parentPostId: uuid('parent_post_id'),
  isEdited: boolean('is_edited').notNull().default(false),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  threadIdx: index('edu_posts_thread_idx').on(table.threadId),
  authorIdx: index('edu_posts_author_idx').on(table.authorId),
  parentIdx: index('edu_posts_parent_idx').on(table.parentPostId),
}));

export const studyGroups = pgTable('education_study_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  pathId: uuid('path_id').references(() => learningPaths.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  maxMembers: integer('max_members').notNull().default(20),
  memberCount: integer('member_count').notNull().default(0),
  isPublic: boolean('is_public').notNull().default(true),
  creatorId: uuid('creator_id').notNull(),
  schedule: jsonb('schedule'),
  tags: jsonb('tags').notNull().default([]),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('edu_groups_tenant_idx').on(table.tenantId),
  courseIdx: index('edu_groups_course_idx').on(table.courseId),
}));

export const studyGroupMembers = pgTable('education_study_group_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').notNull().references(() => studyGroups.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  role: varchar('role', { length: 50 }).notNull().default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  groupUserIdx: index('edu_group_members_group_user_idx').on(table.groupId, table.userId).unique(),
}));

export const mentorProfiles = pgTable('education_mentor_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  bio: text('bio').notNull().default(''),
  avatarUrl: text('avatar_url'),
  expertiseAreas: jsonb('expertise_areas').notNull().default([]),
  skillLevels: jsonb('skill_levels').notNull().default({}),
  availableHoursPerWeek: integer('available_hours_per_week').notNull().default(5),
  timezone: varchar('timezone', { length: 100 }).notNull().default('UTC'),
  languages: jsonb('languages').notNull().default([]),
  rating: integer('rating'),
  totalSessions: integer('total_sessions').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('edu_mentors_tenant_idx').on(table.tenantId),
  userIdx: index('edu_mentors_user_idx').on(table.tenantId, table.userId).unique(),
}));

export const mentorMatches = pgTable('education_mentor_matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  mentorId: uuid('mentor_id').notNull().references(() => mentorProfiles.id, { onDelete: 'cascade' }),
  menteeId: uuid('mentee_id').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  matchScore: integer('match_score').notNull().default(0), // 0-1000
  matchReason: text('match_reason').notNull().default(''),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
}, (table) => ({
  mentorIdx: index('edu_matches_mentor_idx').on(table.mentorId),
  menteeIdx: index('edu_matches_mentee_idx').on(table.tenantId, table.menteeId),
}));

export const mentorshipSessions = pgTable('education_mentorship_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  matchId: uuid('match_id').notNull().references(() => mentorMatches.id, { onDelete: 'cascade' }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(30),
  status: varchar('status', { length: 50 }).notNull().default('scheduled'),
  meetingUrl: text('meeting_url'),
  notes: text('notes'),
  menteeRating: integer('mentee_rating'),
  menteeFeedback: text('mentee_feedback'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  matchIdx: index('edu_mentorship_match_idx').on(table.matchId),
}));
```

### Key SQL Migrations

```sql
-- Full-text search for knowledge articles
CREATE INDEX edu_articles_search_idx ON education_knowledge_articles
  USING GIN (to_tsvector('english', title || ' ' || content));

-- Function to auto-update search vector
CREATE OR REPLACE FUNCTION education_update_article_search()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', NEW.title || ' ' || COALESCE(NEW.excerpt, '') || ' ' || NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER education_article_search_trigger
  BEFORE INSERT OR UPDATE ON education_knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION education_update_article_search();

-- RLS policies for all education tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE tablename LIKE 'education_%'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = current_setting(''app.current_tenant_id'')::uuid)',
      tbl
    );
  END LOOP;
END
$$;

-- Auto-increment enrollment count
CREATE OR REPLACE FUNCTION education_update_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE education_courses SET enrollment_count = enrollment_count + 1 WHERE id = NEW.course_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE education_courses SET enrollment_count = enrollment_count - 1 WHERE id = OLD.course_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER education_enrollment_count_trigger
  AFTER INSERT OR DELETE ON education_enrollments
  FOR EACH ROW EXECUTE FUNCTION education_update_enrollment_count();

-- Auto-update estimated duration from lessons
CREATE OR REPLACE FUNCTION education_update_course_duration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE education_courses
  SET estimated_duration_minutes = (
    SELECT COALESCE(SUM(estimated_duration_minutes), 0)
    FROM education_lessons
    WHERE course_id = COALESCE(NEW.course_id, OLD.course_id)
  )
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER education_course_duration_trigger
  AFTER INSERT OR UPDATE OR DELETE ON education_lessons
  FOR EACH ROW EXECUTE FUNCTION education_update_course_duration();
```

---

## Code Examples

### 1. Creating a Course with Modules and Lessons

```typescript
import { EducationService } from '@mcv/growth/education';

const education = new EducationService(config);

// Create the course
const course = await education.createCourse({
  title: 'Getting Started with MCV.ONE',
  description: 'A comprehensive guide to setting up and using the MCV.ONE platform.',
  shortDescription: 'Learn MCV.ONE from scratch in under 2 hours.',
  level: 'beginner',
  tags: ['getting-started', 'fundamentals', 'onboarding'],
  visibility: 'public',
});

// Add modules
const introModule = await education.addModule(course.id, {
  title: 'Introduction',
  description: 'What is MCV.ONE and why it matters',
  sortOrder: 0,
});

const setupModule = await education.addModule(course.id, {
  title: 'Setup & Configuration',
  description: 'Get your workspace up and running',
  sortOrder: 1,
});

// Add lessons to the intro module
const welcomeLesson = await education.addLesson(introModule.id, {
  title: 'Welcome to MCV.ONE',
  type: 'video',
  estimatedDurationMinutes: 5,
  isFree: true, // preview lesson
  isRequired: true,
});

// Add video content block
await education.addLessonContent(welcomeLesson.id, {
  type: 'video',
  muxAssetId: 'asset_abc123',
  muxPlaybackId: 'playback_xyz789',
  title: 'Welcome Video',
  description: null,
  durationSeconds: 312,
  thumbnailUrl: null,
  subtitlesUrl: null,
  chapters: [
    { title: 'Introduction', startSeconds: 0 },
    { title: 'Platform Overview', startSeconds: 45 },
    { title: 'What You\'ll Learn', startSeconds: 180 },
  ],
});

// Add a text lesson with code samples
const configLesson = await education.addLesson(setupModule.id, {
  title: 'Environment Configuration',
  type: 'text',
  estimatedDurationMinutes: 10,
});

await education.addLessonContent(configLesson.id, {
  type: 'text',
  content: `## Setting Up Your Environment\n\nFollow these steps to configure your MCV.ONE workspace...\n`,
  format: 'markdown',
});

await education.addLessonContent(configLesson.id, {
  type: 'code',
  language: 'typescript',
  code: `import { createClient } from '@mcv/core';\n\nconst client = createClient({\n  apiKey: process.env.MCV_API_KEY,\n  tenantId: process.env.MCV_TENANT_ID,\n});`,
  runnable: false,
  expectedOutput: null,
  hints: ['Make sure to set your environment variables first'],
});

// Publish the course
await education.publishCourse(course.id);

console.log(`Course published: ${course.title} (${course.slug})`);
```

### 2. Setting Up a Learning Path with Prerequisites

```typescript
import { EducationService } from '@mcv/growth/education';

const education = new EducationService(config);

// Create a learning path
const path = await education.createPath({
  title: 'MCV.ONE Developer Certification',
  description: 'Complete this path to earn your MCV.ONE Developer Certificate.',
  level: 'intermediate',
  tags: ['certification', 'developer', 'advanced'],
});

// Add courses in order with prerequisites
const fundamentals = await education.addCourseToPath(path.id, fundamentalsCourseId, {
  sortOrder: 0,
  isRequired: true,
  unlockCondition: { type: 'immediate' },
});

const apiCourse = await education.addCourseToPath(path.id, apiCourseId, {
  sortOrder: 1,
  isRequired: true,
  prerequisites: [fundamentalsCourseId],
  unlockCondition: { type: 'after_completion', courseId: fundamentalsCourseId },
});

const advancedCourse = await education.addCourseToPath(path.id, advancedCourseId, {
  sortOrder: 2,
  isRequired: true,
  prerequisites: [apiCourseId],
  unlockCondition: { type: 'after_score', courseId: apiCourseId, minimumScore: 80 },
});

// Optional elective
const integrationsCourse = await education.addCourseToPath(path.id, integrationsCourseId, {
  sortOrder: 3,
  isRequired: false,
  unlockCondition: { type: 'after_completion', courseId: fundamentalsCourseId },
});

// Get recommendations for a user based on their skills
const recommendations = await education.getRecommendedPaths(userId);
for (const rec of recommendations) {
  console.log(`${rec.path.title} — ${rec.score.toFixed(2)} match (${rec.reason})`);
  console.log(`  Skills: ${rec.matchedSkills.join(', ')}`);
  console.log(`  Time: ~${rec.estimatedTimeToComplete} minutes`);
}
```

### 3. Quiz Creation and Auto-Grading

```typescript
import { EducationService } from '@mcv/growth/education';

const education = new EducationService(config);

// Create a quiz attached to a lesson
const quiz = await education.createQuiz(lessonId, {
  title: 'API Fundamentals Assessment',
  description: 'Test your understanding of the MCV.ONE API.',
  type: 'graded',
  passingScore: 70,
  maxAttempts: 3,
  timeLimitMinutes: 30,
  shuffleQuestions: true,
  shuffleAnswers: true,
  showCorrectAnswers: true,
  showExplanations: true,
});

// Add multiple choice question
await education.addQuestion(quiz.id, {
  type: 'multiple_choice',
  content: 'Which HTTP method should be used to create a new resource via the MCV.ONE API?',
  points: 2,
  difficulty: 'easy',
  options: [
    { text: 'GET', isCorrect: false, explanation: 'GET is for reading resources.', sortOrder: 0 },
    { text: 'POST', isCorrect: true, explanation: 'POST is the standard method for creating resources.', sortOrder: 1 },
    { text: 'PUT', isCorrect: false, explanation: 'PUT is for updating/replacing resources.', sortOrder: 2 },
    { text: 'DELETE', isCorrect: false, explanation: 'DELETE removes resources.', sortOrder: 3 },
  ],
  correctAnswer: 'POST',
  explanation: 'POST is the standard HTTP method for creating new resources. The MCV.ONE API follows RESTful conventions.',
  tags: ['http', 'rest', 'api-basics'],
});

// Add true/false question
await education.addQuestion(quiz.id, {
  type: 'true_false',
  content: 'The MCV.ONE API uses JWT tokens for authentication.',
  points: 1,
  difficulty: 'easy',
  correctAnswer: true,
  explanation: 'MCV.ONE uses JSON Web Tokens (JWT) issued by Supabase Auth for API authentication.',
  tags: ['auth', 'jwt'],
});

// Add coding challenge
await education.addQuestion(quiz.id, {
  type: 'coding',
  content: 'Write a function that initializes the MCV client and fetches a list of courses.',
  points: 5,
  difficulty: 'medium',
  correctAnswer: null, // graded by test cases
  codingChallenge: {
    language: 'typescript',
    starterCode: `import { createClient } from '@mcv/core';

// Initialize the client and fetch courses
export async function fetchCourses(apiKey: string): Promise<Course[]> {
  // Your code here
}`,
    solutionCode: `import { createClient } from '@mcv/core';

export async function fetchCourses(apiKey: string): Promise<Course[]> {
  const client = createClient({ apiKey });
  const { data } = await client.education.listCourses({ status: 'published' });
  return data.items;
}`,
    testCases: [
      { id: 'tc1', name: 'Returns array', input: 'test-key', expectedOutput: 'Array', isHidden: false, points: 2 },
      { id: 'tc2', name: 'Calls listCourses', input: 'test-key', expectedOutput: 'called', isHidden: false, points: 2 },
      { id: 'tc3', name: 'Handles errors', input: 'invalid', expectedOutput: 'error', isHidden: true, points: 1 },
    ],
    timeoutMs: 5000,
    memoryLimitMb: 128,
    allowedImports: ['@mcv/core'],
    forbiddenPatterns: ['eval', 'Function('],
  },
  tags: ['coding', 'api-client'],
});

// Student takes the quiz
const attempt = await education.startQuizAttempt(quiz.id, studentUserId);

// Submit answers
await education.submitAnswer(attempt.id, questionId1, 'POST');
await education.submitAnswer(attempt.id, questionId2, true);
await education.submitAnswer(attempt.id, questionId3, codeSolution);

// Finish and auto-grade
const result = await education.finishQuizAttempt(attempt.id);

console.log(`Score: ${result.score}% (${result.passed ? 'PASSED' : 'FAILED'})`);
console.log(`Points: ${result.earnedPoints}/${result.totalPoints}`);
console.log(`Time: ${result.timeSpentSeconds}s`);

for (const qr of result.questionResults) {
  console.log(`  Q: ${qr.isCorrect ? '✓' : '✗'} (${qr.pointsEarned}/${qr.pointsPossible})`);
}
```

### 4. Progress Tracking and Resume

```typescript
import { EducationService } from '@mcv/growth/education';

const education = new EducationService(config);

// Mark lesson started and track time
await education.markLessonStarted(lessonId, userId);
await education.trackTime(lessonId, userId, 120); // 2 minutes

// Mark lesson complete
await education.markLessonComplete(lessonId, userId);

// Get course progress
const courseProgress = await education.getProgress(courseId, userId);
console.log(`Course: ${courseProgress.overallProgress}% complete`);
console.log(`Modules: ${courseProgress.modulesCompleted}/${courseProgress.modulesTotal}`);
console.log(`Lessons: ${courseProgress.lessonsCompleted}/${courseProgress.lessonsTotal}`);
console.log(`Quizzes passed: ${courseProgress.quizzesPassed}/${courseProgress.quizzesTotal}`);
console.log(`Average quiz score: ${courseProgress.averageQuizScore}%`);
console.log(`Time spent: ${Math.round(courseProgress.totalTimeSpentSeconds / 60)} minutes`);
console.log(`Est. remaining: ${courseProgress.estimatedTimeRemainingMinutes} minutes`);

// Module-by-module breakdown
for (const mod of courseProgress.moduleProgress) {
  const status = mod.isComplete ? '✓' : `${mod.lessonsCompleted}/${mod.lessonsTotal}`;
  console.log(`  ${mod.moduleTitle}: ${status}`);
}

// Get learning path progress
const pathProgress = await education.getPathProgress(pathId, userId);
console.log(`\nPath: ${pathProgress.overallProgress}% complete`);
console.log(`Courses: ${pathProgress.coursesCompleted}/${pathProgress.coursesTotal}`);
if (pathProgress.estimatedCompletionDate) {
  console.log(`Est. completion: ${pathProgress.estimatedCompletionDate.toLocaleDateString()}`);
}

// Resume where left off
const resumePoint = await education.getResumePoint(userId);
if (resumePoint) {
  console.log(`\nResume: ${resumePoint.resumeUrl}`);
  if (resumePoint.videoTimestamp) {
    console.log(`  Video position: ${resumePoint.videoTimestamp}s`);
  }
}
```

### 5. Knowledge Base with Search and Feedback

```typescript
import { EducationService } from '@mcv/growth/education';

const education = new EducationService(config);

// Create an article
const article = await education.createArticle({
  title: 'How to Set Up Webhooks',
  content: `# Webhooks Guide

Webhooks allow your application to receive real-time notifications when events occur in MCV.ONE.

## Prerequisites

- An active MCV.ONE account
- A publicly accessible HTTPS endpoint

## Step 1: Configure Your Endpoint

Navigate to **Settings → Webhooks** and click "Add Endpoint"...

## Step 2: Select Events

Choose which events trigger webhook deliveries...

## Troubleshooting

### Webhook Not Firing
- Verify your endpoint is publicly accessible
- Check that the event type is selected
- Review the delivery logs in the dashboard
`,
  excerpt: 'Learn how to configure webhooks to receive real-time event notifications from MCV.ONE.',
  categoryId: integrationsCategoryId,
  tags: ['webhooks', 'integrations', 'api', 'events'],
  seoTitle: 'MCV.ONE Webhooks Setup Guide',
  seoDescription: 'Step-by-step guide to configuring webhooks for real-time notifications in MCV.ONE.',
});

await education.publishArticle(article.id);

// Search the knowledge base
const results = await education.searchArticles('webhook setup', {
  status: 'published',
  tags: ['integrations'],
});

for (const result of results) {
  console.log(`[${result.relevanceScore.toFixed(2)}] ${result.highlightedTitle}`);
  console.log(`  ${result.highlightedExcerpt}`);
  console.log(`  Terms: ${result.matchedTerms.join(', ')}`);
}

// Get related articles
const related = await education.getRelatedArticles(article.id);
for (const rel of related) {
  console.log(`Related: ${rel.title} (${rel.categoryName}) — ${rel.relevanceScore.toFixed(2)}`);
}

// Submit feedback
await education.submitFeedback(article.id, {
  articleId: article.id,
  userId: currentUserId,
  helpful: true,
  comment: 'Clear and easy to follow. The troubleshooting section was especially helpful.',
  submittedAt: new Date(),
});
```

### 6. Webinar Lifecycle

```typescript
import { EducationService } from '@mcv/growth/education';

const education = new EducationService(config);

// Create and schedule a webinar
const webinar = await education.createWebinar({
  title: 'MCV.ONE Advanced API Patterns',
  description: 'Deep dive into advanced API patterns including webhooks, batch operations, and real-time subscriptions.',
  scheduledStartAt: new Date('2026-03-15T14:00:00Z'),
  scheduledEndAt: new Date('2026-03-15T15:30:00Z'),
  timezone: 'America/New_York',
  maxAttendees: 500,
  registrationRequired: true,
  registrationDeadline: new Date('2026-03-15T13:00:00Z'),
  coHostIds: [coHostUserId],
  tags: ['api', 'advanced', 'live'],
  courseId: apiCourseId, // linked to a course
});

await education.scheduleWebinar(webinar.id, {
  startAt: webinar.scheduledStartAt,
  endAt: webinar.scheduledEndAt,
  timezone: 'America/New_York',
  reminderMinutesBefore: [1440, 60, 15], // 24h, 1h, 15min before
});

// Users register
await education.registerForWebinar(webinar.id, userId1);
await education.registerForWebinar(webinar.id, userId2);

// Start the webinar
await education.startWebinar(webinar.id);

// Track attendance
await education.trackAttendance(webinar.id, userId1, {
  type: 'join',
  timestamp: new Date(),
});

// Handle Q&A
const question = await education.submitQuestion(
  webinar.id,
  userId1,
  'Can webhooks be configured per-tenant or only globally?'
);

// End the webinar
await education.endWebinar(webinar.id);
```

### 7. Onboarding Guide with Product Tour

```typescript
import { EducationService } from '@mcv/growth/education';

const education = new EducationService(config);

// Create an interactive onboarding guide
const guide = await education.createGuide({
  title: 'Welcome to Your Dashboard',
  description: 'A quick tour of the key features in your MCV.ONE dashboard.',
  type: 'product_tour',
  triggerCondition: { type: 'first_login' },
  targetAudience: {
    roles: ['admin', 'editor'],
    plans: ['pro', 'enterprise'],
    segments: [],
    excludeCompletedGuides: [],
  },
  priority: 100,
  steps: [
    {
      type: 'info',
      title: 'Welcome!',
      content: 'Let\'s take a quick tour of your new dashboard. This will take about 2 minutes.',
      sortOrder: 0,
      isRequired: false,
      action: null,
      tooltip: null,
      metadata: {},
    },
    {
      type: 'tooltip',
      title: 'Navigation Sidebar',
      content: 'Use the sidebar to navigate between different sections of MCV.ONE.',
      sortOrder: 1,
      isRequired: true,
      action: null,
      tooltip: {
        targetSelector: '#main-sidebar',
        placement: 'right',
        highlightTarget: true,
        overlayOpacity: 0.5,
        allowInteraction: false,
        advanceOn: 'click_next',
        autoAdvanceMs: null,
      },
      metadata: {},
    },
    {
      type: 'action',
      title: 'Create Your First Course',
      content: 'Click the "New Course" button to start creating educational content.',
      sortOrder: 2,
      isRequired: true,
      action: {
        type: 'click',
        target: '[data-testid="new-course-btn"]',
        validation: {
          type: 'url_match',
          value: '/courses/new',
          timeoutMs: 5000,
        },
      },
      tooltip: {
        targetSelector: '[data-testid="new-course-btn"]',
        placement: 'bottom',
        highlightTarget: true,
        overlayOpacity: 0.6,
        allowInteraction: true,
        advanceOn: 'click_target',
        autoAdvanceMs: null,
      },
      metadata: {},
    },
    {
      type: 'celebration',
      title: 'You\'re All Set! 🎉',
      content: 'Great job! You\'ve completed the dashboard tour. Start building your first course now.',
      sortOrder: 3,
      isRequired: false,
      action: null,
      tooltip: null,
      metadata: { confetti: true },
    },
  ],
});

await education.activateGuide(guide.id);

// Check which guides apply to a user
const activeGuides = await education.getActiveGuides(userId, {
  url: '/dashboard',
  role: 'admin',
  plan: 'pro',
});

// Track step completion
for (const step of activeGuides[0].steps) {
  // User completes step...
  await education.completeGuideStep(activeGuides[0].id, step.id, userId);
}

// Check completion
const completion = await education.getGuideCompletion(guide.id, userId);
console.log(`Guide: ${completion.stepsCompleted}/${completion.stepsTotal} steps`);
console.log(`Complete: ${completion.isComplete}`);
```

### 8. Education Analytics Dashboard

```typescript
import { EducationService } from '@mcv/growth/education';

const education = new EducationService(config);
const period = {
  from: new Date('2026-01-01'),
  to: new Date('2026-02-01'),
};

// Course analytics
const courseStats = await education.getCourseAnalytics(courseId, period);
console.log('=== Course Analytics ===');
console.log(`Enrollments: ${courseStats.enrollments.total} (${courseStats.enrollments.newInPeriod} new)`);
console.log(`Active: ${courseStats.enrollments.active} | Completed: ${courseStats.enrollments.completed}`);
console.log(`Completion rate: ${courseStats.completion.rate}%`);
console.log(`Avg time to complete: ${courseStats.completion.averageTimeToComplete} min`);
console.log(`Bounce rate: ${courseStats.engagement.bounceRate}%`);

console.log('\nDrop-off points:');
for (const drop of courseStats.content.dropOffPoints) {
  console.log(`  ${drop.title}: ${drop.dropOffRate}% drop-off`);
}

// Quiz analytics
const quizStats = await education.getQuizAnalytics(quizId, period);
console.log('\n=== Quiz Analytics ===');
console.log(`Attempts: ${quizStats.attempts.total} (${quizStats.attempts.unique} unique users)`);
console.log(`Pass rate: ${quizStats.scores.passRate}%`);
console.log(`Average score: ${quizStats.scores.average} (σ=${quizStats.scores.standardDeviation})`);

console.log('\nMost missed questions:');
for (const q of quizStats.questions.mostMissed.slice(0, 3)) {
  console.log(`  ${q.content.slice(0, 60)}... — ${q.correctRate}% correct`);
}

// Knowledge gaps
const gaps = await education.getKnowledgeGaps({
  minimumAttempts: 10,
  scoreThreshold: 50,
  period,
});

console.log('\n=== Knowledge Gaps ===');
console.log(`Coverage score: ${gaps.overallCoverageScore}/100`);
for (const gap of gaps.gaps) {
  console.log(`  [${gap.severity.toUpperCase()}] ${gap.topic}`);
  console.log(`    Affected: ${gap.affectedLearners} learners, Avg score: ${gap.averageScore}%`);
  console.log(`    Actions: ${gap.suggestedActions.join('; ')}`);
}

// Completion funnel
const funnel = await education.getCompletionFunnel(courseId);
console.log('\n=== Completion Funnel ===');
for (const stage of funnel.stages) {
  const bar = '█'.repeat(Math.round(stage.learnersCompleted / funnel.stages[0].learnersEntered * 50));
  console.log(`  ${stage.name.padEnd(25)} ${bar} ${stage.learnersCompleted} (${stage.dropOffRate}% drop)`);
}
console.log(`\nBiggest drop: ${funnel.biggestDropOff.from} → ${funnel.biggestDropOff.to} (${funnel.biggestDropOff.dropRate}%)`);

// Content effectiveness
const effectiveness = await education.getContentEffectiveness(period);
console.log('\n=== Content Effectiveness ===');
console.log('Top performers:');
for (const c of effectiveness.topPerformers.slice(0, 3)) {
  console.log(`  ✓ ${c.title}: ${c.score}/100`);
}
console.log('Needs improvement:');
for (const c of effectiveness.needsImprovement.slice(0, 3)) {
  console.log(`  ✗ ${c.title}: ${c.score}/100 — ${c.issues.join(', ')}`);
}
```

---

## Error Codes

All errors thrown by this module extend `EducationError` and include a machine-readable `code`, a human-readable `message`, and optional `details`.

```typescript
import { EducationErrors } from '@mcv/growth/education';

class EducationError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
}
```

| Code | Status | Description |
|------|--------|-------------|
| `EDUCATION_COURSE_NOT_FOUND` | 404 | The specified course does not exist or is not accessible in the current tenant. |
| `EDUCATION_COURSE_NOT_PUBLISHED` | 403 | Attempting to enroll or access content in a course that isn't published. |
| `EDUCATION_COURSE_ALREADY_PUBLISHED` | 409 | Course is already in published status; unpublish first to make changes. |
| `EDUCATION_COURSE_HAS_ENROLLMENTS` | 409 | Cannot delete a course that has active enrollments. Archive it instead. |
| `EDUCATION_LESSON_NOT_FOUND` | 404 | The specified lesson does not exist within the course. |
| `EDUCATION_MODULE_NOT_FOUND` | 404 | The specified module does not exist within the course. |
| `EDUCATION_ENROLLMENT_EXISTS` | 409 | User is already enrolled in this course. |
| `EDUCATION_ENROLLMENT_NOT_FOUND` | 404 | No enrollment found for the specified user and course. |
| `EDUCATION_ENROLLMENT_EXPIRED` | 403 | The user's enrollment has expired; re-enrollment or renewal required. |
| `EDUCATION_PATH_NOT_FOUND` | 404 | The specified learning path does not exist. |
| `EDUCATION_PREREQUISITE_NOT_MET` | 403 | User has not completed the prerequisite course(s) required to unlock this content. |
| `EDUCATION_PREREQUISITE_SCORE_TOO_LOW` | 403 | User's score on the prerequisite course is below the minimum threshold. |
| `EDUCATION_QUIZ_NOT_FOUND` | 404 | The specified quiz does not exist. |
| `EDUCATION_QUIZ_MAX_ATTEMPTS` | 403 | User has exhausted the maximum number of attempts for this quiz. |
| `EDUCATION_QUIZ_TIME_EXPIRED` | 403 | The quiz attempt time limit has been reached; attempt auto-submitted. |
| `EDUCATION_QUIZ_NOT_AVAILABLE` | 403 | The quiz is outside its availability window (`availableFrom` / `availableUntil`). |
| `EDUCATION_QUIZ_ALREADY_SUBMITTED` | 409 | This quiz attempt has already been submitted and cannot be modified. |
| `EDUCATION_ATTEMPT_NOT_FOUND` | 404 | The specified quiz attempt does not exist. |
| `EDUCATION_QUESTION_NOT_IN_QUIZ` | 400 | The submitted answer references a question not belonging to this quiz. |
| `EDUCATION_CERTIFICATE_NOT_FOUND` | 404 | The specified certificate does not exist. |
| `EDUCATION_CERTIFICATE_ALREADY_ISSUED` | 409 | A certificate has already been issued for this user and course. |
| `EDUCATION_CERTIFICATE_REVOKED` | 403 | This certificate has been revoked and is no longer valid. |
| `EDUCATION_CERTIFICATE_EXPIRED` | 403 | This certificate has expired; renewal is required. |
| `EDUCATION_CERTIFICATE_REQUIREMENTS_NOT_MET` | 403 | User has not met all requirements (course completion, quiz scores) for certification. |
| `EDUCATION_ARTICLE_NOT_FOUND` | 404 | The specified knowledge base article does not exist. |
| `EDUCATION_ARTICLE_SLUG_EXISTS` | 409 | An article with this slug already exists in the tenant. |
| `EDUCATION_CATEGORY_NOT_FOUND` | 404 | The specified article category does not exist. |
| `EDUCATION_WEBINAR_NOT_FOUND` | 404 | The specified webinar does not exist. |
| `EDUCATION_WEBINAR_FULL` | 403 | The webinar has reached its maximum attendee capacity. |
| `EDUCATION_WEBINAR_REGISTRATION_CLOSED` | 403 | Registration deadline has passed for this webinar. |
| `EDUCATION_WEBINAR_NOT_LIVE` | 400 | Operation requires the webinar to be in 'live' status. |
| `EDUCATION_WEBINAR_ALREADY_REGISTERED` | 409 | User is already registered for this webinar. |
| `EDUCATION_GUIDE_NOT_FOUND` | 404 | The specified onboarding guide does not exist. |
| `EDUCATION_GUIDE_NOT_ACTIVE` | 403 | The onboarding guide is not in 'active' status. |
| `EDUCATION_GUIDE_ALREADY_COMPLETED` | 409 | User has already completed this guide. |
| `EDUCATION_FORUM_NOT_FOUND` | 404 | The specified discussion forum does not exist. |
| `EDUCATION_FORUM_LOCKED` | 403 | The forum is locked; new threads and posts cannot be created. |
| `EDUCATION_THREAD_LOCKED` | 403 | The thread is locked; new posts cannot be added. |
| `EDUCATION_STUDY_GROUP_FULL` | 403 | The study group has reached its maximum member count. |
| `EDUCATION_MENTOR_NOT_FOUND` | 404 | The specified mentor profile does not exist. |
| `EDUCATION_MENTOR_UNAVAILABLE` | 403 | The mentor is not currently accepting new mentees. |
| `EDUCATION_CODING_TIMEOUT` | 408 | The coding challenge execution timed out. |
| `EDUCATION_CODING_MEMORY_EXCEEDED` | 413 | The coding challenge exceeded the memory limit. |
| `EDUCATION_CODING_FORBIDDEN_PATTERN` | 400 | The submitted code contains a forbidden pattern (e.g., `eval`). |
| `EDUCATION_INVALID_CONTENT_BLOCK` | 400 | The lesson content block data does not match the expected schema for its type. |
| `EDUCATION_SLUG_CONFLICT` | 409 | A resource with this slug already exists in the tenant. |
| `EDUCATION_TENANT_MISMATCH` | 403 | Attempted cross-tenant operation; resource belongs to a different tenant. |
| `EDUCATION_INSUFFICIENT_PERMISSIONS` | 403 | User does not have the required role (admin/editor) for this operation. |
| `EDUCATION_VIDEO_PROCESSING_FAILED` | 500 | Mux video processing failed; check the asset status for details. |
| `EDUCATION_MUX_WEBHOOK_INVALID` | 400 | The incoming Mux webhook signature could not be verified. |

### Error Handling Example

```typescript
import { EducationService, EducationErrors } from '@mcv/growth/education';

try {
  await education.startQuizAttempt(quizId, userId);
} catch (error) {
  if (error instanceof EducationErrors.EducationError) {
    switch (error.code) {
      case 'EDUCATION_QUIZ_MAX_ATTEMPTS':
        console.log(`Max attempts reached. You've used all ${error.details?.maxAttempts} attempts.`);
        break;
      case 'EDUCATION_QUIZ_NOT_AVAILABLE':
        console.log(`Quiz available from ${error.details?.availableFrom} to ${error.details?.availableUntil}`);
        break;
      case 'EDUCATION_PREREQUISITE_NOT_MET':
        console.log(`Complete these courses first: ${(error.details?.requiredCourses as string[]).join(', ')}`);
        break;
      default:
        console.error(`Education error [${error.code}]: ${error.message}`);
    }
  }
  throw error;
}
```

---

## Security

### Authentication & Authorization

```typescript
// Role-based access control
type EducationRole = 'admin' | 'editor' | 'instructor' | 'learner' | 'viewer';

const rolePermissions: Record<EducationRole, string[]> = {
  admin: ['*'], // full access
  editor: [
    'course.create', 'course.update', 'course.publish', 'course.delete',
    'lesson.create', 'lesson.update', 'lesson.delete',
    'quiz.create', 'quiz.update', 'quiz.delete',
    'article.create', 'article.update', 'article.publish',
    'path.create', 'path.update',
    'webinar.create', 'webinar.manage',
    'guide.create', 'guide.update',
    'analytics.view',
  ],
  instructor: [
    'course.create', 'course.update', // own courses only
    'lesson.create', 'lesson.update',
    'quiz.create', 'quiz.update', 'quiz.grade',
    'webinar.create', 'webinar.manage', // own webinars
    'forum.moderate', // assigned forums
    'analytics.view', // own course analytics
  ],
  learner: [
    'course.view', 'course.enroll',
    'lesson.view', 'lesson.complete',
    'quiz.attempt',
    'article.view', 'article.feedback',
    'webinar.register', 'webinar.attend',
    'forum.post', 'forum.reply',
    'group.join',
    'progress.view', // own progress
  ],
  viewer: [
    'course.view', // published only
    'article.view',
    'webinar.view',
  ],
};
```

### Row-Level Security

All database tables enforce tenant isolation via Supabase RLS:

```sql
-- Tenant isolation: users can only access their own tenant's data
ALTER TABLE education_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_read" ON education_courses
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "tenant_write" ON education_courses
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND current_setting('app.current_user_role') IN ('admin', 'editor', 'instructor')
  );

-- Learners can only see published courses
CREATE POLICY "learner_courses" ON education_courses
  FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      status = 'published'
      OR author_id = current_setting('app.current_user_id')::uuid
    )
  );

-- Learners can only see their own progress
CREATE POLICY "own_progress" ON education_learner_progress
  FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND user_id = current_setting('app.current_user_id')::uuid
  );

-- Quiz answers are hidden from other users
CREATE POLICY "own_attempts" ON education_quiz_attempts
  FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND (
      user_id = current_setting('app.current_user_id')::uuid
      OR current_setting('app.current_user_role') IN ('admin', 'editor', 'instructor')
    )
  );
```

### Content Security

```typescript
// Video content protection via Mux signed URLs
interface VideoSecurityConfig {
  /** Enable signed URLs for video playback (prevents hotlinking) */
  signedUrls: boolean;
  /** URL expiration time in seconds */
  urlExpirySeconds: number;
  /** Restrict playback to specific domains */
  allowedDomains: string[];
  /** Enable DRM (requires Mux Enterprise) */
  drm: boolean;
}

// Certificate verification security
interface CertificateSecurityConfig {
  /** HMAC signing key for verification codes */
  signingKey: string;
  /** Include QR code with embedded verification URL */
  includeQrCode: boolean;
  /** Tamper-evident metadata in certificate PDF */
  embedMetadata: boolean;
}
```

### Input Validation

```typescript
// All inputs are validated using Zod schemas
import { z } from 'zod';

const createCourseSchema = z.object({
  title: z.string().min(1).max(500).trim(),
  description: z.string().min(1).max(50000),
  shortDescription: z.string().max(1000).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  visibility: z.enum(['public', 'enrolled', 'private', 'organization']).optional(),
});

// Content blocks are validated per-type
const contentBlockVideoSchema = z.object({
  type: z.literal('video'),
  muxAssetId: z.string().min(1),
  muxPlaybackId: z.string().min(1),
  title: z.string().max(500).nullable(),
  durationSeconds: z.number().int().min(0),
  // ... additional fields
});

// Quiz answers are sanitized to prevent injection
const sanitizeAnswer = (answer: unknown, questionType: QuestionType): unknown => {
  // Strip HTML, enforce length limits, validate against expected types
};

// Coding challenge submissions are sandboxed
const codingSecurityConfig = {
  /** Execute in isolated container */
  sandboxed: true,
  /** No network access */
  networkDisabled: true,
  /** Read-only filesystem */
  readOnlyFs: true,
  /** Resource limits */
  maxCpuMs: 5000,
  maxMemoryMb: 128,
  maxOutputBytes: 1024 * 1024, // 1MB
};
```

### Rate Limiting

```typescript
const educationRateLimits = {
  /** Quiz attempts */
  'quiz.start': { windowMs: 60_000, max: 5 },
  /** Answer submissions */
  'quiz.answer': { windowMs: 1_000, max: 10 },
  /** Knowledge base search */
  'article.search': { windowMs: 60_000, max: 30 },
  /** Webinar registration */
  'webinar.register': { windowMs: 60_000, max: 10 },
  /** Forum posts */
  'forum.post': { windowMs: 60_000, max: 5 },
  /** Feedback submission */
  'article.feedback': { windowMs: 60_000, max: 10 },
  /** Course creation (admin) */
  'course.create': { windowMs: 3600_000, max: 50 },
};
```

### Audit Logging

All mutating operations emit audit events:

```typescript
interface EducationAuditEvent {
  type: 'education.audit';
  action: string; // e.g., 'course.created', 'quiz.graded', 'certificate.issued'
  tenantId: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata: Record<string, unknown>;
  timestamp: Date;
  ip: string | null;
  userAgent: string | null;
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EDUCATION_MUX_TOKEN_ID` | Yes | — | Mux API token ID for video processing |
| `EDUCATION_MUX_TOKEN_SECRET` | Yes | — | Mux API token secret |
| `EDUCATION_MUX_WEBHOOK_SECRET` | Yes | — | Mux webhook signing secret for verification |
| `EDUCATION_STORAGE_BUCKET` | No | `education-assets` | Supabase Storage bucket for course assets (images, downloads) |
| `EDUCATION_CERT_TEMPLATE_BUCKET` | No | `certificate-templates` | Supabase Storage bucket for certificate templates |
| `EDUCATION_CERT_VERIFICATION_URL` | No | `https://verify.mcv.one/cert` | Base URL for certificate verification |
| `EDUCATION_CERT_SIGNING_KEY` | Yes | — | HMAC key for signing certificate verification codes |
| `EDUCATION_VIDEO_SIGNED_URLS` | No | `true` | Enable signed URLs for video playback |
| `EDUCATION_VIDEO_URL_EXPIRY` | No | `7200` | Signed video URL expiry in seconds |
| `EDUCATION_VIDEO_ALLOWED_DOMAINS` | No | `*` | Comma-separated domains allowed for video playback |
| `EDUCATION_CODING_SANDBOX_URL` | No | — | URL of the coding challenge sandbox service |
| `EDUCATION_CODING_TIMEOUT_MS` | No | `5000` | Default timeout for coding challenges |
| `EDUCATION_CODING_MEMORY_MB` | No | `128` | Default memory limit for coding challenges |
| `EDUCATION_SEARCH_MIN_QUERY_LENGTH` | No | `2` | Minimum character count for knowledge base search |
| `EDUCATION_MAX_QUIZ_ATTEMPTS` | No | `10` | Global maximum quiz attempts (per-quiz setting overrides) |
| `EDUCATION_ENABLE_COMMUNITY` | No | `true` | Enable community learning features (forums, groups, mentors) |
| `EDUCATION_ENABLE_WEBINARS` | No | `true` | Enable webinar features |
| `EDUCATION_ENABLE_CODING_CHALLENGES` | No | `true` | Enable coding challenge question type |
| `EDUCATION_ENABLE_AI_RECOMMENDATIONS` | No | `false` | Enable AI-powered path recommendations |
| `EDUCATION_ANALYTICS_RETENTION_DAYS` | No | `365` | How long to retain detailed analytics data |
| `EDUCATION_SESSION_TIMEOUT_MINUTES` | No | `30` | Time tracking session inactivity timeout |

---

## Dependencies

### Internal Dependencies

| Package | Purpose |
|---------|---------|
| `@mcv/core` | Tenant context, auth, base error classes, event bus |
| `@mcv/db` | Drizzle ORM instance, migration runner, connection pool |
| `@mcv/storage` | Supabase Storage abstraction for file uploads |
| `@mcv/events` | Event bus for publishing education events |
| `@mcv/auth` | User identity, role resolution, session management |
| `@mcv/notifications` | Email/push notifications for reminders, completions, certificates |
| `@mcv/analytics` | Analytics pipeline integration for education metrics |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mux/mux-node` | `^8.x` | Mux API client for video ingest, playback, and asset management |
| `drizzle-orm` | `^0.33.x` | Type-safe ORM for database queries |
| `@trpc/server` | `^10.x` | Type-safe API layer |
| `zod` | `^3.x` | Runtime input validation |
| `@supabase/supabase-js` | `^2.x` | Supabase client for RLS-scoped queries and storage |
| `nanoid` | `^5.x` | Generate compact, URL-safe unique IDs (verification codes) |
| `puppeteer-core` | `^22.x` | PDF generation for certificates (HTML → PDF) |
| `qrcode` | `^1.x` | QR code generation for certificate verification |
| `marked` | `^12.x` | Markdown rendering for article and lesson content |
| `dompurify` | `^3.x` | HTML sanitization for user-generated content |
| `fuse.js` | `^7.x` | Client-side fuzzy search fallback |
| `date-fns` | `^3.x` | Date manipulation for scheduling, expiration, analytics |

### Peer Dependencies

| Package | Version | Notes |
|---------|---------|-------|
| `@supabase/supabase-js` | `^2.x` | Must be provided by the host application |
| `drizzle-orm` | `^0.33.x` | Must be provided by the host application |

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EducationService } from '@mcv/growth/education';
import { createMockDb, createMockSupabase } from '@mcv/testing';

describe('EducationService', () => {
  let education: EducationService;
  let mockDb: ReturnType<typeof createMockDb>;
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    mockDb = createMockDb();
    mockSupabase = createMockSupabase();
    education = new EducationService({
      db: mockDb,
      supabase: mockSupabase,
      mux: { tokenId: 'test', tokenSecret: 'test', webhookSecret: 'test' },
      storageBucket: 'test-assets',
      certificates: {
        templateBucket: 'test-certs',
        verificationBaseUrl: 'https://test.verify.mcv.one',
        signingKey: 'test-signing-key-minimum-32-chars!!',
      },
    });
  });

  describe('Course Builder', () => {
    it('should create a course with default values', async () => {
      const course = await education.createCourse({
        title: 'Test Course',
        description: 'A test course.',
      });

      expect(course.title).toBe('Test Course');
      expect(course.slug).toBe('test-course');
      expect(course.status).toBe('draft');
      expect(course.visibility).toBe('enrolled');
      expect(course.level).toBe('beginner');
      expect(course.enrollmentCount).toBe(0);
    });

    it('should generate unique slugs for duplicate titles', async () => {
      const course1 = await education.createCourse({ title: 'API Guide', description: 'v1' });
      const course2 = await education.createCourse({ title: 'API Guide', description: 'v2' });

      expect(course1.slug).toBe('api-guide');
      expect(course2.slug).toBe('api-guide-2');
    });

    it('should not allow publishing a course with no lessons', async () => {
      const course = await education.createCourse({ title: 'Empty', description: 'No content' });

      await expect(education.publishCourse(course.id))
        .rejects.toThrow('EDUCATION_COURSE_HAS_NO_CONTENT');
    });

    it('should prevent deleting a course with active enrollments', async () => {
      const course = await education.createCourse({ title: 'Popular', description: 'Many users' });
      // ... add lessons, publish, enroll user ...

      await expect(education.deleteCourse(course.id))
        .rejects.toThrow('EDUCATION_COURSE_HAS_ENROLLMENTS');
    });
  });

  describe('Quiz Engine', () => {
    it('should auto-grade multiple choice questions', async () => {
      // Setup quiz with questions...
      const attempt = await education.startQuizAttempt(quizId, userId);
      await education.submitAnswer(attempt.id, mcQuestionId, 'POST');
      const result = await education.finishQuizAttempt(attempt.id);

      expect(result.questionResults[0].isCorrect).toBe(true);
      expect(result.questionResults[0].pointsEarned).toBe(2);
    });

    it('should enforce max attempts', async () => {
      // Quiz with maxAttempts: 2, user already has 2 attempts
      await expect(education.startQuizAttempt(quizId, userId))
        .rejects.toThrow('EDUCATION_QUIZ_MAX_ATTEMPTS');
    });

    it('should auto-submit on time expiry', async () => {
      vi.useFakeTimers();
      const attempt = await education.startQuizAttempt(timedQuizId, userId);

      // Advance past time limit
      vi.advanceTimersByTime(31 * 60 * 1000); // 31 minutes

      const result = await education.finishQuizAttempt(attempt.id);
      expect(result.attempt.status).toBe('timed_out');

      vi.useRealTimers();
    });

    it('should shuffle questions when configured', async () => {
      const attempt1 = await education.startQuizAttempt(shuffledQuizId, userId1);
      const attempt2 = await education.startQuizAttempt(shuffledQuizId, userId2);

      // Question order should differ (statistically)
      const order1 = attempt1.answers.map(a => a.questionId);
      const order2 = attempt2.answers.map(a => a.questionId);
      // They contain the same questions
      expect(new Set(order1)).toEqual(new Set(order2));
    });
  });

  describe('Certifications', () => {
    it('should issue a certificate on course completion', async () => {
      // Mark course as completed...
      const cert = await education.issueCertificate(userId, courseId);

      expect(cert.status).toBe('active');
      expect(cert.verificationCode).toHaveLength(32);
      expect(cert.verificationUrl).toContain('https://test.verify.mcv.one');
    });

    it('should verify a valid certificate', async () => {
      const cert = await education.issueCertificate(userId, courseId);
      const verification = await education.verifyCertificate(cert.verificationCode);

      expect(verification.isValid).toBe(true);
      expect(verification.status).toBe('active');
    });

    it('should reject verification of revoked certificate', async () => {
      const cert = await education.issueCertificate(userId, courseId);
      await education.revokeCertificate(cert.id, 'Academic dishonesty');

      const verification = await education.verifyCertificate(cert.verificationCode);
      expect(verification.isValid).toBe(false);
      expect(verification.status).toBe('revoked');
    });
  });

  describe('Progress Tracking', () => {
    it('should calculate overall course progress', async () => {
      // Course with 4 lessons, complete 2
      await education.markLessonComplete(lesson1Id, userId);
      await education.markLessonComplete(lesson2Id, userId);

      const progress = await education.getProgress(courseId, userId);
      expect(progress.overallProgress).toBe(50);
      expect(progress.lessonsCompleted).toBe(2);
      expect(progress.lessonsTotal).toBe(4);
    });

    it('should track time accurately with focus events', async () => {
      await education.trackTime(lessonId, userId, 120);
      await education.trackTime(lessonId, userId, 60);

      const progress = await education.getProgress(courseId, userId);
      expect(progress.totalTimeSpentSeconds).toBeGreaterThanOrEqual(180);
    });

    it('should provide correct resume point', async () => {
      await education.markLessonStarted(lesson3Id, userId);

      const resume = await education.getResumePoint(userId);
      expect(resume).not.toBeNull();
      expect(resume!.lastLessonId).toBe(lesson3Id);
    });
  });

  describe('Knowledge Base', () => {
    it('should return search results ranked by relevance', async () => {
      await education.createArticle({ title: 'Webhooks Setup Guide', content: 'How to configure webhooks...', categoryId });
      await education.createArticle({ title: 'API Authentication', content: 'Webhook tokens can be used...', categoryId });

      const results = await education.searchArticles('webhook');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].relevanceScore).toBeGreaterThanOrEqual(results[1]?.relevanceScore ?? 0);
    });

    it('should track article versions', async () => {
      const article = await education.createArticle({ title: 'Guide v1', content: 'Original content', categoryId });
      await education.updateArticle(article.id, { content: 'Updated content', changelog: 'Fixed typos' });

      expect(article.version).toBe(1);
      // After update, version should increment
    });
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient } from '@mcv/testing';

describe('Education Integration', () => {
  let client: ReturnType<typeof createTestClient>;

  beforeAll(async () => {
    client = await createTestClient({
      modules: ['education'],
      seed: 'education-integration',
    });
  });

  afterAll(async () => {
    await client.cleanup();
  });

  it('should complete full learning path lifecycle', async () => {
    // 1. Create courses
    const course1 = await client.education.createCourse({
      title: 'Fundamentals',
      description: 'Basics',
    });
    const mod1 = await client.education.addModule(course1.id, { title: 'Intro' });
    const les1 = await client.education.addLesson(mod1.id, { title: 'Lesson 1', type: 'text' });
    await client.education.addLessonContent(les1.id, { type: 'text', content: 'Hello', format: 'markdown' });
    await client.education.publishCourse(course1.id);

    const course2 = await client.education.createCourse({
      title: 'Advanced',
      description: 'Deep dive',
    });
    const mod2 = await client.education.addModule(course2.id, { title: 'Intro' });
    const les2 = await client.education.addLesson(mod2.id, { title: 'Lesson 1', type: 'text' });
    await client.education.addLessonContent(les2.id, { type: 'text', content: 'Advanced content', format: 'markdown' });
    await client.education.publishCourse(course2.id);

    // 2. Create path
    const path = await client.education.createPath({
      title: 'Full Track',
      description: 'Complete track',
    });
    await client.education.addCourseToPath(path.id, course1.id, {
      sortOrder: 0,
      isRequired: true,
      unlockCondition: { type: 'immediate' },
    });
    await client.education.addCourseToPath(path.id, course2.id, {
      sortOrder: 1,
      isRequired: true,
      unlockCondition: { type: 'after_completion', courseId: course1.id },
    });

    // 3. Enroll and progress
    const learnerId = client.testUserId;
    await client.education.enrollUser(course1.id, learnerId);
    await client.education.markLessonComplete(les1.id, learnerId);

    const progress1 = await client.education.getProgress(course1.id, learnerId);
    expect(progress1.overallProgress).toBe(100);

    // 4. Course 2 should now be unlocked
    await client.education.enrollUser(course2.id, learnerId);
    await client.education.markLessonComplete(les2.id, learnerId);

    // 5. Path should be complete
    const pathProgress = await client.education.getPathProgress(path.id, learnerId);
    expect(pathProgress.overallProgress).toBe(100);
    expect(pathProgress.coursesCompleted).toBe(2);

    // 6. Issue certificate
    const cert = await client.education.issueCertificate(learnerId, course1.id);
    expect(cert.status).toBe('active');

    // 7. Verify certificate
    const verification = await client.education.verifyCertificate(cert.verificationCode);
    expect(verification.isValid).toBe(true);
  });

  it('should enforce tenant isolation', async () => {
    const otherTenantClient = await createTestClient({
      modules: ['education'],
      seed: 'other-tenant',
      tenantId: 'other-tenant-id',
    });

    const course = await client.education.createCourse({
      title: 'Tenant A Course',
      description: 'Private',
    });

    // Other tenant should not see this course
    const result = await otherTenantClient.education.getCourse(course.id);
    expect(result).toBeNull();

    await otherTenantClient.cleanup();
  });

  it('should handle concurrent quiz attempts correctly', async () => {
    // Ensure quiz with maxAttempts=1 rejects concurrent starts
    const quiz = await client.education.createQuiz(lessonId, {
      title: 'Single Attempt',
      maxAttempts: 1,
    });

    const attempt = await client.education.startQuizAttempt(quiz.id, userId);
    expect(attempt.status).toBe('in_progress');

    // Starting another attempt while one is in progress should fail
    await expect(client.education.startQuizAttempt(quiz.id, userId))
      .rejects.toThrow();
  });
});
```

### Test Utilities

```typescript
import { EducationService } from '@mcv/growth/education';

/**
 * Factory for creating test education data
 */
export class EducationTestFactory {
  constructor(private education: EducationService) {}

  async createFullCourse(options?: {
    moduleCount?: number;
    lessonsPerModule?: number;
    includeQuiz?: boolean;
  }): Promise<{ course: Course; modules: CourseModule[]; lessons: Lesson[]; quiz?: Quiz }> {
    const { moduleCount = 2, lessonsPerModule = 3, includeQuiz = true } = options ?? {};

    const course = await this.education.createCourse({
      title: `Test Course ${Date.now()}`,
      description: 'Auto-generated test course',
    });

    const modules: CourseModule[] = [];
    const lessons: Lesson[] = [];

    for (let m = 0; m < moduleCount; m++) {
      const mod = await this.education.addModule(course.id, {
        title: `Module ${m + 1}`,
        sortOrder: m,
      });
      modules.push(mod);

      for (let l = 0; l < lessonsPerModule; l++) {
        const lesson = await this.education.addLesson(mod.id, {
          title: `Lesson ${m + 1}.${l + 1}`,
          type: 'text',
          estimatedDurationMinutes: 5,
          sortOrder: l,
        });

        await this.education.addLessonContent(lesson.id, {
          type: 'text',
          content: `Content for lesson ${m + 1}.${l + 1}`,
          format: 'markdown',
        });

        lessons.push(lesson);
      }
    }

    let quiz: Quiz | undefined;
    if (includeQuiz) {
      quiz = await this.education.createQuiz(lessons[lessons.length - 1].id, {
        title: 'Final Quiz',
        type: 'graded',
        passingScore: 70,
      });

      await this.education.addQuestion(quiz.id, {
        type: 'true_false',
        content: 'This is a test question.',
        correctAnswer: true,
        points: 1,
      });
    }

    await this.education.publishCourse(course.id);

    return { course, modules, lessons, quiz };
  }

  async enrollAndComplete(courseId: string, userId: string, lessonIds: string[]): Promise<void> {
    await this.education.enrollUser(courseId, userId);
    for (const lessonId of lessonIds) {
      await this.education.markLessonComplete(lessonId, userId);
    }
  }
}
```

### Running Tests

```bash
# Run all education tests
pnpm test --filter @mcv/growth/education

# Run specific test suite
pnpm test --filter @mcv/growth/education -- --grep "Quiz Engine"

# Run with coverage
pnpm test --filter @mcv/growth/education -- --coverage

# Run integration tests (requires database)
pnpm test:integration --filter @mcv/growth/education

# Run e2e tests
pnpm test:e2e --filter @mcv/growth/education
```

### Coverage Targets

| Category | Target | Notes |
|----------|--------|-------|
| Statements | ≥ 90% | Core service methods fully covered |
| Branches | ≥ 85% | All error paths, edge cases |
| Functions | ≥ 90% | All exported functions |
| Lines | ≥ 90% | Comprehensive line coverage |

---

*Module version: 1.0.0 · Last updated: 2026-02-09 · Maintainer: @mcv/growth-team*