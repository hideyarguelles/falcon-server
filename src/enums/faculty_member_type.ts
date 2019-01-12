enum FacultyMemberType {
    Instructor = "Instructor",
    AssistantProfessor = "AssistantProfessor",
    AssociateProfessor = "AssociateProfessor",
    FullProfessor = "FullProfessor",
    PartTime = "PartTime",
}

interface ILoadingLimits {
    minimum: number;
    maximum: number;
    extra: number;
}

export const FacultyMemberTypeLoadingLimit = new Map<FacultyMemberType, ILoadingLimits>([
           [FacultyMemberType.Instructor, { minimum: 3, maximum: 6, extra: 4 }],

           [
               FacultyMemberType.AssistantProfessor,
               {
                   minimum: 3,
                   maximum: 5,
                   extra: 4,
               },
           ],

           [
               FacultyMemberType.AssociateProfessor,
               {
                   minimum: 2,
                   maximum: 4,
                   extra: 3,
               },
           ],

           [
               FacultyMemberType.FullProfessor,
               {
                   minimum: 2,
                   maximum: 2,
                   extra: 0,
               },
           ],

           [
               FacultyMemberType.PartTime,
               {
                   minimum: 2,
                   maximum: 2,
                   extra: 2,
               },
           ],
       ]);

export default FacultyMemberType;
