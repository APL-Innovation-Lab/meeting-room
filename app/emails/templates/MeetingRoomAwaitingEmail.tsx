import {
    Body,
    Column,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Row,
    Section,
    Tailwind,
    Text,
} from "react-email";

import { EMAIL_ASSET_BASE_URL } from "../base-url";
import { SourceSansProFonts } from "../source-sans-pro-fonts";
import { emailTailwindConfig } from "../theme";

export default function MeetingRoomAwaitingEmail() {
    const baseUrl =
        (typeof window !== "undefined" ? window.location.origin : "") || "http://localhost:5173";

    return (
        <Tailwind config={emailTailwindConfig}>
            <Html lang="en">
                <Head>
                    <SourceSansProFonts />
                </Head>
                <Body className="m-0 bg-[#F6F6F6] p-0">
                    <Container className="mx-auto my-[80px] w-[636px] bg-white">
                        <Section className="pt-[32px] text-center">
                            <Img
                                className="mx-auto block pb-[20px]"
                                src={`${EMAIL_ASSET_BASE_URL}/static/apl_blue.png`}
                                alt="APL Logo"
                                width="110"
                                height="110"
                            />
                            <Text className="m-0 font-sans text-[40px] leading-none font-bold">
                                Awaiting Confirmation
                            </Text>
                        </Section>
                        <Section className="w-[572px] pt-[24px] text-center">
                            <Text className="m-0 font-sans text-[16px] leading-[1.5]">
                                <span className="font-bold">Carver Branch</span> Room Request.
                            </Text>
                            <Text className="m-0 font-sans text-[16px] leading-[1.5]">
                                We will process your request within two business days.
                            </Text>
                        </Section>
                        <Section className="my-[24px] w-[352px]">
                            <Hr className="m-0 border-[#adadad]" />
                        </Section>
                        <Section className="w-[352px] px-[24px]">
                            <Row className="pb-[24px]">
                                <Column>
                                    <Container className="m-0 h-[15px] w-[48px] rounded-t-[8px] border-[1px] border-[#A9AEB1] bg-[#F0F0F0]">
                                        <Text className="font-semibold m-0 text-center font-sans text-[12px] text-[#3D4551]">
                                            MAR
                                        </Text>
                                    </Container>
                                    <Container className="m-0 w-[48px] rounded-b-[8px] border-[1px] border-t-0 border-[#A9AEB1]">
                                        <Text className="font-semibold m-0 text-center font-sans text-[16px] text-[#3D4551]">
                                            24
                                        </Text>
                                    </Container>
                                </Column>
                                <Column>
                                    <Text className="m-0 font-sans text-[16px] font-bold">
                                        Mon, March 24, 2024
                                    </Text>
                                    <Text className="m-0 font-sans text-[16px]">
                                        11:00 AM - 12:00 PM
                                    </Text>
                                </Column>
                            </Row>
                            <Row>
                                <Column className="pr-[28px] align-top">
                                    <Container className="m-0 h-[44px] w-[48px] rounded-[8px] border-[1px] border-[#A9AEB1]">
                                        <Img
                                            className="mx-auto"
                                            src={`${EMAIL_ASSET_BASE_URL}/static/icon_location.png`}
                                            alt="Location pin"
                                            width="28"
                                            height="28"
                                        />
                                    </Container>
                                </Column>
                                <Column>
                                    <Text className="m-0 font-sans text-[16px] font-bold">
                                        Room #1
                                    </Text>
                                    <Text className="m-0 w-[228px] font-sans text-[16px]">
                                        Carver Branch, 1161 Angelina St, Austin, TX 78702
                                    </Text>
                                </Column>
                            </Row>
                        </Section>
                        <Section className="my-[24px] w-[352px]">
                            <Hr className="m-0 border-[#adadad]" />
                        </Section>
                        <Section className="mb-[48px] text-center">
                            <Text className="m-0 font-sans text-[16px]">
                                <span className="font-bold">Group:</span> Biology 101
                            </Text>
                            <Text className="m-0 font-sans text-[16px]">
                                <span className="font-bold">Topic:</span> Study Group
                            </Text>
                            <Text className="m-0 font-sans text-[16px]">
                                <span className="font-bold">Capacity:</span> 100
                            </Text>
                        </Section>
                        <Section className="mb-[48px] w-[572px] text-center">
                            <Text className="m-0 pb-[24px] font-sans text-[16px]">
                                Don't need the room anymore?&nbsp;
                                <a
                                    className="text-[#026E98]"
                                    href={`${baseUrl}/meeting-room/cancel`}
                                >
                                    Cancel
                                </a>
                                &nbsp;before your reservation time so someone else can book your
                                room.
                            </Text>
                            <Text className="m-0 font-sans text-[16px]">
                                Questions? Call 512-974-7400 (option 1) or&nbsp;
                                <a
                                    className="text-[#026E98]"
                                    href="http://library.austintexas.libanswers.com"
                                >
                                    Ask a Librarian
                                </a>
                                .
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Html>
        </Tailwind>
    );
}
