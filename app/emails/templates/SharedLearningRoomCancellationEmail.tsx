import {
    Body,
    Column,
    Container,
    Head,
    Hr,
    Html,
    Img,
    Link,
    Row,
    Section,
    Tailwind,
    Text,
} from "react-email";
import { getGoogleCalendarUrl, getICSDownloadUrl, getYahooCalendarUrl } from "~/utils/calendar";

import { EMAIL_ASSET_BASE_URL } from "../base-url";
import EmailCalendarButton from "../components/EmailCalendarButton";
import { SourceSansProFonts } from "../source-sans-pro-fonts";
import { emailTailwindConfig } from "../theme";

export default function SharedLearningRoomCancellationEmail() {
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
                                Canceled
                            </Text>
                        </Section>
                        <Section className="w-[572px] pt-[24px] text-center">
                            <Text className="m-0 font-sans text-[16px]">
                                The following has been canceled.
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
                                        Shared Learning - 408
                                    </Text>
                                    <Text className="m-0 w-[228px] font-sans text-[16px]">
                                        Central Library, 710 W Cesar Chavez St, Austin, TX 78702
                                    </Text>
                                </Column>
                            </Row>
                        </Section>
                        <Section className="my-[24px] w-[352px]">
                            <Hr className="m-0 border-[#adadad]" />
                        </Section>
                        <Section className="mb-[48px] text-center">
                            <Text className="m-0 font-sans text-[16px]">
                                <span className="font-bold">Name:</span> Jerri Zhang
                            </Text>
                            <Text className="m-0 font-sans text-[16px]">
                                <span className="font-bold">Topic:</span> Study Group
                            </Text>
                            <Text className="m-0 font-sans text-[16px]">
                                <span className="font-bold">Capacity:</span> 4
                            </Text>
                        </Section>
                        <Text className="m-0 mb-[64px] text-center font-sans text-[16px]">
                            Questions? Call 512-974-7400 (option 1) or 
                            <a
                                className="text-[#026E98]"
                                href="http://library.austintexas.libanswers.com"
                            >
                                Ask a Librarian
                            </a>
                            .
                        </Text>
                    </Container>
                </Body>
            </Html>
        </Tailwind>
    );
}
