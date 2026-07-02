import { Body, Column, Container, Head, Hr, Html, Img, Link, Row, Section, Tailwind, Text } from "react-email";
import { getGoogleCalendarUrl, getICSDownloadUrl, getYahooCalendarUrl } from "~/utils/calendar";

import { EMAIL_ASSET_BASE_URL } from "../base-url";
import EmailCalendarButton from "../components/EmailCalendarButton";
import { SourceSansProFonts } from "../source-sans-pro-fonts";
import { emailTailwindConfig } from "../theme";

export default function SharedLearningRoomConfirmationEmail() {
    // Use dynamic values eventually
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const title = "Shared Learning - 408";
    const description = "Shared room reservation confirmation for Austin Central Library";
    const location = "710 W Cesar Chavez St, Austin, TX 78702";
    const start = new Date("2024-03-04T11:00:00-06:00");
    const end = new Date("2024-03-04T11:15:00-06:00");
    const googleLink = getGoogleCalendarUrl({ title, description, location, start, end });
    const yahooLink = getYahooCalendarUrl({ title, description, location, start, end });
    const icsLink = getICSDownloadUrl({ baseUrl, title, description, location, start, end });

    return (
        <Tailwind config={emailTailwindConfig}>
            <Html lang="en">
                <Head>
                    <SourceSansProFonts />
                </Head>
                <Body className="bg-[#F6F6F6] m-0 p-0">
                    <Container className="bg-white w-[636px] my-[80px] mx-auto">
                        <Section className="pt-[32px] text-center">
                            <Img className="block mx-auto pb-[20px]" src={`${EMAIL_ASSET_BASE_URL}/static/apl_blue.png`} alt="APL Logo" width="110" height="110" />
                            <Text className="font-sans text-[40px] font-bold m-0 leading-none">
                                Confirmed!
                            </Text>
                        </Section>
                        <Section className="pt-[24px] w-[572px] text-center">
                            <Text className="font-sans text-[16px] m-0 leading-[1.5]">
                                You have made a Shared Learning Room reservation at <span className="font-bold">Central Library</span>, located at 710 W Cesar Chavez St, Austin, TX 78701
                            </Text>
                        </Section>
                        <Section className="w-[352px] my-[24px]">
                            <Hr className="border-[#adadad] m-0" />
                        </Section>
                        <Section className="w-[352px] px-[24px]">
                            <Row className="pb-[24px]">
                                <Column >
                                    <Container className="m-0 rounded-t-[8px] border-[#A9AEB1] border-[1px] w-[48px] h-[15px] bg-[#F0F0F0]">
                                        <Text className="font-sans text-center text-[12px] text-[#3D4551] font-semibold m-0">MAR</Text>
                                    </Container>
                                    <Container className="m-0 rounded-b-[8px] border-[#A9AEB1] border-[1px] w-[48px] border-t-0">
                                        <Text className="font-sans text-center text-[16px] text-[#3D4551] font-semibold m-0">24</Text>
                                    </Container>
                                </Column>
                                <Column >
                                    <Text className="font-sans text-[16px] font-bold m-0">Mon, March 24, 2024</Text>
                                    <Text className="font-sans text-[16px] m-0">11:00 AM - 12:00 PM</Text>
                                </Column>
                            </Row>
                            <Row >
                                <Column className="pr-[28px] align-top">
                                    <Container className="m-0 rounded-[8px] border-[#A9AEB1] border-[1px] w-[48px] h-[44px]">
                                        <Img className="mx-auto" src={`${EMAIL_ASSET_BASE_URL}/static/icon_location.png`} alt="Location pin" width="28" height="28" />
                                    </Container>
                                </Column>
                                <Column >
                                    <Text className="font-sans text-[16px] font-bold m-0">Shared Learning - 408</Text>
                                    <Text className="font-sans text-[16px] m-0 w-[228px]">Central Library, 710 W Cesar Chavez St, Austin, TX 78702</Text>
                                </Column>
                            </Row>
                        </Section>
                        <Section className="w-[352px] my-[24px]">
                            <Hr className="border-[#adadad] m-0" />
                        </Section>
                        <Section className="mb-[48px] text-center">
                            <Text className="font-sans text-[16px] m-0">
                                <span className="font-bold">Name:</span> Jerri Zhang
                            </Text>
                            <Text className="font-sans text-[16px] m-0">
                                <span className="font-bold">Topic:</span> Study Group
                            </Text>
                        </Section>
                        <Section className="w-[572px] mb-[48px] text-center">
                            {/*TODO: Determine Cancel link href.*/}
                            <Text className="font-sans text-[16px] m-0 pb-[24px]">
                                By booking a room, you agree to abide by the <a href="http://austinlibrary.com/downloads/shared_learning_rooms_policy.pdf" className="text-[#026E98]">Shared Learning Room policy</a> .
                                Don't need the room anymore? <a href="" className="text-[#026E98]">Cancel</a> before your reservation time so someone else can book your room.
                            </Text>
                            <Text className="font-sans text-[16px] m-0">
                                Questions? Call 512-974-7400 (option 1) or <a href="http://library.austintexas.libanswers.com" className="text-[#026E98]">Ask a Librarian</a>.
                            </Text>
                        </Section>
                        <Text className="font-sans text-[16px] m-0 font-bold text-center">
                            Add to Calendar:
                        </Text>
                        <Section className="pt-[24px] pb-[32px] mx-auto w-[400px]">
                            <Row>
                                <Link href={googleLink} target="_blank" rel="noreferrer">
                                    <EmailCalendarButton marginRight="10px">Google</EmailCalendarButton>
                                </Link>
                                <Link href={icsLink} download="reservation.ics">
                                    <EmailCalendarButton marginRight="10px">Outlook</EmailCalendarButton>
                                </Link>
                                <Link href={icsLink} download="reservation.ics">
                                    <EmailCalendarButton marginRight="10px">iCal</EmailCalendarButton>
                                </Link>
                                <Link href={yahooLink} target="_blank" rel="noreferrer">
                                    <EmailCalendarButton marginRight="0">Yahoo!</EmailCalendarButton>
                                </Link>
                            </Row>
                        </Section>
                    </Container>
                </Body>
            </Html>
        </Tailwind>
    );
}