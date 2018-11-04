enum MeetingHours {
    AM_7_9 = "AM_7_9",
    AM_9_11 = "AM_9_11",
    AM_11_1 = "AM_11_1",
    PM_1_3 = "PM_1_3",
    PM_3_5 = "PM_3_5",
    PM_5_7 = "PM_5_7",
}

export function twoMeetingHoursBefore(mh: MeetingHours): MeetingHours[] {
    switch (mh) {
        case MeetingHours.AM_11_1:
            return [MeetingHours.AM_7_9, MeetingHours.AM_9_11];
        case MeetingHours.PM_1_3:
            return [MeetingHours.AM_9_11, MeetingHours.AM_11_1];
        case MeetingHours.PM_3_5:
            return [MeetingHours.AM_11_1, MeetingHours.PM_1_3];
        case MeetingHours.PM_5_7:
            return [MeetingHours.PM_1_3, MeetingHours.PM_3_5];
        default:
            return [];
    }
}

export function compareMeetingHours(a: MeetingHours, b: MeetingHours): number {
    const ordering = [
        MeetingHours.AM_7_9,
        MeetingHours.AM_9_11,
        MeetingHours.AM_11_1,
        MeetingHours.PM_1_3,
        MeetingHours.PM_3_5,
        MeetingHours.PM_5_7,
    ];
    return ordering.indexOf(a) - ordering.indexOf(b);
}

export default MeetingHours;
