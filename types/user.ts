// user.ts

// Type definition for User
export type User = {
    id: number;
    username: string;
    email: string;
    role: UserRole;
};

// Enum for User roles
export enum UserRole {
    Student = 'Student',
    Admin = 'Admin',
    Client = 'Client'
}

// Type definition for Student
export type Student = User & {
    courses: string[];
};

// Type definition for Admin
export type Admin = User & {
    permissions: string[];
};

// Type definition for Client
export type Client = User & {
    projectDetails: string;
};
