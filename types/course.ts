// types/course.ts

type Course = {
    id: string;
    title: string;
    description: string;
    instructor: string;
    duration: number; // duration in hours
    prerequisites?: string[];
};


type CourseRegistration = {
    courseId: string;
    userId: string;
    registrationDate: Date;
    status: 'registered' | 'completed' | 'dropped';
};

export { Course, CourseRegistration };