// ═══════════════════════════════════════════════════════════════════
// TypeScript Arayüzleri — Backend DTO eşleşmeleri
// ═══════════════════════════════════════════════════════════════════

// ──────────── Genel ────────────

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
}

// ──────────── Lookup ────────────

export interface LookupItem {
  code: string;
  displayName: string;
  sortOrder: number;
}

export interface AllLookups {
  meetingStatuses: LookupItem[];
  noteTypes: LookupItem[];
  actionStatuses: LookupItem[];
  participantRoles: LookupItem[];
  relationTypes: LookupItem[];
  changeActions: LookupItem[];
}

// ──────────── User ────────────

export interface UserDto {
  id: number;
  email: string;
  fullName: string;
  isActive: boolean;
  isSuperuser: boolean;
}

export interface UserPreferenceDto {
  id: number;
  preferenceKey: string;
  preferenceValue: string;
}

export interface SetPreferenceRequest {
  preferenceKey: string;
  preferenceValue: string;
}

// ──────────── Company ────────────

export interface CompanyDto {
  id: number;
  name: string;
  shortName: string | null;
  isActive: boolean;
}

export interface CreateCompanyRequest {
  name: string;
  shortName?: string;
}

export interface UpdateCompanyRequest {
  name: string;
  shortName?: string;
  isActive: boolean;
}

// ──────────── Project ────────────

export interface ProjectDto {
  id: number;
  name: string;
  code: string | null;
  isActive: boolean;
}

export interface CreateProjectRequest {
  name: string;
  code?: string;
}

export interface UpdateProjectRequest {
  name: string;
  code?: string;
  isActive: boolean;
}

// ──────────── Location ────────────

export interface LocationDto {
  id: number;
  name: string;
  isActive: boolean;
}

export interface CreateLocationRequest {
  name: string;
}

export interface UpdateLocationRequest {
  name: string;
  isActive: boolean;
}

// ──────────── Category ────────────

export interface CategoryDto {
  id: number;
  name: string;
  isActive: boolean;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
  isActive: boolean;
}


// ──────────── Title (Unvan) ────────────

export interface TitleDto {
  id: number;
  name: string;
  isActive: boolean;
}

export interface CreateTitleRequest {
  name: string;
}

export interface UpdateTitleRequest {
  name: string;
  isActive: boolean;
}

// ──────────── Person ────────────

export interface PersonDto {
  id: number;
  fullName: string;
  companyId: number | null;
  companyName: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  linkedUserId: number | null;
}

export interface CreatePersonRequest {
  fullName: string;
  companyId?: number;
  title?: string;
  email?: string;
  phone?: string;
  linkedUserId?: number;
}

export interface UpdatePersonRequest {
  fullName: string;
  companyId?: number;
  title?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  linkedUserId?: number;
}

// ──────────── Meeting ────────────

export interface MeetingListItem {
  id: number;
  title: string;
  meetingDate: string;
  plannedStart: string | null;
  status: string;
  statusDisplay: string;
  projectName: string | null;
  companyName: string | null;
  locationName: string | null;
  categoryName: string | null;
  participantCount: number;
  noteCount: number;
  createdAt: string;
}

export interface MeetingDetail {
  id: number;
  title: string;
  description: string | null;
  subject: string | null;
  meetingDate: string;
  plannedStart: string | null;
  status: string;
  statusDisplay: string;
  projectId: number | null;
  projectName: string | null;
  companyId: number | null;
  companyName: string | null;
  locationId: number | null;
  locationName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  startedAt: string | null;
  endedAt: string | null;
  nextMeetingAt: string | null;
  nextMeetingNote: string | null;
  version: number;
  participants: ParticipantDto[];
  notes: NoteDto[];
  linkedMeetings: MeetingLinkDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  subject?: string;
  meetingDate: string;
  plannedStart?: string;
  projectId?: number;
  companyId?: number;
  locationId?: number;
  categoryId?: number;
  nextMeetingNote?: string;
}

export interface UpdateMeetingRequest {
  title: string;
  description?: string;
  subject?: string;
  meetingDate: string;
  plannedStart?: string;
  status: string;
  projectId?: number;
  companyId?: number;
  locationId?: number;
  categoryId?: number;
  nextMeetingAt?: string;
  nextMeetingNote?: string;
}

// ──────────── Participant ────────────

export interface ParticipantDto {
  id: number;
  personId: number;
  personName: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  role: string;
  roleDisplay: string;
  isAttended: boolean;
}

export interface AddParticipantRequest {
  personId: number;
  role?: string;
}

// ──────────── Note ────────────

export interface NoteDto {
  id: number;
  content: string;
  noteType: string;
  noteTypeDisplay: string;
  displayOrder: number;
  responsiblePersonId: number | null;
  responsiblePersonName: string | null;
  dueDate: string | null;
  actionStatus: string | null;
  actionStatusDisplay: string | null;
  createdAt: string;
}

export interface CreateNoteRequest {
  content: string;
  noteType?: string;
  displayOrder?: number;
  responsiblePersonId?: number;
  dueDate?: string;
  actionStatus?: string;
}

export interface UpdateNoteRequest {
  content: string;
  noteType: string;
  displayOrder: number;
  responsiblePersonId?: number;
  dueDate?: string;
  actionStatus?: string;
}

// ──────────── Meeting Link ────────────

export interface MeetingLinkDto {
  id: number;
  linkedMeetingId: number;
  linkedMeetingTitle: string;
  linkedMeetingDate: string;
  relationType: string;
  relationTypeDisplay: string;
  direction: "PARENT" | "CHILD";
}

export interface CreateMeetingLinkRequest {
  childMeetingId: number;
  relationType?: string;
}

// ──────────── Followup Item ────────────

export interface FollowupItemDto {
  id: number;
  text: string;
  topicId: number | null;
  responsiblePersonId: number | null;
  responsiblePersonName: string | null;
  responsibleCompanyId: number | null;
  responsibleCompanyName: string | null;
  dueDate: string | null;
  actionStatus: string;
  actionStatusDisplay: string;
  completedOn: string | null;
  waitingReason: string | null;
  developmentNote: string | null;
  dependencyItemIds: number[] | null;
  sourceMeetingId: number | null;
  sourceMeetingTitle: string | null;
  sourceNoteId: number | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFollowupRequest {
  text: string;
  topicId?: number;
  responsiblePersonId?: number;
  responsibleCompanyId?: number;
  dueDate?: string;
  waitingReason?: string;
  developmentNote?: string;
  dependencyItemIds?: number[];
  sourceMeetingId?: number;
  sourceNoteId?: number;
}

export interface UpdateFollowupRequest {
  text: string;
  topicId?: number;
  responsiblePersonId?: number;
  responsibleCompanyId?: number;
  dueDate?: string;
  actionStatus: string;
  completedOn?: string;
  waitingReason?: string;
  developmentNote?: string;
  dependencyItemIds?: number[];
}

// ──────────── Followup Change Log ────────────

export interface FollowupChangeLogDto {
  id: number;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string;
  changedBy: number;
  changedByName: string;
  changedAt: string;
}
