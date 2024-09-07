import { Card, CardGroup, CardHeader, Header, Label, Link, Select } from "@trussworks/react-uswds";


export default function searchRoomNonCommercial() {
    
    return (

        <div className="flex justify-center">
            <CardGroup className="min-w-[30rem] max-w-[49rem]">
                <Card>
                    <Header>
                        <div className="object-contain">
                            <img
                                alt="A room of people in attendance at a meeting"
                                className="rounded-t-md"
                                loading="lazy"
                                src="/meeting-spaces-header.jpg"
                            />
                        </div>
                    </Header>
                    <div className="ml-5 mr-5">

                        <CardHeader className="-mt-3">
                            
                            <br/>
                            <h1 className="font-sans text-[40px] usa-card__heading font-bold py-2">
                                FIND A ROOM
                            </h1>

                            <p className="font-sans text-base-darker text-sans-xs">
                            For smaller groups, please consider our Shared Learning Rooms with capacities of 4, 8, and 10. 
                            Groups up to 20+ to 100 people are better for Meeting Rooms.
                            </p>
                        </CardHeader>
                    </div>
                </Card>
            </CardGroup>
        </div>
    );
}



