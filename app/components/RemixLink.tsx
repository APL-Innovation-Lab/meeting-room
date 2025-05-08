import { Link } from "react-router";

export default function RemixLink({ href, ...props }: any) {
    // eslint-disable-next-line
    return <Link {...props} to={href} />;
}
