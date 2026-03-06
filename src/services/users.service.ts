import { http } from "./http";

export type UserRole = "Administrador" | "Cajero";
export type RoleLabel = UserRole;

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export type User = {
  id: number;
  name: string;
  paternal_lastname: string;
  maternal_lastname: string;
  role: UserRole;
  status: number; 
};

export type UserRow = User;


export type UserDetail = User & {
  user: string;
  password: string;
};


export type GetUsersResponse = ApiResponse<User[]>;

export async function getAllUsers() {
  const { data } = await http.get<GetUsersResponse>("/users");
  return data;
}

export async function getUsers() {
  return getAllUsers();
}


export type GetUserByIdResponse = ApiResponse<UserDetail>;

export async function getUserById(id: number) {
  const { data } = await http.get<GetUserByIdResponse>(`/users/${id}`);
  return data;
}


export type CreateUserPayload = {
  name: string;
  paternal_lastname: string;
  maternal_lastname: string;
  role: UserRole;
  user: string;
  password: string;
};

export type CreateUserResponse = ApiResponse<null>;

export async function createUser(payload: CreateUserPayload) {
  const { data } = await http.post<CreateUserResponse>("/users", payload);
  return data;
}


export type UpdateUserPayload = {
  id: number;
  name: string;
  paternal_lastname: string;
  maternal_lastname: string;
  role: UserRole;
  user?: string;
  password?: string;
};

export type UpdateUserResponse = ApiResponse<null>;

export async function updateUser(payload: UpdateUserPayload) {
  const { data } = await http.put<UpdateUserResponse>("/users", payload);
  return data;
}


export type DeleteUserResponse = ApiResponse<null>;

export async function deleteUser(id: number) {
  const { data } = await http.delete<DeleteUserResponse>(`/users/${id}`);
  return data;
}


export type ActivateUserResponse = ApiResponse<null>;

export async function activateUser(id: number) {
  const { data } = await http.patch<ActivateUserResponse>(`/users/${id}`);
  return data;
}