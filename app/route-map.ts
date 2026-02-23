import { index, route } from "@withsprinkles/react-router-route-map";

export const routes = {
    home: index("./routes/home.tsx"),
    search: route("/:roomKind", "./routes/search/search.tsx"),
    review: route("/:roomKind/review", "./routes/review.tsx"),
    confirm: route("/:roomKind/confirm", "./routes/confirm.tsx"),
    cancel: route("/:roomKind/cancel", "./routes/cancel.tsx"),
    cancelConfirmation: route("/:roomKind/cancel-confirmation", "./routes/cancel-confirmation.tsx"),
};

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
