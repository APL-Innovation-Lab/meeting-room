import { Card, CardGroup, CardHeader, Header } from "@trussworks/react-uswds";
import { mergeMeta } from "~/lib/merge-meta";

export const meta = mergeMeta(({ parentTitle }) => [{ title: `Meeting Spaces • ${parentTitle}` }]);

export default function Index() {
    return (
        <>
            <Header>
                <img
                    src="public\meetingSpacesHeader.jpg"
                    className="max-w-5xl max-h-52 justify-center"
                />
            </Header>
            <CardGroup>
                <Card>
                    <CardHeader>
                        <h1 className="usa-card__heading">Meeting Spaces</h1>
                        <p className="font-sans text-base-darker">
                            Austin Public Library Meeting Spaces are
                            <strong className="font-bold"> free of charge</strong> and ideal for
                            discussion groups, panels, and lectures. Both paper and online
                            reservation requests are timestamped and processed in the order they are
                            received.
                        </p>
                    </CardHeader>
                </Card>
            </CardGroup>
        </>
    );
}
