import { index, route } from "@withsprinkles/react-router-route-map";

export const enum RoomType {
    SharedLearningRoom = "shared-learning-room",
    MeetingRoom = "meeting-room",
}

export function displayName(roomType: RoomType): string {
    return roomType === RoomType.MeetingRoom ? "Meeting Rooms" : "Shared Learning Rooms";
}

export const routes = {
    home: index("./routes/home.tsx"),
    search: route("/:roomType", "./routes/search.tsx"),
    review: route("/:roomType/review", "./routes/review.tsx"),
    confirm: route("/:roomType/confirm", "./routes/confirm.tsx"),
    cancel: route("/:roomType/cancel", "./routes/cancel.tsx"),
};
