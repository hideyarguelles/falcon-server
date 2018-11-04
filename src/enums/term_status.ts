enum TermStatus {
    Initializing = "Initializing",
    Scheduling = "Scheduling",
    FeedbackGathering = "FeedbackGathering",
    Published = "Published",
    Archived = "Archived",
}

export function nextStatus(current: TermStatus): TermStatus {
    switch (current) {
        case TermStatus.Initializing:
            return TermStatus.Scheduling;
        case TermStatus.Scheduling:
            return TermStatus.FeedbackGathering;
        case TermStatus.FeedbackGathering:
            return TermStatus.Published;
        case TermStatus.Published:
            return TermStatus.Archived;
    }
}

export function previousStatus(current: TermStatus): TermStatus {
    switch (current) {
        case TermStatus.Scheduling:
            return TermStatus.Initializing;
        case TermStatus.FeedbackGathering:
            return TermStatus.Scheduling;
        case TermStatus.Published:
            return TermStatus.FeedbackGathering;
    }
}

export default TermStatus;
