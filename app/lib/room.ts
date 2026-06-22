export namespace Room {
    export type Kind = "shared-learning-room" | "meeting-room";
}

export class Room {
    static SharedLearning = new Room("shared-learning-room");
    static Meeting = new Room("meeting-room");

    static isMeeting(kind: string): boolean {
        return kind === "meeting-room";
    }

    static isSharedLearning(kind: string): boolean {
        return kind === "shared-learning-room";
    }

    constructor(public kind: Room.Kind) {}

    get displayName(): string {
        return this.kind === "shared-learning-room" ? "Shared Learning Rooms" : "Meeting Rooms";
    }
}
