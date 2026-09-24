import apiClient from "./apiClient";
import type {
  CompanyDto, CreateCompanyRequest, UpdateCompanyRequest,
  ProjectDto, CreateProjectRequest, UpdateProjectRequest,
  LocationDto, CreateLocationRequest, UpdateLocationRequest,
  CategoryDto, CreateCategoryRequest, UpdateCategoryRequest,
  PersonDto, CreatePersonRequest, UpdatePersonRequest,
  TitleDto, CreateTitleRequest, UpdateTitleRequest,
} from "../types/api";

// ──────────── Companies ────────────

export async function fetchCompanies(): Promise<CompanyDto[]> {
  const { data } = await apiClient.get<CompanyDto[]>("/Companies");
  return data;
}

export async function createCompany(dto: CreateCompanyRequest): Promise<CompanyDto> {
  const { data } = await apiClient.post<CompanyDto>("/Companies", dto);
  return data;
}

export async function updateCompany(id: number, dto: UpdateCompanyRequest): Promise<CompanyDto> {
  const { data } = await apiClient.put<CompanyDto>(`/Companies/${id}`, dto);
  return data;
}

export async function deleteCompany(id: number): Promise<void> {
  await apiClient.delete(`/Companies/${id}`);
}

// ──────────── Projects ────────────

export async function fetchProjects(): Promise<ProjectDto[]> {
  const { data } = await apiClient.get<ProjectDto[]>("/Projects");
  return data;
}

export async function createProject(dto: CreateProjectRequest): Promise<ProjectDto> {
  const { data } = await apiClient.post<ProjectDto>("/Projects", dto);
  return data;
}

export async function updateProject(id: number, dto: UpdateProjectRequest): Promise<ProjectDto> {
  const { data } = await apiClient.put<ProjectDto>(`/Projects/${id}`, dto);
  return data;
}

export async function deleteProject(id: number): Promise<void> {
  await apiClient.delete(`/Projects/${id}`);
}

// ──────────── Locations ────────────

export async function fetchLocations(): Promise<LocationDto[]> {
  const { data } = await apiClient.get<LocationDto[]>("/Locations");
  return data;
}

export async function createLocation(dto: CreateLocationRequest): Promise<LocationDto> {
  const { data } = await apiClient.post<LocationDto>("/Locations", dto);
  return data;
}

export async function updateLocation(id: number, dto: UpdateLocationRequest): Promise<LocationDto> {
  const { data } = await apiClient.put<LocationDto>(`/Locations/${id}`, dto);
  return data;
}

export async function deleteLocation(id: number): Promise<void> {
  await apiClient.delete(`/Locations/${id}`);
}

// ──────────── Categories ────────────

export async function fetchCategories(): Promise<CategoryDto[]> {
  const { data } = await apiClient.get<CategoryDto[]>("/Categories");
  return data;
}

export async function createCategory(dto: CreateCategoryRequest): Promise<CategoryDto> {
  const { data } = await apiClient.post<CategoryDto>("/Categories", dto);
  return data;
}

export async function updateCategory(id: number, dto: UpdateCategoryRequest): Promise<CategoryDto> {
  const { data } = await apiClient.put<CategoryDto>(`/Categories/${id}`, dto);
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/Categories/${id}`);
}

// ──────────── Persons ────────────

export async function fetchPersons(): Promise<PersonDto[]> {
  const { data } = await apiClient.get<PersonDto[]>("/Persons");
  return data;
}

export async function createPerson(dto: CreatePersonRequest): Promise<PersonDto> {
  const { data } = await apiClient.post<PersonDto>("/Persons", dto);
  return data;
}

export async function updatePerson(id: number, dto: UpdatePersonRequest): Promise<PersonDto> {
  const { data } = await apiClient.put<PersonDto>(`/Persons/${id}`, dto);
  return data;
}

export async function deletePerson(id: number): Promise<void> {
  await apiClient.delete(`/Persons/${id}`);
}

// ──────────── Titles (Unvanlar) ────────────

export async function fetchTitles(): Promise<TitleDto[]> {
  const { data } = await apiClient.get<TitleDto[]>("/Titles");
  return data;
}

export async function createTitle(dto: CreateTitleRequest): Promise<TitleDto> {
  const { data } = await apiClient.post<TitleDto>("/Titles", dto);
  return data;
}

export async function updateTitle(id: number, dto: UpdateTitleRequest): Promise<TitleDto> {
  const { data } = await apiClient.put<TitleDto>(`/Titles/${id}`, dto);
  return data;
}

export async function deleteTitle(id: number): Promise<void> {
  await apiClient.delete(`/Titles/${id}`);
}
