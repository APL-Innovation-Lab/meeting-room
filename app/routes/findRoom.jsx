import { Card, CardGroup, CardHeader } from "@trussworks/react-uswds";

export default function findRoom() {
    return (
        <div>

        <CardGroup>
            <Card>
                <CardHeader>
                    <br/>
                    <p className="font-sans text-base-darker">
                        <strong className="font-bold">Home  Meeting Spaces Find a Room</strong>
                    </p>
                    <br/>
                    <h1 className="">FIND A ROOM</h1>
                    <h1 className="usa-card__heading">COMMERCIAL/BUSINESS</h1>
                    <br/>

                    <p className="font-sans text-base-darker">
                        <strong className="font-bold">Rooms for commercial work purposes are only available at capacities of 4, 8, and 10. </strong>
                         Rooms can be booked in 15 min time blocks up to 2-hours, and up to 2 weeks out.
                    </p>
                    <p>Location</p>
                </CardHeader>
            </Card>
        </CardGroup>
        </div>
    );
}
