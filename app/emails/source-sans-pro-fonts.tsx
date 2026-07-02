import { Font } from 'react-email';

const BASE = 'https://fonts.gstatic.com/s/sourcesanspro/v21';

const NORMAL: Record<number, string> = {
    200: `${BASE}/6xKydSBYKcSV-LCoeQqfX1RYOo3i94_wlxdu.woff2`,
    300: `${BASE}/6xKydSBYKcSV-LCoeQqfX1RYOo3ik4zwlxdu.woff2`,
    400: `${BASE}/6xK3dSBYKcSV-LCoeQqfX1RYOo3qOK7l.woff2`,
    600: `${BASE}/6xKydSBYKcSV-LCoeQqfX1RYOo3i54rwlxdu.woff2`,
    700: `${BASE}/6xKydSBYKcSV-LCoeQqfX1RYOo3ig4vwlxdu.woff2`,
    900: `${BASE}/6xKydSBYKcSV-LCoeQqfX1RYOo3iu4nwlxdu.woff2`,
};

const ITALIC: Record<number, string> = {
    200: `${BASE}/6xKwdSBYKcSV-LCoeQqfX1RYOo3qPZYokSds18Q.woff2`,
    300: `${BASE}/6xKwdSBYKcSV-LCoeQqfX1RYOo3qPZZMkids18Q.woff2`,
    400: `${BASE}/6xK1dSBYKcSV-LCoeQqfX1RYOo3qPZ7nsDI.woff2`,
    600: `${BASE}/6xKwdSBYKcSV-LCoeQqfX1RYOo3qPZY4lCds18Q.woff2`,
    700: `${BASE}/6xKwdSBYKcSV-LCoeQqfX1RYOo3qPZZclSds18Q.woff2`,
    900: `${BASE}/6xKwdSBYKcSV-LCoeQqfX1RYOo3qPZZklyds18Q.woff2`,
};

const WEIGHTS = [200, 300, 400, 600, 700, 900] as const;

export function SourceSansProFonts() {
    return (
        <>
            {WEIGHTS.map((weight) => (
                <Font
                    key={`normal-${weight}`}
                    fontFamily="Source Sans Pro"
                    fallbackFontFamily={['Arial', 'sans-serif']}
                    webFont={{ url: NORMAL[weight], format: 'woff2' }}
                    fontWeight={weight}
                    fontStyle="normal"
                />
            ))}
            {WEIGHTS.map((weight) => (
                <Font
                    key={`italic-${weight}`}
                    fontFamily="Source Sans Pro"
                    fallbackFontFamily={['Arial', 'sans-serif']}
                    webFont={{ url: ITALIC[weight], format: 'woff2' }}
                    fontWeight={weight}
                    fontStyle="italic"
                />
            ))}
        </>
    );
}