import type { CancellationDetails } from "./cancel.data.server";

/** The reservation being cancelled, exactly as it was persisted at booking time. */
export function ReservationFacts({ details }: { details: CancellationDetails }) {
    return (
        <>
            <div className="flex-col pb-[20px]">
                <h3 className="text-center font-sans text-[22px] font-bold">
                    {details.branchName}, {details.roomName}
                </h3>
                {details.branchAddress && (
                    <p className="text-center font-sans text-sans-xs">{details.branchAddress}</p>
                )}
            </div>
            <p className="text-center font-sans text-sans-xs">{details.dateLabel}</p>
            <p className="text-center font-sans text-sans-xs">{details.timeLabel}</p>
            {details.capacity > 0 && (
                <p className="text-center font-sans text-sans-xs">Capacity: {details.capacity}</p>
            )}
        </>
    );
}
