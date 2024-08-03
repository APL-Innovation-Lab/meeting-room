import {
    Breadcrumb,
    BreadcrumbBar,
    BreadcrumbLink,
    Card,
    CardGroup,
    CardHeader,
    Header,
} from "@trussworks/react-uswds";
import { mergeMeta } from "~/lib/merge-meta";

export const meta = mergeMeta(({ parentTitle }) => [{ title: `Meeting Spaces • ${parentTitle}` }]);

export default function Index() {
    return (
        <>
            <Header>
                <div className="flex justify-center">
                    <img
                        alt="Public Meeting Room"
                        className="min-w-[40rem] max-w-[62rem] object-contain"
                        loading="lazy"
                        src="/meetingSpacesHeader.jpg"
                    />
                </div>
            </Header>
            <div className="flex justify-center">
                <BreadcrumbBar className="min-w-[40rem]">
                    <Breadcrumb>
                        <BreadcrumbLink href="#">
                            <span>Home</span>
                        </BreadcrumbLink>
                    </Breadcrumb>
                </BreadcrumbBar>
            </div>
            <div className="flex justify-center">
                <CardGroup>
                    <Card className="min-w-[41rem] max-w-[63rem]">
                        <CardHeader>
                            <h1 className="font usa-card__heading font-bold py-2">
                                Meeting Spaces
                            </h1>
                            <p className="font-sans text-base-darker text-left mx-4">
                                Austin Public Library Meeting Spaces are
                                <strong className="font-bold"> free of charge</strong> and ideal for
                                discussion groups, panels, and lectures. Both paper and online
                                reservation requests are timestamped and processed in the order they
                                are received.
                            </p>
                        </CardHeader>
                    </Card>
                </CardGroup>
            </div>
        </>
    );
}
